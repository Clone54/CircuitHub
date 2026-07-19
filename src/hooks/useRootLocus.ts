import { useState, useMemo } from 'react';

class Complex {
  constructor(public re: number, public im: number) {}
  add(c: Complex) { return new Complex(this.re + c.re, this.im + c.im); }
  sub(c: Complex) { return new Complex(this.re - c.re, this.im - c.im); }
  mul(c: Complex) { return new Complex(this.re * c.re - this.im * c.im, this.re * c.im + this.im * c.re); }
  div(c: Complex) {
    const den = c.re * c.re + c.im * c.im;
    return new Complex((this.re * c.re + this.im * c.im) / den, (this.im * c.re - this.re * c.im) / den);
  }
  abs() { return Math.sqrt(this.re * this.re + this.im * this.im); }
}

function evaluatePoly(coeffs: number[], s: Complex): Complex {
  let res = new Complex(0, 0);
  for (let i = 0; i < coeffs.length; i++) {
    res = res.mul(s).add(new Complex(coeffs[i], 0));
  }
  return res;
}

function findRoots(coeffs: number[]): Complex[] {
  let c = [...coeffs];
  while (c.length > 0 && Math.abs(c[0]) < 1e-9) c.shift();
  if (c.length <= 1) return [];
  const n = c.length - 1;
  const a = c.map(v => v / c[0]);
  
  let R = new Complex(0.4, 0.9);
  let roots: Complex[] = [];
  let cur = new Complex(1, 0);
  for (let i = 0; i < n; i++) {
    roots.push(cur);
    cur = cur.mul(R);
  }
  
  for (let iter = 0; iter < 100; iter++) {
    let maxDiff = 0;
    for (let i = 0; i < n; i++) {
      let num = evaluatePoly(a, roots[i]);
      let den = new Complex(1, 0);
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          den = den.mul(roots[i].sub(roots[j]));
        }
      }
      let diff = num.div(den);
      roots[i] = roots[i].sub(diff);
      maxDiff = Math.max(maxDiff, diff.abs());
    }
    if (maxDiff < 1e-6) break;
  }
  return roots;
}

export function useRootLocus(initialNum: string, initialDen: string) {
  const [inputs, setInputs] = useState({ numStr: initialNum, denStr: initialDen });

  const outputs = useMemo(() => {
    let rlData: { re: number, im: number, K: number }[] = [];
    let nyqData: { re: number, im: number, w: number }[] = [];
    let openLoopPoles: { re: number, im: number }[] = [];
    let openLoopZeros: { re: number, im: number }[] = [];
    
    try {
      const num = inputs.numStr.split(',').map(n => parseFloat(n.trim()));
      const den = inputs.denStr.split(',').map(n => parseFloat(n.trim()));
      
      openLoopPoles = findRoots(den).map(r => ({ re: r.re, im: r.im }));
      openLoopZeros = findRoots(num).map(r => ({ re: r.re, im: r.im }));
      
      const maxLen = Math.max(num.length, den.length);
      const paddedNum = [...Array(maxLen - num.length).fill(0), ...num];
      const paddedDen = [...Array(maxLen - den.length).fill(0), ...den];
      
      for (let i = 0; i <= 200; i++) {
        const K = (i / 200) * 100; // sweep K up to 100
        const charEq = [];
        for (let j = 0; j < maxLen; j++) {
          charEq.push(paddedDen[j] + K * paddedNum[j]);
        }
        const roots = findRoots(charEq);
        roots.forEach(r => rlData.push({ K, re: r.re, im: r.im }));
      }
      
      for (let w = -50; w <= 50; w += 0.2) {
        if (w === 0) w = 0.001;
        const s = new Complex(0, w);
        const n = evaluatePoly(num, s);
        const d = evaluatePoly(den, s);
        const g = n.div(d);
        if (g.abs() < 100) {
          nyqData.push({ w, re: g.re, im: g.im });
        }
      }
    } catch(e) {}
    
    return { rlData, nyqData, openLoopPoles, openLoopZeros };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
