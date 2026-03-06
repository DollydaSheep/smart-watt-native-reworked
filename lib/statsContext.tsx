import { createContext, useContext, useState } from "react";

type StatsContextType = {
  baselinePower: number | null;
  totalEnergy: number | null;
  setBaselinePower: (v: number) => void;
  setTotalEnergy: (v: number) => void;
};

const StatsContext = createContext<StatsContextType | null>(null);

export function StatsProvider({ children }: { children: React.ReactNode }) {

  const [baselinePower, setBaselinePower] = useState<number | null>(null);
  const [totalEnergy, setTotalEnergy] = useState<number | null>(null);

  return (
    <StatsContext.Provider
      value={{
        baselinePower,
        totalEnergy,
        setBaselinePower,
        setTotalEnergy
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