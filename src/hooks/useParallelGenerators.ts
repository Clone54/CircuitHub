import { useState, useMemo } from 'react';

export interface ParallelGenInputs {
  fnl1: number;
  sp1: number;
  fnl2: number;
  sp2: number;
  Ptotal: number;
}

export function useParallelGenerators(initialInputs: ParallelGenInputs) {
  const [inputs, setInputs] = useState<ParallelGenInputs>(initialInputs);

  const outputs = useMemo(() => {
    let fsys = 0, P1 = 0, P2 = 0;
    let plotData: { P: number, Gen1_Freq: number, Gen2_Freq: number }[] = [];

    try {
      const { fnl1, sp1, fnl2, sp2, Ptotal } = inputs;
      
      fsys = (sp1 * fnl1 + sp2 * fnl2 - Ptotal) / (sp1 + sp2);
      P1 = sp1 * (fnl1 - fsys);
      P2 = sp2 * (fnl2 - fsys);
      
      // Plot data
      for (let p = 0; p <= Ptotal; p += Ptotal / 50) {
        if (p === 0 && Ptotal === 0) break;
        
        // For house diagram, x-axis is Power from 0 to Ptotal
        // Gen 1 frequency drops as power increases from 0
        const f1 = fnl1 - p / sp1;
        
        // Gen 2 frequency drops as its power increases. Its power is (Ptotal - p)
        const f2 = fnl2 - (Ptotal - p) / sp2;
        
        plotData.push({
          P: p,
          Gen1_Freq: f1,
          Gen2_Freq: f2
        });
      }
    } catch(err) {}

    return { fsys, P1, P2, plotData };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
