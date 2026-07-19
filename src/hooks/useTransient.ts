import { useState, useMemo } from 'react';

export interface TransientInputs {
  type: 'series-rl' | 'series-rc' | 'series-rlc' | 'parallel-rlc';
  R: number; // Ohms
  L: number; // mH
  C: number; // uF
  Vs: number; // Volts (or Amps equivalent for parallel)
  v0: number; // Volts
  i0: number; // Amps
}

export interface TransientOutputs {
  dampingType: 'Overdamped' | 'Underdamped' | 'Critically Damped' | 'N/A';
  alpha: number;
  omega0: number;
  plotData: { t: number; value: number }[];
  yLabel: string;
}

export function useTransient(initialInputs: TransientInputs) {
  const [inputs, setInputs] = useState<TransientInputs>(initialInputs);

  const outputs = useMemo<TransientOutputs>(() => {
    const { type, R, Vs, v0, i0 } = inputs;
    const L = inputs.L * 1e-3; // H
    const C = inputs.C * 1e-6; // F

    let alpha = 0;
    let omega0 = 0;
    let dampingType: TransientOutputs['dampingType'] = 'N/A';
    let yLabel = 'Voltage / Current';

    // Calculate parameters
    if (type === 'series-rlc' || type === 'parallel-rlc') {
      omega0 = 1 / Math.sqrt(L * C);
      if (type === 'series-rlc') {
        alpha = R / (2 * L);
        yLabel = 'Capacitor Voltage v_c(t) [V]';
      } else {
        alpha = 1 / (2 * R * C);
        yLabel = 'Tank Voltage v(t) [V]';
      }

      if (alpha > omega0) dampingType = 'Overdamped';
      else if (alpha < omega0) dampingType = 'Underdamped';
      else dampingType = 'Critically Damped';
    } else if (type === 'series-rl') {
      alpha = R / L; // tau = 1/alpha
      yLabel = 'Inductor Current i_L(t) [A]';
    } else if (type === 'series-rc') {
      alpha = 1 / (R * C); // tau = 1/alpha
      yLabel = 'Capacitor Voltage v_c(t) [V]';
    }

    // Determine simulation time (approx 5 time constants or 5 periods)
    let tEnd = 0;
    if (type === 'series-rl' || type === 'series-rc') {
      tEnd = 5 / alpha;
    } else {
      if (dampingType === 'Underdamped') {
        tEnd = 5 / alpha; // 5 time constants of the envelope
        // limit if alpha is very small
        if (tEnd > 100 * (2 * Math.PI / omega0)) {
           tEnd = 20 * (2 * Math.PI / omega0);
        }
      } else {
        // Overdamped or critically damped
        const s1 = alpha - Math.sqrt(Math.abs(alpha * alpha - omega0 * omega0));
        // Use the slower pole for settling time
        tEnd = 5 / (s1 > 0 ? s1 : alpha);
      }
    }
    
    // Safety fallback
    if (!isFinite(tEnd) || tEnd <= 0) tEnd = 1;
    if (tEnd > 10) tEnd = 10; // Cap at 10 seconds to avoid huge loops if parameters are extreme

    // RK4 Solver
    const steps = 500;
    const dt = tEnd / steps;
    const plotData = [];

    let v_c = v0;
    let i_L = i0;

    const getDerivs = (v: number, i: number) => {
      let dv = 0;
      let di = 0;
      if (type === 'series-rlc') {
        di = (Vs - v - i * R) / L;
        dv = i / C;
      } else if (type === 'parallel-rlc') {
        const Is = Vs / R; // Norton equivalent current source
        dv = (Is - v / R - i) / C;
        di = v / L;
      } else if (type === 'series-rl') {
        di = (Vs - i * R) / L;
      } else if (type === 'series-rc') {
        dv = (Vs - v) / (R * C);
      }
      return { dv, di };
    };

    for (let i = 0; i <= steps; i++) {
      const t = i * dt;
      let value = 0;
      
      if (type === 'series-rc' || type === 'series-rlc' || type === 'parallel-rlc') {
        value = v_c;
      } else if (type === 'series-rl') {
        value = i_L;
      }
      
      plotData.push({ t: t * 1000, value }); // time in ms for plotting

      // RK4 step
      const k1 = getDerivs(v_c, i_L);
      const k2 = getDerivs(v_c + 0.5 * dt * k1.dv, i_L + 0.5 * dt * k1.di);
      const k3 = getDerivs(v_c + 0.5 * dt * k2.dv, i_L + 0.5 * dt * k2.di);
      const k4 = getDerivs(v_c + dt * k3.dv, i_L + dt * k3.di);

      v_c += (dt / 6) * (k1.dv + 2 * k2.dv + 2 * k3.dv + k4.dv);
      i_L += (dt / 6) * (k1.di + 2 * k2.di + 2 * k3.di + k4.di);
    }

    return {
      dampingType,
      alpha,
      omega0,
      plotData,
      yLabel
    };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
