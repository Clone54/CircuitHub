import { useState, useMemo } from 'react';

export type SignalType = 'Rectangular' | 'Step' | 'Exponential';

export interface ConvolutionInputs {
  xType: SignalType;
  hType: SignalType;
  tShift: number; // Current time shift 't'
}

export interface ConvolutionOutputs {
  tauData: { tau: number; x: number; h_shifted: number; overlap: number }[];
  yData: { t: number; y: number }[];
  currentY: number;
}

export function useConvolution(initialInputs: ConvolutionInputs) {
  const [inputs, setInputs] = useState<ConvolutionInputs>(initialInputs);

  const outputs = useMemo<ConvolutionOutputs>(() => {
    const { xType, hType, tShift } = inputs;

    const getSignal = (type: SignalType, t: number) => {
      if (type === 'Rectangular') {
        return (t >= 0 && t <= 2) ? 1 : 0;
      } else if (type === 'Step') {
        return (t >= 0) ? 1 : 0;
      } else if (type === 'Exponential') {
        return (t >= 0) ? Math.exp(-t) : 0;
      }
      return 0;
    };

    const tauMin = -2;
    const tauMax = 8;
    const steps = 200;
    const dTau = (tauMax - tauMin) / steps;

    const tauData = [];
    let currentY = 0;

    for (let i = 0; i <= steps; i++) {
      const tau = tauMin + i * dTau;
      const x_tau = getSignal(xType, tau);
      const h_t_minus_tau = getSignal(hType, tShift - tau);
      const overlap = x_tau * h_t_minus_tau;
      
      tauData.push({
        tau,
        x: x_tau,
        h_shifted: h_t_minus_tau,
        overlap
      });

      // Simple numerical integration for current y(t) using rectangular rule
      // We sum up the area from -infinity (or tauMin) up to +infinity (tauMax)
      // Actually convolution is integral over all tau.
    }
    
    // Calculate current Y using integration over all tau
    currentY = tauData.reduce((sum, point) => sum + point.overlap * dTau, 0);

    // Generate yData for all t from -2 to 8 to show the full convolution result
    const yData = [];
    const tMin = -2;
    const tMax = 8;
    const tSteps = 200;
    const dt = (tMax - tMin) / tSteps;

    for (let i = 0; i <= tSteps; i++) {
      const t = tMin + i * dt;
      let y = 0;
      for (let j = 0; j <= steps; j++) {
        const tau = tauMin + j * dTau;
        const x_tau = getSignal(xType, tau);
        const h_t_minus_tau = getSignal(hType, t - tau);
        y += x_tau * h_t_minus_tau * dTau;
      }
      // only keep y up to tShift if we want to show it building up, 
      // but usually we show the full y(t) and maybe a dot at current t.
      // Or we can mask it. Let's just output full y(t).
      yData.push({ t, y });
    }

    return { tauData, yData, currentY };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
