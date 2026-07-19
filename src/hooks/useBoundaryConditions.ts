import { useState, useMemo } from 'react';

export interface BoundaryInputs {
  eps_r1: number;
  eps_r2: number;
  polarization: 'TM' | 'TE'; // TM = Parallel, TE = Perpendicular
}

export interface BoundaryOutputs {
  theta_c?: number; // Critical angle in degrees (if exists)
  theta_b: number; // Brewster angle in degrees
  plotData: { theta_i: number; gamma: number; tau: number }[];
}

export function useBoundaryConditions(initialInputs: BoundaryInputs) {
  const [inputs, setInputs] = useState<BoundaryInputs>(initialInputs);

  const outputs = useMemo<BoundaryOutputs>(() => {
    const { eps_r1, eps_r2, polarization } = inputs;
    
    // Assuming non-magnetic dielectrics mu_r = 1
    const n1 = Math.sqrt(eps_r1);
    const n2 = Math.sqrt(eps_r2);
    
    const eta1 = 1 / n1;
    const eta2 = 1 / n2;

    let theta_c: number | undefined;
    if (n1 > n2) {
      theta_c = Math.asin(n2 / n1) * (180 / Math.PI);
    }

    // Brewster's angle for non-magnetic dielectrics (TM polarization only has perfect 0 reflection)
    // but mathematically atan(n2/n1) gives the Brewster angle.
    const theta_b = Math.atan(n2 / n1) * (180 / Math.PI);

    const plotData = [];
    const points = 90;

    for (let i = 0; i <= points; i++) {
      const theta_i_deg = i;
      const theta_i = theta_i_deg * (Math.PI / 180);
      const sin_ti = Math.sin(theta_i);
      const cos_ti = Math.cos(theta_i);

      const sin_tt = (n1 / n2) * sin_ti;

      let gamma = 1;
      let tau = 0;

      if (sin_tt > 1) {
        // Total Internal Reflection
        gamma = 1;
        // Tau is complex, we'll just set magnitude for plotting purposes or leave as 0
        tau = 0;
      } else {
        const cos_tt = Math.sqrt(1 - sin_tt * sin_tt);
        
        if (polarization === 'TM') {
          gamma = (eta2 * cos_tt - eta1 * cos_ti) / (eta2 * cos_tt + eta1 * cos_ti);
          tau = (2 * eta2 * cos_ti) / (eta2 * cos_tt + eta1 * cos_ti);
        } else {
          // TE
          gamma = (eta2 * cos_ti - eta1 * cos_tt) / (eta2 * cos_ti + eta1 * cos_tt);
          tau = (2 * eta2 * cos_ti) / (eta2 * cos_ti + eta1 * cos_tt);
        }
      }

      plotData.push({
        theta_i: theta_i_deg,
        gamma,
        tau
      });
    }

    return { theta_c, theta_b, plotData };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
