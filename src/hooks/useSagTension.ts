import { useState, useMemo } from 'react';

export interface SagTensionInputs {
  L: number;
  Wc: number;
  Ww: number;
  Wi: number;
  UTS: number;
  SF: number;
}

export function useSagTension(initialInputs: SagTensionInputs) {
  const [inputs, setInputs] = useState<SagTensionInputs>(initialInputs);

  const outputs = useMemo(() => {
    let We = 0, T = 0, Sag = 0;
    let plotData: { x: number, y: number }[] = [];

    try {
      const { L, Wc, Ww, Wi, UTS, SF } = inputs;
      We = Math.sqrt(Math.pow(Wc + Wi, 2) + Math.pow(Ww, 2));
      T = UTS / Math.max(1, SF);
      
      if (T > 0 && L > 0) {
        Sag = (We * L * L) / (8 * T);

        for (let i = 0; i <= 100; i++) {
          const x = -L / 2 + (i / 100) * L;
          const y = (We * x * x) / (2 * T) - Sag; // Parabola dipping downwards
          plotData.push({ x, y });
        }
      }
    } catch (e) {}

    return { We, T, Sag, plotData };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
