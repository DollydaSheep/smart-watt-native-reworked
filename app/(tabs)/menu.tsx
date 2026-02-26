import { Text } from '@/components/ui/text';
import { useSmartWatt } from '@/lib/context';
import { THEME } from '@/lib/theme';
import { DeviceData } from '@/lib/types';
import { Bell, ChevronDown, ChevronUp, CircleQuestionMark, HandHeart, Key, KeyRound, Monitor, Palette, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, View, Image, TextInput, Dimensions, Pressable } from 'react-native';
import { io } from "socket.io-client";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Icon } from '@/components/ui/icon';

export default function MenuTabScreen(){

  const { powerLimit, setPowerLimit } = useSmartWatt();

  const [storePower, setStorePower] = useState('');

  const [data, setData] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(true);

  const screenWidth = Dimensions.get("window").width;

  const progress = data ? data.totalUsage / powerLimit : 0;
  const barWidth = progress * screenWidth;

  const isOpen = useSharedValue(false);

  const socket = io("https://puisne-krish-uncommiseratively.ngrok-free.dev");

  useEffect(() => {

    socket.on("mqtt-device-data", (msg: DeviceData) => {
      console.log("Received mock data:", msg);
      setData(msg);
      setLoading(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(()=>{
    setStorePower(powerLimit.toString());
  },[])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      maxHeight: withTiming(isOpen.value ? 220 : 0, {
        duration: 420,
        easing: Easing.bezier(0.22, 1, 0.36, 1), // smooth premium easing
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
    };
  });

  const toggleDropdown = () => {
    isOpen.value = !isOpen.value;
  };

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

  return(
    <>
      <ScrollView>
        <View className='flex-1'>
          <View className='flex flex-row justify-center py-8 border-b border-border'>
            <Text className='text-4xl font-semibold'>SmarT-WaTT</Text>
          </View>

          <View className='flex flex-column items-center justify-center py-8 px-4 border-b border-border'>
            
            <Pressable className='flex flex-row items-center gap-4' onPress={toggleDropdown}>
              <View className='p-4 self-center rounded-full bg-green-500'>
                <Zap 
                  color={"#fff"}
                  fill={"#fff"}
                />
              </View>
              <View className='flex-1 py-2 px-4 bg-foreground/10 rounded-lg flex-row items-center justify-between'>
                <View className=''>
                  <Text className='text-2xl font-semibold'>15.0 kW</Text>
                  <Text className='text-xs text-foreground/40'>Power Limit</Text>
                </View>
                <Animated.View style={iconStyle}>
                  <Icon
                    as={ChevronDown}
                    size={20}
                    color={THEME.dark.foreground}
                  />
                </Animated.View>
              </View>
            </Pressable>
            

            <Animated.View style={[animatedStyle, { overflow: "hidden" }]} className='flex flex-row items-center gap-4 mt-2'>
              <View className='p-4 self-center rounded-full bg-green-500 opacity-0'>
                <Zap 
                  color={"#fff"}
                  fill={"#fff"}
                />
              </View>
              <View className='flex-1 bg-foreground/10 rounded-lg'>
                <View className='px-4 py-2'>
                  <View className='flex flex-row items-center gap-2'>
                    <Zap 
                      color={"#05df72"}
                      fill={"#05df72"}
                      size={16}
                    />
                    <View>
                      <Text className='text-green-400 text-sm font-medium'>10.0kW</Text>
                      <Text className='text-[10px] text-foreground/40'>Used Today</Text>
                    </View>
                  </View>
                  <Text className='font-medium text-sm my-2'>Power Limit (kW)</Text>
                  <TextInput 
                    className='px-3 py-1 flex-1 text-foreground bg-foreground/20 rounded-md'
                    value={storePower}
                    onChangeText={(text) => {
                      setStorePower(text);
                      const parsed = parseFloat(text);
                      if (!isNaN(parsed)) {
                        setPowerLimit(parsed);
                        console.log("Power limit updated:", parsed);
                      }
                    }}
                    keyboardType="numeric"
                  />
                </View>
                <View className='border-t border-foreground/20 my-2'></View>
                <View className='p-4 pt-2'>
                  <View className='flex flex-row justify-between mb-2'>
                    <Text className='text-xs'>Usage</Text>
                    <Text className='text-xs text-green-500'>{data ? ((data!.totalUsage/powerLimit) * 100).toFixed(2) : "0"}% of limit</Text>
                  </View>
                  <View className='relative h-2 bg-foreground rounded-full overflow-hidden'>
                    <View className={`h-2 bg-green-500`} style={{width: barWidth }}></View>
                  </View>
                </View>
              </View>
            </Animated.View>

          </View>

          <View className='p-8 flex flex-column gap-4'>
            <View className='flex flex-row items-center gap-4'>
              <Monitor 
                color={THEME.dark.foreground}
                size={32}
              />
              <Text className='text-base font-medium'>Device & Sensors</Text>
            </View>

            <View className='flex flex-row items-center gap-4'>
              <Bell 
                color={THEME.dark.foreground}
                size={32}
              />
              <Text className='text-base font-medium'>Notification</Text>
            </View>

            <View className='flex flex-row items-center gap-4'>
              <Palette 
                color={THEME.dark.foreground}
                size={32}
              />
              <Text className='text-base font-medium'>App Preference</Text>
            </View>

            <View className='flex flex-row items-center gap-4'>
              <HandHeart 
                color={THEME.dark.foreground}
                size={32}
              />
              <Text className='text-base font-medium'>How to Use?</Text>
            </View>

            <View className='flex flex-row items-center gap-4'>
              <KeyRound 
                color={THEME.dark.foreground}
                size={32}
              />
              <Text className='text-base font-medium'>Data & Privacy</Text>
            </View>

            <View className='flex flex-row items-center gap-4'>
              <CircleQuestionMark 
                color={THEME.dark.foreground}
                size={32}
              />
              <Text className='text-base font-medium'>About</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  )
}