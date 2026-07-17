import { useState, useMemo } from 'react';

export interface ModInputs {
  type: 'AM' | 'FM';
  fc: number;
  fm: number;
  index: number;
}

export function useModulation(initialInputs: ModInputs) {
  const [inputs, setInputs] = useState<ModInputs>(initialInputs);

  const outputs = useMemo(() => {
    const { type, fc, fm, index } = inputs;
    
    let timeData: { t: number, val: number, env?: number, negEnv?: number }[] = [];
    let specData: { f: number, amp: number, label: string }[] = [];
    let bw = 0;

    try {
      if (fc > 0 && fm > 0) {
        const tMax = 3 / fm; // 3 cycles
        const steps = 2000;
        for (let i = 0; i <= steps; i++) {
          const t = (i / steps) * tMax;
          const msg = Math.cos(2 * Math.PI * fm * t);
          let val = 0;
          let env = 0;
          if (type === 'AM') {
            env = 1 + index * msg;
            val = env * Math.cos(2 * Math.PI * fc * t);
            timeData.push({ t: t * 1000, val, env, negEnv: -env }); // ms
          } else {
            val = Math.cos(2 * Math.PI * fc * t + index * Math.sin(2 * Math.PI * fm * t));
            timeData.push({ t: t * 1000, val });
          }
        }

        if (type === 'AM') {
          bw = 2 * fm;
          specData.push({ f: fc - fm, amp: index / 2, label: 'LSB' });
          specData.push({ f: fc, amp: 1, label: 'Carrier' });
          specData.push({ f: fc + fm, amp: index / 2, label: 'USB' });
        } else {
          bw = 2 * (index + 1) * fm;
          const nSidebands = Math.ceil(index + 2);
          for (let n = -nSidebands; n <= nSidebands; n++) {
             // Mock bessel approximation for visual spectrum
             const absN = Math.abs(n);
             let amp = 0;
             if (absN === 0) {
                 amp = Math.abs(Math.sin(index) / (index || 1));
                 if (index === 0) amp = 1;
             } else {
                 amp = Math.abs(Math.sin(index - absN * Math.PI / 2) / (index || 1)) * (index / (absN + index/2));
             }
             amp = Math.min(1, Math.max(0.01, amp));
             
             if (amp > 0.05) {
               specData.push({ f: fc + n * fm, amp: amp, label: n === 0 ? 'fc' : (n>0 ? `+${n}fm` : `${n}fm`) });
             }
          }
        }
      }
    } catch(e) {}

    return { timeData, specData, bw };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
