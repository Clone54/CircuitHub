import { useState, useMemo } from 'react';

export interface SSInputs {
  numStr: string;
  denStr: string;
}

export function useStateSpace(initialInputs: SSInputs) {
  const [inputs, setInputs] = useState<SSInputs>(initialInputs);

  const outputs = useMemo(() => {
    let result = '';
    
    try {
      const num = inputs.numStr.split(',').map(n => parseFloat(n.trim()));
      const den = inputs.denStr.split(',').map(n => parseFloat(n.trim()));
      
      if (num.some(isNaN) || den.some(isNaN)) throw new Error("Invalid coefficients. Use comma-separated numbers.");
      if (den.length === 0 || den[0] === 0) throw new Error("Invalid denominator.");
      
      const a0 = den[0];
      const a = den.map(d => d / a0);
      let b = num.map(n => n / a0);
      
      const n = a.length - 1;
      while (b.length < n + 1) b.unshift(0);
      
      const d_val = b[0];
      const b_vals = [];
      for (let i = 1; i <= n; i++) {
        b_vals.push(b[i] - d_val * a[i]);
      }
      
      let A = Array(n).fill(0).map(() => Array(n).fill(0));
      let B = Array(n).fill(0).map(() => [0]);
      let C = [Array(n).fill(0)];
      let D = [[d_val]];
      
      for (let i = 0; i < n - 1; i++) {
        A[i][i + 1] = 1;
      }
      for (let i = 0; i < n; i++) {
        A[n - 1][i] = -a[n - i];
      }
      if (n > 0) {
        B[n - 1][0] = 1;
      }
      for (let i = 0; i < n; i++) {
        C[0][i] = b_vals[n - 1 - i];
      }
      
      if (n === 0) {
        result = `
**State-Space Representation:**

$$ A = \\begin{bmatrix} 0 \\end{bmatrix} $$
$$ B = \\begin{bmatrix} 0 \\end{bmatrix} $$
$$ C = \\begin{bmatrix} 0 \\end{bmatrix} $$
$$ D = \\begin{bmatrix} ${d_val.toFixed(4)} \\end{bmatrix} $$
`;
      } else {
        result = `
**State-Space Representation (Controllable Canonical Form):**

$$ A = \\begin{bmatrix} ${A.map(row => row.map(v => Number(v.toFixed(4))).join(' & ')).join(' \\\\ ')} \\end{bmatrix} $$

$$ B = \\begin{bmatrix} ${B.map(row => row.map(v => Number(v.toFixed(4))).join(' & ')).join(' \\\\ ')} \\end{bmatrix} $$

$$ C = \\begin{bmatrix} ${C.map(row => row.map(v => Number(v.toFixed(4))).join(' & ')).join(' \\\\ ')} \\end{bmatrix} $$

$$ D = \\begin{bmatrix} ${D.map(row => row.map(v => Number(v.toFixed(4))).join(' & ')).join(' \\\\ ')} \\end{bmatrix} $$
`;
      }
    } catch (e: any) {
      result = `*Error: ${e.message}*`;
    }
    
    return { markdown: result };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
