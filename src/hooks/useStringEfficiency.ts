import { useState, useMemo } from 'react';

export interface StringEfficiencyInputs {
  n: number;
  k: number;
  Vph: number;
}

export function useStringEfficiency(initialInputs: StringEfficiencyInputs) {
  const [inputs, setInputs] = useState<StringEfficiencyInputs>(initialInputs);

  const outputs = useMemo(() => {
    let V_discs: number[] = [];
    let efficiency = 0;
    let plotData: { disc: string, voltage: number }[] = [];

    try {
      const { n, k, Vph } = inputs;
      if (n > 0) {
        let V = [1];
        let sum = 1;
        
        for (let m = 1; m < n; m++) {
          let V_next = V[m - 1] + k * sum;
          V.push(V_next);
          sum += V_next;
        }
        
        const V1_actual = Vph / sum;
        V_discs = V.map(v => v * V1_actual);
        
        const Vn = V_discs[n - 1];
        efficiency = (Vph / (n * Vn)) * 100;
        
        plotData = V_discs.map((v, i) => ({
          disc: `Disc ${i + 1}`,
          voltage: v
        }));
      }
    } catch (e) {}

    return { V_discs, efficiency, plotData };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
