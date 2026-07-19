import { useMemo, useState } from 'react';

export interface SParam {
  mag: number;
  phase: number; // in degrees
}

export type MatrixSize = 2 | 3;

// Helper to convert polar complex to cartesian complex
interface Complex {
  r: number;
  i: number;
}

function polarToCartesian(mag: number, phaseDeg: number): Complex {
  const rad = (phaseDeg * Math.PI) / 180;
  return {
    r: mag * Math.cos(rad),
    i: mag * Math.sin(rad)
  };
}

// Complex number helpers
const complexAdd = (c1: Complex, c2: Complex): Complex => ({
  r: c1.r + c2.r,
  i: c1.i + c2.i
});

const complexConj = (c: Complex): Complex => ({
  r: c.r,
  i: -c.i
});

const complexMul = (c1: Complex, c2: Complex): Complex => ({
  r: c1.r * c2.r - c1.i * c2.i,
  i: c1.r * c2.i + c1.i * c2.r
});

export function useSParameters() {
  const [size, setSize] = useState<MatrixSize>(2);

  // Initialize a 3x3 matrix state, so we can support both 2x2 and 3x3 dynamically
  const [matrix, setMatrix] = useState<SParam[][]>([
    [
      { mag: 0.1, phase: 90 },
      { mag: 0.7, phase: 0 },
      { mag: 0.7, phase: -90 }
    ],
    [
      { mag: 0.7, phase: 0 },
      { mag: 0.15, phase: 90 },
      { mag: 0.05, phase: 180 }
    ],
    [
      { mag: 0.7, phase: -90 },
      { mag: 0.05, phase: 180 },
      { mag: 0.1, phase: 90 }
    ]
  ]);

  const updateCell = (row: number, col: number, key: 'mag' | 'phase', value: number) => {
    setMatrix((prev) => {
      const copy = prev.map((r) => r.map((c) => ({ ...c })));
      // Constrain magnitude to [0, 1]
      let val = value;
      if (key === 'mag') {
        val = Math.max(0, Math.min(1, value));
      } else {
        // Normalize phase to [-180, 360]
        val = value;
      }
      copy[row][col][key] = val;
      return copy;
    });
  };

  const sMetrics = useMemo(() => {
    // 1. Get current active sub-matrix
    const activeMatrix: Complex[][] = [];
    for (let i = 0; i < size; i++) {
      activeMatrix.push([]);
      for (let j = 0; j < size; j++) {
        activeMatrix[i].push(polarToCartesian(matrix[i][j].mag, matrix[i][j].phase));
      }
    }

    // 2. Compute RF metrics in dB
    // Return Loss (dB) = -20 * log10(|S11|)
    const s11_mag = matrix[0][0].mag;
    const returnLoss = s11_mag > 0 ? -20 * Math.log10(s11_mag) : 999.9;

    // Insertion Loss (dB) = -20 * log10(|S21|)
    const s21_mag = matrix[1][0].mag;
    const insertionLoss = s21_mag > 0 ? -20 * Math.log10(s21_mag) : 999.9;

    // Isolation (dB)
    // 2x2: Isolation from S12
    // 3x3: Isolation from S31 (or S12 depending on configuration, let's show S31)
    const s12_mag = matrix[0][1].mag;
    const isolationS12 = s12_mag > 0 ? -20 * Math.log10(s12_mag) : 999.9;

    let isolationS31 = 999.9;
    if (size === 3) {
      const s31_mag = matrix[2][0].mag;
      isolationS31 = s31_mag > 0 ? -20 * Math.log10(s31_mag) : 999.9;
    }

    // 3. Properties check (Boolean Badges)
    // Reciprocal check: S_ij = S_ji for all i != j
    let isReciprocal = true;
    const tolerance = 0.01;
    for (let i = 0; i < size; i++) {
      for (let j = i + 1; j < size; j++) {
        const diffReal = activeMatrix[i][j].r - activeMatrix[j][i].r;
        const diffImag = activeMatrix[i][j].i - activeMatrix[j][i].i;
        const diffMag = Math.sqrt(diffReal * diffReal + diffImag * diffImag);
        if (diffMag > tolerance) {
          isReciprocal = false;
        }
      }
    }

    // Lossless (Unitary) check: S^\dagger * S = I
    // Meaning:
    // a) Sum of magnitude squared of elements in each column = 1
    // b) Complex dot product of different columns = 0
    let isLossless = true;
    const unitaryTolerance = 0.05;

    // a) Column magnitude sum check
    for (let col = 0; col < size; col++) {
      let sumMagSq = 0;
      for (let row = 0; row < size; row++) {
        sumMagSq += Math.pow(matrix[row][col].mag, 2);
      }
      if (Math.abs(sumMagSq - 1.0) > unitaryTolerance) {
        isLossless = false;
        break;
      }
    }

    // b) Orthogonality of columns check
    if (isLossless) {
      for (let c1 = 0; c1 < size; c1++) {
        for (let c2 = c1 + 1; c2 < size; c2++) {
          let dotProduct: Complex = { r: 0, i: 0 };
          for (let row = 0; row < size; row++) {
            const val1 = activeMatrix[row][c1];
            const val2 = activeMatrix[row][c2];
            // conj(val1) * val2
            const term = complexMul(complexConj(val1), val2);
            dotProduct = complexAdd(dotProduct, term);
          }
          const dotProductMag = Math.sqrt(dotProduct.r * dotProduct.r + dotProduct.i * dotProduct.i);
          if (dotProductMag > unitaryTolerance) {
            isLossless = false;
            break;
          }
        }
        if (!isLossless) break;
      }
    }

    return {
      returnLoss: returnLoss > 100 ? '∞' : parseFloat(returnLoss.toFixed(2)),
      insertionLoss: insertionLoss > 100 ? '∞' : parseFloat(insertionLoss.toFixed(2)),
      isolationS12: isolationS12 > 100 ? '∞' : parseFloat(isolationS12.toFixed(2)),
      isolationS31: isolationS31 > 100 ? '∞' : parseFloat(isolationS31.toFixed(2)),
      isReciprocal,
      isLossless
    };
  }, [matrix, size]);

  return {
    size,
    setSize,
    matrix,
    updateCell,
    sMetrics
  };
}
