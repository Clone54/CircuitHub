import { useState, useMemo } from 'react';

export interface BodePlotInputs {
  Amid: number; // V/V
  fL: number; // Hz
  fH: number; // Hz
}

export interface BodePlotDataPoint {
  f: number;
  mag: number; // dB
  phase: number; // degrees
}

export interface BodePlotOutputs {
  Amid_dB: number;
  plotData: BodePlotDataPoint[];
}

export function useBodePlot(initialInputs: BodePlotInputs) {
  const [inputs, setInputs] = useState<BodePlotInputs>(initialInputs);

  const outputs = useMemo<BodePlotOutputs>(() => {
    const { Amid, fL, fH } = inputs;
    
    let Amid_dB = 0;
    if (Amid > 0) {
      Amid_dB = 20 * Math.log10(Amid);
    }

    const plotData: BodePlotDataPoint[] = [];
    
    if (fL > 0 && fH > 0 && fH > fL) {
      const minF = Math.max(0.1, fL * 0.1);
      const maxF = fH * 10;
      
      const numPoints = 200;
      const logMin = Math.log10(minF);
      const logMax = Math.log10(maxF);
      const step = (logMax - logMin) / (numPoints - 1);

      for (let i = 0; i < numPoints; i++) {
        const f = Math.pow(10, logMin + i * step);
        
        // Magnitude formula for combined HPF (fL) and LPF (fH)
        // A = Amid / (sqrt(1 + (fL/f)^2) * sqrt(1 + (f/fH)^2))
        const magLinear = Amid / (Math.sqrt(1 + Math.pow(fL/f, 2)) * Math.sqrt(1 + Math.pow(f/fH, 2)));
        const mag = magLinear > 0 ? 20 * Math.log10(magLinear) : -200;
        
        // Phase formula (in radians, converted to degrees)
        // Phase = arctan(fL/f) - arctan(f/fH)
        const phaseRad = Math.atan(fL / f) - Math.atan(f / fH);
        const phase = phaseRad * (180 / Math.PI);

        plotData.push({ f, mag, phase });
      }
    }

    return { Amid_dB, plotData };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
