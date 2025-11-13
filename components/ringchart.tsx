import React from "react";
import { View } from "react-native";
import {
  VictoryPie,
  VictoryTooltip,
  VictoryLabel,
} from "victory-native";
import { Defs, LinearGradient, Stop } from "react-native-svg";
import { Text } from "@/components/ui/text";

export default function ApplianceUsageRingChart() {
  // Example appliance usage data (percentages)
  const data = [
    { x: "Aircon", y: 35 },
    { x: "Refrigerator", y: 25 },
    { x: "Lights", y: 15 },
    { x: "Television", y: 10 },
    { x: "Fan", y: 8 },
    { x: "Others", y: 7 },
  ];

  return (
    <View
      style={{
        backgroundColor: "transparent",
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 2,
      }}
    >
      {/* Chart */}
      <VictoryPie
        radius={100}
        data={data}
        colorScale={[
          "#73ff00ff",
          "#2269eeff",
          "#dd1144ff",
          "#dc4de1ff",
          "#e6e6e6ff",
          "#fffc40ff",
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
