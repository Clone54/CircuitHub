import { useState, useMemo } from 'react';

export interface OscillatorInputs {
  topology: 'Wien' | 'RC-PhaseShift' | 'Hartley' | 'Colpitts';
  fo: number; // kHz
  C: number; // nF (Known capacitor value)
}

export interface OscillatorOutputs {
  R?: number; // Ohms
  L?: number; // mH
  Av_min: number;
}

export function useOscillator(initialInputs: OscillatorInputs) {
  const [inputs, setInputs] = useState<OscillatorInputs>(initialInputs);

  const outputs = useMemo<OscillatorOutputs>(() => {
    const { topology, fo, C } = inputs;
    
    const fo_Hz = fo * 1000;
    const C_F = C * 1e-9;
    
    let R: number | undefined;
    let L: number | undefined;
    let Av_min = 0;

    if (fo_Hz > 0 && C_F > 0) {
      if (topology === 'Wien') {
        // fo = 1 / (2 * pi * R * C)
        R = 1 / (2 * Math.PI * fo_Hz * C_F);
        Av_min = 3;
      } else if (topology === 'RC-PhaseShift') {
        // fo = 1 / (2 * pi * R * C * sqrt(6))
        R = 1 / (2 * Math.PI * fo_Hz * C_F * Math.sqrt(6));
        Av_min = 29;
      } else if (topology === 'Hartley') {
        // fo = 1 / (2 * pi * sqrt(L_eq * C))
        const L_eq_H = 1 / (Math.pow(2 * Math.PI * fo_Hz, 2) * C_F);
        L = L_eq_H * 1000; // mH
        Av_min = 1; // Assuming self-starting oscillator, Av depends on L1/L2 ratio
      } else if (topology === 'Colpitts') {
        // fo = 1 / (2 * pi * sqrt(L * C_eq))
        const L_H = 1 / (Math.pow(2 * Math.PI * fo_Hz, 2) * C_F);
        L = L_H * 1000; // mH
        Av_min = 1; // Depends on C1/C2 ratio
      }
    }

    return { R, L, Av_min };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
