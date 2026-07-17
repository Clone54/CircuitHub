import { useState, useMemo } from 'react';

export interface PlaneWaveInputs {
  f_MHz: number;
  eps_r: number;
  mu_r: number;
  sigma: number; // S/m
}

export interface PlaneWaveOutputs {
  lossTangent: number;
  classification: string;
  alpha: number; // Np/m
  beta: number; // rad/m
  delta: number; // m
  v: number; // m/s
  lambda: number; // m
  eta_mag: number; // Ohms
  eta_angle: number; // Degrees
  plotData: { z: number; E: number }[];
}

const EPSILON_0 = 8.8541878128e-12; // F/m
const MU_0 = 4 * Math.PI * 1e-7; // H/m

export function usePlaneWave(initialInputs: PlaneWaveInputs) {
  const [inputs, setInputs] = useState<PlaneWaveInputs>(initialInputs);

  const outputs = useMemo<PlaneWaveOutputs>(() => {
    const { f_MHz, eps_r, mu_r, sigma } = inputs;
    
    const f = f_MHz * 1e6;
    const omega = 2 * Math.PI * f;
    const eps = eps_r * EPSILON_0;
    const mu = mu_r * MU_0;

    let lossTangent = 0;
    if (omega > 0 && eps > 0) {
      lossTangent = sigma / (omega * eps);
    }

    let classification = "Unknown";
    if (lossTangent < 0.01) {
      classification = "Perfect Dielectric";
    } else if (lossTangent > 100) {
      classification = "Good Conductor";
    } else {
      classification = "Lossy Dielectric";
    }

    const term = Math.sqrt(1 + lossTangent * lossTangent);
    const multiplier = omega * Math.sqrt((mu * eps) / 2);

    const alpha = multiplier * Math.sqrt(term - 1);
    const beta = multiplier * Math.sqrt(term + 1);

    const delta = alpha > 0 ? 1 / alpha : Infinity;
    const v = beta > 0 ? omega / beta : 0;
    const lambda = beta > 0 ? (2 * Math.PI) / beta : 0;

    const eta_mag = Math.sqrt(mu / eps) / Math.pow(1 + lossTangent * lossTangent, 0.25);
    const eta_angle = 0.5 * Math.atan(lossTangent) * (180 / Math.PI); // degrees

    const plotData = [];
    const maxZ = alpha > 0 ? 5 * delta : (lambda > 0 ? 5 * lambda : 10);
    const points = 100;
    
    for (let i = 0; i <= points; i++) {
      const z = (i / points) * maxZ;
      const E = Math.exp(-alpha * z);
      plotData.push({ z, E });
    }

    return {
      lossTangent,
      classification,
      alpha,
      beta,
      delta,
      v,
      lambda,
      eta_mag,
      eta_angle,
      plotData
    };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
