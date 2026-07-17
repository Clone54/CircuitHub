import { useMemo, useState } from 'react';

export interface Eigenvalue {
  real: number;
  imag: number;
  label: string;
  isStable: boolean;
}

export interface UseSMIBEigenvaluesParams {
  initialD?: number;
  initialK1?: number;
  initialH?: number;
  initialK5?: number;
  initialKa?: number;
  initialKpss?: number;
}

// Cubic equation solver: x^3 + a2*x^2 + a1*x + a0 = 0
export function solveCubicRoots(a2: number, a1: number, a0: number): { r: number; i: number }[] {
  const p = a1 - (a2 * a2) / 3;
  const q = a0 - (a2 * a1) / 3 + (2 * Math.pow(a2, 3)) / 27;

  const discriminant = (q * q) / 4 + (p * p * p) / 27;

  const roots: { r: number; i: number }[] = [];

  if (discriminant > 0.000001) {
    // One real root, two complex conjugate roots
    const sqrtDisc = Math.sqrt(discriminant);
    const u = Math.cbrt(-q / 2 + sqrtDisc);
    const v = Math.cbrt(-q / 2 - sqrtDisc);

    // Real root
    const r1 = u + v - a2 / 3;
    roots.push({ r: parseFloat(r1.toFixed(4)), i: 0 });

    // Complex roots
    const realPart = -0.5 * (u + v) - a2 / 3;
    const imagPart = (Math.sqrt(3) / 2) * (u - v);

    roots.push({ r: parseFloat(realPart.toFixed(4)), i: parseFloat(imagPart.toFixed(4)) });
    roots.push({ r: parseFloat(realPart.toFixed(4)), i: parseFloat((-imagPart).toFixed(4)) });
  } else if (Math.abs(discriminant) <= 0.000001) {
    // All roots real, and at least two are equal
    const r1 = 3 * q / p;
    const r2 = -1.5 * q / p;
    
    roots.push({ r: parseFloat((r1 - a2 / 3).toFixed(4)), i: 0 });
    roots.push({ r: parseFloat((r2 - a2 / 3).toFixed(4)), i: 0 });
    roots.push({ r: parseFloat((r2 - a2 / 3).toFixed(4)), i: 0 });
  } else {
    // Three distinct real roots
    const cosVal = (3 * q) / (2 * p) * Math.sqrt(-3 / p);
    // Clamp to prevent out-of-range for acos due to floating point precision
    const clampedCos = Math.max(-1.0, Math.min(1.0, cosVal));
    const theta = Math.acos(clampedCos);

    const mult = 2 * Math.sqrt(-p / 3);
    const r1 = mult * Math.cos(theta / 3) - a2 / 3;
    const r2 = mult * Math.cos((theta + 2 * Math.PI) / 3) - a2 / 3;
    const r3 = mult * Math.cos((theta + 4 * Math.PI) / 3) - a2 / 3;

    roots.push({ r: parseFloat(r1.toFixed(4)), i: 0 });
    roots.push({ r: parseFloat(r2.toFixed(4)), i: 0 });
    roots.push({ r: parseFloat(r3.toFixed(4)), i: 0 });
  }

  return roots;
}

