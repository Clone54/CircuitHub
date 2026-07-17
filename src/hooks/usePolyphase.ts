import { useState, useMemo } from 'react';
import * as math from 'mathjs';

export interface ComplexImpedance {
  r: number;
  x: number;
}

export interface PolyphaseInputs {
  config: 'YY' | 'YD' | 'DY' | 'DD';
  isBalanced: boolean;
  vMag: number;
  vPhase: number;
  vType: 'line' | 'phase';
  za: ComplexImpedance;
  zb: ComplexImpedance;
  zc: ComplexImpedance;
}

export interface Phasor {
  mag: number;
  ang: number;
}

export interface PolyphaseOutputs {
  iLineA: Phasor;
  iLineB: Phasor;
  iLineC: Phasor;
  iPhaseA?: Phasor;
  iPhaseB?: Phasor;
  iPhaseC?: Phasor;
  iNeutral?: Phasor;
  P: number;
  Q: number;
  S: number;
  pf: number;
}

export function usePolyphase(initialInputs: PolyphaseInputs) {
  const [inputs, setInputs] = useState<PolyphaseInputs>(initialInputs);

  const outputs = useMemo<PolyphaseOutputs>(() => {
    const { config, isBalanced, vMag, vPhase, vType } = inputs;
    const deg2rad = Math.PI / 180;
    const rad2deg = 180 / Math.PI;

    let za = math.complex(inputs.za.r, inputs.za.x);
    let zb = isBalanced ? za : math.complex(inputs.zb.r, inputs.zb.x);
    let zc = isBalanced ? za : math.complex(inputs.zc.r, inputs.zc.x);

    // Ensure non-zero impedances to avoid division by zero
    if (za.re === 0 && za.im === 0) za = math.complex(1e-9, 0);
    if (zb.re === 0 && zb.im === 0) zb = math.complex(1e-9, 0);
    if (zc.re === 0 && zc.im === 0) zc = math.complex(1e-9, 0);

    // Source Voltages (assume positive sequence a-b-c)
    let V_an, V_bn, V_cn, V_ab, V_bc, V_ca;

    if (config.startsWith('Y')) {
      const vPhaseMag = vType === 'phase' ? vMag : vMag / Math.sqrt(3);
      const vPhaseAng = vType === 'phase' ? vPhase : vPhase - 30; // V_an lags V_ab by 30 deg in +ve sequence

      V_an = math.complex({ r: vPhaseMag, phi: vPhaseAng * deg2rad });
      V_bn = math.complex({ r: vPhaseMag, phi: (vPhaseAng - 120) * deg2rad });
      V_cn = math.complex({ r: vPhaseMag, phi: (vPhaseAng + 120) * deg2rad });

      V_ab = math.subtract(V_an, V_bn) as unknown as math.Complex;
      V_bc = math.subtract(V_bn, V_cn) as unknown as math.Complex;
      V_ca = math.subtract(V_cn, V_an) as unknown as math.Complex;
    } else {
      // Source is Delta
      const vLineMag = vType === 'line' ? vMag : vMag * Math.sqrt(3);
      const vLineAng = vPhase;

      V_ab = math.complex({ r: vLineMag, phi: vLineAng * deg2rad });
      V_bc = math.complex({ r: vLineMag, phi: (vLineAng - 120) * deg2rad });
      V_ca = math.complex({ r: vLineMag, phi: (vLineAng + 120) * deg2rad });
      
      // Equivalent Y source voltages for computation
      V_an = math.complex({ r: vLineMag / Math.sqrt(3), phi: (vLineAng - 30) * deg2rad });
      V_bn = math.complex({ r: vLineMag / Math.sqrt(3), phi: (vLineAng - 150) * deg2rad });
      V_cn = math.complex({ r: vLineMag / Math.sqrt(3), phi: (vLineAng + 90) * deg2rad });
    }

    let I_a = math.complex(0, 0);
    let I_b = math.complex(0, 0);
    let I_c = math.complex(0, 0);
    let I_ab = math.complex(0, 0);
    let I_bc = math.complex(0, 0);
    let I_ca = math.complex(0, 0);
    let I_n = math.complex(0, 0);

    let S_total = math.complex(0, 0);

    if (config.endsWith('Y')) {
      // Y-Load
      if (isBalanced) {
        I_a = math.divide(V_an, za) as unknown as math.Complex;
        I_b = math.divide(V_bn, zb) as unknown as math.Complex;
        I_c = math.divide(V_cn, zc) as unknown as math.Complex;
        I_n = math.complex(0, 0);
      } else {
        // Unbalanced Y-load (assume 4-wire with neutral connected for simplicity of Neutral current)
        // Or Millman's for 3-wire. Let's assume 4-wire with zero neutral impedance so V_nN = 0.
        // The prompt says "Calculate Neutral Current (I_n) for unbalanced Y-Y systems". This implies a 4-wire system.
        I_a = math.divide(V_an, za) as unknown as math.Complex;
        I_b = math.divide(V_bn, zb) as unknown as math.Complex;
        I_c = math.divide(V_cn, zc) as unknown as math.Complex;
        I_n = math.add(math.add(I_a, I_b), I_c) as unknown as math.Complex;
      }
      
      S_total = math.add(
        math.add(
          math.multiply(V_an, math.conj(I_a)),
          math.multiply(V_bn, math.conj(I_b))
        ),
        math.multiply(V_cn, math.conj(I_c))
      ) as unknown as math.Complex;

    } else {
      // Delta Load
      I_ab = math.divide(V_ab, za) as unknown as math.Complex;
      I_bc = math.divide(V_bc, zb) as unknown as math.Complex;
      I_ca = math.divide(V_ca, zc) as unknown as math.Complex;

      I_a = math.subtract(I_ab, I_ca) as unknown as math.Complex;
      I_b = math.subtract(I_bc, I_ab) as unknown as math.Complex;
      I_c = math.subtract(I_ca, I_bc) as unknown as math.Complex;

      S_total = math.add(
        math.add(
          math.multiply(V_ab, math.conj(I_ab)),
          math.multiply(V_bc, math.conj(I_bc))
        ),
        math.multiply(V_ca, math.conj(I_ca))
      ) as unknown as math.Complex;
    }

    const toPhasor = (c: math.Complex): Phasor => {
      const p = c.toPolar();
      return { mag: p.r, ang: p.phi * rad2deg };
    };

    const P = S_total.re;
    const Q = S_total.im;
    const S = math.abs(S_total) as number;
    const pf = S === 0 ? 0 : P / S;

    return {
      iLineA: toPhasor(I_a),
      iLineB: toPhasor(I_b),
      iLineC: toPhasor(I_c),
      iPhaseA: config.endsWith('D') ? toPhasor(I_ab) : undefined,
      iPhaseB: config.endsWith('D') ? toPhasor(I_bc) : undefined,
      iPhaseC: config.endsWith('D') ? toPhasor(I_ca) : undefined,
      iNeutral: config.endsWith('Y') ? toPhasor(I_n) : undefined,
      P,
      Q,
      S,
      pf
    };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
