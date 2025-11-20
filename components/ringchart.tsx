import React from "react";
import { View } from "react-native";
import {
  VictoryPie,
  VictoryTooltip,
  VictoryLabel,
} from "victory-native";
import { Defs, LinearGradient, Stop } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { THEME } from "@/lib/theme";

export default function ApplianceUsageRingChart() {
  // Example appliance usage data (percentages)
  const data = [
    { x: "PC", y: 35 },
    { x: "Television", y: 25 },
    { x: "Refrigerator", y: 15 },
    { x: "Microwave", y: 10 },
    { x: "Lights", y: 8 },
  ];

  return (
    <View
      style={{
        backgroundColor: "transparent",
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 2,
      }}
      className="-mt-10"
    >
      {/* Chart */}
      <VictoryPie
        radius={100}
        data={data}
        colorScale={[
          "#51a2ff",
          "#8e51ff",
          "#05df72",
          THEME.dark.foreground,
          "#fcc800",
        ]}
        labels={({datum}) => `${datum.x}\n${datum.y}%`}
        labelRadius={110}
        innerRadius={90}
        cornerRadius={20}
        padAngle={1}
        style={{
          labels: { fill: "#ddd", fontSize: 9, fontWeight: "500" },
          data: { stroke: "#0a0a0a", strokeWidth: 1 },
        }}
        animate={{ duration: 1000, easing: "expInOut" }}
      />
    </View>
  );
}
