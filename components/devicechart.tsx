import React from "react";
import { View } from "react-native";
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryLabel,
  VictoryTheme,
} from "victory-native";

export default function DeviceUsageBarChart() {
  const data = [
    { x: "2025", y: 35 },
    { x: "2024", y: 25 },
    { x: "2023", y: 15 },
    { x: "2022", y: 10 },
    { x: "2021", y: 8 },
    { x: "2020", y: 7 },
  ];

  const colors = [
    "#51a2ff",
  ];

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
        domainPadding={{ x: 30, y: 20 }}
        padding={{ top: 10, bottom: 10, left: 60, right: 40 }}
        height={220}
        width={320}
      >
        <VictoryAxis
          dependentAxis
          style={{
            tickLabels: { fill: "#ddd", fontSize: 12, fontWeight: "500" },
            axis: { stroke: "transparent" },
          }}
        />

        <VictoryAxis
          style={{
            tickLabels: { fill: "#777", fontSize: 10 },
            grid: { stroke: "#333", strokeDasharray: "4,4" },
            axis: { stroke: "#555" },
          }}
        />

        <VictoryBar
          horizontal
          cornerRadius={4}
          barWidth={16}
          data={data}
        //   labels={({ datum }) => `${datum.y}%`}
        //   labelComponent={
        //     <VictoryLabel
        //       dx={5}
        //       style={{ fill: "#ddd", fontSize: 11 }}
        //     />
        //   }
          style={{
            data: {
              fill: "#51a2ff", // ✅ Fixed
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
