import { useState, useMemo } from 'react';

export function useDiscreteConvolution(initialX: string, initialH: string) {
  const [xStr, setXStr] = useState(initialX);
  const [hStr, setHStr] = useState(initialH);
  const [step, setStep] = useState(0);

  const outputs = useMemo(() => {
    let x = xStr.split(',').map(Number).filter(n => !isNaN(n));
    let h = hStr.split(',').map(Number).filter(n => !isNaN(n));
    if (x.length === 0) x = [0];
    if (h.length === 0) h = [0];

    const yLen = x.length + h.length - 1;
    const y = new Array(yLen).fill(0);

    for (let i = 0; i < x.length; i++) {
      for (let j = 0; j < h.length; j++) {
        y[i + j] += x[i] * h[j];
      }
    }

    const hFolded = [...h].reverse();
    const stepsData = [];

    for (let n = 0; n < yLen; n++) {
      const shift = n - (h.length - 1);
      const hShifted = [];
      let sum = 0;
      let partials = [];
      
      for (let k = 0; k < Math.max(x.length, yLen); k++) {
        const hVal = (k >= shift && k < shift + h.length) ? hFolded[k - shift] : 0;
        const xVal = (k >= 0 && k < x.length) ? x[k] : 0;
        
        hShifted.push({ k, val: hVal });
        if (k >= 0 && k < x.length) {
          sum += xVal * hVal;
          partials.push({ k, val: xVal * hVal });
        }
      }
      stepsData.push({ n, hShifted, sum, partials });
    }

    const plotX = x.map((val, n) => ({ n, val }));
    const plotH = h.map((val, n) => ({ n, val }));
    const plotY = y.map((val, n) => ({ n, val }));

    return { x, h, y, plotX, plotH, plotY, stepsData };
  }, [xStr, hStr]);

  return { xStr, setXStr, hStr, setHStr, step, setStep, outputs };
}
