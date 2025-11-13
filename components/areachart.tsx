import React, { useState } from "react";
import { View, Pressable } from "react-native";
import {
  VictoryChart,
  VictoryAxis,
  VictoryArea,
  VictoryGroup,
} from "victory-native";
import { Defs, LinearGradient, Stop } from "react-native-svg";
import { Text } from "@/components/ui/text";

export default function StackedAreaChart() {
  const [mode, setMode] = useState<"week" | "month" | "year">("month");

  // 🗓 WEEKLY DATA (7 days)
  const weekSeries1 = [
    { x: "Mon", y: 4 },
    { x: "Tue", y: 5 },
    { x: "Wed", y: 3 },
    { x: "Thu", y: 6 },
    { x: "Fri", y: 5 },
    { x: "Sat", y: 8 },
    { x: "Sun", y: 7 },
  ];

  const weekSeries2 = [
    { x: "Mon", y: 2 },
    { x: "Tue", y: 3 },
    { x: "Wed", y: 2 },
    { x: "Thu", y: 4 },
    { x: "Fri", y: 3 },
    { x: "Sat", y: 4 },
    { x: "Sun", y: 5 },
  ];

  const weekSeries3 = [
    { x: "Mon", y: 1 },
    { x: "Tue", y: 2 },
    { x: "Wed", y: 1 },
    { x: "Thu", y: 2 },
    { x: "Fri", y: 1 },
    { x: "Sat", y: 3 },
    { x: "Sun", y: 2 },
  ];

  // 🗓 MONTHLY DATA (7 months)
  const monthSeries1 = [
    { x: "Jan", y: 5 },
    { x: "Feb", y: 10 },
    { x: "Mar", y: 8 },
    { x: "Apr", y: 12 },
    { x: "May", y: 9 },
    { x: "Jun", y: 14 },
    { x: "Jul", y: 10 },
  ];

  const monthSeries2 = [
    { x: "Jan", y: 4 },
    { x: "Feb", y: 6 },
    { x: "Mar", y: 5 },
    { x: "Apr", y: 7 },
    { x: "May", y: 6 },
    { x: "Jun", y: 8 },
    { x: "Jul", y: 7 },
  ];

  const monthSeries3 = [
    { x: "Jan", y: 3 },
    { x: "Feb", y: 5 },
    { x: "Mar", y: 4 },
    { x: "Apr", y: 6 },
    { x: "May", y: 4 },
    { x: "Jun", y: 7 },
    { x: "Jul", y: 5 },
  ];

  // 🗓 YEARLY DATA (12 months)
  const yearSeries1 = [
    { x: "Jan", y: 30 },
    { x: "Feb", y: 25 },
    { x: "Mar", y: 28 },
    { x: "Apr", y: 35 },
    { x: "May", y: 32 },
    { x: "Jun", y: 38 },
    { x: "Jul", y: 36 },
    { x: "Aug", y: 40 },
    { x: "Sep", y: 34 },
    { x: "Oct", y: 37 },
    { x: "Nov", y: 31 },
    { x: "Dec", y: 39 },
  ];

  const yearSeries2 = yearSeries1.map((p) => ({
    x: p.x,
    y: Math.max(10, p.y - 15),
  }));

  const yearSeries3 = yearSeries1.map((p) => ({
    x: p.x,
    y: Math.max(5, p.y - 25),
  }));

  // Helper: stack each layer
  const stackData = (s1: any[], s2: any[], s3: any[]) => {
    const stacked2 = s2.map((p, i) => ({ x: p.x, y: p.y + s1[i].y }));
    const stacked3 = s3.map((p, i) => ({ x: p.x, y: p.y + stacked2[i].y }));
    return { s1, stacked2, stacked3 };
  };

  const { s1, stacked2, stacked3 } =
    mode === "week"
      ? stackData(weekSeries1, weekSeries2, weekSeries3)
      : mode === "month"
      ? stackData(monthSeries1, monthSeries2, monthSeries3)
      : stackData(yearSeries1, yearSeries2, yearSeries3);

  return (
    <View style={{ backgroundColor: "#0a0a0a", borderRadius: 16, padding: 2 }}>
      {/* Toggle Header */}
      <View className="p-4 -my-8 z-10">
        <View className="flex flex-row justify-evenly p-2">
          <Pressable onPress={() => {setMode("week");console.log("hey")}}>
            <Text
              className={`font-medium ${
                mode === "week"
                  ? "text-foreground border-b-2 border-green-500"
                  : "text-gray-600"
              }`}
            >
              Week
            </Text>
          </Pressable>
          <Pressable onPress={() => setMode("month")}>
            <Text
              className={`font-medium ${
                mode === "month"
                  ? "text-foreground border-b-2 border-green-500"
                  : "text-gray-600"
              }`}
            >
              Month
            </Text>
          </Pressable>
          <Pressable onPress={() => setMode("year")}>
            <Text
              className={`font-medium ${
                mode === "year"
                  ? "text-foreground border-b-2 border-green-500"
                  : "text-gray-600"
              }`}
            >
              Year
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Chart */}
      <VictoryChart padding={{ top: 30, bottom: 40, left: 40, right: 20 }}>
        {/* gradient defs */}
        <Defs>
          <LinearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#00ff99" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#00ff99" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#33ccff" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#33ccff" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="grad3" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#ff6600" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#ff6600" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        <VictoryAxis
          style={{
            axis: { stroke: "#333" },
            tickLabels: { fill: "#aaa", fontSize: 10 },
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

        <VictoryGroup>
          {/* Bottom layer */}
          <VictoryArea
            
            data={s1}
            style={{
              data: { fill: "url(#grad1)", stroke: "#00ff99", strokeWidth: 2 },
            }}
          />
          {/* Middle layer */}
          <VictoryArea
            
            data={stacked2}
            style={{
              data: { fill: "url(#grad2)", stroke: "#33ccff", strokeWidth: 2 },
            }}
          />
          {/* Top layer */}
          <VictoryArea
            
            data={stacked3}
            style={{
              data: { fill: "url(#grad3)", stroke: "#ff6600", strokeWidth: 2 },
            }}
          />
        </VictoryGroup>
      </VictoryChart>
    </View>
  );
}
