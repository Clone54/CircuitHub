import { useMemo } from 'react';

export interface DroopPFPoint {
  pActive: number;
  inv1Freq: number;
  inv2Freq: number;
}

export interface DroopQVPoint {
  qReactive: number;
  inv1Volt: number;
  inv2Volt: number;
}

export function useDroopControl(
  rating1: number,       // Inverter 1 Capacity (kW)
  rating2: number,       // Inverter 2 Capacity (kW)
  mp1: number,           // Inverter 1 frequency droop coefficient (Hz/kW)
  mp2: number,           // Inverter 2 frequency droop coefficient (Hz/kW)
  nq1: number,           // Inverter 1 voltage droop coefficient (V/kVAR)
  nq2: number,           // Inverter 2 voltage droop coefficient (V/kVAR)
  pLoad: number,         // Total active load demand (kW)
  qLoad: number,         // Total reactive load demand (kVAR)
  fRef: number = 50.0,   // Nominal frequency reference (Hz)
  vRef: number = 230.0   // Nominal voltage reference (V)
) {
  const result = useMemo(() => {
    // 1. Solve steady state power sharing
    // Since f = fRef - mp1 * P1 = fRef - mp2 * P2 and P1 + P2 = pLoad
    const p1 = pLoad * (mp2 / (mp1 + mp2));
    const p2 = pLoad * (mp1 / (mp1 + mp2));

    // Similarly for reactive power and voltage droop
    const q1 = qLoad * (nq2 / (nq1 + nq2));
    const q2 = qLoad * (nq1 / (nq1 + nq2));

    // 2. Solve final steady state frequency and voltage
    const fSteady = fRef - mp1 * p1;
    const vSteady = vRef - nq1 * q1;

    // 3. Generate data points for the Active Power vs Frequency (P-f) Droop Chart
    // The X-axis represents Active Power coordinate from 0 to pLoad.
    // Inverter 1 starts at left (X = 0 is P1 = 0, so f = fRef; X = pLoad is P1 = pLoad)
    // Inverter 2 starts at right (X = pLoad is P2 = 0, so f = fRef; X = 0 is P2 = pLoad)
    const pfPoints: DroopPFPoint[] = [];
    const steps = 50;
    const dp = pLoad / steps;

    for (let i = 0; i <= steps; i++) {
      const x = i * dp; // Coordinates from 0 to pLoad
      
      const f1 = fRef - mp1 * x;
      const f2 = fRef - mp2 * (pLoad - x);

      pfPoints.push({
        pActive: parseFloat(x.toFixed(2)),
        inv1Freq: parseFloat(f1.toFixed(3)),
        inv2Freq: parseFloat(f2.toFixed(3))
      });
    }

    // 4. Generate data points for the Reactive Power vs Voltage (Q-V) Droop Chart
    // Similarly, X-axis represents Reactive Power coordinate from 0 to qLoad.
    const qvPoints: DroopQVPoint[] = [];
    const dq = qLoad / steps;

    for (let i = 0; i <= steps; i++) {
      const x = i * dq; // Coordinates from 0 to qLoad
      
      const v1 = vRef - nq1 * x;
      const v2 = vRef - nq2 * (qLoad - x);

      qvPoints.push({
        qReactive: parseFloat(x.toFixed(2)),
        inv1Volt: parseFloat(v1.toFixed(2)),
        inv2Volt: parseFloat(v2.toFixed(2))
      });
    }

    // 5. Calculate load sharing ratio and capacity utilization
    const p1Percent = rating1 > 0 ? (p1 / rating1) * 100 : 0;
    const p2Percent = rating2 > 0 ? (p2 / rating2) * 100 : 0;

    const sharingIsProportional = Math.abs((p1 / rating1) - (p2 / rating2)) < 0.01;

    return {
      p1: parseFloat(p1.toFixed(2)),
      p2: parseFloat(p2.toFixed(2)),
      q1: parseFloat(q1.toFixed(2)),
      q2: parseFloat(q2.toFixed(2)),
      fSteady: parseFloat(fSteady.toFixed(3)),
      vSteady: parseFloat(vSteady.toFixed(2)),
      pfPoints,
      qvPoints,
      p1Percent: parseFloat(p1Percent.toFixed(1)),
      p2Percent: parseFloat(p2Percent.toFixed(1)),
      sharingIsProportional
    };
  }, [rating1, rating2, mp1, mp2, nq1, nq2, pLoad, qLoad, fRef, vRef]);

  return result;
}
