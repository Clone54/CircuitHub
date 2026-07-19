import React, { useState, useEffect } from 'react';
import { AlertCircle, HelpCircle, ShieldCheck } from 'lucide-react';

export default function BJTCalc() {
  // Inputs
  const [vcc, setVcc] = useState<number>(12);
  const [r1, setR1] = useState<number>(33); // kΩ
  const [r2, setR2] = useState<number>(10); // kΩ
  const [rc, setRc] = useState<number>(2.2); // kΩ
  const [re, setRe] = useState<number>(1.0); // kΩ
  const [beta, setBeta] = useState<number>(100);

  // Outputs
  const [vth, setVth] = useState<number>(0);
  const [rth, setRth] = useState<number>(0);
  const [ib, setIb] = useState<number>(0); // mA
  const [ic, setIc] = useState<number>(0); // mA
  const [ie, setIe] = useState<number>(0); // mA
  const [vb, setVb] = useState<number>(0); // V
  const [ve, setVe] = useState<number>(0); // V
  const [vc, setVc] = useState<number>(0); // V
  const [vce, setVce] = useState<number>(0); // V
  const [region, setRegion] = useState<string>('ACTIVE');
  const [regionColor, setRegionColor] = useState<string>('text-emerald-accent border-emerald-accent/20 bg-emerald-accent/10');
  const [warningMessage, setWarningMessage] = useState<string>('');

  useEffect(() => {
    // Check for negative or zero values
    if (r1 <= 0 || r2 <= 0 || rc < 0 || re < 0 || beta <= 0 || vcc <= 0) {
      return;
    }

    const Vbe = 0.7; // Standard silicon BJT base-emitter forward voltage drop

    // 1. Calculate Thevenin equivalents
    const calculatedRth = (r1 * r2) / (r1 + r2); // kΩ
    const calculatedVth = (vcc * r2) / (r1 + r2); // V

    setRth(calculatedRth);
    setVth(calculatedVth);

    // 2. Base current Ib using exact loops (Vth - Ib*Rth - Vbe - Ie*Re = 0)
    // where Ie = (Beta + 1)*Ib
    // Vth - Vbe = Ib * (Rth + (Beta + 1)*Re)
    const denominator = calculatedRth + (beta + 1) * re;
    let calculatedIb = 0; // mA

    if (calculatedVth > Vbe) {
      calculatedIb = (calculatedVth - Vbe) / denominator; // mA
    }

    if (calculatedIb <= 0) {
      // Cutoff Region
      setIb(0);
      setIc(0);
      setIe(0);
      setVb(calculatedVth);
      setVe(0);
      setVc(vcc);
      setVce(vcc);
      setRegion('CUTOFF');
      setRegionColor('text-amber-400 border-amber-500/20 bg-amber-500/10');
      setWarningMessage('Transistor is in CUTOFF. The base-emitter junction is not forward biased because V_th is less than V_be (0.7V). No current flows.');
    } else {
      // Try active region first
      const activeIc = beta * calculatedIb; // mA
      const activeIe = (beta + 1) * calculatedIb; // mA
      const activeVe = activeIe * re; // V
      const activeVc = vcc - activeIc * rc; // V
      const activeVce = activeVc - activeVe; // V

      if (activeVce <= 0.2) {
        // Saturation Region
        const Vce_sat = 0.2; // V
        // For saturation, we approximate Ic_sat using the load line limit
        const icSat = (vcc - Vce_sat) / (rc + re); // mA
        const ibMinSat = icSat / beta; // Minimum base current to saturate

        setIb(calculatedIb);
        setIc(icSat);
        setIe(icSat);
        const calculatedVe = icSat * re;
        setVe(calculatedVe);
        setVb(calculatedVe + Vbe);
        setVc(calculatedVe + Vce_sat);
        setVce(Vce_sat);
        setRegion('SATURATION');
        setRegionColor('text-red-400 border-red-500/20 bg-red-500/10');
        setWarningMessage(`Transistor is in SATURATION. The base current (I_b = ${calculatedIb.toFixed(3)} mA) is greater than the threshold needed for saturation (I_b(min) = ${ibMinSat.toFixed(3)} mA). V_ce is locked at ~0.2V.`);
      } else {
        // Active Region
        setIb(calculatedIb);
        setIc(activeIc);
        setIe(activeIe);
        setVb(activeVe + Vbe);
        setVe(activeVe);
        setVc(activeVc);
        setVce(activeVce);
        setRegion('ACTIVE (AMPLIFIER)');
        setRegionColor('text-emerald-accent border-emerald-accent/20 bg-emerald-accent/10');
        setWarningMessage('');
      }
    }
  }, [vcc, r1, r2, rc, re, beta]);

  return (
    <div id="bjt-calc" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Card */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase border-b border-navy-light pb-2">
            Bias Network Inputs
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">V_CC (Supply, V)</label>
              <input
                type="number"
                min="1"
                step="any"
                value={vcc}
                onChange={(e) => setVcc(Math.max(1, parseFloat(e.target.value) || 1))}
                className="w-full rounded-lg bg-navy-light/30 border border-navy-light px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-accent/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Beta (β / h_FE)</label>
              <input
                type="number"
                min="10"
                step="any"
                value={beta}
                onChange={(e) => setBeta(Math.max(10, parseInt(e.target.value, 10) || 10))}
                className="w-full rounded-lg bg-navy-light/30 border border-navy-light px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-accent/50 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">R₁ (Divider Top, kΩ)</label>
              <input
                type="number"
                min="0.1"
                step="any"
                value={r1}
                onChange={(e) => setR1(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                className="w-full rounded-lg bg-navy-light/30 border border-navy-light px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-accent/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">R₂ (Divider Bottom, kΩ)</label>
              <input
                type="number"
                min="0.1"
                step="any"
                value={r2}
                onChange={(e) => setR2(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                className="w-full rounded-lg bg-navy-light/30 border border-navy-light px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-accent/50 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">R_C (Collector, kΩ)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={rc}
                onChange={(e) => setRc(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full rounded-lg bg-navy-light/30 border border-navy-light px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-accent/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">R_E (Emitter, kΩ)</label>
              <input
                type="number"
                min="0.01"
                step="any"
                value={re}
                onChange={(e) => setRe(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                className="w-full rounded-lg bg-navy-light/30 border border-navy-light px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-accent/50 transition-colors"
              />
            </div>
          </div>

          {/* Region Status Indicator */}
          <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${regionColor}`}>
            <span className="text-[10px] font-mono tracking-widest uppercase opacity-75">TRANSISTOR REGION</span>
            <span className="text-base font-black tracking-wide mt-1">{region}</span>
          </div>

          {warningMessage && (
            <div className="p-3 rounded-lg border border-red-500/10 bg-red-500/5 flex gap-2">
              <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-300 leading-relaxed">{warningMessage}</p>
            </div>
          )}
        </div>

        {/* Right Outputs and Interactive Circuit Diagram */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Output Readings */}
          <div className="md:col-span-5 space-y-3">
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase border-b border-navy-light pb-2">
              Calculated Q-Point
            </h3>

            <div className="space-y-2 font-mono">
              <div className="p-2.5 rounded bg-navy-light/20 border border-navy-light/30 flex justify-between items-center text-xs">
                <span className="text-slate-400">V_B (Base)</span>
                <span className="font-bold text-white">{vb.toFixed(3)} V</span>
              </div>
              <div className="p-2.5 rounded bg-navy-light/20 border border-navy-light/30 flex justify-between items-center text-xs">
                <span className="text-slate-400">V_C (Collector)</span>
                <span className="font-bold text-white">{vc.toFixed(3)} V</span>
              </div>
              <div className="p-2.5 rounded bg-navy-light/20 border border-navy-light/30 flex justify-between items-center text-xs">
                <span className="text-slate-400">V_E (Emitter)</span>
                <span className="font-bold text-white">{ve.toFixed(3)} V</span>
              </div>
              <div className="p-2.5 rounded bg-navy-light/20 border border-navy-light/30 flex justify-between items-center text-xs">
                <span className="text-emerald-accent font-semibold">V_CE (Operating)</span>
                <span className="font-bold text-emerald-accent">{vce.toFixed(3)} V</span>
              </div>
              <div className="p-2.5 rounded bg-navy-light/20 border border-navy-light/30 flex justify-between items-center text-xs">
                <span className="text-slate-400">I_C (Collector Current)</span>
                <span className="font-bold text-white">{ic.toFixed(3)} mA</span>
              </div>
              <div className="p-2.5 rounded bg-navy-light/20 border border-navy-light/30 flex justify-between items-center text-xs">
                <span className="text-slate-400">I_B (Base Current)</span>
                <span className="font-bold text-white">{(ib * 1000).toFixed(1)} μA</span>
              </div>
            </div>

            <div className="p-3 rounded bg-navy-light/10 border border-navy-light/20 text-[10px] text-slate-400">
              <span className="font-semibold block text-slate-300 mb-1">Thevenin Equivalent Parameters:</span>
              R_th = {rth.toFixed(2)} kΩ<br />
              V_th = {vth.toFixed(2)} V
            </div>
          </div>

          {/* Interactive Schematic Diagram */}
          <div className="md:col-span-7 flex flex-col bg-black/50 border border-navy-light/80 rounded-xl overflow-hidden">
            <div className="p-3 border-b border-navy-light/50 bg-black/30 flex justify-between items-center text-[10px] font-mono text-slate-500">
              <span>VOLTAGE DIVIDER SCHEMATIC</span>
              <span className="text-emerald-accent">Active Nodes Displayed</span>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 min-h-[220px]">
              <svg className="w-full h-full max-w-[240px] text-slate-400" viewBox="0 0 160 180" fill="none">
                {/* Voltage supply rail */}
                <path d="M 80 15 L 80 30" stroke="#94a3b8" strokeWidth="1.5" />
                <circle cx="80" cy="15" r="2.5" fill="#ef4444" />
                <text x="88" y="18" fill="#ef4444" className="text-[10px] font-mono font-bold">V_CC ({vcc}V)</text>

                {/* Resistor R1 */}
                <rect x="74" y="30" width="12" height="24" rx="1.5" stroke="#94a3b8" strokeWidth="1.5" fill="#1e293b" />
                <text x="56" y="44" fill="#94a3b8" className="text-[9px] font-mono">R₁</text>
                <text x="92" y="44" fill="#64748b" className="text-[8px] font-mono">{r1}k</text>

                {/* Node connection R1-R2-Base */}
                <path d="M 80 54 L 80 100" stroke="#94a3b8" strokeWidth="1.5" />
                <circle cx="80" cy="74" r="2.5" fill="#10b981" />
                <path d="M 80 74 L 110 74" stroke="#94a3b8" strokeWidth="1.5" />
                {/* Node marker text for Base */}
                <text x="68" y="70" fill="#10b981" className="text-[8px] font-mono font-bold">V_B={vb.toFixed(1)}V</text>

                {/* Resistor R2 */}
                <rect x="74" y="100" width="12" height="24" rx="1.5" stroke="#94a3b8" strokeWidth="1.5" fill="#1e293b" />
                <text x="56" y="114" fill="#94a3b8" className="text-[9px] font-mono">R₂</text>
                <text x="92" y="114" fill="#64748b" className="text-[8px] font-mono">{r2}k</text>

                {/* Connection to ground */}
                <path d="M 80 124 L 80 145" stroke="#94a3b8" strokeWidth="1.5" />
                {/* Ground symbol */}
                <path d="M 72 145 L 88 145 M 75 149 L 85 149 M 78 153 L 82 153" stroke="#94a3b8" strokeWidth="1.5" />

                {/* RC Collector side */}
                <path d="M 125 15 L 125 35" stroke="#94a3b8" strokeWidth="1.5" />
                <path d="M 80 25 L 125 25" stroke="#94a3b8" strokeWidth="1.5" />
                <rect x="119" y="35" width="12" height="24" rx="1.5" stroke="#94a3b8" strokeWidth="1.5" fill="#1e293b" />
                <text x="136" y="49" fill="#94a3b8" className="text-[9px] font-mono">R_C</text>
                <text x="104" y="49" fill="#64748b" className="text-[8px] font-mono">{rc}k</text>
                <path d="M 125 59 L 125 65" stroke="#94a3b8" strokeWidth="1.5" />
                {/* Collector node marker */}
                <circle cx="125" cy="65" r="2.5" fill="#10b981" />
                <text x="132" y="68" fill="#10b981" className="text-[8px] font-mono font-bold">V_C={vc.toFixed(1)}V</text>

                {/* Transistor symbol (NPN representation) */}
                {/* Collector-base-emitter lines */}
                <path d="M 125 65 L 125 72 L 118 78 L 118 70 L 118 78 L 110 74 L 118 70 M 118 74 L 118 74" stroke="#e2e8f0" strokeWidth="2" />
                <path d="M 118 74 M 118 78 L 125 84 L 125 95" stroke="#e2e8f0" strokeWidth="2" />
                {/* Arrow on emitter line */}
                <polygon points="121,81 125,84 121,86" fill="#e2e8f0" />
                <text x="100" y="87" fill="#cbd5e1" className="text-[9px] font-bold">Q₁</text>

                {/* Emitter Node marker */}
                <circle cx="125" cy="95" r="2.5" fill="#10b981" />
                <text x="132" y="98" fill="#10b981" className="text-[8px] font-mono font-bold">V_E={ve.toFixed(1)}V</text>

                {/* RE Emitter Resistor */}
                <rect x="119" y="105" width="12" height="24" rx="1.5" stroke="#94a3b8" strokeWidth="1.5" fill="#1e293b" />
                <text x="136" y="119" fill="#94a3b8" className="text-[9px] font-mono">R_E</text>
                <text x="104" y="119" fill="#64748b" className="text-[8px] font-mono">{re}k</text>
                <path d="M 125 129 L 125 145" stroke="#94a3b8" strokeWidth="1.5" />
                <path d="M 125 145 L 80 145" stroke="#94a3b8" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
