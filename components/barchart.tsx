// DailyPeaksBarChart.tsx
import React from "react";
import { View } from "react-native";
import {
  VictoryBar,
  VictoryChart,
  VictoryAxis,
  VictoryTheme,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from "victory-native";
import { Defs, LinearGradient, Stop } from "react-native-svg";
import { Text } from "@/components/ui/text";

export default function DailyPeaksBarChart() {
  // Example 24-hour data — replace with live or dynamic values
  const hourlyData = [
    { x: "12 AM", y: 120 },
    { x: "1 AM", y: 100 },
    { x: "2 AM", y: 90 },
    { x: "3 AM", y: 80 },
    { x: "4 AM", y: 75 },
    { x: "5 AM", y: 90 },
    { x: "6 AM", y: 150 },
    { x: "7 AM", y: 300 },
    { x: "8 AM", y: 350 },
    { x: "9 AM", y: 280 },
    { x: "10 AM", y: 240 },
    { x: "11 AM", y: 200 },
    { x: "12 PM", y: 220 },
    { x: "1 PM", y: 250 },
    { x: "2 PM", y: 290 },
    { x: "3 PM", y: 330 },
    { x: "4 PM", y: 380 },
    { x: "5 PM", y: 420 },
    { x: "6 PM", y: 460 },
    { x: "7 PM", y: 500 },
    { x: "8 PM", y: 470 },
    { x: "9 PM", y: 380 },
    { x: "10 PM", y: 260 },
    { x: "11 PM", y: 180 },
  ];

  // Determine top 3 peaks for highlighting
  const sorted = [...hourlyData].sort((a, b) => b.y - a.y);
  const topPeaks = new Set(sorted.slice(0, 3).map((d) => d.x));

  return (
    <View
      style={{
        backgroundColor: "#0a0a0a",
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 2,
      }}
    >

      <VictoryChart
        theme={VictoryTheme.material}
        padding={{ top: 10, bottom: 100, left: 50, right: 20 }}
        domainPadding={{ x: [10, 10], y: [0, 0] }}
        containerComponent={
          <VictoryVoronoiContainer
            labels={({ datum }) => `${datum.x}\n${datum.y} W`}
            labelComponent={
              <VictoryTooltip
                flyoutStyle={{
                  stroke: "#333",
                  fill: "#111",
                }}
                style={{ fill: "#fff", fontSize: 10 }}
              />
            }
          />
        }
      >
        {/* Gradient Definition */}
        <Defs>
          <LinearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#00ff99" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#00ff99" stopOpacity="0.2" />
          </LinearGradient>
        </Defs>

        {/* Axes */}
        <VictoryAxis
          style={{
            axis: { stroke: "#333" },
            tickLabels: {
              fill: "#aaa",
              fontSize: 8,
              angle: 90,
              padding: 12,
            },
            grid: { stroke: "none" },
          }}
        />
        <VictoryAxis
          dependentAxis
          style={{
            axis: { stroke: "#333" },
            tickLabels: { fill: "#666", fontSize: 9 },
            grid: { stroke: "#1a1a1a" },
          }}
        />

        {/* Bars */}
        <VictoryBar
          data={hourlyData}
          barWidth={10}
          style={{
            data: {
              fill: ({ datum }) =>
                topPeaks.has(datum.x) ? "#ff7a59" : "url(#barGradient)",
              stroke: ({ datum }) =>
                topPeaks.has(datum.x) ? "#ff9b70" : "transparent",
              strokeWidth: ({ datum }) => (topPeaks.has(datum.x) ? 2 : 0),
            },
          }}
          animate={{ duration: 800, easing: "quadInOut" }}
        />
      </VictoryChart>
    </View>
  );
}
