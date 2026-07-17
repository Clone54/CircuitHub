import { useMemo, useState } from 'react';

export interface UseSmithChartParams {
  initialZReal?: number;
  initialZImag?: number;
  initialZ0?: number;
}

export function useSmithChart({
  initialZReal = 75,
  initialZImag = 25,
  initialZ0 = 50
}: UseSmithChartParams = {}) {
  const [zReal, setZReal] = useState<number>(initialZReal);
  const [zImag, setZImag] = useState<number>(initialZImag);
  const [z0, setZ0] = useState<number>(initialZ0);

  const smithMetrics = useMemo(() => {
    const r = zReal;
    const x = zImag;

    // 1. Normalized impedance z = r_n + j x_n
    const rn = r / z0;
    const xn = x / z0;

    // 2. Reflection coefficient Gamma = (Z_L - Z_0) / (Z_L + Z_0)
    // Gamma_r = (rn^2 + xn^2 - 1) / ((rn + 1)^2 + xn^2)
    // Gamma_i = (2 * xn) / ((rn + 1)^2 + xn^2)
    const denom = Math.pow(rn + 1, 2) + Math.pow(xn, 2);
    let gammaReal = 0;
    let gammaImag = 0;

    if (denom > 0) {
      gammaReal = (Math.pow(rn, 2) + Math.pow(xn, 2) - 1) / denom;
      gammaImag = (2 * xn) / denom;
    }

    const gammaMag = Math.sqrt(Math.pow(gammaReal, 2) + Math.pow(gammaImag, 2));
    let gammaAngleRad = Math.atan2(gammaImag, gammaReal);
    let gammaAngleDeg = (gammaAngleRad * 180) / Math.PI;
    if (gammaAngleDeg < 0) gammaAngleDeg += 360;

    // 3. VSWR = (1 + |Gamma|) / (1 - |Gamma|)
    let vswr = 1.0;
    if (gammaMag < 0.999) {
      vswr = (1 + gammaMag) / (1 - gammaMag);
    } else {
      vswr = 999.9; // Representation of high mismatch / infinity
    }

    // 4. Return Loss (RL) = -20 * log10(|Gamma|)
    let returnLoss = 999.9;
    if (gammaMag > 0.0001) {
      returnLoss = -20 * Math.log10(gammaMag);
    }

    // 5. Mismatch Loss (ML) = -10 * log10(1 - |Gamma|^2)
    let mismatchLoss = 0;
    if (gammaMag < 1.0) {
      mismatchLoss = -10 * Math.log10(1 - Math.pow(gammaMag, 2));
    }

    return {
      rn: parseFloat(rn.toFixed(4)),
      xn: parseFloat(xn.toFixed(4)),
      gammaReal: parseFloat(gammaReal.toFixed(4)),
      gammaImag: parseFloat(gammaImag.toFixed(4)),
      gammaMag: parseFloat(gammaMag.toFixed(4)),
      gammaAngleDeg: parseFloat(gammaAngleDeg.toFixed(1)),
      vswr: vswr > 100 ? '∞' : parseFloat(vswr.toFixed(3)),
      vswrNum: vswr,
      returnLoss: returnLoss > 100 ? '∞' : parseFloat(returnLoss.toFixed(2)),
      mismatchLoss: parseFloat(mismatchLoss.toFixed(2))
    };
  }, [zReal, zImag, z0]);

  return {
    zReal,
    setZReal,
    zImag,
    setZImag,
    z0,
    setZ0,
    smithMetrics
  };
}
