import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Link, router, Stack } from 'expo-router';
import { ChevronLeft, ChevronRight, Microwave, MoonStarIcon, StarIcon, SunIcon, TrendingDown, TrendingUp, Zap } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Dimensions, Image, type ImageStyle, Modal, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import Animated, { interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, useAnimatedProps, useAnimatedReaction, Extrapolation, useDerivedValue } from 'react-native-reanimated';
import { BlurView } from "expo-blur";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { THEME } from '@/lib/theme';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import HeroCarouselComponent from '@/components/carousel';
import { io, Socket } from "socket.io-client";
import EnergySphere3D from '@/components/sphere3D';
import { DeviceData, NotifData, SensorData } from '@/lib/types';
import Skeletoncircle from '@/components/skeleton/skeletoncircle';
import { useSmartWatt } from '@/lib/context';

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

  useEffect(() => {
    socketRef.current = io("https://puisne-krish-uncommiseratively.ngrok-free.dev");

    socketRef.current.on("mqtt-lights-on", (newNotif: NotifData) => {
      console.log("Received activity:", newNotif);
      setNotif(prev => [...prev, newNotif]);
    });

    socketRef.current.on("mqtt-device-data", (msg: DeviceData) => {
      console.log("Received mock data:", msg);
      setData(msg);
      setLoading(false);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const blur = useSharedValue(0);

  const { height: SCREEN_HEIGHT } = Dimensions.get("window");

  const snapPoints = useMemo(() => {
    const first = (SCREEN_HEIGHT - 225) * 0.55;  // 55%
    const second = (SCREEN_HEIGHT - 225) * 0.25; // 75%
    return [first, second];
  }, []);

  const min = snapPoints[0];      // collapsed
  const max = snapPoints[1];  // fully open

  console.log(min)
  console.log(max)
  
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

  useAnimatedReaction(
    () => animatedPosition.value,
    (pos) => {
      console.log(animatedPosition.value)
      blur.value = interpolate(
        pos,
        [min, max],   // bottom → fully open (adjust to your screen height)
        [0, 1],    // blur range
        Extrapolation.CLAMP
      );
    }
  );

  const animatedProps = useAnimatedProps(() => ({
    intensity: blur.value
  }));

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    // RE-RENDER the entire screen
    setRenderKey(prev => prev + 1);

    // Simulate any loading time + stop refresh icon
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  }, []);

  const [refreshing, setRefreshing] = useState(false);

	return (
		<>
			<ScrollView key={renderKey} contentContainerStyle={{ flexGrow: 1 }} refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#00c951"
          colors={["#00c951"]}
        />
      }>
      <View className="flex-1 items-center gap-4 p-4">
        <Animated.View className='mt-8 p-4 rounded-lg' style={[animatedStyle]} pointerEvents={bottomScrolled ? 'auto' : 'none'}>
          {/* <View className='p-36 self-center rounded-full bg-green-500'></View> */}
          {loading && (
            <Skeletoncircle size={280} />
          )}
          {data && (
            <HeroCarouselComponent devices={data!.devices} totalUsage={data!.totalUsage} voltage={data!.voltage} current={data!.current} />
          )}
        </Animated.View>
        {/* <View className='w-full mt-5 p-4 border border-border rounded-lg'>
          <View className='p-36 self-center rounded-full bg-green-500'></View>
        </View> */}

        

        <BottomSheet
          snapPoints={["50%","75%"]}
          enableDynamicSizing={false}
          animatedPosition={animatedPosition}
          onChange={()=>{setBottomScrolled(!bottomScrolled);console.log("changed",bottomScrolled)}}
          enableContentPanningGesture={true}
          enableHandlePanningGesture={true}
          backgroundStyle={{ backgroundColor: 'transparent', overflow: "hidden" }}
          handleStyle={{ backgroundColor: 'transparent' }}
          handleIndicatorStyle={{ display: "none" }}
          
        >
          {/* Example list items */}
          <View className='w-full p-4 flex flex-col mb-4'>
            <Pressable onPress={()=>setModalVisible(true)}>
              <View className='flex flex-row gap-2 justify-between'>
                <View className='flex flex-row gap-2'>
                  <Zap fill={"#00c951"} color={"#00c951"} size={48}/>
                  <View className='flex flex-col'>
                    <View className='flex flex-row items-end gap-2 -mt-1'>
                      {data ? (
                        <Text className='text-4xl font-medium'>{data!.totalUsage}</Text>
                      ): (
                        <Text className='text-4xl font-medium'>0</Text>
                      )}
                      <Text className='text-base font-medium text-gray-600'>kW</Text>
                    </View>
                    <Text className='self-end font-medium text-gray-600 text-base'>/{powerLimit} kW</Text>
                  </View>
                  {data ? (
                    <>
                      <Text className='ml-1 self-end font-medium text-gray-600 text-base'>{data!.voltage} V</Text>
                      <Text className='ml-1 self-end font-medium text-gray-600 text-base'>{data!.current} A</Text>
                    </>
                  ): (
                    <>
                      <Text className='ml-1 self-end font-medium text-gray-600 text-base'>0 V</Text>
                      <Text className='ml-1 self-end font-medium text-gray-600 text-base'>0 A</Text>
                    </>
                  )}
                </View>
                <Icon as={ChevronRight} className='size-4 text-foreground mr-2 self-center' />
              </View>
            </Pressable>
            <View className='flex flex-row justify-between pt-2'>
              <View className='flex flex-row items-center gap-1'>
                {anomalyLevel === 'warning' ? (
                  <TrendingDown color={"#efb100"} size={12} />
                ) : (
                  <TrendingUp color={"#00c951"} size={12} />
                )}
                <Text className={`text-[8px] ${anomalyLevel === 'warning' ? "text-yellow-500" : "text-green-500"}`}>{anomalyLevel === 'warning' ? "Unoptimized" : "Optimized Efficiency"}</Text>
              </View>
              <View className='flex flex-row items-center gap-1'>
                <View className={`p-0.5 rounded-full ${anomalyLevel === 'warning' ? "bg-yellow-500" : "bg-green-500"}`}></View>
                <Text className={`text-[8px] ${anomalyLevel === 'warning' ? "text-yellow-500" : "text-green-500"}`}>{anomalyLevel === 'warning' ? "1" : "0"} Anomalies</Text>
              </View>
            </View>

          </View>
          <View className="p-4">
            <View className='space-y-4 border border-foreground/5 rounded-lg h-[85%]'>
              <Pressable onPress={()=>router.navigate('/history')}>
                <View className='flex flex-row justify-between items-center px-5 py-4'>
                  <Text className='font-medium'>Today</Text>
                  <View className='flex flex-row items-center -mr-2 gap-2'>
                    <Text className='text-[10px] text-gray-600'>Oct 10, 2025</Text>
                    <ChevronRight color={'#fff'} size={20}/>
                  </View>
                </View>
              </Pressable>
              <BottomSheetScrollView
                enableOnAndroid={true}
                nestedScrollEnabled={true}
                className="px-4 pt-2 mb-6"
              >
                  <View className='flex flex-col gap-2'>
                    
                    {notif && (
                      notif.map((n) => (
                        <View className='flex flex-row p-4 gap-2'>
                          <View className='px-3 py-2 bg-gray-800 rounded-lg'>
                            <Microwave color={'#fff'} size={36}/>
                          </View>
                          <View>
                            <Text className='text-xs text-gray-600'>{n.time}</Text>
                            <Text className='font-medium'>{n.message}</Text>
                          </View>
                        </View>
                      ))
                    )}

                    <View className='flex flex-row p-4 gap-2'>
                      <View className='px-3 py-2 bg-gray-800 rounded-lg'>
                        <Microwave color={'#fff'} size={36}/>
                      </View>
                      <View>
                        <Text className='text-xs text-gray-600'>5:00 AM</Text>
                        <Text className='font-medium'>Microwave turned on</Text>
                      </View>
                    </View>  

                    <View className='flex flex-row p-4 gap-2'>
                      <View className='px-3 py-2 bg-gray-800 rounded-lg'>
                        <Microwave color={'#fff'} size={36}/>
                      </View>
                      <View>
                        <Text className='text-xs text-gray-600'>5:00 AM</Text>
                        <Text className='font-medium'>Microwave turned on</Text>
                      </View>
                    </View>  

                    <View className='flex flex-row p-4 gap-2'>
                      <View className='px-3 py-2 bg-gray-800 rounded-lg'>
                        <Microwave color={'#fff'} size={36}/>
                      </View>
                      <View>
                        <Text className='text-xs text-gray-600'>5:00 AM</Text>
                        <Text className='font-medium'>Microwave turned on</Text>
                      </View>
                    </View>  

                    <View className='flex flex-row p-4 gap-2'>
                      <View className='px-3 py-2 bg-gray-800 rounded-lg'>
                        <Microwave color={'#fff'} size={36}/>
                      </View>
                      <View>
                        <Text className='text-xs text-gray-600'>5:00 AM</Text>
                        <Text className='font-medium'>Microwave turned on</Text>
                      </View>
                    </View>                   

                    
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
          <Pressable onPress={()=>setModalVisible(false)} className='p-2'>
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
	)
}