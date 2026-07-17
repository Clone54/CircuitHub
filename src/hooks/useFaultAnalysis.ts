import { useState, useMemo } from 'react';
import * as math from 'mathjs';

export type FaultType = 'L-G' | 'L-L' | 'L-L-G' | '3-Phase';

export interface SequenceData {
  z1_r: number; z1_x: number;
  z2_r: number; z2_x: number;
  z0_r: number; z0_x: number;
  zf_r: number; zf_x: number;
}

export function useFaultAnalysis() {
  const [faultType, setFaultType] = useState<FaultType>('L-G');
  const [seq, setSeq] = useState<SequenceData>({
    z1_r: 0, z1_x: 0.2,
    z2_r: 0, z2_x: 0.2,
    z0_r: 0, z0_x: 0.05,
    zf_r: 0, zf_x: 0
  });
  
  const results = useMemo(() => {
    const Vf = math.complex(1, 0); // 1 pu voltage
    const Z1 = math.complex(seq.z1_r, seq.z1_x);
    const Z2 = math.complex(seq.z2_r, seq.z2_x);
    const Z0 = math.complex(seq.z0_r, seq.z0_x);
    const Zf = math.complex(seq.zf_r, seq.zf_x);
    
    let I1: math.Complex, I2: math.Complex, I0: math.Complex;
    let desc = "";
    
    if (faultType === '3-Phase') {
      const denom = math.add(Z1, Zf);
      I1 = math.divide(Vf, denom) as math.Complex;
      I2 = math.complex(0, 0);
      I0 = math.complex(0, 0);
      desc = "Positive sequence network only.";
    } else if (faultType === 'L-G') {
      const Zeq = math.add(math.add(Z1, Z2), math.add(Z0, math.multiply(3, Zf)));
      I1 = math.divide(Vf, Zeq) as math.Complex;
      I2 = I1;
      I0 = I1;
      desc = "Sequence networks in series.";
    } else if (faultType === 'L-L') {
      const Zeq = math.add(math.add(Z1, Z2), Zf);
      I1 = math.divide(Vf, Zeq) as math.Complex;
      I2 = math.multiply(I1, -1) as math.Complex;
      I0 = math.complex(0, 0);
      desc = "Positive and Negative sequence networks in parallel.";
    } else {
      // L-L-G
      const Zp = math.divide(math.multiply(Z2, math.add(Z0, math.multiply(3, Zf))), math.add(math.add(Z2, Z0), math.multiply(3, Zf)));
      const Zeq = math.add(Z1, Zp);
      I1 = math.divide(Vf, Zeq) as math.Complex;
      
      const v2 = math.subtract(Vf, math.multiply(I1, Z1));
      I2 = math.divide(math.multiply(v2, -1), Z2) as math.Complex;
      I0 = math.divide(math.multiply(v2, -1), math.add(Z0, math.multiply(3, Zf))) as math.Complex;
      desc = "All sequence networks in parallel.";
    }
    
    // a = 1 \angle 120, a^2 = 1 \angle 240
    const a = math.complex({ r: 1, phi: 120 * Math.PI / 180 });
    const a2 = math.complex({ r: 1, phi: 240 * Math.PI / 180 });
    
    const Ia = math.add(math.add(I0, I1), I2) as math.Complex;
    const Ib = math.add(math.add(I0, math.multiply(a2, I1)), math.multiply(a, I2)) as math.Complex;
    const Ic = math.add(math.add(I0, math.multiply(a, I1)), math.multiply(a2, I2)) as math.Complex;
    
    return { I0, I1, I2, Ia, Ib, Ic, desc };
  }, [faultType, seq]);

  return {
    faultType, setFaultType,
    seq, setSeq,
    results
  };
}
