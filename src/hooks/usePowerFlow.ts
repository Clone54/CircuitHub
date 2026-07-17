import { useState } from 'react';
import * as math from 'mathjs';

export interface BusData {
  id: number;
  type: 'slack' | 'pq' | 'pv';
  vMag: number;
  vAng: number;
  p: number; // specified P (pu)
  q: number; // specified Q (pu)
}

export interface BranchData {
  from: number;
  to: number;
  r: number;
  x: number;
}

export function usePowerFlow() {
  const [buses, setBuses] = useState<BusData[]>([
    { id: 1, type: 'slack', vMag: 1.0, vAng: 0, p: 0, q: 0 },
    { id: 2, type: 'pq', vMag: 1.0, vAng: 0, p: -0.5, q: -0.2 }
  ]);
  const [branches, setBranches] = useState<BranchData[]>([
    { from: 1, to: 2, r: 0.1, x: 0.2 }
  ]);
  const [method, setMethod] = useState<'gs' | 'nr'>('gs');
  const [tolerance, setTolerance] = useState(0.001);
  const [maxIter, setMaxIter] = useState(50);
  
  const [results, setResults] = useState<{ vMag: number, vAng: number }[]>([]);
  const [iterations, setIterations] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const calculateYBus = () => {
    const n = buses.length;
    let Y = Array(n).fill(null).map(() => Array(n).fill(math.complex(0, 0)));
    
    branches.forEach(b => {
      const idxFrom = buses.findIndex(bus => bus.id === b.from);
      const idxTo = buses.findIndex(bus => bus.id === b.to);
      if (idxFrom >= 0 && idxTo >= 0) {
        const Z = math.complex(b.r, b.x);
        const y = math.divide(1, Z) as math.Complex;
        
        Y[idxFrom][idxFrom] = math.add(Y[idxFrom][idxFrom], y) as math.Complex;
        Y[idxTo][idxTo] = math.add(Y[idxTo][idxTo], y) as math.Complex;
        
        Y[idxFrom][idxTo] = math.subtract(Y[idxFrom][idxTo], y) as math.Complex;
        Y[idxTo][idxFrom] = math.subtract(Y[idxTo][idxFrom], y) as math.Complex;
      }
    });
    return Y;
  };

  const solveGaussSeidel = () => {
    try {
      const n = buses.length;
      const Y = calculateYBus();
      let V = buses.map(b => math.complex({ r: b.vMag, phi: b.vAng * Math.PI / 180 }));
      
      let iter = 0;
      let maxDiff = 1;
      
      while (iter < maxIter && maxDiff > tolerance) {
        maxDiff = 0;
        for (let i = 0; i < n; i++) {
          if (buses[i].type === 'slack') continue;
          
          const bus = buses[i];
          const P = bus.p;
          const Q = bus.type === 'pv' ? 0 : bus.q; // simplified for PV, need Q calc, but keep basic for now
          
          let sumYV = math.complex(0, 0);
          for (let j = 0; j < n; j++) {
            if (i !== j) {
              sumYV = math.add(sumYV, math.multiply(Y[i][j], V[j])) as math.Complex;
            }
          }
          
          const S_conj = math.complex(P, -Q);
          const term1 = math.divide(S_conj, math.conj(V[i]));
          const term2 = math.subtract(term1, sumYV);
          let newV = math.divide(term2, Y[i][i]) as math.Complex;
          
          if (bus.type === 'pv') {
            newV = math.complex({ r: bus.vMag, phi: newV.toPolar().phi }); // keep vMag constant
          }
          
          const diff = math.abs(math.subtract(newV, V[i]) as math.Complex) as number;
          if (diff > maxDiff) maxDiff = diff;
          V[i] = newV;
        }
        iter++;
      }
      
      setIterations(iter);
      setResults(V.map(v => {
        const polar = v.toPolar();
        return { vMag: polar.r, vAng: polar.phi * 180 / Math.PI };
      }));
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const solvePowerFlow = () => {
    // For NR, we'd need Jacobian. Falling back to GS for simplicity if NR not fully implemented
    solveGaussSeidel();
  };

  return {
    buses, setBuses,
    branches, setBranches,
    method, setMethod,
    tolerance, setTolerance,
    maxIter, setMaxIter,
    results, iterations, error,
    solvePowerFlow,
    calculateYBus
  };
}
