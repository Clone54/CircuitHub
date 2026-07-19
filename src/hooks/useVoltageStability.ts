import { useMemo, useState } from 'react';

export interface PVPoint {
  p: number;
  vUpper: number;
  vLower: number | null;
  // For single-path plotting:
  pPlot: number;
  vPlot: number;
  branch: 'upper' | 'lower';
}

export interface UseVoltageStabilityParams {
  initialR?: number;
  initialX?: number;
  initialPf?: number;
  initialPfType?: 'lagging' | 'leading';
  initialVs?: number;
}

export function useVoltageStability({
  initialR = 0.04,
  initialX = 0.25,
  initialPf = 0.90,
  initialPfType = 'lagging',
  initialVs = 1.0
}: UseVoltageStabilityParams = {}) {
  const [R, setR] = useState<number>(initialR);
  const [X, setX] = useState<number>(initialX);
  const [pf, setPf] = useState<number>(initialPf);
  const [pfType, setPfType] = useState<'lagging' | 'leading'>(initialPfType);
  const [Vs, setVs] = useState<number>(initialVs);

  const voltageMetrics = useMemo(() => {
    // 1. Calculate k = Q/P based on power factor
    const thetaPf = Math.acos(pf);
    const k = pfType === 'lagging' ? Math.tan(thetaPf) : -Math.tan(thetaPf);

    // 2. Analytical calculation of P_max (Load boundary limit)
    // Solve: A_pf * P^2 + B_pf * P + C_pf = 0
    // where:
    // A_pf = 4 * [ (R + k*X)^2 - (R^2 + X^2) / pf^2 ]
    // B_pf = -4 * (R + k*X) * Vs^2
    // C_pf = Vs^4
    const impedanceSq = R * R + X * X;
    const termRKX = R + k * X;
    
    const Apf = 4 * (termRKX * termRKX - impedanceSq / (pf * pf));
    const Bpf = -4 * termRKX * (Vs * Vs);
    const Cpf = Math.pow(Vs, 4);

    const discPf = Bpf * Bpf - 4 * Apf * Cpf;

    let pMax = 0;
    if (discPf >= 0 && Math.abs(Apf) > 0.0001) {
      const root1 = (-Bpf + Math.sqrt(discPf)) / (2 * Apf);
      const root2 = (-Bpf - Math.sqrt(discPf)) / (2 * Apf);
      
      // Since Apf is typically negative, we take the positive real root representing pMax
      const validRoots = [root1, root2].filter(r => r > 0);
      if (validRoots.length > 0) {
        pMax = Math.min(...validRoots);
      } else {
        pMax = 1.5; // fallback
      }
    } else {
      // Direct numerical search fallback if analytical is singular
      pMax = 0.1;
      let solvable = true;
      while (solvable && pMax < 10.0) {
        const Q = pMax * k;
        const b = 2 * (pMax * R + Q * X) - Vs * Vs;
        const c = impedanceSq * (pMax * pMax + Q * Q);
        if (b * b - 4 * c >= 0) {
          pMax += 0.02;
        } else {
          solvable = false;
        }
      }
      pMax = Math.max(0.1, pMax - 0.02);
    }

    // Adjust pMax to be clean
    pMax = parseFloat(pMax.toFixed(4));

    // 3. Generate sweep data
    const steps = 40;
    const upperBranch: { p: number; v: number }[] = [];
    const lowerBranch: { p: number; v: number }[] = [];
    const tableData: { p: number; q: number; vUpper: number; vLower: number | null; status: string }[] = [];

    for (let i = 0; i <= steps; i++) {
      // Sweep active power P from 0 to pMax
      const p = (i / steps) * pMax;
      const Q = p * k;

      // Solve quadratic: y^2 + b*y + c = 0 where y = Vr^2
      const b = 2 * (p * R + Q * X) - Vs * Vs;
      const c = impedanceSq * (p * p + Q * Q);

      const disc = b * b - 4 * c;

      if (disc >= 0) {
        const yUpper = (-b + Math.sqrt(disc)) / 2;
        const yLower = (-b - Math.sqrt(disc)) / 2;

        const vUpper = yUpper >= 0 ? Math.sqrt(yUpper) : 0;
        const vLower = yLower >= 0 ? Math.sqrt(yLower) : 0;

        upperBranch.push({ p: parseFloat(p.toFixed(3)), v: parseFloat(vUpper.toFixed(4)) });
        if (i < steps) {
          lowerBranch.push({ p: parseFloat(p.toFixed(3)), v: parseFloat(vLower.toFixed(4)) });
        }

        tableData.push({
          p: parseFloat(p.toFixed(3)),
          q: parseFloat(Q.toFixed(3)),
          vUpper: parseFloat(vUpper.toFixed(4)),
          vLower: parseFloat(vLower.toFixed(4)),
          status: vUpper >= 0.9 ? 'Normal' : vUpper >= 0.8 ? 'Alert' : 'Critical'
        });
      }
    }

    // Create consolidated single continuous path for drawing the Nose shape in Recharts
    // Goes from P=0 -> P_max along the Upper branch, then from P_max -> P=0 along the Lower branch
    const noseCurvePoints: { pPlot: number; vPlot: number; branch: string }[] = [];
    
    upperBranch.forEach(pt => {
      noseCurvePoints.push({
        pPlot: pt.p,
        vPlot: pt.v,
        branch: 'Upper (Stable)'
      });
    });

    // Append lower branch in reverse order to close the nose curve beautifully
    for (let i = lowerBranch.length - 1; i >= 0; i--) {
      noseCurvePoints.push({
        pPlot: lowerBranch[i].p,
        vPlot: lowerBranch[i].v,
        branch: 'Lower (Unstable)'
      });
    }

    // Critical point voltage calculation at pMax
    const qAtMax = pMax * k;
    const bAtMax = 2 * (pMax * R + qAtMax * X) - Vs * Vs;
    const vCritical = bAtMax < 0 ? Math.sqrt(-bAtMax / 2) : 0.707;

    return {
      pMax,
      vCritical: parseFloat(vCritical.toFixed(3)),
      noseCurvePoints,
      tableData,
      k,
      impedance: parseFloat(Math.sqrt(impedanceSq).toFixed(3))
    };
  }, [R, X, pf, pfType, Vs]);

  return {
    R,
    setR,
    X,
    setX,
    pf,
    setPf,
    pfType,
    setPfType,
    Vs,
    setVs,
    voltageMetrics
  };
}
