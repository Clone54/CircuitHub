import { useState, useMemo } from 'react';

export interface DCStarterInputs {
  V: number;
  Ra: number;
  I_max: number;
  I_min: number;
}

export interface DCStarterOutputs {
  n: number;
  alpha: number;
  sections: { step: number; r: number; R_total: number }[];
}

export function useDCStarter(initialInputs: DCStarterInputs) {
  const [inputs, setInputs] = useState<DCStarterInputs>(initialInputs);

  const outputs = useMemo<DCStarterOutputs>(() => {
    const { V, Ra, I_max, I_min } = inputs;
    
    if (I_min <= 0 || I_max <= I_min || Ra <= 0 || V <= 0) {
      return { n: 0, alpha: 0, sections: [] };
    }

    const alpha_initial = I_max / I_min;
    const R1 = V / I_max;

    // Calculate theoretical n
    // alpha^(n-1) = R1 / Ra => (n-1) = ln(R1/Ra) / ln(alpha)
    const n_theoretical = 1 + Math.log(R1 / Ra) / Math.log(alpha_initial);
    
    // Round to nearest integer for practical number of studs
    const n = Math.ceil(n_theoretical);

    // Recalculate alpha to fit exact n
    // alpha^(n-1) = R1 / Ra => alpha = (R1 / Ra)^(1/(n-1))
    let alpha = alpha_initial;
    if (n > 1) {
       alpha = Math.pow(R1 / Ra, 1 / (n - 1));
    }

    const sections = [];
    let current_R = R1;
    for (let m = 1; m < n; m++) {
      const next_R = current_R / alpha;
      const r_section = current_R - next_R;
      sections.push({
        step: m,
        r: r_section,
        R_total: current_R
      });
      current_R = next_R;
    }
    
    // Last step is just the armature resistance
    sections.push({
      step: n,
      r: 0, // No external resistor section added at the final stud (it's cut out)
      R_total: Ra
    });

    return { n, alpha, sections };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
