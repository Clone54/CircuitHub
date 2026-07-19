import { useState, useMemo } from 'react';

export interface VLSIDelayInputs {
  Rs: number; // ohms/sq
  L: number; // um
  W: number; // um
  Cg: number; // fF/um^2
  S: number; // current scaling factor, default 1
}

export function useVLSIDelay(initialInputs: VLSIDelayInputs) {
  const [inputs, setInputs] = useState(initialInputs);

  const outputs = useMemo(() => {
    const { Rs, L, W, Cg, S } = inputs;
    const R = Rs * (L / (W || 1));
    const C_total = Cg * L * W; // fF
    const Tau = R * C_total * 1e-15; // in seconds
    
    // For plotting
    const plotData = [];
    for (let s = 1; s <= 10; s += 0.5) {
      // Constant field scaling
      // Delay scales as 1/S
      const delayCF = Tau / s;
      
      // Constant voltage scaling
      // Delay scales as 1/S^2
      const delayCV = Tau / Math.pow(s, 2);
      
      plotData.push({
        S: s,
        delayCF: delayCF * 1e12, // ps
        delayCV: delayCV * 1e12 // ps
      });
    }

    return { R, C_total, Tau: Tau * 1e12, plotData }; // Tau in ps
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
