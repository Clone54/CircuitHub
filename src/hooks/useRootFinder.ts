import { useState, useMemo } from 'react';
import * as math from 'mathjs';

export interface RootFinderInputs {
  expression: string;
  method: 'bisection' | 'newton';
  a: number;
  b: number;
  x0: number;
  tol: number;
  maxIter: number;
}

export function useRootFinder(initialInputs: RootFinderInputs) {
  const [inputs, setInputs] = useState<RootFinderInputs>(initialInputs);

  const outputs = useMemo(() => {
    let history: { iter: number, x: number, fx: number, err: number }[] = [];
    let plotData: { x: number, fx: number }[] = [];
    let errorStr = '';

    try {
      const { expression, method, a, b, x0, tol, maxIter } = inputs;
      const node = math.parse(expression);
      const code = node.compile();
      const f = (x: number) => code.evaluate({ x });
      
      let curX = 0;
      let minX = 0;
      let maxX = 0;

      if (method === 'bisection') {
        let left = a;
        let right = b;
        let fL = f(left);
        let fR = f(right);
        
        if (fL * fR > 0) {
          errorStr = 'f(a) and f(b) must have opposite signs.';
        } else {
          for (let i = 1; i <= maxIter; i++) {
            let mid = (left + right) / 2;
            let fMid = f(mid);
            let err = Math.abs(right - left) / 2;
            history.push({ iter: i, x: mid, fx: fMid, err });
            
            if (err < tol || Math.abs(fMid) < 1e-12) {
              break;
            }
            
            if (fL * fMid < 0) {
              right = mid;
              fR = fMid;
            } else {
              left = mid;
              fL = fMid;
            }
          }
        }
        minX = a - 1;
        maxX = b + 1;
      } else if (method === 'newton') {
        const derivNode = math.derivative(node, 'x');
        const derivCode = derivNode.compile();
        const df = (x: number) => derivCode.evaluate({ x });
        
        let x = x0;
        minX = x;
        maxX = x;
        
        for (let i = 1; i <= maxIter; i++) {
          let fx = f(x);
          let dfx = df(x);
          
          if (Math.abs(dfx) < 1e-12) {
            errorStr = 'Derivative is near zero.';
            break;
          }
          
          let xNext = x - fx / dfx;
          let err = Math.abs(xNext - x);
          history.push({ iter: i, x: xNext, fx: f(xNext), err });
          
          minX = Math.min(minX, xNext);
          maxX = Math.max(maxX, xNext);
          
          x = xNext;
          if (err < tol) break;
        }
        let range = Math.abs(maxX - minX);
        if (range < 1) range = 10;
        minX -= range * 0.5;
        maxX += range * 0.5;
      }

      // Generate plot data even if there's an error in bisection signs
      if (true) {
        // limit minX and maxX bounds to prevent too huge plots
        if (isNaN(minX) || !isFinite(minX)) minX = -10;
        if (isNaN(maxX) || !isFinite(maxX)) maxX = 10;
        minX = Math.max(minX, -100);
        maxX = Math.min(maxX, 100);
        
        // If range is 0, give it a default spread
        if (maxX <= minX) {
            minX = -10;
            maxX = 10;
        }

        const step = (maxX - minX) / 100;
        for (let x = minX; x <= maxX; x += step) {
          try {
            plotData.push({ x, fx: f(x) });
          } catch(e) {}
        }
      }
      
    } catch (e: any) {
      errorStr = e.message || 'Invalid equation';
    }

    return { history, plotData, errorStr };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
