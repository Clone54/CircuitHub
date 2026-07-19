import { useState, useMemo } from 'react';

export interface MaxPowerInputs {
  vTh: number; // Volts
  rTh: number; // Ohms
}

export interface MaxPowerOutputs {
  pMax: number; // Watts
  plotData: { rLoad: number; power: number }[];
}

export function useMaxPowerTransfer(initialInputs: MaxPowerInputs) {
  const [inputs, setInputs] = useState<MaxPowerInputs>(initialInputs);

  const outputs = useMemo<MaxPowerOutputs>(() => {
    const { vTh, rTh } = inputs;
    
    if (vTh <= 0 || rTh <= 0) {
      return { pMax: 0, plotData: [] };
    }

    const pMax = (vTh * vTh) / (4 * rTh);
    
    const plotData = [];
    const minRl = rTh * 0.1;
    const maxRl = rTh * 5;
    const step = (maxRl - minRl) / 100;
    
    for (let rl = minRl; rl <= maxRl; rl += step) {
      const current = vTh / (rTh + rl);
      const power = current * current * rl;
      plotData.push({ rLoad: rl, power });
    }
    
    return {
      pMax,
      plotData
    };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
