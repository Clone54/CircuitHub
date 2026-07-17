import { useMemo, useState } from 'react';

export interface ImpulseWavePoint {
  timeUs: number; // in microseconds
  voltageKv: number; // in kV
}

export interface UseImpulseWaveParams {
  initialStages?: number;
  initialV0?: number; // per stage, in kV
  initialC1?: number; // generator capacitance, in nF
  initialC2?: number; // load capacitance, in nF
  initialR1?: number; // front resistance, in Ohms
  initialR2?: number; // tail resistance, in Ohms
}

export function useImpulseWave({
  initialStages = 4,
  initialV0 = 25.0,
  initialC1 = 250.0, // nF
  initialC2 = 5.0,   // nF
  initialR1 = 150.0, // Ohms
  initialR2 = 1600.0 // Ohms
}: UseImpulseWaveParams = {}) {
  const [stages, setStages] = useState<number>(initialStages);
  const [v0, setV0] = useState<number>(initialV0);
  const [C1, setC1] = useState<number>(initialC1);
  const [C2, setC2] = useState<number>(initialC2);
  const [R1, setR1] = useState<number>(initialR1);
  const [R2, setR2] = useState<number>(initialR2);

  const impulseResult = useMemo(() => {
    // Total DC charging voltage
    const vTotal = stages * v0;

    // Convert parameters to standard units for calculation (Seconds, Farads, Ohms)
    const c1Farad = C1 * 1e-9;
    const c2Farad = C2 * 1e-9;

    // Avoid division by zero or negative values
    if (R1 <= 0 || R2 <= 0 || C1 <= 0 || C2 <= 0 || stages <= 0 || v0 <= 0) {
      return {
        points: [],
        alpha: 0,
        beta: 0,
        vPeak: 0,
        tPeakUs: 0,
        tFrontUs: 0,
        tTailUs: 0,
        efficiency: 0,
        isStandard12_50: false,
        vTotal
      };
    }

    // Characteristic Equation coefficients: s^2 + b*s + c = 0
    // b = 1/(R1 * C2) + 1/(R2 * C1) + 1/(R1 * C1)
    // c = 1/(R1 * R2 * C1 * C2)
    const b = (1 / (R1 * c2Farad)) + (1 / (R2 * c1Farad)) + (1 / (R1 * c1Farad));
    const cCoeff = 1 / (R1 * R2 * c1Farad * c2Farad);

    const discriminant = b * b - 4 * cCoeff;
    if (discriminant <= 0) {
      // Physically, the discharge is overdamped in normal Marx generator operation,
      // so discriminant should be positive. If not, fallback.
      return {
        points: [],
        alpha: 0,
        beta: 0,
        vPeak: 0,
        tPeakUs: 0,
        tFrontUs: 0,
        tTailUs: 0,
        efficiency: 0,
        isStandard12_50: false,
        vTotal
      };
    }

    const s1 = (-b + Math.sqrt(discriminant)) / 2;
    const s2 = (-b - Math.sqrt(discriminant)) / 2;

    // Alpha (decay constant) is the smaller absolute value
    // Beta (rise constant) is the larger absolute value
    const alpha = -Math.max(s1, s2);
    const beta = -Math.min(s1, s2);

    // Equation coefficient: V_coeff = vTotal / (R1 * C2 * (beta - alpha))
    const vCoeff = vTotal / (R1 * c2Farad * (beta - alpha));

    // Analytical Peak time tPeak = ln(beta / alpha) / (beta - alpha)
    const tPeakSeconds = Math.log(beta / alpha) / (beta - alpha);
    const tPeakUs = tPeakSeconds * 1e6;

    // Peak voltage vPeak
    const vPeak = vCoeff * (Math.exp(-alpha * tPeakSeconds) - Math.exp(-beta * tPeakSeconds));
    const efficiency = vPeak / vTotal;

    // Use high-resolution binary search to find exact key times for IEC standard wave parameters
    // We want to find t_30 (30% of peak), t_90 (90% of peak) on rising edge (0 to tPeakSeconds),
    // and t_50 (50% of peak) on falling edge (tPeakSeconds to 1000 us).
    const findTimeForVoltage = (targetVolt: number, tStart: number, tEnd: number, isRising: boolean) => {
      let low = tStart;
      let high = tEnd;
      for (let iter = 0; iter < 40; iter++) {
        const mid = (low + high) / 2;
        const volt = vCoeff * (Math.exp(-alpha * mid) - Math.exp(-beta * mid));
        if (volt < targetVolt) {
          if (isRising) {
            low = mid;
          } else {
            high = mid;
          }
        } else {
          if (isRising) {
            high = mid;
          } else {
            low = mid;
          }
        }
      }
      return (low + high) / 2;
    };

    const v30 = vPeak * 0.3;
    const v90 = vPeak * 0.9;
    const v50 = vPeak * 0.5;

    const t30 = findTimeForVoltage(v30, 0, tPeakSeconds, true);
    const t90 = findTimeForVoltage(v90, 0, tPeakSeconds, true);
    // Standard lightning tail decays in ~100 us, but we search up to 2 ms to be safe
    const t50Tail = findTimeForVoltage(v50, tPeakSeconds, 2000e-6, false);

    // IEC definitions:
    // Virtual front time T1 = 1.67 * (t90 - t30)
    // Virtual origin t0 = t30 - 0.5 * (t90 - t30)
    // Virtual time to half-value T2 = t50Tail - t0
    const tFrontUs = 1.67 * (t90 - t30) * 1e6;
    const t0 = t30 - 0.5 * (t90 - t30);
    const tTailUs = (t50Tail - t0) * 1e6;

    // Generate curve points for plotting
    // Lightning impulse waveform is fast in the first 5us, then slow up to 100us.
    // We'll create fine points (0.1 us step) from 0 to 5 us, then 0.5 us step up to 100 us.
    const points: ImpulseWavePoint[] = [];
    
    // Fine-grained rising edge & peak
    for (let tUs = 0; tUs < 5; tUs += 0.05) {
      const tSec = tUs * 1e-6;
      const vVal = vCoeff * (Math.exp(-alpha * tSec) - Math.exp(-beta * tSec));
      points.push({
        timeUs: parseFloat(tUs.toFixed(2)),
        voltageKv: parseFloat(vVal.toFixed(2))
      });
    }

    // Coarser falling edge
    for (let tUs = 5; tUs <= 100; tUs += 0.5) {
      const tSec = tUs * 1e-6;
      const vVal = vCoeff * (Math.exp(-alpha * tSec) - Math.exp(-beta * tSec));
      points.push({
        timeUs: parseFloat(tUs.toFixed(2)),
        voltageKv: parseFloat(vVal.toFixed(2))
      });
    }

    // Sort to be safe
    points.sort((a, b) => a.timeUs - b.timeUs);

    // Determine if the waveshape matches standard 1.2/50 us impulse within IEC tolerances
    // T1: 1.2 us ± 30% (0.84 to 1.56 us)
    // T2: 50 us ± 20% (40.0 to 60.0 us)
    const isStandard12_50 = 
      tFrontUs >= 0.84 && tFrontUs <= 1.56 && 
      tTailUs >= 40.0 && tTailUs <= 60.0;

    return {
      points,
      alpha: parseFloat(alpha.toFixed(1)),
      beta: parseFloat(beta.toFixed(1)),
      vPeak: parseFloat(vPeak.toFixed(2)),
      tPeakUs: parseFloat(tPeakUs.toFixed(2)),
      tFrontUs: parseFloat(tFrontUs.toFixed(2)),
      tTailUs: parseFloat(tTailUs.toFixed(2)),
      efficiency: parseFloat((efficiency * 100).toFixed(1)),
      isStandard12_50,
      vTotal: parseFloat(vTotal.toFixed(2))
    };
  }, [stages, v0, C1, C2, R1, R2]);

  return {
    stages,
    setStages,
    v0,
    setV0,
    C1,
    setC1,
    C2,
    setC2,
    R1,
    setR1,
    R2,
    setR2,
    impulseResult
  };
}
