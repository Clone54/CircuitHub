import { useState, useMemo } from 'react';

export interface ReferenceFrameInputs {
  amplitude: number;     // I_m (A)
  frequency: number;     // f (Hz)
  theta: number;         // Rotor Angle (degrees, 0-360)
  phiMode: 'd-axis' | 'q-axis' | 'manual';
  phiManual: number;     // Manual Phase Angle (degrees, 0-360)
}

export function useReferenceFrame(initialInputs: ReferenceFrameInputs) {
  const [inputs, setInputs] = useState<ReferenceFrameInputs>(initialInputs);

  const outputs = useMemo(() => {
    const { amplitude, frequency, theta, phiMode, phiManual } = inputs;

    // Convert angles to radians
    const thetaRad = (theta * Math.PI) / 180;
    
    // Determine current phase angle phi of the stator current vector
    let phi = phiManual;
    if (phiMode === 'd-axis') {
      phi = theta;
    } else if (phiMode === 'q-axis') {
      phi = theta + 90;
    }
    const phiRad = (phi * Math.PI) / 180;

    // Calculate instantaneous currents at angle phi
    const Ia = amplitude * Math.cos(phiRad);
    const Ib = amplitude * Math.cos(phiRad - (2 * Math.PI) / 3);
    const Ic = amplitude * Math.cos(phiRad + (2 * Math.PI) / 3);

    // Clarke Transformation
    const I_alpha = (2 / 3) * (Ia - 0.5 * Ib - 0.5 * Ic);
    const I_beta = (1 / Math.sqrt(3)) * (Ib - Ic);

    // Park Transformation
    const I_d = I_alpha * Math.cos(thetaRad) + I_beta * Math.sin(thetaRad);
    const I_q = -I_alpha * Math.sin(thetaRad) + I_beta * Math.cos(thetaRad);

    // Generate time series for the time domain plot over one full AC cycle T = 1/f
    const T = frequency > 0 ? 1 / frequency : 0.02;
    const timeData = [];
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * T;
      const omega = 2 * Math.PI * (frequency > 0 ? frequency : 50);
      const angle = omega * t;
      
      const ia_t = amplitude * Math.cos(angle);
      const ib_t = amplitude * Math.cos(angle - (2 * Math.PI) / 3);
      const ic_t = amplitude * Math.cos(angle + (2 * Math.PI) / 3);

      const ialpha_t = (2 / 3) * (ia_t - 0.5 * ib_t - 0.5 * ic_t);
      const ibeta_t = (1 / Math.sqrt(3)) * (ib_t - ic_t);

      // In stationary park, rotor angle is fixed:
      const id_stationary = ialpha_t * Math.cos(thetaRad) + ibeta_t * Math.sin(thetaRad);
      const iq_stationary = -ialpha_t * Math.sin(thetaRad) + ibeta_t * Math.cos(thetaRad);

      timeData.push({
        time: t * 1000, // ms
        angleDeg: parseFloat(((angle * 180) / Math.PI % 360).toFixed(1)),
        Ia: parseFloat(ia_t.toFixed(2)),
        Ib: parseFloat(ib_t.toFixed(2)),
        Ic: parseFloat(ic_t.toFixed(2)),
        I_alpha: parseFloat(ialpha_t.toFixed(2)),
        I_beta: parseFloat(ibeta_t.toFixed(2)),
        I_d: parseFloat(id_stationary.toFixed(2)),
        I_q: parseFloat(iq_stationary.toFixed(2)),
      });
    }

    // Generate circle trajectory data for space vector (36 points)
    const trajectoryData = [];
    for (let i = 0; i <= 360; i += 10) {
      const rad = (i * Math.PI) / 180;
      trajectoryData.push({
        alpha: parseFloat((amplitude * Math.cos(rad)).toFixed(2)),
        beta: parseFloat((amplitude * Math.sin(rad)).toFixed(2)),
      });
    }

    return {
      phi,
      Ia,
      Ib,
      Ic,
      I_alpha,
      I_beta,
      I_d,
      I_q,
      timeData,
      trajectoryData,
    };
  }, [inputs]);

  return {
    inputs,
    setInputs,
    outputs,
  };
}
