import { useState, useMemo } from 'react';

export interface DielectricInputs {
  eps_r: number; // static relative permittivity
  eps_inf: number; // optical permittivity
  tau: number; // relaxation time (s)
  N: number; // number density (m^-3)
}

export interface DielectricOutputs {
  alpha: number; // polarizability (F m^2)
  plotData: { log_f: number; f: number; eps_real: number; eps_imag: number }[];
}

const EPSILON_0 = 8.854e-12; // F/m

export function useDielectrics(initialInputs: DielectricInputs) {
  const [inputs, setInputs] = useState<DielectricInputs>(initialInputs);

  const outputs = useMemo<DielectricOutputs>(() => {
    const { eps_r, eps_inf, tau, N } = inputs;

    // Clausius-Mossotti relation: (eps_r - 1)/(eps_r + 2) = N * alpha / (3 * eps_0)
    let alpha = 0;
    if (N > 0) {
      alpha = (3 * EPSILON_0 / N) * ((eps_r - 1) / (eps_r + 2));
    }

    // Debye relaxation: eps*(omega) = eps_inf + (eps_s - eps_inf)/(1 + j*omega*tau)
    const plotData = [];
    const minLogF = 3;
    const maxLogF = 12;
    const points = 100;

    for (let i = 0; i <= points; i++) {
      const log_f = minLogF + (i / points) * (maxLogF - minLogF);
      const f = Math.pow(10, log_f);
      const omega = 2 * Math.PI * f;
      
      const denominator = 1 + omega * omega * tau * tau;
      const eps_real = eps_inf + (eps_r - eps_inf) / denominator;
      const eps_imag = ((eps_r - eps_inf) * omega * tau) / denominator;

      plotData.push({
        log_f,
        f,
        eps_real,
        eps_imag
      });
    }

    return { alpha, plotData };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
