import { useState, useMemo } from 'react';

export interface ResonanceInputs {
  resistance: number; // Ohms
  inductance: number; // mH
  capacitance: number; // uF
  type: 'series' | 'parallel';
}

export interface ResonanceOutputs {
  f0: number; // Hz
  qFactor: number;
  f1: number; // Hz
  f2: number; // Hz
  bandwidth: number; // Hz
  plotData: { frequency: number; value: number }[];
}

export function useResonance(initialInputs: ResonanceInputs) {
  const [inputs, setInputs] = useState<ResonanceInputs>(initialInputs);

  const outputs = useMemo<ResonanceOutputs>(() => {
    const { resistance, inductance, capacitance, type } = inputs;
    const R = resistance;
    const L = inductance * 1e-3; // H
    const C = capacitance * 1e-6; // F

    if (R <= 0 || L <= 0 || C <= 0) {
      return { f0: 0, qFactor: 0, f1: 0, f2: 0, bandwidth: 0, plotData: [] };
    }

    const omega0 = 1 / Math.sqrt(L * C);
    const f0 = omega0 / (2 * Math.PI);
    
    let qFactor = 0;
    if (type === 'series') {
      qFactor = (1 / R) * Math.sqrt(L / C);
    } else {
      qFactor = R * Math.sqrt(C / L);
    }

    let f1 = 0;
    let f2 = 0;
    if (type === 'series') {
      const alpha = R / (2 * L);
      const omega1 = -alpha + Math.sqrt(alpha * alpha + omega0 * omega0);
      const omega2 = alpha + Math.sqrt(alpha * alpha + omega0 * omega0);
      f1 = omega1 / (2 * Math.PI);
      f2 = omega2 / (2 * Math.PI);
    } else {
      const alpha = 1 / (2 * R * C);
      const omega1 = -alpha + Math.sqrt(alpha * alpha + omega0 * omega0);
      const omega2 = alpha + Math.sqrt(alpha * alpha + omega0 * omega0);
      f1 = omega1 / (2 * Math.PI);
      f2 = omega2 / (2 * Math.PI);
    }
    
    const bandwidth = f2 - f1;

    const plotData = [];
    const minFreq = f0 * 0.5;
    const maxFreq = f0 * 1.5;
    const step = (maxFreq - minFreq) / 100;

    for (let f = minFreq; f <= maxFreq; f += step) {
      const omega = 2 * Math.PI * f;
      const Xl = omega * L;
      const Xc = 1 / (omega * C);
      
      let value = 0;
      if (type === 'series') {
        const Z = Math.sqrt(R * R + Math.pow(Xl - Xc, 2));
        value = 1 / Z;
      } else {
        const Y = Math.sqrt(Math.pow(1 / R, 2) + Math.pow(1 / Xc - 1 / Xl, 2));
        value = 1 / Y;
      }
      
      plotData.push({ frequency: f, value });
    }

    return {
      f0, qFactor, f1, f2, bandwidth, plotData
    };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
