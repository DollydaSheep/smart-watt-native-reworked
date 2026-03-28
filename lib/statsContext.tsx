import React, { createContext, useContext, useState } from "react";

type StatsMode = "daily" | "week" | "month" | "year";

export type ChartPoint = {
  x: string;
  y: number | null;
};

export type ApplianceDailyStat = {
  reading_date: string;
  appliance_label: string;
  total_energy_kwh: number;
  total_duration_sec: number;
  hourly_energy_kwh_profile: number[];
  hourly_duration_sec_profile: number[];
  total_nilm_event_count: number;
  total_manual_app_count: number;
};

type StatsContextType = {
  baselinePower: number | null;
  totalEnergy: number | null;
  previousTotalEnergy: number | null;
  selectedDate: string | null;
  mode: StatsMode;
  chartSeries: ChartPoint[];
  applianceDailyStats: ApplianceDailyStat[];
  applianceDailyStatsLoading: boolean;

  setBaselinePower: (v: number) => void;
  setTotalEnergy: (v: number) => void;
  setPreviousTotalEnergy: (v: number) => void;
  setSelectedDate: (date: string | null) => void;
  setMode: (mode: StatsMode) => void;
  setChartSeries: (series: ChartPoint[]) => void;
  setApplianceDailyStats: (stats: ApplianceDailyStat[]) => void;
  setApplianceDailyStatsLoading: (loading: boolean) => void;
};

const StatsContext = createContext<StatsContextType | null>(null);

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const today = new Date().toISOString().split("T")[0];

  const [baselinePower, setBaselinePower] = useState<number | null>(null);
  const [totalEnergy, setTotalEnergy] = useState<number | null>(null);
  const [previousTotalEnergy, setPreviousTotalEnergy] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const [mode, setMode] = useState<StatsMode>("daily");
  const [chartSeries, setChartSeries] = useState<ChartPoint[]>([]);
  const [applianceDailyStats, setApplianceDailyStats] = useState<ApplianceDailyStat[]>([]);
  const [applianceDailyStatsLoading, setApplianceDailyStatsLoading] = useState(false);

  return (
    <StatsContext.Provider
      value={{
        baselinePower,
        totalEnergy,
        previousTotalEnergy,
        selectedDate,
        mode,
        chartSeries,
        applianceDailyStats,
        applianceDailyStatsLoading,
        setBaselinePower,
        setTotalEnergy,
        setPreviousTotalEnergy,
        setSelectedDate,
        setMode,
        setChartSeries,
        setApplianceDailyStats,
        setApplianceDailyStatsLoading,
      }}
    >
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const context = useContext(StatsContext);
  if (!context) throw new Error("useStats must be used inside StatsProvider");
  return context;
}