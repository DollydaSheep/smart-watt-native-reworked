import React, { createContext, useContext, useState } from "react";

// ----------------------------
// TYPES
// ----------------------------
export type AnomalyLevel = "normal" | "warning" | "critical";

type SmartWattContextType = {
  // Anomaly
  anomalyLevel: AnomalyLevel;
  setAnomalyLevel: (level: AnomalyLevel) => void;

  // Power limit
  powerLimit: number;
  setPowerLimit: (limit: number) => void;
};

type ProviderProps = {
  children: React.ReactNode;
};

// ----------------------------
// CONTEXT
// ----------------------------
const SmartWattContext = createContext<SmartWattContextType | null>(null);

// ----------------------------
// PROVIDER
// ----------------------------
export function SmartWattProvider({ children }: ProviderProps) {
  const [anomalyLevel, setAnomalyLevel] = useState<AnomalyLevel>("normal");
  const [powerLimit, setPowerLimit] = useState<number>(5); // default watts

  return (
    <SmartWattContext.Provider
      value={{
        anomalyLevel,
        setAnomalyLevel,
        powerLimit,
        setPowerLimit,
      }}
    >
      {children}
    </SmartWattContext.Provider>
  );
}

// ----------------------------
// HOOKS
// ----------------------------
export function useSmartWatt() {
  const ctx = useContext(SmartWattContext);
  if (!ctx) throw new Error("useSmartWatt must be inside <SmartWattProvider>");
  return ctx;
}

export function useAnomaly() {
  const { anomalyLevel, setAnomalyLevel } = useSmartWatt();
  return { anomalyLevel, setAnomalyLevel };
}

export function usePowerLimit() {
  const { powerLimit, setPowerLimit } = useSmartWatt();
  return { powerLimit, setPowerLimit };
}
