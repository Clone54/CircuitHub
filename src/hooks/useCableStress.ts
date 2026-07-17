import { useState, useMemo } from 'react';

export interface CableStressInputs {
  r: number;
  R: number;
  V: number;
  eps_r: number;
}

export function useCableStress(initialInputs: CableStressInputs) {
  const [inputs, setInputs] = useState<CableStressInputs>(initialInputs);

  const outputs = useMemo(() => {
    let g_max = 0, g_min = 0, C_km = 0;
    let plotData: { x: number, g: number }[] = [];

    try {
      const { r, R, V, eps_r } = inputs;
      if (r > 0 && R > r && V > 0) {
        const lnRr = Math.log(R / r);
        g_max = V / (r * lnRr);
        g_min = V / (R * lnRr);
        
        // C (uF/km) = (2 * pi * eps_0 * eps_r) / ln(R/r) * 10^3 * 10^6
        // eps_0 = 8.854e-12 F/m
        C_km = (0.05563 * eps_r) / lnRr;
        
        for (let i = 0; i <= 100; i++) {
          const x = r + (i / 100) * (R - r);
          const g = V / (x * lnRr);
          plotData.push({ x, g });
        }
      }
    } catch(e) {}

    return { g_max, g_min, C_km, plotData };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
