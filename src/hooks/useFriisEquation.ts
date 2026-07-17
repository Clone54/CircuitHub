import { useMemo, useState } from 'react';

export type AntennaType = 'isotropic' | 'dipole' | 'patch' | 'dish';

export interface UseFriisEquationParams {
  initialPt?: number; // dBm
  initialGt?: number; // dBi
  initialGr?: number; // dBi
  initialFrequency?: number; // GHz
  initialDistance?: number; // km
  initialAntennaType?: AntennaType;
}

export function useFriisEquation({
  initialPt = 20,
  initialGt = 12,
  initialGr = 8,
  initialFrequency = 2.4,
  initialDistance = 2.5,
  initialAntennaType = 'dipole'
}: UseFriisEquationParams = {}) {
  const [pt, setPt] = useState<number>(initialPt);
  const [gt, setGt] = useState<number>(initialGt);
  const [gr, setGr] = useState<number>(initialGr);
  const [frequency, setFrequency] = useState<number>(initialFrequency);
  const [distance, setDistance] = useState<number>(initialDistance);
  const [antennaType, setAntennaType] = useState<AntennaType>(initialAntennaType);

  const friisMetrics = useMemo(() => {
    if (distance <= 0 || frequency <= 0) {
      return { fspl: 0, pr: -120, isViable: false };
    }

    // Exact speed of light
    const c = 299792458; // m/s
    const fHz = frequency * 1e9;
    const dMeters = distance * 1000;

    // FSPL = 20 * log10(d) + 20 * log10(f) + 20 * log10(4 * pi / c)
    const fspl = 20 * Math.log10(dMeters) + 20 * Math.log10(fHz) + 20 * Math.log10((4 * Math.PI) / c);

    // Friis formula: Pr = Pt + Gt + Gr - FSPL
    const pr = pt + gt + gr - fspl;

    return {
      fspl: parseFloat(fspl.toFixed(2)),
      pr: parseFloat(pr.toFixed(2))
    };
  }, [pt, gt, gr, frequency, distance]);

  // Generate 2D Polar Radiation Pattern data for Recharts
  const radiationPatternData = useMemo(() => {
    const data = [];
    // Generate data points for 360 degrees (in steps of 10 degrees)
    for (let angleDeg = 0; angleDeg < 360; angleDeg += 10) {
      const angleRad = (angleDeg * Math.PI) / 180;
      let gainRelative = 1.0; // Linear normalized scale [0, 1]

      switch (antennaType) {
        case 'isotropic':
          gainRelative = 1.0;
          break;
        case 'dipole':
          // Dipole radiation pattern: sin^2(theta) or |sin(theta)|
          gainRelative = Math.abs(Math.sin(angleRad));
          break;
        case 'patch':
          // Patch antenna: directive cardioid or cos^2
          // Peak at 0 deg (or 180 deg)
          const cosVal = Math.cos(angleRad);
          gainRelative = cosVal > 0 ? Math.pow(cosVal, 2) : 0.05;
          break;
        case 'dish':
          // Parabolic dish: extremely narrow main beam
          const cosValDish = Math.cos(angleRad);
          gainRelative = cosValDish > 0.5 ? Math.pow(cosValDish, 10) : 0.01;
          break;
        default:
          gainRelative = 1.0;
      }

      data.push({
        angle: angleDeg,
        gain: parseFloat(gainRelative.toFixed(3)),
        // Convert to dynamic dB scale for display: e.g. Max gain is the Tx/Rx gain
        gainDb: parseFloat((Math.max(-40, 10 * Math.log10(gainRelative))).toFixed(1))
      });
    }
    return data;
  }, [antennaType]);

  return {
    pt,
    setPt,
    gt,
    setGt,
    gr,
    setGr,
    frequency,
    setFrequency,
    distance,
    setDistance,
    antennaType,
    setAntennaType,
    friisMetrics,
    radiationPatternData
  };
}
