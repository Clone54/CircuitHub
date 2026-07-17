import { useState, useMemo } from 'react';

export interface SuperconductorInputs {
  Tc: number; // K
  Hc0: number; // Tesla or A/m
  Top: number; // K
}

export interface SuperconductorOutputs {
  Hc_op: number;
  plotData: { T: number; Hc: number }[];
}

export function useSuperconductor(initialInputs: SuperconductorInputs) {
  const [inputs, setInputs] = useState<SuperconductorInputs>(initialInputs);

  const outputs = useMemo<SuperconductorOutputs>(() => {
    const { Tc, Hc0, Top } = inputs;

    let Hc_op = 0;
    if (Top < Tc && Top >= 0) {
      Hc_op = Hc0 * (1 - Math.pow(Top / Tc, 2));
    }

    const plotData = [];
    const maxT = Tc * 1.5;
    const points = 100;
    const dT = maxT / points;

    for (let i = 0; i <= points; i++) {
      const T = i * dT;
      let Hc = 0;
      if (T < Tc) {
        Hc = Hc0 * (1 - Math.pow(T / Tc, 2));
      }
      
      plotData.push({
        T,
        Hc
      });
    }

    return { Hc_op, plotData };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
