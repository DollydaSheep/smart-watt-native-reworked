import { Text } from '@/components/ui/text';
import { useSmartWatt } from '@/lib/context';
import { THEME } from '@/lib/theme';
import { DeviceData } from '@/lib/types';
import { ChevronDown, Zap, LogOut } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Image, TextInput, Dimensions, Pressable, Alert, Modal } from 'react-native';
import { io } from "socket.io-client";
import { useFocusEffect } from 'expo-router';
import { Icon } from '@/components/ui/icon';
import { supabase } from '@/lib/supabase';

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
  const [signOutModalOpen, setSignOutModalOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  

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

  const handleSignOut = () => {
    setSignOutModalOpen(true);
  };

  const handleConfirmSignOut = async () => {
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSignOutModalOpen(false);
      Alert.alert("Signed Out", "You have been successfully signed out.");
      // You might want to navigate to login screen here
      // router.replace('/login'); // if you have a login route
    } catch (error: any) {
      Alert.alert("Error", "Failed to sign out: " + error.message);
    } finally {
      setSigningOut(false);
    }
  };

  const handleCancelSignOut = () => {
    setSignOutModalOpen(false);
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

        {/* Sign Out Section */}
        <View className='px-4 py-2 border-b border-border'>
          <Pressable 
            onPress={handleSignOut}
            className='flex flex-row items-center gap-3 p-4 rounded-lg'
          >
            <View className='p-3 rounded-full border border-white/20 dark:border-white/20'>
              <Icon as={LogOut} size={20} color="#ffffff" />
            </View>
            <View className='flex-1'>
              <Text className='text-white font-medium'>Sign Out</Text>
              <Text className='text-xs text-white/50'>Log out of your account</Text>
            </View>
          </Pressable>
        </View>

        {/* 🔥 Chad */}
        <Animated.View style={[{ alignItems: 'flex-end', marginTop: 63 }, chadStyle]}>
          <Image
            source={chadSource }
            style={{ width: 300, height: 300, resizeMode: 'contain' }}
          />
        </Animated.View>

      </View>

      {/* Sign Out Confirmation Modal */}
      <Modal transparent visible={signOutModalOpen} animationType="fade">
        <View className="flex-1 bg-background/70 items-center justify-center px-6">
          <View className="w-full max-w-md bg-[#141414] rounded-2xl p-5 border border-foreground/10">
            <Text className="text-lg font-semibold mb-2">Sign Out</Text>

            <Text className="text-sm text-foreground/70 mb-5">
              Are you sure you want to sign out?
            </Text>

            <View className="flex-row gap-3">
              <Pressable
                onPress={handleCancelSignOut}
                disabled={signingOut}
                className="flex-1 py-3 rounded-xl bg-foreground/10 items-center"
              >
                <Text className="font-medium text-sm">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmSignOut}
                disabled={signingOut}
                className={`flex-1 py-3 rounded-xl items-center justify-center px-4 bg-red-600 ${
                  signingOut ? 'opacity-60' : 'opacity-100'
                }`}
              >
                <Text className="font-medium text-white text-sm">
                  {signingOut ? 'Signing Out...' : 'Sign Out'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}