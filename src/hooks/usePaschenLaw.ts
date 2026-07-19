import { useMemo, useState } from 'react';

export type GasType = 'air' | 'sf6' | 'nitrogen';

export interface PaschenPoint {
  pd: number;
  vb: number;
}

export interface UsePaschenLawParams {
  initialGasType?: GasType;
  initialPressure?: number; // in Torr
  initialDistance?: number; // in cm
  initialGamma?: number; // secondary ionization coefficient
}

export const GAS_CONSTANTS: Record<GasType, { name: string; A: number; B: number; defaultGamma: number; description: string }> = {
  air: {
    name: 'Air',
    A: 15.0, // Torr^-1 cm^-1
    B: 365.0, // V Torr^-1 cm^-1
    defaultGamma: 0.01,
    description: 'Standard atmospheric air. Economical insulation but has lower dielectric strength and is susceptible to moisture.'
  },
  nitrogen: {
    name: 'Nitrogen (N₂)',
    A: 12.0,
    B: 342.0,
    defaultGamma: 0.01,
    description: 'Inert, dry gas often used in transformer blankets and high-voltage cables to prevent oxidation.'
  },
  sf6: {
    name: 'Sulfur Hexafluoride (SF₆)',
    A: 24.0,
    B: 890.0,
    defaultGamma: 0.005,
    description: 'Highly electronegative greenhouse gas with excellent arc-quenching and dielectric insulation properties.'
  }
};

export function usePaschenLaw({
  initialGasType = 'air',
  initialPressure = 760, // 1 atm in Torr
  initialDistance = 0.1,  // 1 mm in cm
  initialGamma = 0.01
}: UsePaschenLawParams = {}) {
  const [gasType, setGasType] = useState<GasType>(initialGasType);
  const [pressure, setPressure] = useState<number>(initialPressure);
  const [distance, setDistance] = useState<number>(initialDistance);
  const [gamma, setGamma] = useState<number>(initialGamma);

  const paschenResults = useMemo(() => {
    const { A, B } = GAS_CONSTANTS[gasType];

    // Specific user inputs pd
    const userPd = pressure * distance;

    // Minimum breakdown pd and voltage (analytical)
    // pd_limit is where ln(A*pd) - ln(ln(1 + 1/gamma)) = 0
    const pdLimit = Math.log(1 + 1 / gamma) / A;
    const pdMin = Math.E * Math.log(1 + 1 / gamma) / A;
    const vbMin = B * pdMin;

    // Calculate specific V_b for user inputs
    let userVb = 0;
    let isValid = false;

    if (userPd > pdLimit) {
      const denom = Math.log(A * userPd) - Math.log(Math.log(1 + 1 / gamma));
      if (denom > 0) {
        userVb = (B * userPd) / denom;
        isValid = true;
      }
    }

    // Generate curve points for plotting the classic U-shape
    // We want to sweep pd from just above pdLimit (which goes to infinity) to a high value.
    // Sweeping logarithmically is perfect for capturing both the steep left branch and flat right branch
    const points: PaschenPoint[] = [];
    const steps = 80;

    // pd range for plotting
    const pdStart = pdLimit * 1.02; // Close to the vertical asymptote
    const pdEnd = Math.max(userPd * 2.5, pdMin * 15, 10.0);

    // Let's use log scale for points generation so we get high resolution near the asymptote and minimum,
    // and fewer spread points on the linear high-end.
    const logStart = Math.log10(pdStart);
    const logEnd = Math.log10(pdEnd);
    const logStep = (logEnd - logStart) / (steps - 1);

    for (let i = 0; i < steps; i++) {
      const pdVal = Math.pow(10, logStart + i * logStep);
      const denom = Math.log(A * pdVal) - Math.log(Math.log(1 + 1 / gamma));
      
      if (denom > 0) {
        const vbVal = (B * pdVal) / denom;
        // Keep within reasonable visualization limits
        if (vbVal < vbMin * 40) {
          points.push({
            pd: parseFloat(pdVal.toFixed(4)),
            vb: parseFloat(vbVal.toFixed(1))
          });
        }
      }
    }

    // Sort to make sure line draws correctly
    points.sort((a, b) => a.pd - b.pd);

    return {
      userPd: parseFloat(userPd.toFixed(4)),
      userVb: isValid ? parseFloat(userVb.toFixed(1)) : null,
      isValid,
      pdLimit: parseFloat(pdLimit.toFixed(4)),
      pdMin: parseFloat(pdMin.toFixed(4)),
      vbMin: parseFloat(vbMin.toFixed(1)),
      points
    };
  }, [gasType, pressure, distance, gamma]);

  return {
    gasType,
    setGasType,
    pressure,
    setPressure,
    distance,
    setDistance,
    gamma,
    setGamma,
    paschenResults
  };
}
