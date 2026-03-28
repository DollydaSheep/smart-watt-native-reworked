import React, { useEffect, useMemo, useState } from "react";
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
import { useStats } from "@/lib/statsContext";

type HourlyPoint = {
  x: string;
  y: number;
};

type ApiDataItem = {
  label?: string;
  start_hour?: string;
  end_hour?: string;
  energy_kwh?: number;
  avg_power_w?: Record<string, number | null | undefined> | null;
};

type ApiPeriodSummary = {
  date?: string;
  total_energy_kwh?: number;
  avg_power_w?: number;
  avg_voltage?: number;
  avg_current?: number;
  data?: ApiDataItem[];
  timezone?: string;
};

type ApiResponse = {
  current?: ApiPeriodSummary;
  previous?: ApiPeriodSummary;
};

const API_BASE = "https://smartwatt-server.netlify.app/.netlify/functions/api";

const formatHourLabel = (hour: string) => {
  const [rawHour] = hour.split(":");
  const hourNum = Number(rawHour);

  if (!Number.isFinite(hourNum)) return hour;

  const suffix = hourNum >= 12 ? "PM" : "AM";
  const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;

  return `${displayHour}${suffix}`;
};

export default function DailyPeaksBarChart() {
  const { selectedDate, setChartSeries } = useStats();
  const [hourlyData, setHourlyData] = useState<HourlyPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedDate) {
      setHourlyData([]);
      setChartSeries([]);
      return;
    }

    const controller = new AbortController();

    const fetchHourlyAveragePower = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `${API_BASE}/power/daily?date=${selectedDate}&tz=Asia/Manila`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json: ApiResponse = await res.json();
        const rawData = Array.isArray(json.current?.data) ? json.current.data : [];

        const flattened: HourlyPoint[] = rawData
          .flatMap((item) =>
            Object.entries(item.avg_power_w ?? {}).map(([hour, value]) => ({
              x: formatHourLabel(hour),
              rawHour: hour,
              y: Number(value),
            }))
          )
          .filter(
            (item) =>
              typeof item.x === "string" &&
              item.x.length > 0 &&
              Number.isFinite(item.y)
          )
          .sort((a, b) => a.rawHour.localeCompare(b.rawHour))
          .map(({ x, y }) => ({
            x,
            y: Number(y.toFixed(2)),
          }));

        setHourlyData(flattened);
        setChartSeries(flattened);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("Failed to fetch hourly average power:", err);
        setHourlyData([]);
        setChartSeries([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchHourlyAveragePower();

    return () => controller.abort();
  }, [selectedDate, setChartSeries]);

  const topPeaks = useMemo(() => {
    const sorted = [...hourlyData].sort((a, b) => b.y - a.y);
    return new Set(sorted.slice(0, 3).map((d) => d.x));
  }, [hourlyData]);

  const maxY = useMemo(() => {
    if (!hourlyData.length) return 100;
    const max = Math.max(...hourlyData.map((d) => d.y));
    return max > 0 ? Math.ceil(max * 1.15) : 100;
  }, [hourlyData]);

  const hasData = hourlyData.length > 0;

  return (
    <View
      style={{
        backgroundColor: "#0a0a0a",
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 2,
      }}
    >
      {loading && (
        <Text className="text-center text-xs text-gray-500 py-2">
          Loading...
        </Text>
      )}

      {!loading && !hasData && (
        <View className="py-10">
          <Text className="text-center text-sm text-gray-500">
            No power data available
          </Text>
        </View>
      )}

      {hasData && (
        <VictoryChart
          theme={VictoryTheme.material}
          domain={{ y: [0, maxY] }}
          padding={{ top: 10, bottom: 100, left: 50, right: 20 }}
          domainPadding={{ x: [8, 8], y: [0, 0] }}
          containerComponent={
            <VictoryVoronoiContainer
              labels={({ datum }) =>
                datum && Number.isFinite(datum.y)
                  ? `${datum.x}\n${datum.y.toFixed(0)} W`
                  : ""
              }
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
          <Defs>
            <LinearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#00ff99" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#00ff99" stopOpacity="0.2" />
            </LinearGradient>
          </Defs>

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
            tickFormat={(t) => `${t}W`}
            style={{
              axis: { stroke: "#333" },
              tickLabels: { fill: "#666", fontSize: 9 },
              grid: { stroke: "#1a1a1a" },
            }}
          />

          <VictoryBar
            data={hourlyData}
            x="x"
            y="y"
            barWidth={8}
            style={{
              data: {
                fill: ({ datum }) =>
                  topPeaks.has(datum.x) ? "#f97316" : "url(#barGradient)",
                stroke: ({ datum }) =>
                  topPeaks.has(datum.x) ? "#fb923c" : "transparent",
                strokeWidth: ({ datum }) => (topPeaks.has(datum.x) ? 2 : 0),
              },
            }}
            animate={{ duration: 800, easing: "quadInOut" }}
          />
        </VictoryChart>
      )}
    </View>
  );
}