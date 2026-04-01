import { Dimensions, View } from "react-native";
import React, { useEffect, useState } from "react";
import { useSharedValue } from "react-native-reanimated";
import Carousel, { ICarouselInstance, Pagination } from "react-native-reanimated-carousel";
import { Text } from '@/components/ui/text';
import { useColorScheme } from "nativewind";
import { THEME } from "@/lib/theme";
import { useIsFocused } from "@react-navigation/native";
import EnergySphere3D from "./sphere3D";
import Skeletoncircle from "./skeleton/skeletoncircle";
import { device } from "@/data/deviceData";
import { Device, DeviceData } from '@/lib/types';

const data = [...new Array(2).keys()]
const width = Dimensions.get("window").width;

export default function HeroCarouselComponent( { devices, totalUsage } : DeviceData){

  const { colorScheme } = useColorScheme();
  const isFocused = useIsFocused();
  const [showSphere, setShowSphere] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setShowSphere(false);
      return;
    }

    const t = setTimeout(() => setShowSphere(true), 50);
    return () => clearTimeout(t);
  }, [isFocused]);

  const ref = React.useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);

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
      {/* <Pagination.Basic
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
        containerStyle={{ gap: 5, marginTop: 10, alignSelf: "flex-end", marginRight: 40 }}
        onPress={onPressPagination}
      /> */}
      {/* <Carousel 
        ref={ref}
        width={width}
        height={300}
        loop={false}
        data={data}
        pagingEnabled
        onProgressChange={(_, absoluteProgress) => {
          progress.value = absoluteProgress;
        }}
        renderItem={({index}) => 
          index === 0 ? (
            <View className="self-center">
              {showSphere ? (
                <EnergySphere3D appliances={devices} totalUsage={totalUsage} />
              ) : (
                <View style={{ width: 325, height: 325, alignItems: 'center', justifyContent: 'center' }}>
                  <Skeletoncircle size={280} />
                </View>
              )}
            </View>
          ) : index === 1 ? (<View className={`border-8 border-green-500 p-32 rounded-full self-center`}></View>): (<></>)}
      /> */}
      <View className="self-center">
        {showSphere ? (
          <EnergySphere3D appliances={devices} totalUsage={totalUsage} />
        ) : (
          <View style={{ width: 325, height: 325, alignItems: 'center', justifyContent: 'center' }}>
            <Skeletoncircle size={280} />
          </View>
        )}
      </View>
    </>
  )
}