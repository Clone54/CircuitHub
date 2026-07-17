import { useState, useMemo } from 'react';

export interface FilterInputs {
  type: 'FIR' | 'IIR';
  fs: number; // Hz
  fc: number; // Hz (cutoff)
  order: number;
}

export function useDigitalFilter(initialInputs: FilterInputs) {
  const [inputs, setInputs] = useState<FilterInputs>(initialInputs);

  const outputs = useMemo(() => {
    let b: number[] = [];
    let a: number[] = [1];
    let freqResponse: { f: number; magDb: number }[] = [];
    let poleZeros: { type: 'pole' | 'zero'; re: number; im: number }[] = [];

    const { type, fs, fc, order } = inputs;
    const wc = 2 * Math.PI * (fc / fs);

    if (type === 'FIR') {
      const N = order % 2 === 0 ? order + 1 : order; 
      const alpha = (N - 1) / 2;
      for (let n = 0; n < N; n++) {
        let hd = 0;
        if (n === alpha) {
          hd = wc / Math.PI;
        } else {
          hd = Math.sin(wc * (n - alpha)) / (Math.PI * (n - alpha));
        }
        const window = 0.54 - 0.46 * Math.cos((2 * Math.PI * n) / (N - 1));
        b.push(hd * window);
      }
      a = [1];
      
      for (let i = 0; i < N - 1; i++) {
        poleZeros.push({ type: 'pole', re: 0, im: 0 });
      }
    } else {
      if (order === 1) {
        const wa = Math.tan(wc / 2);
        const denom = 1 + wa;
        b = [wa / denom, wa / denom];
        a = [1, (wa - 1) / denom];
        
        poleZeros.push({ type: 'pole', re: -a[1], im: 0 });
        poleZeros.push({ type: 'zero', re: -1, im: 0 });
      } else {
        const wa = Math.tan(wc / 2);
        const wa2 = wa * wa;
        const sqrt2wa = Math.sqrt(2) * wa;
        const denom = 1 + sqrt2wa + wa2;
        b = [wa2 / denom, (2 * wa2) / denom, wa2 / denom];
        a = [1, (2 * wa2 - 2) / denom, (1 - sqrt2wa + wa2) / denom];

        const disc = a[1] * a[1] - 4 * a[2];
        if (disc < 0) {
          const re = -a[1] / 2;
          const im = Math.sqrt(-disc) / 2;
          poleZeros.push({ type: 'pole', re, im });
          poleZeros.push({ type: 'pole', re, im: -im });
        } else {
          poleZeros.push({ type: 'pole', re: (-a[1] + Math.sqrt(disc)) / 2, im: 0 });
          poleZeros.push({ type: 'pole', re: (-a[1] - Math.sqrt(disc)) / 2, im: 0 });
        }
        poleZeros.push({ type: 'zero', re: -1, im: 0 });
        poleZeros.push({ type: 'zero', re: -1, im: 0 });
      }
    }

    const points = 100;
    for (let i = 0; i <= points; i++) {
      const f = (i / points) * (fs / 2);
      const w = 2 * Math.PI * (f / fs);
      
      let sumReB = 0, sumImB = 0;
      for (let k = 0; k < b.length; k++) {
        sumReB += b[k] * Math.cos(-k * w);
        sumImB += b[k] * Math.sin(-k * w);
      }
      
      let sumReA = 0, sumImA = 0;
      for (let k = 0; k < a.length; k++) {
        sumReA += a[k] * Math.cos(-k * w);
        sumImA += a[k] * Math.sin(-k * w);
      }
      
      const magB = Math.sqrt(sumReB * sumReB + sumImB * sumImB);
      const magA = Math.sqrt(sumReA * sumReA + sumImA * sumImA);
      
      let H = magB / (magA || 1e-10);
      let magDb = 20 * Math.log10(H + 1e-10);
      magDb = Math.max(-100, magDb); 

      freqResponse.push({ f, magDb });
    }

    return { b, a, freqResponse, poleZeros };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
