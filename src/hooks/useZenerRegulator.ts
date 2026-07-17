import { useState, useMemo } from 'react';

export interface ZenerInputs {
  VinMin: number;
  VinMax: number;
  Vz: number;
  IzT: number; // mA
  IzM: number; // mA
  ILMin: number; // mA
  ILMax: number; // mA
}

export interface ZenerOutputs {
  RsMax: number; // Ohms
  RsMin: number; // Ohms
  PzMax: number; // W
  PRsMax: number; // W
  error?: string;
}

export function useZenerRegulator(initialInputs: ZenerInputs) {
  const [inputs, setInputs] = useState<ZenerInputs>(initialInputs);

  const outputs = useMemo<ZenerOutputs>(() => {
    const { VinMin, VinMax, Vz, IzT, IzM, ILMin, ILMax } = inputs;

    if (VinMin < Vz) {
      return { RsMax: 0, RsMin: 0, PzMax: 0, PRsMax: 0, error: 'Vin(min) is less than Vz. Regulator will not turn on.' };
    }

    // Convert mA to A for power calculations, keep in mA for resistor calc?
    // R = V / I. If I is in mA, R is in kOhms. Let's use A to get Ohms directly.
    const iLmin_A = ILMin / 1000;
    const iLmax_A = ILMax / 1000;
    const izM_A = IzM / 1000;
    const izMin_A = 0.1 * izM_A; // Assume IzK is 10% of IzM

    // R_s max ensures Zener turns on at minimum Vin and maximum IL
    const RsMax = (VinMin - Vz) / (iLmax_A + izMin_A);

    // R_s min ensures Zener doesn't exceed IzM at maximum Vin and minimum IL
    const RsMin = (VinMax - Vz) / (iLmin_A + izM_A);

    if (RsMin > RsMax) {
      return { RsMax, RsMin, PzMax: 0, PRsMax: 0, error: 'Conflicting constraints: Rs(min) > Rs(max). Redesign needed (e.g. increase IzM).' };
    }

    const PzMax = Vz * izM_A;
    // Max power in Rs occurs at VinMax. Assuming we pick a value in between, say Rs_chosen = (RsMin + RsMax)/2.
    // For safety, rate PRs at RsMin.
    const PRsMax = Math.pow(VinMax - Vz, 2) / (RsMin || 1);

    return { RsMax, RsMin, PzMax, PRsMax };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
