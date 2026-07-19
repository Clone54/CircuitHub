import { useState, useMemo } from 'react';

export interface VLSIInputs {
  vdd: number; // Supply Voltage in V
  frequency: number; // Clock Frequency in MHz
  capacitance: number; // Load Capacitance in pF
  ileak: number; // Leakage current in microAmps (uA)
}

export interface VLSIOutputs {
  pDynamic: number; // Dynamic Power in microWatts (uW)
  pStatic: number; // Static Power in microWatts (uW)
  pTotal: number; // Total Power in microWatts (uW)
  dynamicPercentage: number;
  staticPercentage: number;
  error?: string;
}

export function useVLSIMath(initialInputs: VLSIInputs) {
  const [inputs, setInputs] = useState<VLSIInputs>(initialInputs);

  const outputs = useMemo<VLSIOutputs>(() => {
    const { vdd, frequency, capacitance, ileak } = inputs;

    // Strict validation
    if (vdd < 0 || frequency < 0 || capacitance < 0 || ileak < 0) {
      return {
        pDynamic: 0,
        pStatic: 0,
        pTotal: 0,
        dynamicPercentage: 0,
        staticPercentage: 0,
        error: 'Inputs cannot be negative.'
      };
    }

    // Dynamic power: P_dynamic (uW) = C (pF) * Vdd^2 (V^2) * f (MHz)
    const pDynamic = capacitance * Math.pow(vdd, 2) * frequency;

    // Static power: P_static (uW) = I_leak (uA) * Vdd (V)
    const pStatic = ileak * vdd;

    const pTotal = pDynamic + pStatic;

    let dynamicPercentage = 0;
    let staticPercentage = 0;

    if (pTotal > 0) {
      dynamicPercentage = (pDynamic / pTotal) * 100;
      staticPercentage = (pStatic / pTotal) * 100;
    }

    return {
      pDynamic,
      pStatic,
      pTotal,
      dynamicPercentage,
      staticPercentage
    };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
