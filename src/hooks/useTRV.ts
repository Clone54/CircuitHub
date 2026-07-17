import { useMemo, useState } from 'react';

export interface UseTRVParams {
  initialInductance?: number; // mH
  initialCapacitance?: number; // µF
  initialVMax?: number; // kV peak
  initialDampingFactor?: number; // 0 (undamped) to 1 (critically damped)
}

export function useTRV({
  initialInductance = 4.5,
  initialCapacitance = 0.02,
  initialVMax = 27.0,
  initialDampingFactor = 0.15
}: UseTRVParams = {}) {
  const [inductance, setInductance] = useState<number>(initialInductance);
  const [capacitance, setCapacitance] = useState<number>(initialCapacitance);
  const [vMax, setVMax] = useState<number>(initialVMax);
  const [dampingFactor, setDampingFactor] = useState<number>(initialDampingFactor);

  const trvMetrics = useMemo(() => {
    const lc = inductance * capacitance;
    if (lc <= 0) return { fn: 0, Tn: 0, tpUs: 0, maxTRV: 0, rrrv: 0 };

    // fn in Hz = 1 / (2 * pi * sqrt(L * C))
    // L_H = inductance * 1e-3, C_F = capacitance * 1e-6
    const L_H = inductance * 1e-3;
    const C_F = capacitance * 1e-6;
    const fn = 1 / (2 * Math.PI * Math.sqrt(L_H * C_F)); // Hz
    const Tn = 1 / fn; // seconds

    // Time to peak (tp) = 1 / (2 * fn) seconds
    const tpSec = 1 / (2 * fn);
    const tpUs = tpSec * 1e6; // µs

    // Maximum TRV = 2 * V_max (kV) peak (assuming undamped for theoretical max)
    const maxTRV = 2 * vMax;

    // Average RRRV (Rate of Rise of Recovery Voltage) = Maximum TRV / tp
    // Where Maximum TRV is in kV, and tp is in microseconds (µs)
    const rrrv = tpUs > 0 ? maxTRV / tpUs : 0; // kV/µs

    return {
      fn, // Hz
      Tn, // s
      tpUs, // µs
      maxTRV, // kV
      rrrv // kV/µs
    };
  }, [inductance, capacitance, vMax]);

  // Generate AreaChart data in microseconds
  const trvWaveformData = useMemo(() => {
    if (trvMetrics.fn <= 0) return [];

    const points = 200;
    const periodUs = trvMetrics.Tn * 1e6; // period in microseconds
    const totalDurationUs = periodUs * 3.0; // Plot 3 complete cycles
    const step = totalDurationUs / points;

    const data = [];
    const wn = 2 * Math.PI * trvMetrics.fn; // rad/s

    for (let i = 0; i <= points; i++) {
      const tUs = i * step;
      const tSec = tUs * 1e-6;

      // Ideal: V_TRV(t) = vMax * (1 - cos(wn * t))
      // Add damping: v(t) = vMax * (1 - exp(-dampingFactor * t) * cos(wn * t))
      // For nice visualization, we scale the damping exponential with the normalized time
      const dampingTerm = Math.exp(-dampingFactor * (tUs / periodUs));
      const trvVal = vMax * (1 - Math.cos(wn * tSec) * dampingTerm);

      data.push({
        timeUs: parseFloat(tUs.toFixed(1)),
        trv: parseFloat(trvVal.toFixed(2)),
        vMaxLine: parseFloat(vMax.toFixed(2)),
        maxTrvLimit: parseFloat((2 * vMax).toFixed(2))
      });
    }

    return data;
  }, [trvMetrics, vMax, dampingFactor]);

  return {
    inductance,
    setInductance,
    capacitance,
    setCapacitance,
    vMax,
    setVMax,
    dampingFactor,
    setDampingFactor,
    trvMetrics,
    trvWaveformData
  };
}
