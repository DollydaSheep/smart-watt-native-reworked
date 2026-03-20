import { Stack } from "expo-router";
import { Dimensions, Pressable, ScrollView, TouchableOpacity, View } from "react-native";
import { Text } from '@/components/ui/text';
import { Edit, Ellipsis, EllipsisVertical, LayoutPanelLeft, Microwave, Share2, Trash2 } from "lucide-react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Animated, { Extrapolation, interpolate, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { NotifData } from '@/lib/types';
import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "expo-router";

export default function HistoryScreen(){

  const [sheetOpen, setSheetOpen] = useState(false);
  const [notif, setNotif] = useState<NotifData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const sheetRef = useRef<BottomSheet>(null);

  const { height: SCREEN_HEIGHT } = Dimensions.get("window");

  const snapPoints = useMemo(() => {
      const first = (SCREEN_HEIGHT);  // 55%
      const second = (SCREEN_HEIGHT) * 0.4; // 75%
      return [first, second];
    }, []);

  const openSheet = useCallback(() => {
    setSheetOpen(true);
    sheetRef.current?.expand();
  }, []);

  const blur = useSharedValue(0);

  const min = snapPoints[0];      // collapsed
  const max = snapPoints[1];  // fully open
  
  const animatedPosition = useSharedValue(0);

  const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

  const opacity = useDerivedValue(() => {
    return interpolate(
      animatedPosition.value,
      [min, max],     // fully open → collapsed
      [1, 0.1],
      Extrapolation.CLAMP
    );
  });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const end = new Date();
      end.setHours(24, 0, 0, 0);

      const start = new Date(end);
      start.setDate(end.getDate() - 30);
      start.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('appliance_events')
        .select(`
          id,
          appliance_label,
          started_at,
          ended_at,
          status,
          matched_state_w,
          estimated_energy_kwh
        `)
        .gte('started_at', start.toISOString())
        .lt('started_at', end.toISOString())
        .order('started_at', { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as Array<{
        id: number;
        appliance_label: string;
        started_at: string;
        ended_at: string | null;
        status: string;
        matched_state_w: number;
        estimated_energy_kwh: number;
      }>;

      const events: NotifData[] = rows.map((row) => {
        let message = '';

        if (row.status === 'on') {
          message = `${row.appliance_label} turned on`;
        } else if (row.status === 'off') {
          message = `${row.appliance_label} turned off`;
        } else if (row.status === 'completed') {
          message = `${row.appliance_label} usage completed`;
        } else {
          message = `${row.appliance_label} event: ${row.status}`;
        }

        return {
          id: String(row.id),
          time: row.started_at,
          message,
        };
      });

      setNotif(events);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load history');
      setNotif([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const groups = useMemo(() => {
    const grouped: Record<string, NotifData[]> = {};

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
        [min, max],   // bottom → fully open (adjust to your screen height)
        [0, 1],    // blur range
        Extrapolation.CLAMP
      );
    }
  );

  const pressOpacityBackground = () => {
    if(sheetOpen){
      sheetRef.current?.close();
    }
  }

  return(
    <>
      <Stack.Screen 
        options={{
          title: "History"
        }}
      />
      <View className="flex-1">
        <Animated.ScrollView nestedScrollEnabled className="flex-1 p-4 mb-12" >
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
                      <View className={`px-3 py-1 rounded-full ${selectedGroup === label ? 'bg-green-600' : 'bg-foreground/10'}`}>
                        <Text className={`${selectedGroup === label ? 'text-white' : 'text-gray-400'} text-xs`}>{label}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              {selectedGroup && groups[selectedGroup] ? (
                <Animated.View key={selectedGroup} style={[animatedStyle]}>
                  <Text className="text-xl text-green-500 mb-4">{selectedGroup}</Text>
                  <View className="p-2 gap-6 pb-6">
                    {groups[selectedGroup].map((n, index) => (
                      <View key={index} className='flex flex-row justify-between items-center'>
                        <View className="flex flex-row items-center gap-2">
                          <View className='px-3 py-2 bg-gray-800 rounded-lg'>
                            <Microwave color={'#fff'} size={36}/>
                          </View>
                          <View className="gap-1">
                            <Text className='text-sm font-medium'>{n.message}</Text>
                            <Text className='text-[10px] text-gray-600'>
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
                        <Pressable onPress={openSheet}>
                          <EllipsisVertical color={'#fff'}/>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </Animated.View>
              ) : null}
            </>
          )}
          </Pressable>
        </Animated.ScrollView>
        

        <BottomSheet
          ref={sheetRef}
          index={-1}
          snapPoints={['35%']}
          onClose={()=>setSheetOpen(false)}
          animatedPosition={animatedPosition}
          enableDynamicSizing={false}
          enablePanDownToClose
          backgroundStyle={{ backgroundColor: '#1a1a1a' }}
          handleIndicatorStyle={{ backgroundColor: '#444' }}
        >
          <View className="px-6 py-4">
            <View className="flex-row items-center mb-3">
              <View className="bg-green-600 w-10 h-10 rounded-md mr-3" />
              <View>
                <Text className="text-white text-lg">Microwave turned on</Text>
                <Text className="text-gray-400 text-sm">5:00 AM | 31/10/2025</Text>
              </View>
            </View>

            <View className="border-b border-border my-2"></View>
            {/* Action Buttons */}
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
  )
}