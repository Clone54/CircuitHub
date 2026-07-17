import { useState, useMemo } from 'react';

export interface SamplingInputs {
  f_m: number;
  f_s: number;
}

export interface SamplingOutputs {
  nyquistRate: number;
  aliasedFreq: number | null;
  plotData: { t: number; original: number; sampled: number | null; reconstructed: number }[];
}

export function useSampling(initialInputs: SamplingInputs) {
  const [inputs, setInputs] = useState<SamplingInputs>(initialInputs);

  const outputs = useMemo<SamplingOutputs>(() => {
    const { f_m, f_s } = inputs;
    
    const nyquistRate = 2 * f_m;
    let aliasedFreq = null;

    if (f_s < nyquistRate && f_s > 0) {
      // Find aliased frequency
      // The aliased frequency is min |f_m - N * f_s|
      let N = Math.round(f_m / f_s);
      aliasedFreq = Math.abs(f_m - N * f_s);
    } else {
      aliasedFreq = f_m; 
    }

    const plotData = [];
    // We want to plot a few cycles of the original wave. 
    // Let's plot 3 cycles of f_m or f_alias.
    const minFreq = Math.min(f_m, aliasedFreq || f_m);
    const duration = minFreq > 0 ? 3 / minFreq : 1; 
    const points = 300;
    const dt = duration / points;
    
    const sampleInterval = f_s > 0 ? 1 / f_s : Infinity;

    for (let i = 0; i <= points; i++) {
      const t = i * dt;
      const original = Math.sin(2 * Math.PI * f_m * t);
      
      let sampled = null;
      // If t is close to a sampling instance
      const n = Math.round(t / sampleInterval);
      const sampleT = n * sampleInterval;
      if (Math.abs(t - sampleT) < dt / 2) {
        sampled = Math.sin(2 * Math.PI * f_m * sampleT);
      }

      const reconstructedFreq = aliasedFreq !== null ? aliasedFreq : f_m;
      // Phase might be flipped for alias, depending on sign
      const N_val = Math.round(f_m / f_s);
      const sign = (f_m - N_val * f_s) < 0 ? -1 : 1;
      
      const reconstructed = f_s > 0 ? sign * Math.sin(2 * Math.PI * reconstructedFreq * t) : 0;

      plotData.push({
        t,
        original,
        sampled,
        reconstructed
      });
    }

    // if no aliasing happened, aliasedFreq is set to f_m in calculations, but let's null it for output
    if (f_s >= nyquistRate) aliasedFreq = null;

    return { nyquistRate, aliasedFreq, plotData };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
