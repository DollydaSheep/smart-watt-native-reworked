import HeroCarouselComponent from '@/components/carousel';
import StackedAreaChart from '@/components/areachart';
import EnergyChart from '@/components/areachart';
import ChartCarouselComponent from '@/components/chartCarousel';
import { Text } from '@/components/ui/text';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { useEffect, useMemo, useState } from 'react';
import { Dimensions, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedProps, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import AreaChartBottomSheet from '@/components/areachartbottomsheet';
import BarChartBottomSheet from '@/components/barchartbottomsheet';
import RingChartBottomSheet from '@/components/ringchartbottomsheet';
import Skeletontext from '@/components/skeleton/skeletontext';

export default function StatsTabScreen(){

  const [bottomScrolled, setBottomScrolled] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    setInterval(()=>{
      setLoading(false);
    },1000)
  })

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

  return(
    <>
      <View className='flex-1 items-center p-4'>
        <Animated.View style={[animatedStyle]} className="-mt-8">
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
      </View>
    </>
  )
}