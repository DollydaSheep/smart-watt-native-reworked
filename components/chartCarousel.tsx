import { Dimensions, View } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { useSharedValue } from "react-native-reanimated";
import Carousel, { ICarouselInstance, Pagination } from "react-native-reanimated-carousel";
import { Text } from '@/components/ui/text';
import { useColorScheme } from "nativewind";
import { THEME } from "@/lib/theme";
import StackedAreaChart from "./areachart";
import DailyPeaksBarChart from "./barchart";
import ApplianceUsageRingChart from "./ringchart";
import Skeletonbox from "./skeleton/skeletonbox";
import { useStats } from "@/lib/statsContext";

const data = [...new Array(2).keys()];
const width = Dimensions.get("window").width;

type ChartCarouselProps = {
  carouselIndex: number;
  setCarouselIndex: React.Dispatch<React.SetStateAction<number>>;
};

export default function ChartCarouselComponent({
  carouselIndex,
  setCarouselIndex,
}: ChartCarouselProps) {
  const { colorScheme } = useColorScheme();

  const ref = React.useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);
  const { selectedDate, mode } = useStats();

  const [title] = useState(["Total Consumption", "Power Profile", "Appliance Usage"]);
  const [loading, setLoading] = useState(true);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLoading = () => {
    setLoading(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const onPressPagination = (index: number) => {
    if (index !== carouselIndex) {
      startLoading();
    }

    ref.current?.scrollTo({
      count: index - progress.value,
      animated: true,
    });
  };

  useEffect(() => {
    startLoading();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [selectedDate, mode]);

  const renderChart = () => {
    if (loading) {
      return (
        <View className="p-4">
          <Skeletonbox height={250} />
        </View>
      );
    }

    if (carouselIndex === 0) {
      return <StackedAreaChart key={`chart-0-${selectedDate}-${mode}`} />;
    }

    if (carouselIndex === 1) {
      return <DailyPeaksBarChart key={`chart-1-${selectedDate}-${mode}`} />;
    }

    // if (carouselIndex === 2) {
    //   return <ApplianceUsageRingChart key={`chart-2-${selectedDate}-${mode}`} />;
    // }

    return null;
  };

  return (
    <>
      <Pagination.Basic
        progress={progress}
        data={data}
        dotStyle={{
          backgroundColor: colorScheme === 'dark' ? THEME.dark.border : THEME.light.border,
          borderRadius: 20,
        }}
        activeDotStyle={{
          borderRadius: 20,
          overflow: "hidden",
          backgroundColor: colorScheme === 'dark' ? THEME.dark.foreground : THEME.light.foreground,
        }}
        containerStyle={{ gap: 5, alignSelf: "flex-end", marginRight: 40 }}
        onPress={onPressPagination}
      />

      <Text className="my-2 self-center text-xl font-medium">
        {title[carouselIndex]}
      </Text>

      <Carousel
        ref={ref}
        width={width}
        height={300}
        loop={false}
        data={data}
        pagingEnabled
        onProgressChange={(_, absoluteProgress) => {
          progress.value = absoluteProgress;

          const nextIndex = Math.round(absoluteProgress);

          if (nextIndex !== carouselIndex) {
            startLoading();
            setCarouselIndex(nextIndex);
          }
        }}
        renderItem={({ index }) => (
          <View className="self-center w-full">
            {index === carouselIndex ? renderChart() : null}
          </View>
        )}
      />
    </>
  );
}