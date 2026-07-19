import { useState, useMemo } from 'react';

export interface PowerAmpInputs {
  classType: 'A-series' | 'A-transformer' | 'B-pushpull';
  Vcc: number;
  Vp: number;
  RL: number;
  Tj_max: number;
  Ta: number;
  Theta_jc: number;
}

export interface PowerAmpOutputs {
  P_DC: number;
  P_AC: number;
  P_D_total: number;
  P_D_per_transistor: number;
  efficiency: number;
  Theta_ca: number;
  error?: string;
}

export function usePowerAmp(initialInputs: PowerAmpInputs) {
  const [inputs, setInputs] = useState<PowerAmpInputs>(initialInputs);

  const outputs = useMemo<PowerAmpOutputs>(() => {
    const { classType, Vcc, Vp, RL, Tj_max, Ta, Theta_jc } = inputs;
    
    if (Vcc <= 0 || RL <= 0) {
      return { P_DC: 0, P_AC: 0, P_D_total: 0, P_D_per_transistor: 0, efficiency: 0, Theta_ca: 0, error: 'Vcc and RL must be positive.' };
    }
    
    // Determine theoretical Vp max based on topology
    let Vp_max = Vcc;
    if (classType === 'A-series') {
      Vp_max = Vcc / 2;
    }
    
    if (Vp > Vp_max) {
      return { P_DC: 0, P_AC: 0, P_D_total: 0, P_D_per_transistor: 0, efficiency: 0, Theta_ca: 0, error: `Vp cannot exceed ${Vp_max}V for ${classType}.` };
    }

    const P_AC = (Vp * Vp) / (2 * RL);
    let P_DC = 0;
    let numTransistors = 1;

    if (classType === 'A-series') {
      // Assuming biased at midpoint Vcc/2
      const Icq = Vcc / (2 * RL);
      P_DC = Vcc * Icq;
    } else if (classType === 'A-transformer') {
      // Assuming biased for max swing Vcc
      const Icq = Vcc / RL;
      P_DC = Vcc * Icq;
    } else if (classType === 'B-pushpull') {
      P_DC = (2 * Vcc * Vp) / (Math.PI * RL);
      numTransistors = 2;
    }

    const P_D_total = Math.max(0, P_DC - P_AC);
    const P_D_per_transistor = P_D_total / numTransistors;
    const efficiency = P_DC > 0 ? (P_AC / P_DC) * 100 : 0;

    // Thermal calculations
    let Theta_ca = 0;
    if (P_D_per_transistor > 0) {
      const Theta_ja = (Tj_max - Ta) / P_D_per_transistor;
      Theta_ca = Theta_ja - Theta_jc;
    } else {
      Theta_ca = Infinity; // No heat sink needed
    }

    return {
      P_DC,
      P_AC,
      P_D_total,
      P_D_per_transistor,
      efficiency,
      Theta_ca
    };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
