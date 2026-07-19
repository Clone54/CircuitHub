import { useMemo, useState } from 'react';

export interface SwingSimulationPoint {
  time: number;
  deltaDeg: number;
  omegaDeviation: number;
  pe: number;
  pm: number;
}

export interface UseSwingEquationRK4Params {
  initialPm?: number;
  initialPmax1?: number;
  initialPmax2?: number;
  initialPmax3?: number;
  initialH?: number;
  initialD?: number;
  initialTf?: number;
  initialTc?: number;
  initialF0?: number;
}

export function useSwingEquationRK4({
  initialPm = 0.8,
  initialPmax1 = 1.8,
  initialPmax2 = 0.4,
  initialPmax3 = 1.4,
  initialH = 4.0,
  initialD = 0.05,
  initialTf = 0.1,
  initialTc = 0.35,
  initialF0 = 50
}: UseSwingEquationRK4Params = {}) {
  const [pm, setPm] = useState<number>(initialPm);
  const [pmax1, setPmax1] = useState<number>(initialPmax1);
  const [pmax2, setPmax2] = useState<number>(initialPmax2);
  const [pmax3, setPmax3] = useState<number>(initialPmax3);
  const [H, setH] = useState<number>(initialH);
  const [D, setD] = useState<number>(initialD);
  const [tf, setTf] = useState<number>(initialTf);
  const [tc, setTc] = useState<number>(initialTc);
  const [f0, setF0] = useState<number>(initialF0);

  const simulationResult = useMemo(() => {
    // 1. Calculate initial rotor angle delta0
    // Pm = Pmax1 * sin(delta0) => delta0 = arcsin(Pm/Pmax1)
    let delta0 = 0.5236; // Default to 30 degrees (0.5236 rad) if invalid
    let isInitialStable = true;

    if (pm <= pmax1 && pmax1 > 0) {
      delta0 = Math.asin(pm / pmax1);
    } else {
      isInitialStable = false;
      delta0 = Math.PI / 2; // fall back to 90 degrees
    }

    // Run simulation
    const tMax = 5.0;
    const dt = 0.01;
    const points: SwingSimulationPoint[] = [];

    let t = 0.0;
    let delta = delta0;
    let domega = 0.0; // speed deviation (rad/s)

    let isUnstable = false;
    let instabilityTime: number | null = null;

    // Define derivative helper
    // dy/dt = f(t, y) where y = [delta, domega]
    const getDerivatives = (currentTime: number, currentDelta: number, currentDomega: number) => {
      // Determine active electrical power P_e
      let activePmax = pmax1;
      if (currentTime >= tf && currentTime < tc) {
        activePmax = pmax2;
      } else if (currentTime >= tc) {
        activePmax = pmax3;
      }

      const pe = activePmax * Math.sin(currentDelta);
      
      // Swing equation:
      // d(delta)/dt = domega
      // d(domega)/dt = (pi * f0 / H) * (Pm - Pe - D * domega)
      const dDelta_dt = currentDomega;
      
      // Prevent division by zero
      const inertiaTerm = H > 0 ? (Math.PI * f0) / H : 0;
      const dDomega_dt = inertiaTerm * (pm - pe - D * currentDomega);

      return { dDelta_dt, dDomega_dt, pe };
    };

    // Integrate using RK4
    const totalSteps = Math.round(tMax / dt);
    for (let i = 0; i <= totalSteps; i++) {
      // Record point
      const deltaDeg = (delta * 180) / Math.PI;
      
      // Determine current Pe for reporting
      let currentPmax = pmax1;
      if (t >= tf && t < tc) {
        currentPmax = pmax2;
      } else if (t >= tc) {
        currentPmax = pmax3;
      }
      const currentPe = currentPmax * Math.sin(delta);

      points.push({
        time: parseFloat(t.toFixed(2)),
        deltaDeg: parseFloat(deltaDeg.toFixed(2)),
        omegaDeviation: parseFloat(domega.toFixed(4)),
        pe: parseFloat(currentPe.toFixed(4)),
        pm: parseFloat(pm.toFixed(4))
      });

      // Check for transient instability
      // Typically, if rotor angle exceeds 180 degrees, it has pulled out of synchronism
      if (!isUnstable && deltaDeg > 180.0) {
        isUnstable = true;
        instabilityTime = t;
      }

      // If angle is excessively large, cap integration to avoid NaN explosion, but continue plotting
      if (deltaDeg > 360.0) {
        // Continue recording flat-lined or ramped values so chart doesn't break
        delta = 2.0 * Math.PI; // Cap representation
        domega = 0.0;
      }

      // RK4 integration step
      const k1 = getDerivatives(t, delta, domega);
      
      const t_half = t + 0.5 * dt;
      const delta_k2 = delta + 0.5 * dt * k1.dDelta_dt;
      const domega_k2 = domega + 0.5 * dt * k1.dDomega_dt;
      const k2 = getDerivatives(t_half, delta_k2, domega_k2);

      const delta_k3 = delta + 0.5 * dt * k2.dDelta_dt;
      const domega_k3 = domega + 0.5 * dt * k2.dDomega_dt;
      const k3 = getDerivatives(t_half, delta_k3, domega_k3);

      const t_next = t + dt;
      const delta_k4 = delta + dt * k3.dDelta_dt;
      const domega_k4 = domega + dt * k3.dDomega_dt;
      const k4 = getDerivatives(t_next, delta_k4, domega_k4);

      delta = delta + (dt / 6.0) * (k1.dDelta_dt + 2 * k2.dDelta_dt + 2 * k3.dDelta_dt + k4.dDelta_dt);
      domega = domega + (dt / 6.0) * (k1.dDomega_dt + 2 * k2.dDomega_dt + 2 * k3.dDomega_dt + k4.dDomega_dt);
      t += dt;
    }

    // Determine equal area stability criterion parameters
    // Critical clearing angle (delta_cr)
    // cos(delta_cr) = (Pm * (delta_max - delta_0) - Pmax2*cos(delta_0) + Pmax3*cos(delta_max)) / (Pmax3 - Pmax2)
    // (Note: this is a theoretical estimate for standard fault clearing problems)
    let deltaMaxRad = Math.PI - Math.asin(pm / pmax3);
    let deltaCrDeg: number | null = null;
    if (pm <= pmax3 && pmax3 > pmax2) {
      const num = pm * (deltaMaxRad - delta0) - pmax2 * Math.cos(delta0) + pmax3 * Math.cos(deltaMaxRad);
      const den = pmax3 - pmax2;
      const cosDeltaCr = num / den;
      if (Math.abs(cosDeltaCr) <= 1.0) {
        deltaCrDeg = (Math.acos(cosDeltaCr) * 180) / Math.PI;
      }
    }

    return {
      points,
      isInitialStable,
      isUnstable,
      instabilityTime: instabilityTime !== null ? parseFloat(instabilityTime.toFixed(3)) : null,
      delta0Deg: parseFloat(((delta0 * 180) / Math.PI).toFixed(1)),
      deltaMaxDeg: parseFloat(((deltaMaxRad * 180) / Math.PI).toFixed(1)),
      deltaCrDeg: deltaCrDeg !== null ? parseFloat(deltaCrDeg.toFixed(1)) : null
    };
  }, [pm, pmax1, pmax2, pmax3, H, D, tf, tc, f0]);

  return {
    pm,
    setPm,
    pmax1,
    setPmax1,
    pmax2,
    setPmax2,
    pmax3,
    setPmax3,
    H,
    setH,
    D,
    setD,
    tf,
    setTf,
    tc,
    setTc,
    f0,
    setF0,
    simulationResult
  };
}
