import React, { useEffect, useMemo, useState } from "react";
import { View, Pressable } from "react-native";
import {
  VictoryChart,
  VictoryAxis,
  VictoryArea,
  VictoryGroup,
} from "victory-native";
import { Defs, LinearGradient, Stop } from "react-native-svg";
import { Text } from "@/components/ui/text";
import { useStats } from "@/lib/statsContext";

type ChartPoint = {
  x: string;
  y: number | null;
};

type ApiItem = {
  label: string;
  date?: string;
  energy_kwh: number | null;
};

type ApiResponse = {
  period: string;
  metric?: string;
  date?: string;
  anchorDate?: string;
  timezone?: string;
  total_energy_kwh?: number | null;
  data?: ApiItem[];
};

const API_BASE = "https://smartwatt-server.netlify.app/.netlify/functions/api";

export default function StackedAreaChart() {
  const [chartSeries, setChartSeries] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    setBaselinePower,
    setTotalEnergy,
    selectedDate,
    mode,
    setMode,
  } = useStats();

  function convertApiDataToVictory(data: ApiItem[] = []): ChartPoint[] {
    return data.map((item) => ({
      x: item.label,
      y: item.energy_kwh,
    }));
  }

  useEffect(() => {
    if (!selectedDate) return;

    let url = "";

    if (mode === "daily") {
      url = `${API_BASE}/power/daily?date=${selectedDate}&tz=Asia/Manila`;
    } else if (mode === "week") {
      url = `${API_BASE}/power/weekly?date=${selectedDate}&tz=Asia/Manila`;
    } else if (mode === "month") {
      url = `${API_BASE}/power/monthly?date=${selectedDate}&tz=Asia/Manila`;
    } else {
      setChartSeries([]);
      setBaselinePower(0);
      setTotalEnergy(0);
      return;
    }

    setLoading(true);

    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json() as Promise<ApiResponse>;
      })
      .then((data) => {
        console.log("chart api response:", data);

        if (!data?.data || !Array.isArray(data.data)) {
          setChartSeries([]);
          setBaselinePower(0);
          setTotalEnergy(Number(data?.total_energy_kwh ?? 0));
          return;
        }

        const victorySeries = convertApiDataToVictory(data.data);

        setChartSeries(victorySeries);
        setBaselinePower(0);
        setTotalEnergy(Number(data.total_energy_kwh ?? 0));
      })
      .catch((err) => {
        console.error("Energy fetch error:", err);
        setChartSeries([]);
        setBaselinePower(0);
        setTotalEnergy(0);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedDate, mode, setBaselinePower, setTotalEnergy]);

  const monthSeries1 = [
    { x: "1", y: 0.5 },
    { x: "2", y: 1.0 },
    { x: "3", y: 0.8 },
    { x: "4", y: 1.2 },
    { x: "5", y: 0.9 },
    { x: "6", y: 1.4 },
    { x: "7", y: 1.0 },
  ];

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

  const finalSeries =
    mode === "daily" || mode === "week" || mode === "month"
      ? chartSeries
      : mode === "year"
      ? yearSeries1
      : monthSeries1;

  const yDomain: [number, number] = useMemo(() => {
    const valid = finalSeries
      .map((p) => p.y)
      .filter((v): v is number => typeof v === "number" && !Number.isNaN(v));

    const max = valid.length ? Math.max(...valid) : 1;
    return [0, Number((max * 1.15).toFixed(2))];
  }, [finalSeries]);

  return (
    <View style={{ backgroundColor: "#0a0a0a", borderRadius: 16, padding: 2 }}>
      <View className="p-4 -my-8 z-10">
        <View className="flex flex-row justify-evenly p-2">
          <Pressable onPress={() => setMode("daily")}>
            <Text
              className={`font-medium ${
                mode === "daily"
                  ? "text-foreground border-b-2 border-green-500"
                  : "text-gray-600"
              }`}
            >
              Daily
            </Text>
          </Pressable>

          <Pressable onPress={() => setMode("week")}>
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

      <VictoryChart
        domain={{ y: yDomain }}
        padding={{ top: 35, bottom: 40, left: 50, right: 20 }}
      >
        <Defs>
          <LinearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#00ff99" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#00ff99" stopOpacity="0" />
          </LinearGradient>
        </Defs>

        <VictoryAxis
          style={{
            axis: { stroke: "#333" },
            tickLabels: { fill: "#aaa", fontSize: 10, angle: 0 },
            grid: { stroke: "#1a1a1a" },
          }}
        />

        <VictoryAxis
          dependentAxis
          tickFormat={(t) => `${t} kWh`}
          style={{
            axis: { stroke: "#333" },
            tickLabels: { fill: "#666", fontSize: 9 },
            grid: { stroke: "#1a1a1a" },
          }}
        />

        <VictoryGroup>
          <VictoryArea
            interpolation="monotoneX"
            data={finalSeries}
            style={{
              data: {
                fill: "url(#grad1)",
                stroke: "#00ff99",
                strokeWidth: 2,
              },
            }}
          />
        </VictoryGroup>
      </VictoryChart>

      {loading && (
        <View className="pb-3">
          <Text className="text-center text-xs text-gray-500">Loading...</Text>
        </View>
      )}
    </View>
  );
}