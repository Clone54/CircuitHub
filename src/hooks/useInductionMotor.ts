import { useState, useMemo } from 'react';

export interface InductionInputs {
  V_nl: number;
  I_nl: number;
  P_nl: number;
  V_br: number;
  I_br: number;
  P_br: number;
  R1: number;
  P: number;
  f: number;
  R_ext: number;
}

export function useInductionMotor(initialInputs: InductionInputs) {
  const [inputs, setInputs] = useState<InductionInputs>(initialInputs);

  const outputs = useMemo(() => {
    let Rc = 0, Xm = 0, Req = 0, Xeq = 0, R2 = 0, X2 = 0, X1 = 0;
    let plotData: { N: number, Torque: number }[] = [];
    
    try {
      const { V_nl, I_nl, P_nl, V_br, I_br, P_br, R1, P, f, R_ext } = inputs;
      
      // No-load (assume Y connected, per-phase)
      const V1_nl = V_nl / Math.sqrt(3);
      const P1_nl = P_nl / 3;
      
      // Core loss (approx)
      const P_core = Math.max(0.1, P1_nl - (I_nl * I_nl * R1));
      Rc = (V1_nl * V1_nl) / P_core;
      
      const S1_nl = V1_nl * I_nl;
      const Q1_nl = Math.sqrt(Math.max(0, S1_nl * S1_nl - P1_nl * P1_nl));
      Xm = (V1_nl * V1_nl) / Math.max(0.1, Q1_nl);
      
      // Blocked-rotor
      const V1_br = V_br / Math.sqrt(3);
      const P1_br = P_br / 3;
      
      const Zeq = V1_br / Math.max(0.001, I_br);
      Req = P1_br / Math.max(0.001, I_br * I_br);
      Xeq = Math.sqrt(Math.max(0, Zeq * Zeq - Req * Req));
      
      R2 = Math.max(0.001, Req - R1);
      X1 = Xeq / 2;
      X2 = Xeq / 2;
      
      const Ns = 120 * f / P;
      const ws = 2 * Math.PI * Ns / 60;
      
      const V_th = V1_nl * (Xm / (X1 + Xm));
      const Z_th_sq = (R1 * (Xm / (X1 + Xm))) ** 2 + (X1 * (Xm / (X1 + Xm))) ** 2;
      
      // Torque-speed curve
      const steps = 100;
      for (let i = 0; i < steps; i++) {
        const N = (i / steps) * Ns;
        const s = Math.max(0.0001, (Ns - N) / Ns);
        
        const Rr = R2 + R_ext;
        
        // Simplified circuit calculation
        const den = Math.pow(R1 + Rr/s, 2) + Math.pow(X1 + X2, 2);
        const I2_sq = (V1_nl * V1_nl) / den;
        
        const Torque = (3 / ws) * I2_sq * (Rr / s);
        
        plotData.push({ N, Torque });
      }
      
    } catch (err) {
      console.error(err);
    }
    
    return { Rc, Xm, Req, Xeq, R2, X2, plotData };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
