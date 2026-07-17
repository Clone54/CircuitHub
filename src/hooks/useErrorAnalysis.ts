import { useState, useMemo } from 'react';

export interface ErrorInputs {
  equationType: 'R_VI' | 'P_VI' | 'Generic';
  val1: number;
  err1: number;
  err1Type: 'abs' | 'pct';
  val2: number;
  err2: number;
  err2Type: 'abs' | 'pct';
  power1: number; // for Generic
  power2: number; // for Generic
}

export interface ErrorOutputs {
  nominal: number;
  absError: number;
  pctError: number;
  stepsMarkdown: string;
}

export function useErrorAnalysis(initialInputs: ErrorInputs) {
  const [inputs, setInputs] = useState<ErrorInputs>(initialInputs);

  const outputs = useMemo<ErrorOutputs>(() => {
    const { equationType, val1, err1, err1Type, val2, err2, err2Type, power1, power2 } = inputs;
    
    let nominal = 0;
    let pct1 = err1Type === 'pct' ? err1 : (val1 ? (err1 / Math.abs(val1)) * 100 : 0);
    let pct2 = err2Type === 'pct' ? err2 : (val2 ? (err2 / Math.abs(val2)) * 100 : 0);
    
    let pctError = 0;
    let steps = '';

    if (equationType === 'R_VI') {
      nominal = val1 / (val2 || 1);
      pctError = pct1 + pct2;
      steps = `
**Equation**: $R = \\\\frac{V}{I}$

1. **Calculate Nominal Value**: 
   $R = \\\\frac{\${val1}}{\${val2}} = \${nominal.toFixed(4)}$

2. **Convert Errors to Percentages**:
   $\\\\%\\\\text{Error in } V = \${pct1.toFixed(2)}\\\\%$
   $\\\\%\\\\text{Error in } I = \${pct2.toFixed(2)}\\\\%$

3. **Propagate Error (Division)**:
   For division, percentage errors are added.
   $\\\\%\\\\text{Error in } R = \${pct1.toFixed(2)}\\\\% + \${pct2.toFixed(2)}\\\\% = \${pctError.toFixed(2)}\\\\%$
`;
    } else if (equationType === 'P_VI') {
      nominal = val1 * val2;
      pctError = pct1 + pct2;
      steps = `
**Equation**: $P = V \\\\times I$

1. **Calculate Nominal Value**: 
   $P = \${val1} \\\\times \${val2} = \${nominal.toFixed(4)}$

2. **Convert Errors to Percentages**:
   $\\\\%\\\\text{Error in } V = \${pct1.toFixed(2)}\\\\%$
   $\\\\%\\\\text{Error in } I = \${pct2.toFixed(2)}\\\\%$

3. **Propagate Error (Multiplication)**:
   For multiplication, percentage errors are added.
   $\\\\%\\\\text{Error in } P = \${pct1.toFixed(2)}\\\\% + \${pct2.toFixed(2)}\\\\% = \${pctError.toFixed(2)}\\\\%$
`;
    } else {
      nominal = Math.pow(val1, power1) * Math.pow(val2, power2);
      pctError = Math.abs(power1) * pct1 + Math.abs(power2) * pct2;
      steps = `
**Equation**: $A = X^{\${power1}} \\\\times Y^{\${power2}}$

1. **Calculate Nominal Value**: 
   $A = (\${val1})^{\${power1}} \\\\times (\${val2})^{\${power2}} = \${nominal.toFixed(4)}$

2. **Convert Errors to Percentages**:
   $\\\\%\\\\text{Error in } X = \${pct1.toFixed(2)}\\\\%$
   $\\\\%\\\\text{Error in } Y = \${pct2.toFixed(2)}\\\\%$

3. **Propagate Error**:
   $\\\\%\\\\text{Error in } A = |\${power1}| \\\\times \${pct1.toFixed(2)}\\\\% + |\${power2}| \\\\times \${pct2.toFixed(2)}\\\\% = \${pctError.toFixed(2)}\\\\%$
`;
    }

    const absError = Math.abs(nominal) * (pctError / 100);
    
    return { nominal, absError, pctError, stepsMarkdown: steps };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
