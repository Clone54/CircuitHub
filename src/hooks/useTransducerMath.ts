import { useState, useMemo } from 'react';

export interface TransducerInputs {
  type: 'RTD' | 'StrainGauge';
  R0: number; // Base resistance
  alpha: number; // for RTD
  GF: number; // Gauge factor for Strain Gauge
  V_ex: number;
  inputMin: number;
  inputMax: number;
}

export interface TransducerOutputs {
  plotData: { input: number; dR: number; Vout: number }[];
  isLinear: boolean;
}

export function useTransducerMath(initialInputs: TransducerInputs) {
  const [inputs, setInputs] = useState<TransducerInputs>(initialInputs);

  const outputs = useMemo<TransducerOutputs>(() => {
    const { type, R0, alpha, GF, V_ex, inputMin, inputMax } = inputs;
    
    const plotData = [];
    const steps = 50;
    const stepSize = (inputMax - inputMin) / steps;
    
    let isLinear = true;

    for (let i = 0; i <= steps; i++) {
      const input = inputMin + i * stepSize;
      let dR = 0;
      
      if (type === 'RTD') {
        dR = R0 * alpha * input;
      } else {
        const strain = input * 1e-6;
        dR = R0 * GF * strain;
      }
      
      const R_active = R0 + dR;
      const Vout = V_ex * ( R_active / (R_active + R0) - 0.5 );
      
      plotData.push({ input, dR, Vout });
    }

    if (plotData.length > 2) {
       const slope1 = (plotData[1].Vout - plotData[0].Vout) / (stepSize || 1);
       const slope2 = (plotData[steps].Vout - plotData[steps-1].Vout) / (stepSize || 1);
       if (Math.abs((slope1 - slope2) / (slope1 || 1)) > 0.01) {
           isLinear = false;
       }
    }

    return { plotData, isLinear };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
