import { View } from "react-native";
import { Text } from '@/components/ui/text';
import { useMemo } from "react";
import { useStats } from "@/lib/statsContext";

type ChartPoint = {
  x: string;
  y: number | null;
};

export default function BarChartBottomSheet() {
  const { chartSeries = [] } = useStats();

  const validSeries = useMemo(
    () =>
      chartSeries.filter(
        (item: ChartPoint) =>
          typeof item.x === "string" &&
          item.x.length > 0 &&
          typeof item.y === "number" &&
          Number.isFinite(item.y)
      ) as Array<{ x: string; y: number }>,
    [chartSeries]
  );

  const peakUsage = useMemo(() => {
    if (!validSeries.length) return null;
    return validSeries.reduce((max, item) => (item.y > max.y ? item : max), validSeries[0]);
  }, [validSeries]);

  const lowestUsage = useMemo(() => {
    if (!validSeries.length) return null;
    return validSeries.reduce((min, item) => (item.y < min.y ? item : min), validSeries[0]);
  }, [validSeries]);

  return (
    <>
      <View className='flex flex-row justify-between items-center py-3 px-5 border border-border rounded-lg'>
        <Text className='text-sm font-medium'>Peak Usage</Text>
        <View className='flex flex-row gap-2'>
          <Text className='text-sm'>{peakUsage?.x ?? "--"}</Text>
          <Text className='text-sm text-gray-600 w-20 text-right'>
            {peakUsage ? `${peakUsage.y.toFixed(1)} W` : "--"}
          </Text>
        </View>
      </View>

      <View className='flex flex-row justify-between items-center py-3 px-5 border border-border rounded-lg'>
        <Text className='text-sm font-medium'>Lowest Usage</Text>
        <View className='flex flex-row gap-2'>
          <Text className='text-sm'>{lowestUsage?.x ?? "--"}</Text>
          <Text className='text-sm text-gray-600 w-20 text-right'>
            {lowestUsage ? `${lowestUsage.y.toFixed(1)} W` : "--"}
          </Text>
        </View>
      </View>
    </>
  );
}