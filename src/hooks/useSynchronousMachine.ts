import { useState, useMemo } from 'react';

export interface SyncMachineInputs {
  type: 'Generator' | 'Motor';
  V_term: number;
  S_rated: number;
  Ra: number;
  Xs: number;
  PF: number;
  pfType: 'Lagging' | 'Leading' | 'Unity';
}

export function useSynchronousMachine(initialInputs: SyncMachineInputs) {
  const [inputs, setInputs] = useState<SyncMachineInputs>(initialInputs);

  const outputs = useMemo(() => {
    const { type, V_term, S_rated, Ra, Xs, PF, pfType } = inputs;
    
    let Vphase = V_term / Math.sqrt(3);
    let Ia_mag = (S_rated * 1e6) / (Math.sqrt(3) * V_term);
    let theta = Math.acos(PF);
    if (pfType === 'Leading') theta = -theta;
    if (pfType === 'Unity') theta = 0;
    
    // Complex number helpers
    const complexMul = (r1: number, i1: number, r2: number, i2: number) => [r1*r2 - i1*i2, r1*i2 + i1*r2];
    const complexAdd = (r1: number, i1: number, r2: number, i2: number) => [r1+r2, i1+i2];
    const complexSub = (r1: number, i1: number, r2: number, i2: number) => [r1-r2, i1-i2];
    const complexAbs = (r: number, i: number) => Math.sqrt(r*r + i*i);
    
    let Ia_re = Ia_mag * Math.cos(theta);
    let Ia_im = -Ia_mag * Math.sin(theta); // Current lags voltage for lagging PF
    if (pfType === 'Leading') Ia_im = Ia_mag * Math.sin(Math.abs(theta));
    
    let Z_re = Ra;
    let Z_im = Xs;
    
    let Ea_re = 0, Ea_im = 0;
    
    if (type === 'Generator') {
      // E = V + I*Z
      const [IZ_re, IZ_im] = complexMul(Ia_re, Ia_im, Z_re, Z_im);
      [Ea_re, Ea_im] = complexAdd(Vphase, 0, IZ_re, IZ_im);
    } else {
      // Motor: V = E + I*Z => E = V - I*Z (if I is into the motor)
      const [IZ_re, IZ_im] = complexMul(Ia_re, Ia_im, Z_re, Z_im);
      [Ea_re, Ea_im] = complexSub(Vphase, 0, IZ_re, IZ_im);
    }
    
    const Ea_mag = complexAbs(Ea_re, Ea_im);
    const Reg = ((Ea_mag - Vphase) / Vphase) * 100;
    
    // V-Curve Generation (Motor only typically, but we can do it for both conceptually)
    let vCurveData: { Ea: number, Ia: number, PF: number }[] = [];
    if (type === 'Motor') {
      const P_phase = (S_rated * 1e6 * PF) / 3;
      const Ia_real_fixed = P_phase / Vphase;
      
      for (let q_factor = -2; q_factor <= 2; q_factor += 0.1) {
        const Q_phase = P_phase * q_factor;
        const Ia_imag_var = -Q_phase / Vphase; // Reactive current
        
        const ia_m = complexAbs(Ia_real_fixed, Ia_imag_var);
        const [IZ_r, IZ_i] = complexMul(Ia_real_fixed, Ia_imag_var, Z_re, Z_im);
        const [E_r, E_i] = complexSub(Vphase, 0, IZ_r, IZ_i);
        const e_m = complexAbs(E_r, E_i);
        const pf_val = Ia_real_fixed / ia_m;
        
        vCurveData.push({ Ea: e_m, Ia: ia_m, PF: pf_val });
      }
      vCurveData.sort((a, b) => a.Ea - b.Ea);
    }

    return { Vphase, Ia_mag, Ea_mag, Reg, vCurveData };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
