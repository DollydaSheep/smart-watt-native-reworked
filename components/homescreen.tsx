import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Link, router, Stack } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Microwave,
  Monitor,
  MoonStarIcon,
  StarIcon,
  SunIcon,
  TrendingDown,
  TrendingUp,
  Tv,
  WashingMachine,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Dimensions, Image, type ImageStyle, Modal, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, useAnimatedProps, useAnimatedReaction, Extrapolation, useDerivedValue } from 'react-native-reanimated';
import { BlurView } from "expo-blur";
import Svg, { Path } from 'react-native-svg';
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { THEME } from '@/lib/theme';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import HeroCarouselComponent from '@/components/carousel';
import { io, Socket } from "socket.io-client";
import EnergySphere3D from '@/components/sphere3D';
import { DeviceData, NotifData, SensorData } from '@/lib/types';
import Skeletoncircle from '@/components/skeleton/skeletoncircle';
import { useSmartWatt } from '@/lib/context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

const NOTIF_CACHE_KEY = "smartwatt_notifications";
const LAST_NOTIF_SYNC_KEY = "smartwatt_last_notif_sync";

export default function HomeScreen() {
  const { powerLimit, setPowerLimit } = useSmartWatt();
  const { anomalyLevel, setAnomalyLevel } = useSmartWatt();

  const [data, setData] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState<NotifData[]>([]);

  const [modalVisible, setModalVisible] = useState(false);

  const [bottomScrolled, setBottomScrolled] = useState(false);

  const [renderKey, setRenderKey] = useState(0);

  const { colorScheme } = useColorScheme();

  const socketRef = useRef<Socket | null>(null);

  const MAX_NOTIFICATIONS = 20;

  const todayLabel = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Manila",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date());
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

    if (name.includes("tv") || name.includes("television")) return "#8b5cf6"; // violet-500
    if (name.includes("pc") || name.includes("computer") || name.includes("desktop")) return "#60a5fa"; // blue-400
    if (name.includes("washing machine") || name.includes("washer")) return "#4ade80"; // green-400
    if (name.includes("rice cooker")) return "#facc15"; // yellow-400

    return "#ffffff";
  }, []);

  useEffect(() => {
    let readingsChannel: RealtimeChannel;
    let eventsChannel: RealtimeChannel;
    let isMounted = true;

    const appendNotification = async (newNotif: NotifData) => {
      setNotif((prev) => {
        const index = prev.findIndex((item) => item.id === newNotif.id);

        let updated: NotifData[];

        if (index >= 0) {
          updated = [...prev];
          updated[index] = { ...updated[index], ...newNotif };
        } else {
          updated = [newNotif, ...prev];
        }

        updated = updated
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
          .slice(0, MAX_NOTIFICATIONS);

        AsyncStorage.setItem(NOTIF_CACHE_KEY, JSON.stringify(updated));
        return updated;
      });
    };

    const appendNotificationsBulk = async (newNotifs: NotifData[]) => {
      if (newNotifs.length === 0) return;

      setNotif((prev) => {
        const map = new Map(prev.map((item) => [item.id, item]));

        for (const item of newNotifs) {
          const existing = map.get(item.id);
          map.set(item.id, { ...existing, ...item });
        }

        const updated = Array.from(map.values())
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
          .slice(0, MAX_NOTIFICATIONS);

        AsyncStorage.setItem(NOTIF_CACHE_KEY, JSON.stringify(updated));
        return updated;
      });
    };

    const updateLastSync = async (isoTime?: string) => {
      const value = isoTime ?? new Date().toISOString();
      await AsyncStorage.setItem(LAST_NOTIF_SYNC_KEY, value);
    };

    const loadInitialData = async () => {
      try {
        const cached = await AsyncStorage.getItem(NOTIF_CACHE_KEY);
        if (cached && isMounted) {
          const parsed = JSON.parse(cached).slice(0, MAX_NOTIFICATIONS);
          setNotif(parsed);
          await AsyncStorage.setItem(NOTIF_CACHE_KEY, JSON.stringify(parsed));
        }

        const { data: latestReading, error: readingError } = await supabase
          .from("energy_readings")
          .select("*")
          .eq("id", 1)
          .maybeSingle();

        if (readingError) {
          console.error("Initial reading fetch error:", readingError);
        }

        if (latestReading && isMounted) {
          setData({
            totalUsage: latestReading.power ?? 0,
            voltage: latestReading.voltage ?? 0,
            current: latestReading.current ?? 0,
            devices: latestReading.detected_appliances ?? [],
          });
        }
      } catch (err) {
        console.error("Initial Supabase load error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const backfillMissedApplianceEvents = async () => {
      try {
        const lastSync = await AsyncStorage.getItem(LAST_NOTIF_SYNC_KEY);

        let query = supabase
          .from("appliance_events")
          .select("*")
          .order("started_at", { ascending: false })
          .limit(10);

        if (lastSync) {
          query = query.or(
            `started_at.gt.${lastSync},ended_at.gt.${lastSync}`
          );
        } else {
          const fallback = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          query = query.or(
            `started_at.gt.${fallback},ended_at.gt.${fallback}`
          );
        }

        const { data, error } = await query;

        if (error) {
          console.error("Backfill appliance_events error:", error);
          return;
        }

        if (!data || data.length === 0) {
          await updateLastSync();
          return;
        }

        const recovered: NotifData[] = [];

        for (const row of data) {
          if (row.started_at) {
            recovered.push({
              id: `on-${row.id}`,
              message: `${row.appliance_label} turned on`,
              time: row.started_at,
              type: "on",
              appliance_label: row.appliance_label,
              delta_w: row.raw_delta_w ?? null,
              smoothed_delta_w: row.smoothed_delta_w ?? null,
            });
          }

          if (row.status === "closed" && row.ended_at) {
            recovered.push({
              id: `off-${row.id}`,
              message: `${row.appliance_label} turned off`,
              time: row.ended_at,
              type: "off",
              appliance_label: row.appliance_label,
              delta_w: row.raw_off_delta_w ?? null,
              smoothed_delta_w: row.smoothed_off_delta_w ?? null,
            });
          }
        }

        await appendNotificationsBulk(recovered);

        const newestTime = data.reduce((latest, row) => {
          const candidate = row.ended_at ?? row.started_at ?? latest;
          return new Date(candidate).getTime() > new Date(latest).getTime()
            ? candidate
            : latest;
        }, data[0].ended_at ?? data[0].started_at ?? new Date().toISOString());

        await updateLastSync(newestTime);
      } catch (err) {
        console.error("Backfill error:", err);
      }
    };

    const init = async () => {
      await loadInitialData();
      await backfillMissedApplianceEvents();

      readingsChannel = supabase
        .channel("energy-readings-live")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "energy_readings",
            filter: "id=eq.1",
          },
          (payload) => {
            const row = payload.new as any;

            console.log("Updated energy reading:", row);

            if (!isMounted) return;

            setData({
              totalUsage: row.power ?? 0,
              voltage: row.voltage ?? 0,
              current: row.current ?? 0,
              devices: row.detected_appliances ?? [],
            });

            setLoading(false);
          }
        )
        .subscribe((status) => {
          console.log("energy_readings channel status:", status);
        });

      eventsChannel = supabase
        .channel("appliance-events-live")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "appliance_events",
          },
          async (payload) => {
            const row = payload.new as any;

            console.log("Inserted appliance event:", row);

            if (row.status === "open") {
              await appendNotification({
                id: `on-${row.id}`,
                message: `${row.appliance_label} turned on`,
                time: row.started_at ?? new Date().toISOString(),
                type: "on",
                appliance_label: row.appliance_label,
                delta_w: row.raw_delta_w ?? null,
                smoothed_delta_w: row.smoothed_delta_w ?? null,
              });
            }

            await updateLastSync(row.started_at ?? new Date().toISOString());
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "appliance_events",
          },
          async (payload) => {
            const oldRow = payload.old as any;
            const newRow = payload.new as any;

            console.log("Updated appliance event:", newRow);

            if (oldRow.status !== "closed" && newRow.status === "closed") {
              await appendNotification({
                id: `off-${newRow.id}`,
                message: `${newRow.appliance_label} turned off`,
                time: newRow.ended_at ?? new Date().toISOString(),
                type: "off",
                appliance_label: newRow.appliance_label,
                delta_w: newRow.raw_off_delta_w ?? null,
                smoothed_delta_w: newRow.smoothed_off_delta_w ?? null,
              });
            }

            await updateLastSync(
              newRow.ended_at ?? newRow.started_at ?? new Date().toISOString()
            );
          }
        )
        .subscribe((status) => {
          console.log("appliance_events channel status:", status);
        });
    };

    init();

    return () => {
      isMounted = false;
      if (readingsChannel) supabase.removeChannel(readingsChannel);
      if (eventsChannel) supabase.removeChannel(eventsChannel);
    };
  }, [renderKey, getApplianceIcon, getApplianceIconColor]);

  const blur = useSharedValue(0);

  const { height: SCREEN_HEIGHT } = Dimensions.get("window");

  const snapPoints = useMemo(() => {
    const first = (SCREEN_HEIGHT - 225) * 0.55;
    const second = (SCREEN_HEIGHT - 225) * 0.25;
    return [first, second];
  }, [SCREEN_HEIGHT]);

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

  const animatedProps = useAnimatedProps(() => ({
    intensity: blur.value
  }));

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRenderKey(prev => prev + 1);

    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  return (
    <>
      <ScrollView
        key={renderKey}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00c951"
            colors={["#00c951"]}
          />
        }
      >
        <View className="flex-1 items-center gap-4 p-4">
          <Animated.View className='mt-8 p-4 rounded-lg' style={[animatedStyle]} pointerEvents={bottomScrolled ? 'auto' : 'none'}>
            {loading && (
              <Skeletoncircle size={280} />
            )}
            {data && (
              <HeroCarouselComponent devices={data.totalUsage ? data.devices : data.devices} totalUsage={data.totalUsage} voltage={data.voltage} current={data.current} />
            )}
          </Animated.View>

          <BottomSheet
            snapPoints={["50%","75%"]}
            enableDynamicSizing={false}
            animatedPosition={animatedPosition}
            onChange={() => { setBottomScrolled(!bottomScrolled); console.log("changed", bottomScrolled); }}
            enableContentPanningGesture={true}
            enableHandlePanningGesture={true}
            backgroundStyle={{ backgroundColor: 'transparent', overflow: "hidden" }}
            handleStyle={{ backgroundColor: 'transparent' }}
            handleIndicatorStyle={{ display: "none" }}
          >
            <View className='w-full p-4 pt-20 flex flex-col'>
              <Pressable onPress={() => setModalVisible(true)}>
                <View className='flex flex-row gap-2 justify-between'>
                  <View className='flex flex-row gap-2'>
                    <Svg
                      width={48}
                      height={48}
                      viewBox="0 0 40 73"
                      fill="none"
                    >
                      <Path
                        d="M6.54856 48.1286L20.5917 13.0207C21.0164 11.959 22.6025 12.3262 22.5174 13.4665L20.5802 39.4256C20.5369 40.0056 20.9958 40.5 21.5774 40.5H37.7433C38.5185 40.5 38.9989 41.3439 38.6031 42.0105L24.7275 65.3801C24.124 66.3964 22.5668 65.7092 22.9109 64.5784L27.107 50.7912C27.3026 50.1487 26.8219 49.5 26.1504 49.5H7.47703C6.76957 49.5 6.28581 48.7855 6.54856 48.1286Z"
                        fill={anomalyLevel === 'critical' ? '#612727' : anomalyLevel === 'warning' ? '#805B1E' : '#0D6731'}
                        stroke="black"
                      />
                      <Path
                        d="M0.548556 41.1286L14.5917 6.0207C15.0164 4.95901 16.6025 5.32621 16.5174 6.46651L14.5802 32.4256C14.5369 33.0056 14.9958 33.5 15.5774 33.5H31.7433C32.5185 33.5 32.9989 34.3439 32.6031 35.0105L18.7275 58.3801C18.124 59.3964 16.5668 58.7092 16.9109 57.5784L21.107 43.7912C21.3026 43.1487 20.8219 42.5 20.1504 42.5H1.47703C0.769568 42.5 0.28581 41.7855 0.548556 41.1286Z"
                        fill={anomalyLevel === 'critical' ? '#ef4444' : anomalyLevel === 'warning' ? '#f59e0b' : '#00c951'}
                      />
                    </Svg>
                    <View className='flex flex-col'>
                      <View className='flex flex-row items-end gap-2 -mt-1'>
                        {data ? (
                          <Text className={`text-3xl font-medium ${anomalyLevel === 'critical' ? 'text-red-500' : anomalyLevel === 'warning' ? 'text-yellow-500' : ''}`}>{data.totalUsage}</Text>
                        ) : (
                          <Text className={`text-3xl font-medium ${anomalyLevel === 'critical' ? 'text-red-500' : anomalyLevel === 'warning' ? 'text-yellow-500' : ''}`}>0</Text>
                        )}
                        <Text className='text-base font-medium text-gray-600'>W</Text>
                      </View>
                      <Text className='self-end font-medium text-gray-600 text-base text-[1em]'>/{powerLimit} W</Text>
                    </View>
                    {data ? (
                      <>
                        <Text className='ml-1 self-end font-medium text-gray-600 text-base text-[1em]'>{data.voltage} V</Text>
                        <Text className='ml-1 self-end font-medium text-gray-600 text-base text-[1em]'>{data.current} A</Text>
                      </>
                    ) : (
                      <>
                        <Text className='ml-1 self-end font-medium text-gray-600 text-base text-[1em]'>0 V</Text>
                        <Text className='ml-1 self-end font-medium text-gray-600 text-base'>0 A</Text>
                      </>
                    )}
                  </View>
                </View>
              </Pressable>

              <View className='flex flex-row justify-between pt-2'>
                <View className='flex flex-row items-center gap-1'>
                  {anomalyLevel === 'critical' ? (
                    <TrendingDown color={"#ef4444"} size={12} />
                  ) : anomalyLevel === 'warning' ? (
                    <TrendingDown color={"#efb100"} size={12} />
                  ) : (
                    <TrendingUp color={"#00c951"} size={12} />
                  )}
                  <Text className={`text-[8px] ${anomalyLevel === 'critical' ? "text-red-500" : anomalyLevel === 'warning' ? "text-yellow-500" : "text-green-500"}`}>
                    {anomalyLevel === 'warning' || anomalyLevel === 'critical' ? "Unoptimized" : "Optimized Efficiency"}
                  </Text>
                </View>
                <View className='flex flex-row items-center gap-1'>
                  <View className={`p-0.5 rounded-full ${anomalyLevel === 'critical' ? "bg-red-500" : anomalyLevel === 'warning' ? "bg-yellow-500" : "bg-green-500"}`}></View>
                  <Text className={`text-[8px] ${anomalyLevel === 'critical' ? "text-red-500" : anomalyLevel === 'warning' ? "text-yellow-500" : "text-green-500"}`}>
                    {anomalyLevel === 'warning' || anomalyLevel === 'critical' ? "1" : "0"} Anomalies
                  </Text>
                </View>
              </View>
            </View>

            <View className="p-4">
              <View className='space-y-4 border border-foreground/5 rounded-lg'>
                <Pressable onPress={() => router.navigate('/history')}>
                  <View className='flex flex-row justify-between items-center px-5 py-4'>
                    <Text className='font-medium'>Today</Text>
                    <View className='flex flex-row items-center -mr-2 gap-2'>
                      <Text className='text-[10px] text-gray-600'>{todayLabel}</Text>
                      <ChevronRight color={'#fff'} size={20} />
                    </View>
                  </View>
                </Pressable>

                <BottomSheetScrollView
                  enableOnAndroid={true}
                  nestedScrollEnabled={true}
                  className="px-4 pt-2 mb-6"
                >
                  <View className="flex flex-col gap-2 pb-16">
                    {notif.length === 0 ? (
                      <View className="p-4">
                        <Text className="text-sm text-gray-500">No recent notifications</Text>
                      </View>
                    ) : (
                      notif.map((n, index) => {
                        const ApplianceIcon = getApplianceIcon(n.appliance_label);

                        return (
                          <View key={n.id ?? index} className="flex flex-row p-4 gap-2">
                            <View className="px-3 py-2 bg-gray-800 rounded-lg self-start">
                              <ApplianceIcon
                                color={getApplianceIconColor(n.appliance_label)}
                                size={36}
                              />
                            </View>

                            <View className="flex-1">
                              <Text className="text-xs text-gray-600">
                                {(() => {
                                  const date = new Date(n.time);
                                  const now = new Date();
                                  const diffHours =
                                    (now.getTime() - date.getTime()) / (1000 * 60 * 60);

                                  if (diffHours >= 24) {
                                    return date.toLocaleDateString([], {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    });
                                  } else {
                                    return date.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    });
                                  }
                                })()}
                              </Text>

                              <Text className="font-medium capitalize">{n.message}</Text>

                              {n.delta_w != null && !Number.isNaN(Number(n.delta_w)) && (
                                <Text className={`font-light ${n.type === "on" ? "text-green-600" : "text-red-600"}`}>
                                  {n.type === "on" ? "Spike" : "Drop"}:{" "}
                                  {n.type === "on"
                                    ? `${Number(n.delta_w) > 0 ? "+" : ""}${Number(n.delta_w).toFixed(1)} W`
                                    : `${Math.abs(Number(n.delta_w)).toFixed(1)} W`}
                                </Text>
                              )}
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                </BottomSheetScrollView>
              </View>
            </View>
          </BottomSheet>
        </View>

        <Modal
          animationType='fade'
          transparent={true}
          visible={modalVisible}
        >
          <View className='flex-1 bg-background/80 p-4'>
            <Pressable onPress={() => setModalVisible(false)} className='p-2'>
              <Icon as={ChevronLeft} className='size-5 text-foreground' />
            </Pressable>
            <Text>Legend</Text>
            <View className='flex flex-row gap-2'>
              <View className='p-1 rounded-full bg-blue-500 self-center'></View>
              <Text>Refrigerator</Text>
            </View>
            <View className='flex flex-row gap-2'>
              <View className='p-1 rounded-full bg-green-500 self-center'></View>
              <Text>PC</Text>
            </View>
            <View className='flex flex-row gap-2'>
              <View className='p-1 rounded-full bg-yellow-500 self-center'></View>
              <Text>Electric Fan</Text>
            </View>
            <Text>Current: 10 A</Text>
            <Text>Voltage: 12 V</Text>
            <Text>Cost: P39.8</Text>
          </View>
        </Modal>
      </ScrollView>
    </>
  );
}