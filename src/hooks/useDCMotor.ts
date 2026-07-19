import { useState, useMemo } from 'react';

export interface DCMotorInputs {
  type: 'Shunt' | 'Series' | 'Compound';
  V: number;
  Ra: number;
  Rf: number; // Rsh for Shunt, Rse for Series, Rsh for Compound (Assume Rse is included in Ra for compound)
  N_rated: number;
  I_rated: number;
}

export interface DCMotorOutputs {
  plotData: { Ia: number; N: number; T: number }[];
}

export function useDCMotor(initialInputs: DCMotorInputs) {
  const [inputs, setInputs] = useState<DCMotorInputs>(initialInputs);

  const outputs = useMemo<DCMotorOutputs>(() => {
    const { type, V, Ra, Rf, N_rated, I_rated } = inputs;
    
    let Ish = 0;
    let Ia_rated = I_rated;
    
    if (type === 'Shunt' || type === 'Compound') {
      Ish = Rf > 0 ? V / Rf : 0;
      Ia_rated = I_rated - Ish;
    }

    const omega_rated = N_rated * (2 * Math.PI) / 60;
    
    // E_rated = V - Ia_rated * R_total
    const R_total = type === 'Series' ? (Ra + Rf) : Ra;
    const E_rated = V - Ia_rated * R_total;

    // KPhi = E / omega
    let KPhi_rated = E_rated / (omega_rated || 1);

    const plotData = [];
    const maxIa = Ia_rated * 1.25;
    const points = 50;

    for (let i = 1; i <= points; i++) {
      const Ia = (i / points) * maxIa;
      let KPhi = KPhi_rated;

      if (type === 'Series') {
        // Assume linear relation between Flux and Ia before saturation
        // KPhi = c * Ia. c = KPhi_rated / Ia_rated
        const c = KPhi_rated / (Ia_rated || 1);
        KPhi = c * Ia;
      } else if (type === 'Compound') {
        // Cumulative compound: Flux increases slightly with Ia
        // KPhi = KPhi_shunt + c * Ia
        // Let's assume series field adds 20% flux at full load
        const KPhi_shunt = KPhi_rated / 1.2;
        const c = (0.2 * KPhi_shunt) / (Ia_rated || 1);
        KPhi = KPhi_shunt + c * Ia;
      }

      const E = V - Ia * R_total;
      let omega = E / (KPhi || 0.001);
      
      // Prevent infinite speed at zero current for series motor
      if (type === 'Series' && Ia < Ia_rated * 0.1) {
          omega = (V - (Ia_rated * 0.1) * R_total) / (KPhi_rated * 0.1);
      }

      const N = omega * 60 / (2 * Math.PI);
      const T = KPhi * Ia;

      plotData.push({ Ia, N: Math.max(0, N), T: Math.max(0, T) });
    }

    return { plotData };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
