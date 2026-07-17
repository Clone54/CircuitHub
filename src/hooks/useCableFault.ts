import { useState, useMemo } from 'react';

export interface CableFaultInputs {
  type: 'Murray' | 'Varley';
  L: number; // km
  r: number; // ohms/km
  P: number;
  Q: number;
  S: number;
}

export interface CableFaultOutputs {
  Lx: number;
  Rf: number; // resistance to fault
  error?: string;
}

export function useCableFault(initialInputs: CableFaultInputs) {
  const [inputs, setInputs] = useState<CableFaultInputs>(initialInputs);

  const outputs = useMemo<CableFaultOutputs>(() => {
    const { type, L, r, P, Q, S } = inputs;
    
    try {
      if (P + Q === 0) throw new Error('P + Q cannot be zero.');
      if (L <= 0) throw new Error('Length must be positive.');
      if (r <= 0) throw new Error('Resistance per km must be positive.');
      
      const R_total = 2 * L * r; 
      let Rf = 0;
      let Lx = 0;

      if (type === 'Murray') {
        Rf = R_total * (P / (P + Q));
      } else {
        Rf = (P * R_total - Q * S) / (P + Q);
      }

      Lx = Rf / r;
      if (Lx < 0 || Lx > L) {
         return { Lx: 0, Rf: 0, error: 'Calculated distance is out of bounds. Check inputs.' };
      }

      return { Lx, Rf };
    } catch (e: any) {
      return { Lx: 0, Rf: 0, error: e.message };
    }
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
