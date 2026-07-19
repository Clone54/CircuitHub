import { useState, useMemo } from 'react';

export interface SPWMInputs {
  strategy: 'Square Wave' | 'Bipolar SPWM' | 'Unipolar SPWM';
  ma: number; // 0.1 to 1.0
  mf: number; // 15, 21, etc
  Vdc: number;
}

export function useSPWM(initialInputs: SPWMInputs) {
  const [inputs, setInputs] = useState<SPWMInputs>(initialInputs);

  const outputs = useMemo(() => {
    const { strategy, ma, mf, Vdc } = inputs;
    const f_out = 50; 
    const w = 2 * Math.PI * f_out;
    const T = 1 / f_out;
    
    let timeData: { t_ms: number, vRef: number, vTri: number, vOut: number }[] = [];
    let specData: { h: number, amp: number }[] = [];
    let THD = 0;
    let fundAmp = 0;

    const N = 10000; 
    const dt = T / N;
    const vOutArr: number[] = [];

    // Time domain over 1 cycle
    for (let i = 0; i <= N; i++) {
      const t = i * dt;
      const vRef = ma * Math.sin(w * t);
      
      const triPhase = (t * mf * f_out) % 1; 
      let vTri = 0;
      if (triPhase < 0.25) vTri = triPhase * 4;
      else if (triPhase < 0.75) vTri = 1 - (triPhase - 0.25) * 4;
      else vTri = -1 + (triPhase - 0.75) * 4;

      let vOut = 0;
      if (strategy === 'Square Wave') {
        vOut = vRef >= 0 ? Vdc : -Vdc;
      } else if (strategy === 'Bipolar SPWM') {
        vOut = vRef >= vTri ? Vdc : -Vdc;
      } else if (strategy === 'Unipolar SPWM') {
        const vA = vRef >= vTri ? Vdc : 0;
        const vB = -vRef >= vTri ? Vdc : 0;
        vOut = vA - vB;
      }

      // To keep plot manageable, only push every 10th point
      if (i % 10 === 0) {
        timeData.push({ t_ms: t * 1000, vRef: vRef * Vdc, vTri: vTri * Vdc, vOut });
      }
      if (i < N) vOutArr.push(vOut);
    }

    // Harmonics calculation via Discrete Fourier Transform
    let sumHarmonicsSq = 0;
    const maxH = 100; // compute up to 100th harmonic

    for (let h = 1; h <= maxH; h++) {
      let a_h = 0, b_h = 0;
      for (let i = 0; i < N; i++) {
        const t = i * dt;
        a_h += vOutArr[i] * Math.cos(h * w * t);
        b_h += vOutArr[i] * Math.sin(h * w * t);
      }
      a_h = (2 / N) * a_h;
      b_h = (2 / N) * b_h;
      const c_h = Math.sqrt(a_h * a_h + b_h * b_h);
      
      if (c_h > Vdc * 0.02 || h === 1) { 
        specData.push({ h, amp: c_h });
      }

      if (h === 1) fundAmp = c_h;
      else sumHarmonicsSq += c_h * c_h;
    }

    if (fundAmp > 0) {
      THD = (Math.sqrt(sumHarmonicsSq) / fundAmp) * 100;
    }

    return { timeData, specData, THD, fundAmp };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
