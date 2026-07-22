import React from 'react';
import { Terminal, Cpu, Loader2, Sparkles, Code2, HelpCircle } from 'lucide-react';

interface MatlabEditorProps {
  codeScript: string;
  setCodeScript: (code: string) => void;
  isParsing: boolean;
  error: string | null;
  onParse: () => void;
}

const SAMPLE_SCRIPTS = [
  {
    title: 'Hysteresis Loop (V vs I)',
    script: `% Hysteresis loop data points for MOSFET Drain Characteristics
V_inc = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
I_inc = [0, 0.12, 0.45, 1.05, 1.95, 3.10, 4.40, 5.80, 7.20, 8.50, 9.60];

V_dec = [5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.5, 0];
I_dec = [9.60, 8.80, 7.80, 6.60, 5.20, 3.80, 2.50, 1.45, 0.65, 0.18, 0];

plot(V_inc, I_inc, 'b-o', 'DisplayName', 'Increasing Voltage');
hold on;
plot(V_dec, I_dec, 'r-s', 'DisplayName', 'Decreasing Voltage');
xlabel('Voltage - V_ds (V)');
ylabel('Drain Current - I_d (mA)');`
  },
  {
    title: 'Sinusoidal AC Waveforms',
    script: `% Multi-phase AC Voltage Waveforms
t = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20];
V_phaseA = [0, 3.1, 5.9, 8.1, 9.5, 10.0, 9.5, 8.1, 5.9, 3.1, 0, -5.9, -9.5, -9.5, -5.9, 0];
V_phaseB = [-8.66, -5.0, 0, 5.0, 8.66, 10.0, 8.66, 5.0, 0, -5.0, -8.66, -8.66, 0, 8.66, 8.66, -8.66];

xlabel('Time - t (ms)');
ylabel('Voltage - v(t) (V)');`
  },
  {
    title: 'BJT Output Family Curves',
    script: `% BJT Collector Characteristics I_c vs V_ce for various I_b
V_ce = [0, 0.2, 0.5, 1.0, 2.0, 4.0, 6.0, 8.0, 10.0];
Ic_Ib1 = [0, 0.8, 1.8, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5]; % Ib = 10uA
Ic_Ib2 = [0, 1.5, 3.8, 4.0, 4.2, 4.4, 4.6, 4.8, 5.0]; % Ib = 20uA
Ic_Ib3 = [0, 2.2, 5.8, 6.1, 6.4, 6.7, 7.0, 7.3, 7.6]; % Ib = 30uA

xlabel('Collector Voltage - V_ce (V)');
ylabel('Collector Current - I_c (mA)');`
  },
  {
    title: 'RC Circuit Step Response',
    script: `% RC Circuit Step Charge and Discharge
t_ms = [0, 2, 4, 6, 8, 10, 15, 20, 25, 30];
Vc_charge = [0, 1.81, 3.29, 4.51, 5.50, 6.32, 7.76, 8.64, 9.17, 9.50];
Vc_discharge = [10.0, 8.19, 6.70, 5.48, 4.49, 3.67, 2.23, 1.35, 0.82, 0.49];

xlabel('Time - t (ms)');
ylabel('Capacitor Voltage - V_c (V)');`
  }
];

export const MatlabEditor: React.FC<MatlabEditorProps> = ({
  codeScript,
  setCodeScript,
  isParsing,
  error,
  onParse
}) => {
  return (
    <div className="space-y-6">
      {/* Sample Template Buttons */}
      <div className="bg-navy-dark/70 border border-navy-light/60 p-4 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-accent uppercase tracking-wider">
          <Sparkles className="h-4 w-4" />
          <span>Load MATLAB Sample Scripts:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_SCRIPTS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setCodeScript(s.script)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-navy-light/50 hover:bg-navy-light border border-navy-light/80 text-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Code2 className="h-3.5 w-3.5 text-emerald-accent" />
              <span>{s.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MATLAB Script Code Editor */}
      <div className="bg-navy-dark/80 border border-navy-light/80 rounded-xl overflow-hidden shadow-xl">
        <div className="bg-navy-dark border-b border-navy-light/60 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
            </div>
            <span className="text-xs font-mono text-slate-400 ml-2">script.m</span>
          </div>
          <div className="text-[11px] font-mono text-emerald-accent/80 flex items-center gap-1">
            <Terminal className="h-3.5 w-3.5" />
            <span>MATLAB Syntax Engine</span>
          </div>
        </div>

        <div className="p-4 relative">
          <textarea
            value={codeScript}
            onChange={(e) => setCodeScript(e.target.value)}
            placeholder={`% Paste MATLAB script here (e.g., V vs I with hysteresis)\nV_inc = [0 0.5 1.0 1.5 2.0];\nI_inc = [0 0.2 0.8 1.9 3.5];\nV_dec = [2.0 1.5 1.0 0.5 0];\nI_dec = [3.2 1.6 0.7 0.1 0];`}
            rows={10}
            className="w-full bg-black/40 border border-navy-light/60 rounded-lg p-3.5 text-xs font-mono text-slate-100 focus:border-emerald-accent focus:outline-none leading-relaxed resize-y"
          />
        </div>

        {/* Action Button */}
        <div className="bg-navy-dark border-t border-navy-light/60 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 text-emerald-accent shrink-0" />
            <span>AI extracts multi-variable vectors, loop sweeps, labels & legends automatically.</span>
          </div>
          <button
            onClick={onParse}
            disabled={isParsing || !codeScript.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-accent hover:bg-emerald-400 disabled:opacity-50 text-navy-dark font-bold text-xs transition-all shadow-md cursor-pointer ml-auto"
          >
            {isParsing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Compiling...</span>
              </>
            ) : (
              <>
                <Cpu className="h-4 w-4" />
                <span>▶ Run Code (AI Execute)</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Output Console */}
      <div className="bg-black/60 border border-navy-light/40 rounded-xl overflow-hidden shadow-inner">
        <div className="bg-navy-dark/90 px-4 py-2 border-b border-navy-light/30 flex items-center">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Output Console</span>
        </div>
        <div className="p-4 font-mono text-xs h-24 overflow-y-auto">
          {isParsing ? (
            <span className="text-emerald-accent/80 animate-pulse">Status: Compiling and parsing via AI...</span>
          ) : error ? (
            <span className="text-red-400">Compilation Error: {error}</span>
          ) : (
            <span className="text-slate-400">Ready. Awaiting execution.</span>
          )}
        </div>
      </div>
    </div>
  );
};
