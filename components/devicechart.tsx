import React, { useMemo } from "react";
import { View } from "react-native";
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryTheme,
} from "victory-native";
import { Text } from "@/components/ui/text";
import { useStats } from "@/lib/statsContext";

const DEVICE_LABEL_MAP: Record<string, string[]> = {
  pc: ["personal computer", "htpc", "pc"],
  television: ["television", "tv"],
  "washing machine": ["washing machine"],
  "rice cooker": ["rice cooker"],
  lights: ["lights", "light"],
};

type Props = {
  colorHex: string;
  applianceLabel: string;
};

function formatHourLabel(hour: number) {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

export default function DeviceUsageBarChart({
  colorHex,
  applianceLabel,
}: Props) {
  const { applianceDailyStats, applianceDailyStatsLoading } = useStats();

  console.log("[DeviceUsageBarChart] applianceLabel:", applianceLabel);
  console.log("[DeviceUsageBarChart] applianceDailyStats:", applianceDailyStats);

  const selectedStat = useMemo(() => {
    const normalized = applianceLabel.trim().toLowerCase();
    const possibleLabels = DEVICE_LABEL_MAP[normalized] ?? [normalized];

    const match = applianceDailyStats.find((item) =>
      possibleLabels.includes(String(item.appliance_label ?? "").toLowerCase())
    );

    console.log("[DeviceUsageBarChart] normalized label:", normalized);
    console.log("[DeviceUsageBarChart] possibleLabels:", possibleLabels);
    console.log("[DeviceUsageBarChart] selectedStat:", match);

    return match;
  }, [applianceDailyStats, applianceLabel]);

  const data = useMemo(() => {
    const profile = selectedStat?.hourly_energy_kwh_profile ?? Array(24).fill(0);

    console.log("[DeviceUsageBarChart] hourly_energy_kwh_profile:", profile);

    const mapped = profile.map((value, hour) => ({
      x: `${hour}`,
      y: Number(value ?? 0),
    }));

    console.log("[DeviceUsageBarChart] chart data:", mapped);

    return mapped;
  }, [selectedStat]);

  if (applianceDailyStatsLoading) {
    console.log("[DeviceUsageBarChart] still loading");
    return (
      <View className="h-[220px] items-center justify-center">
        <Text className="text-sm text-foreground/60">Loading chart...</Text>
      </View>
    );
  }

  if (!selectedStat) {
    console.log("[DeviceUsageBarChart] no selectedStat found");
    return (
      <View className="h-[220px] items-center justify-center">
        <Text className="text-sm text-foreground/60">No appliance data available.</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: "transparent",
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 8,
      }}
    >
      <VictoryChart
        theme={VictoryTheme.material}
        domainPadding={{ x: 10, y: 20 }}
        padding={{ top: 10, bottom: 65, left: 34, right: 34 }}
        height={220}
        width={320}
      >
        <VictoryAxis
          dependentAxis
          tickFormat={(t) => `${t.toFixed(2)}`}
          style={{
            tickLabels: { fill: "#ddd", fontSize: 10, fontWeight: "500" },
            axis: { stroke: "transparent" },
            grid: { stroke: "#333", strokeDasharray: "4,4" },
          }}
        />

        <VictoryAxis
          tickValues={data.map((d) => d.x)}
          tickFormat={(t) => formatHourLabel(Number(t))}
          style={{
            tickLabels: {
              fill: "#777",
              fontSize: 9,
              angle: 90,
              padding: 18,
            },
            grid: { stroke: "transparent" },
            axis: { stroke: "#555" },
          }}
        />

        <VictoryBar
          data={data}
          cornerRadius={4}
          barWidth={8}
          style={{
            data: {
              fill: colorHex,
              stroke: "#0a0a0a",
              strokeWidth: 1,
            },
          }}
          animate={{ duration: 900, easing: "cubicInOut" }}
        />
      </VictoryChart>
    </View>
  );
}