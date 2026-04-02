import { Text } from '@/components/ui/text';
import { useSmartWatt } from '@/lib/context';
import { THEME } from '@/lib/theme';
import { DeviceData } from '@/lib/types';
import { ChevronDown, Zap } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Image, TextInput, Dimensions, Pressable } from 'react-native';
import { io } from "socket.io-client";
import { useFocusEffect } from 'expo-router';
import { Icon } from '@/components/ui/icon';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const API_BASE = "https://smartwatt-server.netlify.app/.netlify/functions/api";

export default function MenuTabScreen(){
  
  const { anomalyLevel, powerLimit, setPowerLimit, setAnomalyLevel } = useSmartWatt();

  const [storePower, setStorePower] = useState('');
  const [data, setData] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [usedTodayKwh, setUsedTodayKwh] = useState<number>(0);

  

  const screenWidth = Dimensions.get("window").width;
  const progress = data ? data.totalUsage / powerLimit : 0;
  const barWidth = progress * screenWidth;


  //anomalycolor

  


  // 🔥 Dropdown animation
  const isOpen = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => ({
    maxHeight: withTiming(isOpen.value ? 220 : 0, {
      duration: 420,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    }),
    opacity: withTiming(isOpen.value ? 1 : 0, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    }),
    transform: [
      {
        translateY: withTiming(isOpen.value ? 0 : -8, {
          duration: 420,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        }),
      },
    ],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: withTiming(isOpen.value ? "180deg" : "0deg", {
          duration: 350,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
        }),
      },
    ],
  }));

  const toggleDropdown = () => {
    isOpen.value = !isOpen.value;
  };

  // 🔥 Chad animation (Reanimated)
  const chadAnim = useSharedValue(80);

  useFocusEffect(
    useCallback(() => {
      chadAnim.value = 80;
      chadAnim.value = withTiming(0, {
        duration: 750,
        easing: Easing.out(Easing.cubic),
      });
    }, [])
  );

  const chadStyle = useAnimatedStyle(() => ({
    opacity: interpolate(chadAnim.value, [-40, 0, 50], [0, 1, 0]),
    transform: [{ translateY: chadAnim.value }],
  }));

  const chadSource =
    anomalyLevel === 'critical'
      ? require('@/assets/images/ChadRed.png')
      : anomalyLevel === 'warning'
      ? require('@/assets/images/ChadYellow.png')
      : require('@/assets/images/ChadGreen.png');

  // 🔥 Socket (FIXED cleanup)
  const socket = useMemo(() => io("https://puisne-krish-uncommiseratively.ngrok-free.dev"), []);

  useEffect(() => {
    socket.on("mqtt-device-data", (msg: DeviceData) => {
      setData(msg);
      setLoading(false);
    });

    return () => {
      socket.disconnect(); // ✅ FIXED
    };
  }, [socket]);

  // 🔥 Fetch usage
  const fetchUsedToday = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const url = `${API_BASE}/power/daily?date=${today}&tz=Asia/Manila`;

      const res = await fetch(url);
      if (!res.ok) throw new Error();

      const json = await res.json();
      const total = Number(json?.current?.total_energy_kwh ?? 0);
      setUsedTodayKwh(Number.isFinite(total) ? total : 0);
    } catch {
      setUsedTodayKwh(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUsedToday();
    }, [fetchUsedToday])
  );

  useEffect(() => {
    setStorePower(powerLimit.toString());
  }, [powerLimit]);

  const commitPowerLimit = () => {
    const parsed = parseFloat(storePower);
    if (!isNaN(parsed) && parsed > 0) {
      setPowerLimit(parsed);
    } else {
      setStorePower(powerLimit.toString());
    }
  };

  return (
    <ScrollView scrollEnabled={false} bounces={false} overScrollMode="never">
      <View className='flex-1'>

        {/* Header */}
        <View className='flex flex-row justify-center py-8 border-b border-border'>
          <Image
            source={require('assets/images/smartwattname2.png')}
            style={{ width: 250, height: 100 }}
          />
        </View>

        {/* Power Section */}
        <View className='items-center py-8 px-4 border-b border-border'>

          <Pressable className='flex flex-row items-center gap-4' onPress={toggleDropdown}>
            <View 
              className='p-4 rounded-full'
              style={{
                backgroundColor:
                  anomalyLevel === 'critical' ? '#ef4444' :
                  anomalyLevel === 'warning' ? '#F5C20B' :
                  '#10b981',
              }}
            >
              <Zap color="#fff" fill="#fff" />
            </View>

            <View className='flex-1 py-2 px-4 bg-foreground/10 rounded-lg flex-row items-center justify-between'>
              <View>
                <Text className='text-2xl font-semibold'>{powerLimit.toFixed(1)} W</Text>
                <Text className='text-xs text-foreground/40'>Power Limit</Text>
              </View>

              <Animated.View style={iconStyle}>
                <Icon as={ChevronDown} size={20} color={THEME.dark.foreground} />
              </Animated.View>
            </View>
          </Pressable>

          <Animated.View style={[animatedStyle, { overflow: "hidden" }]} className='flex flex-row items-center gap-4 mt-2 pb-3'>
            <View className='p-4 rounded-full opacity-0' />

            <View className='flex-1 bg-foreground/10 pb-5 rounded-lg'>
              <View className='px-4 py-2'>
                <Text className='text-green-400 text-sm font-medium'>
                  {usedTodayKwh.toFixed(2)} kWh
                </Text>

                <Text className='text-[10px] text-foreground/40'>Used Today</Text>

                <Text className='font-medium text-sm my-2'>Power Limit (W)</Text>

                <View className='flex flex-row gap-2'>
                  <TextInput
                    className='px-4 py-2 flex-1 text-medium bg-white rounded-md'
                    value={storePower}
                    onChangeText={setStorePower}
                    onSubmitEditing={commitPowerLimit}
                    onEndEditing={commitPowerLimit}
                    keyboardType="decimal-pad"
                  />

                  <Pressable onPress={commitPowerLimit} className='px-4 py-3 rounded-md bg-green-600'>
                    <Text className='text-xs text-white'>Apply</Text>
                  </Pressable>
                </View>
              </View>

              
            </View>
          </Animated.View>

        </View>

        {/* 🔥 Chad */}
        <Animated.View style={[{ alignItems: 'flex-end', marginTop: 178 }, chadStyle]}>
          <Image
            source={chadSource }
            style={{ width: 300, height: 300, resizeMode: 'contain' }}
          />
        </Animated.View>

      </View>
    </ScrollView>
  );
}