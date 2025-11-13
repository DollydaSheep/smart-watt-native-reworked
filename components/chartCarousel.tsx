import { Dimensions, View } from "react-native";
import React, { useState } from "react";
import { useSharedValue } from "react-native-reanimated";
import Carousel, { ICarouselInstance, Pagination } from "react-native-reanimated-carousel";
import { Text } from '@/components/ui/text';
import { useColorScheme } from "nativewind";
import { THEME } from "@/lib/theme";
import EnergySphere3D from "./sphere3D";
import { device } from "@/data/deviceData";
import { Device, DeviceData } from '@/lib/types';
import StackedAreaChart from "./areachart";
import DailyPeaksBarChart from "./barchart";
import ApplianceUsageRingChart from "./ringchart";

const data = [...new Array(3).keys()]
const width = Dimensions.get("window").width;

type ChartCarouselProps = {
  carouselIndex: number;
  setCarouselIndex: React.Dispatch<React.SetStateAction<number>>;
};

export default function ChartCarouselComponent({ carouselIndex, setCarouselIndex }: ChartCarouselProps){

  const { colorScheme } = useColorScheme();

  const ref = React.useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);
  const [title, setTitle] = useState(["Total Consumption","Peaks","Appliance Usage"])

  const onPressPagination = (index: number) => {
    ref.current?.scrollTo({
      /**
       * Calculate the difference between the current index and the target index
       * to ensure that the carousel scrolls to the nearest index
       */
      count: index - progress.value,
      animated: true,
    });
  };

  return(
    <>
      <Pagination.Basic
        progress={progress}
        data={data}
        dotStyle={{ 
          backgroundColor: colorScheme === 'dark' ? THEME.dark.border : THEME.light.border, 
          borderRadius: 20 }}
        activeDotStyle={{
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: colorScheme === 'dark' ? THEME.dark.foreground : THEME.light.foreground,
        }}
        containerStyle={{ gap: 5, alignSelf: "flex-end", marginRight: 40 }}
        onPress={onPressPagination}
      />
      <Text className="my-2 self-center text-xl font-medium">{title[carouselIndex]}</Text>
      <Carousel 
        ref={ref}
        width={width}
        height={300}
        loop={false}
        data={data}
        pagingEnabled
        onProgressChange={(_, absoluteProgress) => {
          progress.value = absoluteProgress;
          setCarouselIndex(Math.round(absoluteProgress));
          console.log(Math.round(absoluteProgress))
        }}
        renderItem={({index}) => 
          index === 0 ? (
            <View className="self-center">
              <StackedAreaChart />
            </View>
          ) : index === 1 ? (
            <View className="self-center w-full">
              <DailyPeaksBarChart />
            </View>
          ): index === 2 ? (
            <View className="self-center w-full -mt-10">
              <ApplianceUsageRingChart />
            </View>
          ) :(<></>)}
      />
    </>
  )
}