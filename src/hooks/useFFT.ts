import { useState, useMemo } from 'react';

export function useFFT(initialInputs: { N: number; data: string }) {
  const [inputs, setInputs] = useState(initialInputs);

  const outputs = useMemo(() => {
    let data = inputs.data.split(',').map(Number).filter(n => !isNaN(n));
    const N = inputs.N;
    
    while (data.length < N) data.push(0);
    if (data.length > N) data = data.slice(0, N);

    const bitReverse = (n: number, bits: number) => {
      let reversed = 0;
      for (let i = 0; i < bits; i++) {
        reversed = (reversed << 1) | (n & 1);
        n >>= 1;
      }
      return reversed;
    };

    const bits = Math.log2(N);
    const complexData = data.map((val, i) => ({ re: data[bitReverse(i, bits)], im: 0 }));

    const stages: { re: number, im: number }[][] = [];
    stages.push(JSON.parse(JSON.stringify(complexData)));

    for (let s = 1; s <= bits; s++) {
      const m = 1 << s;
      const m2 = m >> 1;
      const w = { re: Math.cos(-2 * Math.PI / m), im: Math.sin(-2 * Math.PI / m) };

      const nextData = JSON.parse(JSON.stringify(complexData));

      for (let k = 0; k < N; k += m) {
        let w_k = { re: 1, im: 0 };
        for (let j = 0; j < m2; j++) {
          const t = {
            re: w_k.re * complexData[k + j + m2].re - w_k.im * complexData[k + j + m2].im,
            im: w_k.re * complexData[k + j + m2].im + w_k.im * complexData[k + j + m2].re
          };
          const u = complexData[k + j];

          nextData[k + j] = { re: u.re + t.re, im: u.im + t.im };
          nextData[k + j + m2] = { re: u.re - t.re, im: u.im - t.im };

          const nextW_k = {
            re: w_k.re * w.re - w_k.im * w.im,
            im: w_k.re * w.im + w_k.im * w.re
          };
          w_k = nextW_k;
        }
      }
      for (let i = 0; i < N; i++) {
        complexData[i] = nextData[i];
      }
      stages.push(JSON.parse(JSON.stringify(complexData)));
    }

    const magnitudes = complexData.map(c => Math.sqrt(c.re * c.re + c.im * c.im));
    const phases = complexData.map(c => Math.atan2(c.im, c.re));

    return { N, stages, magnitudes, phases };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
