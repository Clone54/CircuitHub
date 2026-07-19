import { useState, useMemo } from 'react';
import * as math from 'mathjs';

export interface ComplexVal {
  r: number;
  x: number;
}

export interface TwoPortInputs {
  type: 'Z' | 'Y' | 'ABCD' | 'h';
  m11: ComplexVal;
  m12: ComplexVal;
  m21: ComplexVal;
  m22: ComplexVal;
}

export type Matrix2x2 = [[math.Complex, math.Complex], [math.Complex, math.Complex]];

export interface TwoPortOutputs {
  Z?: Matrix2x2;
  Y?: Matrix2x2;
  ABCD?: Matrix2x2;
  h?: Matrix2x2;
  error?: string;
}

export function useTwoPort(initialInputs: TwoPortInputs) {
  const [inputs, setInputs] = useState<TwoPortInputs>(initialInputs);

  const outputs = useMemo<TwoPortOutputs>(() => {
    try {
      const { type, m11, m12, m21, m22 } = inputs;
      const in11 = math.complex(m11.r, m11.x);
      const in12 = math.complex(m12.r, m12.x);
      const in21 = math.complex(m21.r, m21.x);
      const in22 = math.complex(m22.r, m22.x);

      let Z: Matrix2x2 | undefined;

      // Helper to check for zero
      const isZero = (c: math.Complex) => Math.abs(c.re) < 1e-10 && Math.abs(c.im) < 1e-10;
      
      const det = (m: Matrix2x2) => math.subtract(math.multiply(m[0][0], m[1][1]), math.multiply(m[0][1], m[1][0])) as math.Complex;

      if (type === 'Z') {
        Z = [[in11, in12], [in21, in22]];
      } else if (type === 'Y') {
        const Y_mat = [[in11, in12], [in21, in22]];
        const dY = det(Y_mat as Matrix2x2);
        if (isZero(dY)) throw new Error("Y matrix is singular; Z parameters do not exist.");
        Z = [
          [math.divide(in22, dY) as math.Complex, math.divide(math.unaryMinus(in12), dY) as math.Complex],
          [math.divide(math.unaryMinus(in21), dY) as math.Complex, math.divide(in11, dY) as math.Complex]
        ];
      } else if (type === 'ABCD') {
        if (isZero(in21)) throw new Error("C parameter is zero; Z parameters do not exist.");
        const detABCD = math.subtract(math.multiply(in11, in22), math.multiply(in12, in21)) as math.Complex;
        Z = [
          [math.divide(in11, in21) as math.Complex, math.divide(detABCD, in21) as math.Complex],
          [math.divide(math.complex(1, 0), in21) as math.Complex, math.divide(in22, in21) as math.Complex]
        ];
      } else if (type === 'h') {
        if (isZero(in22)) throw new Error("h22 is zero; Z parameters do not exist.");
        const deth = math.subtract(math.multiply(in11, in22), math.multiply(in12, in21)) as math.Complex;
        Z = [
          [math.divide(deth, in22) as math.Complex, math.divide(in12, in22) as math.Complex],
          [math.divide(math.unaryMinus(in21), in22) as math.Complex, math.divide(math.complex(1, 0), in22) as math.Complex]
        ];
      }

      if (!Z) throw new Error("Conversion failed.");

      const z11 = Z[0][0];
      const z12 = Z[0][1];
      const z21 = Z[1][0];
      const z22 = Z[1][1];
      const detZ = det(Z);

      let Y: Matrix2x2 | undefined;
      if (!isZero(detZ)) {
        Y = [
          [math.divide(z22, detZ) as math.Complex, math.divide(math.unaryMinus(z12), detZ) as math.Complex],
          [math.divide(math.unaryMinus(z21), detZ) as math.Complex, math.divide(z11, detZ) as math.Complex]
        ];
      }

      let ABCD: Matrix2x2 | undefined;
      if (!isZero(z21)) {
        ABCD = [
          [math.divide(z11, z21) as math.Complex, math.divide(detZ, z21) as math.Complex],
          [math.divide(math.complex(1, 0), z21) as math.Complex, math.divide(z22, z21) as math.Complex]
        ];
      }

      let h: Matrix2x2 | undefined;
      if (!isZero(z22)) {
        h = [
          [math.divide(detZ, z22) as math.Complex, math.divide(z12, z22) as math.Complex],
          [math.divide(math.unaryMinus(z21), z22) as math.Complex, math.divide(math.complex(1, 0), z22) as math.Complex]
        ];
      }

      return { Z, Y, ABCD, h };

    } catch (err: any) {
      return { error: err.message || "Invalid input parameters." };
    }
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
