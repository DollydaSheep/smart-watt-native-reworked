import HeroCarouselComponent from '@/components/carousel';
import StackedAreaChart from '@/components/areachart';
import EnergyChart from '@/components/areachart';
import ChartCarouselComponent from '@/components/chartCarousel';
import { Text } from '@/components/ui/text';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { useEffect, useMemo, useState } from 'react';
import { Dimensions, Modal, Pressable, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedProps, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import AreaChartBottomSheet from '@/components/areachartbottomsheet';
import BarChartBottomSheet from '@/components/barchartbottomsheet';
import RingChartBottomSheet from '@/components/ringchartbottomsheet';
import Skeletontext from '@/components/skeleton/skeletontext';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';
import CalendarComponent from '@/components/calendarcomponent';
import { useStats } from '@/lib/statsContext';

export default function StatsTabScreen(){

  const { selectedDate, setSelectedDate } = useStats();

  const today = new Date().toISOString().split("T")[0];

  const [bottomScrolled, setBottomScrolled] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [confirmedDate, setConfirmedDate] = useState(today);

  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    setLoading(true);
    setInterval(()=>{
      setLoading(false);
    },1000)
  },[selectedDate])

  const blur = useSharedValue(0);
  
  const { height: SCREEN_HEIGHT } = Dimensions.get("window");

  const snapPoints = useMemo(() => {
    const first = (SCREEN_HEIGHT - 225) * 0.55;  // 55%
    const second = (SCREEN_HEIGHT - 225) * 0.25; // 75%
    return [first, second];
  }, []);

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

  const animatedProps = useAnimatedProps(() => ({
    intensity: blur.value
  }));

  return(
    <>
      <View className='flex-1 items-center p-4'> 
        {carouselIndex === 0 ? (
          <>
            {confirmedDate === today ? (
              <Pressable className='self-end absolute -top-12 right-6 border border-foreground rounded-full px-6 py-1 z-10'
                onPress={()=>setCalendarModalOpen(true)}
              >
                <Text className='text-sm font-light'>Today</Text>
              </Pressable>
            ) : (
              <>
                <Pressable className='self-end absolute -top-12 right-6 bg-green-600 rounded-full px-6 py-1 z-10'
                  onPress={()=>setCalendarModalOpen(true)}
                >
                  <Text className='text-sm font-light'>
                    {new Date(confirmedDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </Pressable>
              </>
            )}
          </>
        ): null}
        <Animated.View style={[animatedStyle]} className="-mt-6">
          <ChartCarouselComponent carouselIndex={carouselIndex} setCarouselIndex={setCarouselIndex} />
        </Animated.View>

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
          <BottomSheetScrollView>
            <View className='flex flex-col gap-4 p-4'>
              {loading && (
                <>
                  <Skeletontext height={40} />
                  <Skeletontext height={40} />
                  <Skeletontext height={40} />
                  <Skeletontext height={40} />
                </>
              )}
              {!loading && carouselIndex === 0 ? (
                <AreaChartBottomSheet />
              ) : !loading && carouselIndex === 1 ? (
                <BarChartBottomSheet />
              ) : !loading && carouselIndex === 2 ? (
                <RingChartBottomSheet />
              ) : (
                <></>
              )}
              
            </View>
          </BottomSheetScrollView>
        </BottomSheet>
        {carouselIndex === 0 && (
          <Modal
            transparent={true}
            visible={calendarModalOpen}
            animationType="fade"
          >
            <View className='flex-1 bg-background/70 items-center justify-center'>
              <CalendarComponent  
                initialDate={confirmedDate}
                setCalendarModalOpen={(open) => setCalendarModalOpen(open)}
                onConfirm={(date, iso) => {
                  setConfirmedDate(date);
                  setSelectedDate(date);
                  console.log("confirmed:", date, iso);
                }}
              />
            </View>
          </Modal>
        )}
      </View>
    </>
  )
}