export function useSMIBEigenvalues({
  initialD = 1.0,
  initialK1 = 1.0,
  initialH = 4.0,
  initialK5 = -0.05,
  initialKa = 40.0,
  initialKpss = 6.0
}: UseSMIBEigenvaluesParams = {}) {
  const [D, setD] = useState<number>(initialD);
  const [K1, setK1] = useState<number>(initialK1);
  const [H, setH] = useState<number>(initialH);
  const [K5, setK5] = useState<number>(initialK5);
  const [Ka, setKa] = useState<number>(initialKa);
  const [pssEnabled, setPssEnabled] = useState<boolean>(true);
  const [Kpss, setKpss] = useState<number>(initialKpss);

  // Constants for the 3rd order system
  const f0 = 50.0;
  const omega0 = 2 * Math.PI * f0; // ~314.159
  const Tdo = 5.0; // field circuit time constant
  const K2 = 1.2;
  const K3 = 0.4;
  const K4 = 1.4;

  const result = useMemo(() => {
    // Construct the 3x3 state matrix A
    // States: x = [delta_delta, delta_omega, delta_Eq_prime]
    // A-matrix layout:
    // row 0: [ 0,  omega0,  0 ]
    // row 1: [ -K1/(2H), -D/(2H), -K2/(2H) ]
    // row 2: [ -(K4 + Ka*K5)/Tdo, (pssEnabled ? Ka*Kpss/Tdo : 0), -1/(K3*Tdo) ]

    const a00 = 0;
    const a01 = omega0;
    const a02 = 0;

    const denominator2H = 2 * H;
    const a10 = denominator2H > 0 ? -K1 / denominator2H : 0;
    const a11 = denominator2H > 0 ? -D / denominator2H : 0;
    const a12 = denominator2H > 0 ? -K2 / denominator2H : 0;

    const a20 = -((K4 + Ka * K5) / Tdo);
    const a21 = pssEnabled ? (Ka * Kpss) / Tdo : 0;
    const a22 = -1 / (K3 * Tdo);

    // Compute characteristic polynomial coefficients: s^3 + c2*s^2 + c1*s + c0 = 0
    // c2 = -tr(A)
    const c2 = -(a00 + a11 + a22);

    // c1 = sum of principal 2x2 minors
    const m11 = a11 * a22 - a12 * a21;
    const m22 = a00 * a22 - a02 * a20;
    const m33 = a00 * a11 - a01 * a10;
    const c1 = m11 + m22 + m33;

    // c0 = -det(A)
    // det(A) = a00*(a11*a22 - a12*a21) - a01*(a10*a22 - a12*a20) + a02*(a10*a21 - a11*a20)
    const detA = -a01 * (a10 * a22 - a12 * a20);
    const c0 = -detA;

    // Solve for eigenvalues
    const roots = solveCubicRoots(c2, c1, c0);

    // Map roots to Eigenvalue structure
    const eigenvalues: Eigenvalue[] = roots.map((root, idx) => {
      let label = 'Field Mode';
      if (Math.abs(root.i) > 0.1) {
        label = idx === 1 ? 'Electromechanical Mode (+)' : 'Electromechanical Mode (-)';
      }
      return {
        real: root.r,
        imag: root.i,
        label,
        isStable: root.r < 0
      };
    });

    const isSystemStable = eigenvalues.every(ev => ev.isStable);

    // Formulate state matrix A for presentation
    const matrixA = [
      [a00, parseFloat(a01.toFixed(2)), a02],
      [parseFloat(a10.toFixed(4)), parseFloat(a11.toFixed(4)), parseFloat(a12.toFixed(4))],
      [parseFloat(a20.toFixed(4)), parseFloat(a21.toFixed(4)), parseFloat(a22.toFixed(4))]
    ];

    // Compute natural frequency and damping ratio of the electromechanical mode
    // s = sigma +/- j * omega_d
    // omega_n = sqrt(sigma^2 + omega_d^2)
    // zeta = -sigma / omega_n
    const oscMode = eigenvalues.find(ev => Math.abs(ev.imag) > 0.1);
    let naturalFreqHz = 0;
    let dampingRatio = 0;

    if (oscMode) {
      const sigma = oscMode.real;
      const omega_d = Math.abs(oscMode.imag);
      const omega_n = Math.sqrt(sigma * sigma + omega_d * omega_d);
      naturalFreqHz = omega_n / (2 * Math.PI);
      dampingRatio = omega_n > 0 ? -sigma / omega_n : 0;
    }

    return {
      eigenvalues,
      isSystemStable,
      matrixA,
      naturalFreqHz: parseFloat(naturalFreqHz.toFixed(2)),
      dampingRatio: parseFloat(dampingRatio.toFixed(4))
    };
  }, [D, K1, H, K5, Ka, pssEnabled, Kpss]);

  return {
    D,
    setD,
    K1,
    setK1,
    H,
    setH,
    K5,
    setK5,
    Ka,
    setKa,
    pssEnabled,
    setPssEnabled,
    Kpss,
    setKpss,
    result
  };
}
