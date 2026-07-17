import React, { useState, useEffect } from 'react';
import { AlertCircle, HelpCircle, Sparkles, CheckCircle } from 'lucide-react';

const PRESETS = [
  { label: "De Morgan's Law", expr: "NOT (A AND B)" },
  { label: "XOR Equivalent", expr: "(A AND NOT B) OR (NOT A AND B)" },
  { label: "Majority Vote (Carry Out)", expr: "(A AND B) OR (B AND C) OR (A AND C)" },
  { label: "MUX 2-to-1 (A select S)", expr: "(A AND NOT C) OR (B AND C)" }
];

export default function TruthTableGen() {
  const [expression, setExpression] = useState<string>('A AND B OR NOT C');
  const [varsUsed, setVarsUsed] = useState<string[]>(['A', 'B', 'C']);
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [displayFormat, setDisplayFormat] = useState<'binary' | 'boolean'>('binary');

  useEffect(() => {
    try {
      setError('');
      
      // 1. Scan expression for unique variables out of A, B, C, D
      const upperExpr = expression.toUpperCase();
      const detectedVars: string[] = [];
      ['A', 'B', 'C', 'D'].forEach(v => {
        // Use regex boundary to match letters as words only (not inside words like AND, OR, NOT, XOR)
        const reg = new RegExp(`\\b${v}\\b`);
        if (reg.test(upperExpr)) {
          detectedVars.push(v);
        }
      });

      // Default to A, B if no variables are typed yet
      const finalVars = detectedVars.length > 0 ? detectedVars : ['A', 'B'];
      setVarsUsed(finalVars);

      // 2. Generate combinations (2 ^ n rows)
      const numVars = finalVars.length;
      const totalCombinations = Math.pow(2, numVars);
      const tempRows = [];

      for (let i = 0; i < totalCombinations; i++) {
        const rowVals: Record<string, boolean> = {};
        
        // Map bit values
        finalVars.forEach((v, index) => {
          const shift = numVars - 1 - index;
          const bit = (i >> shift) & 1;
          rowVals[v] = bit === 1;
        });

        // Evaluate expression for this row
        const result = evaluateBooleanExpression(expression, finalVars, rowVals);
        tempRows.push({
          inputs: rowVals,
          output: result
        });
      }

      setRows(tempRows);
    } catch (err: any) {
      setError(err.message);
      setRows([]);
    }
  }, [expression]);

  const evaluateBooleanExpression = (
    expr: string,
    vars: string[],
    values: Record<string, boolean>
  ): boolean => {
    if (!expr.trim()) return false;

    let cleaned = expr.toUpperCase();
    
    // Replace English logical words with JavaScript operations
    cleaned = cleaned.replace(/\bAND\b/g, '&&');
    cleaned = cleaned.replace(/\bOR\b/g, '||');
    cleaned = cleaned.replace(/\bXOR\b/g, '^');
    cleaned = cleaned.replace(/\bNOT\b/g, '!');
    
    // Replace symbolic alternatives
    cleaned = cleaned.replace(/&/g, '&&');
    cleaned = cleaned.replace(/\|/g, '||');
    cleaned = cleaned.replace(/~/g, '!');
    cleaned = cleaned.replace(/\+/g, '||');
    cleaned = cleaned.replace(/\*/g, '&&');

    // Clean duplicate operators
    cleaned = cleaned.replace(/&&+/g, '&&');
    cleaned = cleaned.replace(/\|\|+/g, '||');

    // Security sanitization. Ensure only valid characters/variables/operators remain
    // Allowed characters: A, B, C, D, &, |, !, ^, (, ), space
    const safeCharsOnly = cleaned.replace(/\s/g, '');
    const safeRegex = /^[ABCD&|!^()]+$/;

    if (safeCharsOnly.length > 0 && !safeRegex.test(safeCharsOnly)) {
      throw new Error("Invalid operators or variables. Please use variables A, B, C, D and operators AND, OR, NOT, XOR.");
    }

    // Replace variables with actual values
    let evalStr = cleaned;
    vars.forEach(v => {
      const reg = new RegExp(`\\b${v}\\b`, 'g');
      evalStr = evalStr.replace(reg, values[v] ? 'true' : 'false');
    });

    // Safely execute the boolean function
    try {
      const evaluator = new Function(`return !!(${evalStr});`);
      return evaluator();
    } catch (e) {
      throw new Error("Syntax error in logical expression. Check parentheses or operators.");
    }
  };

  const formatValue = (val: boolean) => {
    if (displayFormat === 'binary') {
      return val ? '1' : '0';
    }
    return val ? 'T' : 'F';
  };

  return (
    <div id="truth-table-gen" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Input Section */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase border-b border-navy-light pb-2">
            Logic Expression
          </h3>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Enter Boolean Expression
            </label>
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="e.g., (A AND B) OR NOT C"
              className="w-full rounded-lg bg-navy-light/30 border border-navy-light px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-accent/50 transition-colors"
            />
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <span className="block text-[11px] font-mono text-slate-400 uppercase tracking-widest">
              EEE Logic Presets
            </span>
            <div className="grid grid-cols-1 gap-2">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setExpression(p.expr)}
                  className="text-left w-full text-xs p-2.5 rounded bg-navy-light/10 hover:bg-navy-light/30 border border-navy-light/40 hover:border-emerald-accent/20 text-slate-300 hover:text-white transition-all duration-150 flex items-center justify-between cursor-pointer"
                >
                  <span className="font-semibold">{p.label}</span>
                  <span className="font-mono text-[10px] text-emerald-accent bg-emerald-accent/5 px-1.5 py-0.5 rounded border border-emerald-accent/10">
                    {p.expr}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-lg border border-red-500/25 bg-red-500/5 flex gap-2">
              <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-300 font-mono leading-relaxed">{error}</p>
            </div>
          )}

          <div className="p-3.5 rounded-lg bg-navy-light/20 border border-navy-light/50 flex gap-2.5">
            <HelpCircle className="h-4.5 w-4.5 text-emerald-accent shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-300 leading-relaxed space-y-1">
              <span><strong>Supported Operators:</strong></span>
              <ul className="list-disc pl-4 space-y-0.5 font-mono text-[10px] text-slate-400">
                <li>Conjunction (AND): <code>AND</code>, <code>&amp;</code>, <code>*</code></li>
                <li>Disjunction (OR): <code>OR</code>, <code>|</code>, <code>+</code></li>
                <li>Negation (NOT): <code>NOT</code>, <code>!</code>, <code>~</code></li>
                <li>Exclusive-OR (XOR): <code>XOR</code>, <code>^</code></li>
              </ul>
              <span className="block pt-1 text-slate-400">Use parentheses to define precedence.</span>
            </div>
          </div>
        </div>

        {/* Right Output Section */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center border-b border-navy-light pb-2">
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
              Truth Table Output
            </h3>
            
            {/* Binary vs Boolean Toggle */}
            <div className="flex bg-navy-light/40 border border-navy-light rounded p-0.5">
              <button
                onClick={() => setDisplayFormat('binary')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wider transition-all cursor-pointer ${
                  displayFormat === 'binary' ? 'bg-emerald-accent text-navy-dark font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                0 / 1
              </button>
              <button
                onClick={() => setDisplayFormat('boolean')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wider transition-all cursor-pointer ${
                  displayFormat === 'boolean' ? 'bg-emerald-accent text-navy-dark font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                T / F
              </button>
            </div>
          </div>

          {rows.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-navy-light bg-navy-dark/40">
              <table className="w-full text-center border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-navy-light/30 border-b border-navy-light text-slate-300">
                    <th className="py-2.5 px-4 text-slate-400 border-r border-navy-light">Row</th>
                    {varsUsed.map(v => (
                      <th key={v} className="py-2.5 px-4 font-bold border-r border-navy-light text-slate-200">
                        {v}
                      </th>
                    ))}
                    <th className="py-2.5 px-4 text-emerald-accent font-black">
                      Output (Y)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-light/40">
                  {rows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-navy-light/10 transition-colors ${
                        row.output ? 'bg-emerald-accent/[0.02]' : ''
                      }`}
                    >
                      <td className="py-2 px-4 text-[10px] text-slate-500 border-r border-navy-light">{idx + 1}</td>
                      {varsUsed.map(v => (
                        <td
                          key={v}
                          className={`py-2 px-4 border-r border-navy-light ${
                            row.inputs[v] ? 'text-blue-400 font-semibold' : 'text-slate-500'
                          }`}
                        >
                          {formatValue(row.inputs[v])}
                        </td>
                      ))}
                      <td
                        className={`py-2 px-4 font-bold ${
                          row.output ? 'text-emerald-accent drop-shadow-[0_0_2px_rgba(16,185,129,0.2)]' : 'text-slate-500'
                        }`}
                      >
                        {formatValue(row.output)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed border-navy-light rounded-xl text-slate-500 text-xs">
              <AlertCircle className="h-6 w-6 text-slate-600 mb-2" />
              <span>Enter a valid boolean logic expression to generate the truth table.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
