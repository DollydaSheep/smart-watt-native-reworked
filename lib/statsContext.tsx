import { createContext, useContext, useState } from "react";

type StatsMode = "daily" | "week" | "month" | "year";

type StatsContextType = {
  baselinePower: number | null;
  totalEnergy: number | null;
  selectedDate: string | null;
  mode: StatsMode;

  setBaselinePower: (v: number) => void;
  setTotalEnergy: (v: number) => void;
  setSelectedDate: (date: string | null) => void;
  setMode: (mode: StatsMode) => void;
};

const StatsContext = createContext<StatsContextType | null>(null);

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const today = new Date().toISOString().split("T")[0];

  const [baselinePower, setBaselinePower] = useState<number | null>(null);
  const [totalEnergy, setTotalEnergy] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const [mode, setMode] = useState<StatsMode>("month");

  return (
    <StatsContext.Provider
      value={{
        baselinePower,
        totalEnergy,
        selectedDate,
        mode,
        setBaselinePower,
        setTotalEnergy,
        setSelectedDate,
        setMode,
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