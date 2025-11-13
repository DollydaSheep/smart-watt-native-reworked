import { Stack } from "expo-router";
import { Dimensions, Pressable, ScrollView, TouchableOpacity, View } from "react-native";
import { Text } from '@/components/ui/text';
import { Edit, Ellipsis, EllipsisVertical, LayoutPanelLeft, Microwave, Share2, Trash2 } from "lucide-react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { useCallback, useMemo, useRef, useState } from "react";
import Animated, { Extrapolation, interpolate, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue } from "react-native-reanimated";
import { BlurView } from "expo-blur";

export default function HistoryScreen(){

  const [sheetOpen, setSheetOpen] = useState(false);

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

  console.log("min:",min)
  console.log("max:",max)
  
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
        <Animated.ScrollView nestedScrollEnabled className="flex-1 p-4 mb-10" >
          <Pressable onPress={pressOpacityBackground}>
          <Animated.View style={[animatedStyle]}>
            <Text className="text-xl text-green-500 mb-4">This Week</Text>
            <View className="p-2 gap-6">
              <View className='flex flex-row justify-between items-center'>
                <View className="flex flex-row items-center gap-2">
                  <View className='px-3 py-2 bg-gray-800 rounded-lg'>
                    <Microwave color={'#fff'} size={36}/>
                  </View>
                  <View className="gap-1">
                    <Text className='text-sm font-medium'>Microwave turned on</Text>
                    <Text className='text-[10px] text-gray-600'>5:00 AM | 31/10/2025</Text>
                  </View>
                </View>
                <Pressable onPress={openSheet}>
                  <EllipsisVertical 
                    color={'#fff'}
                  />
                </Pressable>
              </View>  

              <View className='flex flex-row justify-between items-center'>
                <View className="flex flex-row items-center gap-2">
                  <View className='px-3 py-2 bg-gray-800 rounded-lg'>
                    <Microwave color={'#fff'} size={36}/>
                  </View>
                  <View className="gap-1">
                    <Text className='text-sm font-medium'>Microwave turned on</Text>
                    <Text className='text-[10px] text-gray-600'>5:00 AM | 31/10/2025</Text>
                  </View>
                </View>
                <EllipsisVertical 
                  color={'#fff'}
                />
              </View>  

              <View className='flex flex-row justify-between items-center'>
                <View className="flex flex-row items-center gap-2">
                  <View className='px-3 py-2 bg-gray-800 rounded-lg'>
                    <Microwave color={'#fff'} size={36}/>
                  </View>
                  <View className="gap-1">
                    <Text className='text-sm font-medium'>Microwave turned on</Text>
                    <Text className='text-[10px] text-gray-600'>5:00 AM | 31/10/2025</Text>
                  </View>
                </View>
                <EllipsisVertical 
                  color={'#fff'}
                />
              </View>  

              <View className='flex flex-row justify-between items-center'>
                <View className="flex flex-row items-center gap-2">
                  <View className='px-3 py-2 bg-gray-800 rounded-lg'>
                    <Microwave color={'#fff'} size={36}/>
                  </View>
                  <View className="gap-1">
                    <Text className='text-sm font-medium'>Microwave turned on</Text>
                    <Text className='text-[10px] text-gray-600'>5:00 AM | 31/10/2025</Text>
                  </View>
                </View>
                <EllipsisVertical 
                  color={'#fff'}
                />
              </View>  

              <View className='flex flex-row justify-between items-center'>
                <View className="flex flex-row items-center gap-2">
                  <View className='px-3 py-2 bg-gray-800 rounded-lg'>
                    <Microwave color={'#fff'} size={36}/>
                  </View>
                  <View className="gap-1">
                    <Text className='text-sm font-medium'>Microwave turned on</Text>
                    <Text className='text-[10px] text-gray-600'>5:00 AM | 31/10/2025</Text>
                  </View>
                </View>
                <EllipsisVertical 
                  color={'#fff'}
                />
              </View>  

            </View>
            <Text className="text-xl text-green-500 my-4">Last Week</Text>
            <View className="p-2 pb-8 gap-6">
              <View className='flex flex-row justify-between items-center'>
                <View className="flex flex-row items-center gap-2">
                  <View className='px-3 py-2 bg-gray-800 rounded-lg'>
                    <Microwave color={'#fff'} size={36}/>
                  </View>
                  <View className="gap-1">
                    <Text className='text-sm font-medium'>Microwave turned on</Text>
                    <Text className='text-[10px] text-gray-600'>5:00 AM | 31/10/2025</Text>
                  </View>
                </View>
                <EllipsisVertical 
                  color={'#fff'}
                />
              </View>  

              <View className='flex flex-row justify-between items-center'>
                <View className="flex flex-row items-center gap-2">
                  <View className='px-3 py-2 bg-gray-800 rounded-lg'>
                    <Microwave color={'#fff'} size={36}/>
                  </View>
                  <View className="gap-1">
                    <Text className='text-sm font-medium'>Microwave turned on</Text>
                    <Text className='text-[10px] text-gray-600'>5:00 AM | 31/10/2025</Text>
                  </View>
                </View>
                <EllipsisVertical 
                  color={'#fff'}
                />
              </View>  

              <View className='flex flex-row justify-between items-center'>
                <View className="flex flex-row items-center gap-2">
                  <View className='px-3 py-2 bg-gray-800 rounded-lg'>
                    <Microwave color={'#fff'} size={36}/>
                  </View>
                  <View className="gap-1">
                    <Text className='text-sm font-medium'>Microwave turned on</Text>
                    <Text className='text-[10px] text-gray-600'>5:00 AM | 31/10/2025</Text>
                  </View>
                </View>
                <EllipsisVertical 
                  color={'#fff'}
                />
              </View>  

              <View className='flex flex-row justify-between items-center'>
                <View className="flex flex-row items-center gap-2">
                  <View className='px-3 py-2 bg-gray-800 rounded-lg'>
                    <Microwave color={'#fff'} size={36}/>
                  </View>
                  <View className="gap-1">
                    <Text className='text-sm font-medium'>Microwave turned on</Text>
                    <Text className='text-[10px] text-gray-600'>5:00 AM | 31/10/2025</Text>
                  </View>
                </View>
                <EllipsisVertical 
                  color={'#fff'}
                />
              </View>  

              <View className='flex flex-row justify-between items-center'>
                <View className="flex flex-row items-center gap-2">
                  <View className='px-3 py-2 bg-gray-800 rounded-lg'>
                    <Microwave color={'#fff'} size={36}/>
                  </View>
                  <View className="gap-1">
                    <Text className='text-sm font-medium'>Microwave turned on</Text>
                    <Text className='text-[10px] text-gray-600'>5:00 AM | 31/10/2025</Text>
                  </View>
                </View>
                <EllipsisVertical 
                  color={'#fff'}
                />
              </View>  

            </View>
          </Animated.View>
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