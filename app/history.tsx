import { Stack } from "expo-router";
import { Dimensions, Pressable, ScrollView, TouchableOpacity, View } from "react-native";
import { Text } from '@/components/ui/text';
import {
  EllipsisVertical,
  LayoutPanelLeft,
  Microwave,
  Monitor,
  Share2,
  Trash2,
  Tv,
  WashingMachine,
} from "lucide-react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "expo-router";

type HistoryItem = {
  id: string;
  time: string;
  appliance: string;
  message: string;
  deltaText: string;
  deltaValue: number;
  rawStatus: string;
  eventType: "on" | "off";
};

type ApplianceEventRow = {
  id: number;
  appliance_label: string;
  started_at: string;
  ended_at: string | null;
  status: string;
  matched_state_w: number | null;
  estimated_energy_kwh: number | null;
  raw_delta_w: number | null;
  raw_off_delta_w: number | null;
};

const PAGE_SIZE = 30;
const CACHE_MAX = 30;

export default function HistoryScreen() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [notif, setNotif] = useState<HistoryItem[]>([]);
  const [cache, setCache] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const sheetRef = useRef<BottomSheet>(null);
  const { height: SCREEN_HEIGHT } = Dimensions.get("window");

  const snapPoints = useMemo(() => {
    const first = SCREEN_HEIGHT;
    const second = SCREEN_HEIGHT * 0.4;
    return [first, second];
  }, [SCREEN_HEIGHT]);

  const openSheet = useCallback((item: HistoryItem) => {
    setSelectedItem(item);
    setSheetOpen(true);
    sheetRef.current?.expand();
  }, []);

  const getApplianceIcon = useCallback((applianceLabel?: string) => {
    const name = (applianceLabel ?? "").toLowerCase().trim();

    if (name.includes("tv") || name.includes("television")) return Tv;
    if (name.includes("pc") || name.includes("computer") || name.includes("desktop")) return Monitor;
    if (name.includes("washing machine") || name.includes("washer")) return WashingMachine;
    if (name.includes("rice cooker")) return Microwave;

    return Microwave;
  }, []);

  const getApplianceIconColor = useCallback((applianceLabel?: string) => {
    const name = (applianceLabel ?? "").toLowerCase().trim();

    if (name.includes("tv") || name.includes("television")) return "#8b5cf6";
    if (name.includes("pc") || name.includes("computer") || name.includes("desktop")) return "#60a5fa";
    if (name.includes("washing machine") || name.includes("washer")) return "#4ade80";
    if (name.includes("rice cooker")) return "#facc15";

    return "#ffffff";
  }, []);

  const blur = useSharedValue(0);
  const min = snapPoints[0];
  const max = snapPoints[1];
  const animatedPosition = useSharedValue(0);

  const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

  const opacity = useDerivedValue(() => {
    return interpolate(
      animatedPosition.value,
      [min, max],
      [1, 0.1],
      Extrapolation.CLAMP
    );
  });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const toTitleCase = (value: string) =>
    value
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

  const normalizeEvent = (row: ApplianceEventRow): HistoryItem[] => {
    const applianceName = toTitleCase(row.appliance_label);
    const items: HistoryItem[] = [];

    if (row.started_at) {
      const startDelta = Number(row.raw_delta_w ?? 0);

      items.push({
        id: `on-${row.id}`,
        appliance: row.appliance_label,
        time: row.started_at,
        rawStatus: row.status,
        eventType: "on",
        message: `${applianceName} Turned On`,
        deltaValue: startDelta,
        deltaText: `${startDelta > 0 ? "+" : ""}${startDelta.toFixed(1)}W`,
      });
    }

    if (row.ended_at) {
      const offRaw = Number(row.raw_off_delta_w ?? 0);
      const endDelta = offRaw > 0 ? -offRaw : offRaw;

      items.push({
        id: `off-${row.id}`,
        appliance: row.appliance_label,
        time: row.ended_at,
        rawStatus: row.status,
        eventType: "off",
        message: `${applianceName} Turned Off`,
        deltaValue: endDelta,
        deltaText: `${endDelta > 0 ? "+" : ""}${endDelta.toFixed(1)}W`,
      });
    }

    return items;
  };

  const mergeIntoCache = useCallback((incoming: HistoryItem[]) => {
    setCache((prev) => {
      const existingIds = new Set(prev.map((item) => item.id));
      const merged = [...incoming.filter((item) => !existingIds.has(item.id)), ...prev]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, CACHE_MAX);

      return merged;
    });
  }, []);

  const fetchHistory = useCallback(
    async (pageToLoad = 0, append = false) => {
      try {
        if (append) setLoadingMore(true);
        else setLoading(true);

        setError(null);

        const from = pageToLoad * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error } = await supabase
          .from("appliance_events")
          .select(`
            id,
            appliance_label,
            started_at,
            ended_at,
            status,
            matched_state_w,
            estimated_energy_kwh,
            raw_delta_w,
            raw_off_delta_w
          `)
          .order("started_at", { ascending: false })
          .range(from, to);

        if (error) throw error;

        const rows = (data ?? []) as ApplianceEventRow[];

        const normalized = rows
          .flatMap(normalizeEvent)
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        if (append) {
          setNotif((prev) => [...prev, ...normalized]);
        } else {
          setNotif(normalized);
        }

        mergeIntoCache(normalized);
        setHasMore(rows.length === PAGE_SIZE);
        setPage(pageToLoad);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load history");
        if (!append) setNotif([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [mergeIntoCache]
  );

  const loadLatest = useCallback(async () => {
    await fetchHistory(0, false);
  }, [fetchHistory]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    await fetchHistory(page + 1, true);
  }, [fetchHistory, hasMore, loadingMore, page]);

  useFocusEffect(
    useCallback(() => {
      loadLatest();
    }, [loadLatest])
  );

  const groups = useMemo(() => {
    const grouped: Record<string, HistoryItem[]> = {};

    const startOfDay = (value: Date) => {
      const d = new Date(value);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const now = new Date();
    const today = startOfDay(now);

    notif.forEach((n) => {
      const eventDate = new Date(n.time);
      const eventDay = startOfDay(eventDate);

      const diffMs = today.getTime() - eventDay.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let label: string;

      if (diffDays === 0) label = "Today";
      else if (diffDays === 1) label = "Yesterday";
      else if (diffDays <= 7) label = "This Week";
      else if (diffDays <= 30) label = "This Month";
      else {
        label = eventDate.toLocaleDateString([], {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      }

      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(n);
    });

    Object.keys(grouped).forEach((key) => {
      grouped[key].sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );
    });

    return grouped;
  }, [notif]);

  const availableGroups = useMemo(() => {
    const preferredOrder = ["Today", "Yesterday", "This Week", "This Month"];
    const keys = Object.keys(groups);

    const orderedPreferred = preferredOrder.filter((k) => keys.includes(k));

    const remaining = keys
      .filter((k) => !preferredOrder.includes(k))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return [...orderedPreferred, ...remaining];
  }, [groups]);

  useEffect(() => {
    if (selectedGroup && groups[selectedGroup]?.length) return;
    setSelectedGroup(availableGroups[0] ?? null);
  }, [availableGroups, groups, selectedGroup]);

  useAnimatedReaction(
    () => animatedPosition.value,
    (pos) => {
      blur.value = interpolate(
        pos,
        [min, max],
        [0, 1],
        Extrapolation.CLAMP
      );
    }
  );

  const pressOpacityBackground = () => {
    if (sheetOpen) {
      sheetRef.current?.close();
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "History"
        }}
      />

      <View className="flex-1">
        <Animated.ScrollView nestedScrollEnabled className="flex-1 p-4 mb-12">
          <Pressable onPress={pressOpacityBackground}>
            {loading ? (
              <Text className="text-sm text-gray-600">Loading...</Text>
            ) : error ? (
              <Text className="text-sm text-red-500">{error}</Text>
            ) : notif.length === 0 ? (
              <Text className="text-sm text-gray-600">No history found.</Text>
            ) : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  <View className="flex-row gap-2">
                    {availableGroups.map((label) => (
                      <Pressable key={label} onPress={() => setSelectedGroup(label)}>
                        <View className={`px-3 py-1 rounded-full ${selectedGroup === label ? "bg-green-600" : "bg-foreground/10"}`}>
                          <Text className={`${selectedGroup === label ? "text-white" : "text-gray-400"} text-xs`}>
                            {label}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                {selectedGroup && groups[selectedGroup] ? (
                  <Animated.View key={selectedGroup} style={[animatedStyle]}>
                    <Text className="text-xl text-green-500 mb-4">{selectedGroup}</Text>

                    <View className="p-2 gap-6 pb-6">
                      {groups[selectedGroup].map((n) => {
                        const ApplianceIcon = getApplianceIcon(n.appliance);

                        return (
                          <View key={n.id} className="flex flex-row justify-between items-center">
                            <View className="flex flex-row items-center gap-3 flex-1">
                              <View className="px-3 py-2 bg-gray-800/20 rounded-lg">
                                <ApplianceIcon color={getApplianceIconColor(n.appliance)} size={36} />
                              </View>

                              <View className="gap-1 flex-1">
                                <View className="flex-row items-center gap-2">
                                  <Text className="text-sm font-medium flex-1">{n.message}</Text>
                                  <Text
                                    className={`text-xs font-semibold ${
                                      n.deltaValue > 0 ? "text-green-500" : "text-red-500"
                                    }`}
                                  >
                                    {n.deltaText}
                                  </Text>
                                </View>

                                <Text className="text-[10px] text-gray-600">
                                  {new Date(n.time).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true
                                  })}
                                  {" | "}
                                  {new Date(n.time).toLocaleDateString([], {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric"
                                  })}
                                </Text>
                              </View>
                            </View>

                            {/* <Pressable onPress={() => openSheet(n)}>
                              <EllipsisVertical color={"#fff"} />
                            </Pressable> */}
                          </View>
                        );
                      })}
                    </View>

                    {hasMore && (
                      <Pressable
                        onPress={loadMore}
                        className="bg-foreground/10 rounded-xl px-4 py-3 items-center mb-6"
                      >
                        <Text className="text-sm text-white">
                          {loadingMore ? "Loading..." : "Load More"}
                        </Text>
                      </Pressable>
                    )}
                  </Animated.View>
                ) : null}
              </>
            )}
          </Pressable>
        </Animated.ScrollView>

        <BottomSheet
          ref={sheetRef}
          index={-1}
          snapPoints={["35%"]}
          onClose={() => setSheetOpen(false)}
          animatedPosition={animatedPosition}
          enableDynamicSizing={false}
          enablePanDownToClose
          backgroundStyle={{ backgroundColor: "#1a1a1a" }}
          handleIndicatorStyle={{ backgroundColor: "#444" }}
        >
          <View className="px-6 py-4">
            <View className="flex-row items-center mb-3">
              <View className="bg-gray-800 w-14 h-14 rounded-md mr-3 items-center justify-center">
                {selectedItem ? (() => {
                  const ApplianceIcon = getApplianceIcon(selectedItem.appliance);
                  return (
                    <ApplianceIcon
                      color={getApplianceIconColor(selectedItem.appliance)}
                      size={28}
                    />
                  );
                })() : null}
              </View>

              <View className="flex-1">
                <Text className="text-white text-lg">
                  {selectedItem?.message ?? "No item selected"}
                </Text>
                <Text className="text-gray-400 text-sm">
                  {selectedItem
                    ? `${new Date(selectedItem.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true
                      })} | ${new Date(selectedItem.time).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}`
                    : ""}
                </Text>
                {selectedItem ? (
                  <Text
                    className={`text-sm mt-1 font-semibold ${
                      selectedItem.deltaValue > 0 ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {selectedItem.deltaText}
                  </Text>
                ) : null}
              </View>
            </View>

            <View className="border-b border-border my-2" />

            <View className="flex-row justify-between mt-4 mx-4">
              <TouchableOpacity className="items-center">
                <Share2 color="white" size={22} />
                <Text className="text-gray-300 text-xs mt-1">Share</Text>
              </TouchableOpacity>

              <TouchableOpacity className="items-center">
                <LayoutPanelLeft color="white" size={22} />
                <Text className="text-gray-300 text-xs mt-1">View Appliance</Text>
              </TouchableOpacity>

              <TouchableOpacity className="items-center">
                <Trash2 color="red" size={22} />
                <Text className="text-gray-300 text-xs mt-1">Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheet>
      </View>
    </>
  );
}