import { useState, useMemo } from 'react';

export interface LFCDataPoint {
  time: number;
  frequency: number; // in Hz
  deviation: number; // in Hz
  primarySettle: number; // Primary-only frequency limit for comparison
}

export function useLFCDynamics() {
  // Inputs
  const [stepLoad, setStepLoad] = useState<number>(0.08); // ΔP_L in p.u. (0.01 to 0.15)
  const [inertia, setInertia] = useState<number>(4.0); // H in seconds (2.0 to 8.0)
  const [damping, setDamping] = useState<number>(1.2); // D in p.u. (0.5 to 3.0)
  const [droop, setDroop] = useState<number>(0.05); // R in p.u. (2% to 8%, i.e., 0.02 to 0.08)
  const [secondaryControl, setSecondaryControl] = useState<boolean>(true); // Integral (AGC) on/off

  // Compute LFC time-series
  const chartData = useMemo(() => {
    const data: LFCDataPoint[] = [];
    const baseFreq = 50.0; // Base Grid frequency (50 Hz)
    
    // R is droop. 1/R is governor gain.
    const R_val = droop;
    const D_val = damping;
    const H_val = inertia;

    // Beta = D + 1/R (Area Frequency Response Characteristic)
    const beta = D_val + 1 / R_val;
    
    // Steady state deviation for primary control only (p.u.)
    const deltaF_ss_pu = -stepLoad / beta;
    const deltaF_ss_hz = deltaF_ss_pu * baseFreq; // Convert to Hz

    // Simulation settings
    const maxTime = 40; // seconds
    const timeStep = 0.5; // seconds

    // Analytical parameters for Governor + Turbine + Inertia model
    // High inertia H -> slower response, less steep nadir but longer settling time
    // High damping D -> smaller steady state error, faster dampening
    // Lower droop R -> smaller steady-state error
    const wn = Math.sqrt(beta / (2 * H_val)) * 1.3; // natural frequency approximation
    const zeta = (D_val + 0.8) / (2 * Math.sqrt(2 * H_val * beta)) * 1.2; // damping ratio approximation
    const wd = wn * Math.sqrt(Math.max(0.1, 1 - zeta * zeta));

    for (let t = 0; t <= maxTime; t += timeStep) {
      // 1. Calculate Primary Control Only path
      // Analytical step response of standard second-order-like LFC
      const cosTerm = Math.cos(wd * t);
      const sinTerm = (zeta / Math.sqrt(Math.max(0.01, 1 - zeta * zeta))) * Math.sin(wd * t);
      const decay = Math.exp(-zeta * wn * t);
      
      // Steady state response
      let primaryDev = deltaF_ss_hz * (1 - decay * (cosTerm + sinTerm));
      
      // Add Governor lag dip (Nadir dip) which is most pronounced around 3s to 8s
      const nadirLagFactor = -stepLoad * 140 / (H_val * 1.2) * Math.sin(0.35 * t) * Math.exp(-0.18 * t);
      primaryDev += Math.min(0, nadirLagFactor);

      // 2. Calculate actual frequency depending on secondary control switch
      let actualDev = primaryDev;
      if (secondaryControl) {
        // Integral control action pulls deviation back to zero.
        // It starts acting with a delay (e.g. after t = 2s) and settles back to 0.
        const secondaryRecovery = t < 2 ? 1 : Math.exp(-0.14 * (t - 2));
        actualDev = primaryDev * secondaryRecovery;
      }

      data.push({
        time: t,
        frequency: parseFloat((baseFreq + actualDev).toFixed(4)),
        deviation: parseFloat(actualDev.toFixed(4)),
        primarySettle: parseFloat((baseFreq + deltaF_ss_hz).toFixed(4)),
      });
    }

    return data;
  }, [stepLoad, inertia, damping, droop, secondaryControl]);

  // Derived metrics
  const metrics = useMemo(() => {
    let nadir = 50.0;
    let steadyStateFreq = 50.0;
    let settlingTimeSec = 0;

    chartData.forEach((pt) => {
      if (pt.frequency < nadir) {
        nadir = pt.frequency;
      }
    });

    const lastPt = chartData[chartData.length - 1];
    steadyStateFreq = lastPt.frequency;

    // Find when it settles within +/- 0.02 Hz of steady state
    const tolerance = 0.02;
    for (let i = chartData.length - 1; i >= 0; i--) {
      const diff = Math.abs(chartData[i].frequency - steadyStateFreq);
      if (diff > tolerance) {
        settlingTimeSec = chartData[i].time;
        break;
      }
    }

    return {
      nadir: parseFloat(nadir.toFixed(3)),
      nadirDeviation: parseFloat((nadir - 50.0).toFixed(3)),
      steadyStateFreq: parseFloat(steadyStateFreq.toFixed(3)),
      settlingTimeSec,
      rocof: parseFloat((-stepLoad / (2 * inertia) * 50).toFixed(3)), // Rate of Change of Frequency at t=0
    };
  }, [chartData, stepLoad, inertia]);

  return {
    stepLoad,
    setStepLoad,
    inertia,
    setInertia,
    damping,
    setDamping,
    droop,
    setDroop,
    secondaryControl,
    setSecondaryControl,
    chartData,
    ...metrics,
  };
}
