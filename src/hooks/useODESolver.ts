import { useState, useMemo } from 'react';
import * as math from 'mathjs';

export interface ODESolverInputs {
  expression: string;
  x0: number;
  y0: number;
  xEnd: number;
  h: number;
}

export function useODESolver(initialInputs: ODESolverInputs) {
  const [inputs, setInputs] = useState<ODESolverInputs>(initialInputs);

  const outputs = useMemo(() => {
    let plotData: { x: number, yEuler: number, yRK4: number }[] = [];
    let errorStr = '';

    try {
      const { expression, x0, y0, xEnd, h } = inputs;
      const node = math.parse(expression);
      const code = node.compile();
      const f = (x: number, y: number) => code.evaluate({ x, y });
      
      let x = x0;
      let yE = y0;
      let yR = y0;
      
      plotData.push({ x, yEuler: yE, yRK4: yR });
      
      if (h <= 0) throw new Error("Step size must be > 0");
      if (xEnd < x0 && h > 0) throw new Error("xEnd must be >= x0 for positive h");
      
      const maxSteps = 10000;
      let steps = 0;
      
      while (x < xEnd - 1e-9 && steps < maxSteps) {
        // Euler
        let fE = f(x, yE);
        yE = yE + h * fE;
        
        // RK4
        let k1 = f(x, yR);
        let k2 = f(x + h/2, yR + h*k1/2);
        let k3 = f(x + h/2, yR + h*k2/2);
        let k4 = f(x + h, yR + h*k3);
        
        yR = yR + (h/6) * (k1 + 2*k2 + 2*k3 + k4);
        
        x = x + h;
        plotData.push({ x, yEuler: yE, yRK4: yR });
        steps++;
      }
      
    } catch (e: any) {
      errorStr = e.message || 'Invalid ODE equation';
    }

    return { plotData, errorStr };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
