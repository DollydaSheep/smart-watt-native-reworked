import { View } from "react-native";
import { Text } from '@/components/ui/text';
import { useMemo } from "react";
import { useStats } from "@/lib/statsContext";

const RATE_PER_KWH = 12.26;

type ChartPoint = {
  x: string;
  y: number | null;
};

export default function AreaChartBottomSheet() {
  const { totalEnergy, previousTotalEnergy, mode, chartSeries = [] } = useStats();

  const numericTotalEnergy = Number(totalEnergy || 0);
  const numericPreviousTotalEnergy = Number(previousTotalEnergy || 0);
  const estimatedCost = numericTotalEnergy * RATE_PER_KWH;

  const periodLabel = useMemo(() => {
    if (mode === "daily") return "Day";
    if (mode === "week") return "Week";
    if (mode === "month") return "Month";
    return "Day";
  }, [mode]);

  const previousPeriodLabel = useMemo(() => {
    if (mode === "daily") return "previous day";
    if (mode === "week") return "previous week";
    if (mode === "month") return "previous month";
    return "previous period";
  }, [mode]);

  const consumptionUnitLabel = useMemo(() => {
    if (mode === "daily") return "Hour";
    if (mode === "week") return "Day";
    if (mode === "month") return "Day";
    return "Hour";
  }, [mode]);

  const averageDailyCost = useMemo(() => {
    if (mode === "daily") return null;
    if (mode === "week") return estimatedCost / 7;
    if (mode === "month") {
      const daysWithData = chartSeries.filter(
        (item: ChartPoint) => typeof item.y === "number"
      ).length || 1;
      return estimatedCost / daysWithData;
    }
    return null;
  }, [mode, estimatedCost, chartSeries]);

  const highestPoint = useMemo(() => {
    const valid = chartSeries.filter(
      (item: ChartPoint) => typeof item.y === "number" && item.y !== null
    ) as Array<{ x: string; y: number }>;

    if (!valid.length) return null;

    return valid.reduce((max, item) => (item.y > max.y ? item : max), valid[0]);
  }, [chartSeries]);

  const lowestPoint = useMemo(() => {
    const valid = chartSeries.filter(
      (item: ChartPoint) => typeof item.y === "number" && item.y !== null
    ) as Array<{ x: string; y: number }>;

    if (!valid.length) return null;

    return valid.reduce((min, item) => (item.y < min.y ? item : min), valid[0]);
  }, [chartSeries]);

  const formatPointLabel = (point: { x: string; y: number } | null) => {
    if (!point) {
      return {
        label: "--",
        value: "-- kWh",
      };
    }

    return {
      label: point.x,
      value: `${point.y.toFixed(2)} kWh`,
    };
  };

  const highest = formatPointLabel(highestPoint);
  const lowest = formatPointLabel(lowestPoint);

  const totalDifference = numericTotalEnergy - numericPreviousTotalEnergy;

  const totalPercentChange = useMemo(() => {
    if (numericPreviousTotalEnergy <= 0) return null;
    return (totalDifference / numericPreviousTotalEnergy) * 100;
  }, [numericPreviousTotalEnergy, totalDifference]);

  const totalChangeText = useMemo(() => {
    if (totalPercentChange === null) return "No data";

    return `${totalDifference >= 0 ? "+" : ""}${totalDifference.toFixed(2)} kWh • ${totalDifference >= 0 ? "+" : ""}${totalPercentChange.toFixed(1)}%`;
  }, [totalDifference, totalPercentChange]);

  const totalChangeColor = useMemo(() => {
    if (totalPercentChange === null) return "text-gray-600";
    if (totalDifference > 0) return "text-red-600";
    if (totalDifference < 0) return "text-green-600";
    return "text-gray-600";
  }, [totalDifference, totalPercentChange]);

  return (
    <>
      <View className='flex flex-row justify-between items-center py-3 px-5 border border-border rounded-lg'>
        <View>
          <Text className='text-sm font-medium'>Total Consumption</Text>
          <Text className='text-[10px] text-gray-600'>({periodLabel})</Text>
        </View>
        <View className='items-end'>
          <Text className='text-sm font-medium'>{numericTotalEnergy.toFixed(2)} kWh</Text>
          <Text className={`text-[10px] ${totalChangeColor}`}>
            {totalChangeText}
          </Text>
        </View>
      </View>

      <View className='flex flex-row justify-between items-center py-3 px-5 border border-border rounded-lg'>
        <View>
          <Text className='text-sm font-medium'>Estimated Total Cost</Text>
          <Text className='text-[10px] text-gray-600'>({periodLabel})</Text>
        </View>
        <View className='flex flex-row gap-2'>
          <Text className='text-sm'>₱{estimatedCost.toFixed(2)}</Text>
        </View>
      </View>

      {mode !== "daily" && (
        <View className='flex flex-row justify-between items-center py-3 px-5 border border-border rounded-lg'>
          <View>
            <Text className='text-sm font-medium'>Average Daily Cost</Text>
          </View>
          <View className='flex flex-row gap-2'>
            <Text className='text-sm'>₱{Number(averageDailyCost || 0).toFixed(2)}</Text>
          </View>
        </View>
      )}

      <View className='flex flex-row justify-between items-center py-3 px-5 border border-border rounded-lg'>
        <View>
          <Text className='text-sm font-medium'>Highest Consumption</Text>
          <Text className='text-[10px] text-gray-600'>({consumptionUnitLabel})</Text>
        </View>
        <View className='items-end'>
          <Text className='text-sm font-medium'>{highest.label}</Text>
          <Text className='text-[10px] text-green-600'>({highest.value})</Text>
        </View>
      </View>

      <View className='flex flex-row justify-between items-center py-3 px-5 border border-border rounded-lg'>
        <View>
          <Text className='text-sm font-medium'>Lowest Consumption</Text>
          <Text className='text-[10px] text-gray-600'>({consumptionUnitLabel})</Text>
        </View>
        <View className='items-end'>
          <Text className='text-sm font-medium'>{lowest.label}</Text>
          <Text className='text-[10px] text-red-600'>({lowest.value})</Text>
        </View>
      </View>
    </>
  );
}