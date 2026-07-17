import { useState, useMemo } from 'react';

class Complex {
  re: number;
  im: number;
  constructor(re: number, im: number) {
    this.re = re;
    this.im = im;
  }
  add(c: Complex) { return new Complex(this.re + c.re, this.im + c.im); }
  sub(c: Complex) { return new Complex(this.re - c.re, this.im - c.im); }
  mul(c: Complex) { return new Complex(this.re * c.re - this.im * c.im, this.re * c.im + this.im * c.re); }
  div(c: Complex) {
    const denom = c.re * c.re + c.im * c.im;
    return new Complex((this.re * c.re + this.im * c.im) / denom, (this.im * c.re - this.re * c.im) / denom);
  }
  mag() { return Math.sqrt(this.re * this.re + this.im * this.im); }
}

function findRoots(coeffs: number[]): Complex[] {
  // Remove leading zeros
  while (coeffs.length > 0 && Math.abs(coeffs[0]) < 1e-12) {
    coeffs.shift();
  }
  if (coeffs.length <= 1) return [];

  const n = coeffs.length - 1;
  const a = coeffs.map(c => c / coeffs[0]); // normalize

  const evalPoly = (z: Complex) => {
    let res = new Complex(a[0], 0);
    for (let i = 1; i <= n; i++) {
      res = res.mul(z).add(new Complex(a[i], 0));
    }
    return res;
  };

  // Initial guesses: powers of a complex number close to unit circle
  let roots = [];
  const init = new Complex(0.4, 0.9);
  let current = new Complex(1, 0);
  for (let i = 0; i < n; i++) {
    roots.push(current);
    current = current.mul(init);
  }

  const maxIter = 1000;
  for (let iter = 0; iter < maxIter; iter++) {
    let maxDiff = 0;
    const nextRoots = [];
    for (let i = 0; i < n; i++) {
      let denom = new Complex(1, 0);
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          denom = denom.mul(roots[i].sub(roots[j]));
        }
      }
      const p = evalPoly(roots[i]);
      const diff = p.div(denom);
      const nextRoot = roots[i].sub(diff);
      maxDiff = Math.max(maxDiff, diff.mag());
      nextRoots.push(nextRoot);
    }
    roots = nextRoots;
    if (maxDiff < 1e-10) break;
  }

  return roots;
}

export interface PoleZeroInputs {
  domain: 's' | 'z';
  numStr: string;
  denStr: string;
}

export interface PoleZeroOutputs {
  zeros: Complex[];
  poles: Complex[];
  stability: string;
  error?: string;
  plotData: { re: number; im: number; type: 'Zero' | 'Pole' }[];
}

export function usePoleZero(initialInputs: PoleZeroInputs) {
  const [inputs, setInputs] = useState<PoleZeroInputs>(initialInputs);

  const outputs = useMemo<PoleZeroOutputs>(() => {
    const { domain, numStr, denStr } = inputs;
    
    try {
      const parseCoeffs = (str: string) => {
        const parts = str.split(',').map(s => parseFloat(s.trim()));
        if (parts.some(isNaN)) throw new Error('Invalid coefficients');
        return parts;
      };

      const numCoeffs = parseCoeffs(numStr);
      const denCoeffs = parseCoeffs(denStr);

      const zeros = findRoots(numCoeffs);
      const poles = findRoots(denCoeffs);

      let isStable = true;
      let isMarginal = false;

      poles.forEach(p => {
        if (domain === 's') {
          if (p.re > 1e-6) isStable = false;
          else if (Math.abs(p.re) <= 1e-6) isMarginal = true;
        } else {
          const mag = p.mag();
          if (mag > 1.000001) isStable = false;
          else if (Math.abs(mag - 1) <= 1e-6) isMarginal = true;
        }
      });

      let stability = 'Stable';
      if (!isStable) {
        stability = 'Unstable';
      } else if (isMarginal) {
        stability = 'Marginally Stable';
      }

      if (poles.length === 0) {
          stability = 'Stable (FIR / No Poles)';
      }

      const plotData = [
        ...zeros.map(z => ({ re: z.re, im: z.im, type: 'Zero' as const })),
        ...poles.map(p => ({ re: p.re, im: p.im, type: 'Pole' as const }))
      ];

      return { zeros, poles, stability, plotData };
    } catch (e: any) {
      return { zeros: [], poles: [], stability: 'Error', error: e.message, plotData: [] };
    }
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
