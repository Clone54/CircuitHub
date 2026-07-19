import React from 'react';
import { useCMOSGenerator, LogicGateType, ViewMode } from '../../hooks/useCMOSGenerator';
import { Settings2, Zap, Layers, Play, StopCircle } from 'lucide-react';

export default function CMOSGenerator() {
  const {
    gateType,
    handleGateTypeChange,
    viewMode,
    setViewMode,
    inputs,
    handleInputToggle,
    output,
    transistorCount,
    customExpression,
    setCustomExpression,
    customSvg,
    isGeneratingCustom,
    customError,
    generateCustomCMOS
  } = useCMOSGenerator();

  const renderSchematic = () => {
    // This is a simplified SVG rendering of CMOS gates.
    // In a real application, this would be much more complex.
    // For this example, we'll draw simple visual representations.

    const A = inputs[0] === 1;
    const B = inputs.length > 1 ? inputs[1] === 1 : false;

    // PMOS color: if conducting (input is 0) -> Green, else Red
    const getPmosColor = (input: boolean) => !input ? '#10B981' : '#EF4444';
    // NMOS color: if conducting (input is 1) -> Green, else Red
    const getNmosColor = (input: boolean) => input ? '#10B981' : '#EF4444';

    const renderTransistor = (type: 'PMOS' | 'NMOS', x: number, y: number, state: boolean, label: string) => (
      <g transform={`translate(${x}, ${y})`}>
        {/* Gate */}
        <line x1="-15" y1="0" x2="-5" y2="0" stroke="white" strokeWidth="2" />
        <line x1="-5" y1="-10" x2="-5" y2="10" stroke="white" strokeWidth="2" />
        
        {/* Drain/Source Channel */}
        <line x1="5" y1="-15" x2="5" y2="15" stroke="white" strokeWidth="2" />
        
        {/* PMOS Bubble */}
        {type === 'PMOS' && <circle cx="-10" cy="0" r="3" fill="none" stroke="white" strokeWidth="1.5" />}
        
        {/* Source/Drain connections */}
        <line x1="5" y1="-15" x2="5" y2="-25" stroke={type === 'PMOS' ? getPmosColor(state) : getNmosColor(state)} strokeWidth="2" />
        <line x1="5" y1="15" x2="5" y2="25" stroke={type === 'PMOS' ? getPmosColor(state) : getNmosColor(state)} strokeWidth="2" />

        <text x="-25" y="4" fill="white" fontSize="12" fontFamily="monospace">{label}</text>
        <text x="12" y="4" fill="#94A3B8" fontSize="10" fontFamily="monospace">{type}</text>
      </g>
    );

    if (gateType === 'Custom Function') {
      if (isGeneratingCustom) {
        return (
          <div className="flex flex-col items-center justify-center space-y-4 text-emerald-accent animate-pulse">
            <Zap className="h-10 w-10 animate-bounce" />
            <p className="font-mono text-sm">Synthesizing CMOS layout via AI...</p>
          </div>
        );
      }
      
      if (customError) {
        return (
          <div className="text-rose-400 font-mono text-sm max-w-sm text-center">
            <div className="mb-2 font-bold uppercase">Synthesis Error</div>
            {customError}
          </div>
        );
      }
      
      if (customSvg) {
        return (
          <div className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[500px]" dangerouslySetInnerHTML={{ __html: customSvg }} />
        );
      }
      
      return (
        <div className="text-slate-400 font-mono text-sm text-center max-w-sm">
          Enter a boolean expression and click Synthesize to generate the exact CMOS transistor-level schematic.
        </div>
      );
    }

    if (gateType === 'NOT') {
      return (
        <svg width="200" height="300" viewBox="0 0 200 300" className="mx-auto">
          {/* VDD */}
          <line x1="90" y1="30" x2="110" y2="30" stroke="#10B981" strokeWidth="2" />
          <text x="92" y="25" fill="#10B981" fontSize="12" fontFamily="monospace">VDD</text>
          
          <line x1="100" y1="30" x2="100" y2="80" stroke={!A ? '#10B981' : '#EF4444'} strokeWidth="2" />
          
          {/* PMOS */}
          {renderTransistor('PMOS', 95, 105, A, 'A')}
          
          <line x1="100" y1="130" x2="100" y2="170" stroke={output === 1 ? '#10B981' : '#EF4444'} strokeWidth="2" />
          
          {/* Output Y */}
          <circle cx="100" cy="150" r="4" fill={output === 1 ? '#10B981' : '#EF4444'} />
          <line x1="100" y1="150" x2="130" y2="150" stroke={output === 1 ? '#10B981' : '#EF4444'} strokeWidth="2" />
          <text x="135" y="154" fill="white" fontSize="14" fontFamily="monospace">Y={output}</text>

          {/* NMOS */}
          {renderTransistor('NMOS', 95, 195, A, 'A')}

          <line x1="100" y1="220" x2="100" y2="260" stroke={A ? '#10B981' : '#EF4444'} strokeWidth="2" />
          
          {/* GND */}
          <line x1="90" y1="260" x2="110" y2="260" stroke="#EF4444" strokeWidth="2" />
          <line x1="95" y1="265" x2="105" y2="265" stroke="#EF4444" strokeWidth="2" />
          <line x1="98" y1="270" x2="102" y2="270" stroke="#EF4444" strokeWidth="2" />
          <text x="115" y="270" fill="#EF4444" fontSize="12" fontFamily="monospace">GND</text>
          
          {/* Input wiring */}
          <line x1="40" y1="105" x2="80" y2="105" stroke="white" strokeWidth="2" />
          <line x1="40" y1="195" x2="80" y2="195" stroke="white" strokeWidth="2" />
          <line x1="40" y1="105" x2="40" y2="195" stroke="white" strokeWidth="2" />
          <line x1="10" y1="150" x2="40" y2="150" stroke="white" strokeWidth="2" />
          <text x="-5" y="154" fill="white" fontSize="14" fontFamily="monospace">A={A ? 1 : 0}</text>
        </svg>
      );
    }
    
    // Default generic layout for other gates to save space and time in this example
    return (
      <svg width="300" height="400" viewBox="0 0 300 400" className="mx-auto">
        <text x="150" y="200" fill="#94A3B8" fontSize="14" fontFamily="monospace" textAnchor="middle">
          {gateType} Schematic Visualization
        </text>
        <text x="150" y="220" fill="#94A3B8" fontSize="12" fontFamily="monospace" textAnchor="middle">
          (Simplified block representation)
        </text>
        {/* VDD */}
        <line x1="140" y1="30" x2="160" y2="30" stroke="#10B981" strokeWidth="2" />
        <text x="142" y="25" fill="#10B981" fontSize="12" fontFamily="monospace">VDD</text>
        
        <rect x="100" y="80" width="100" height="80" fill="none" stroke="#10B981" strokeDasharray="4 4" strokeWidth="2" />
        <text x="150" y="125" fill="#10B981" fontSize="14" fontFamily="monospace" textAnchor="middle">PUN</text>

        <rect x="100" y="240" width="100" height="80" fill="none" stroke="#EF4444" strokeDasharray="4 4" strokeWidth="2" />
        <text x="150" y="285" fill="#EF4444" fontSize="14" fontFamily="monospace" textAnchor="middle">PDN</text>

        <line x1="150" y1="30" x2="150" y2="80" stroke="#10B981" strokeWidth="2" />
        <line x1="150" y1="160" x2="150" y2="240" stroke="white" strokeWidth="2" />
        <line x1="150" y1="320" x2="150" y2="360" stroke="#EF4444" strokeWidth="2" />

        {/* Output */}
        <circle cx="150" cy="200" r="4" fill={output === 1 ? '#10B981' : '#EF4444'} />
        <line x1="150" y1="200" x2="220" y2="200" stroke={output === 1 ? '#10B981' : '#EF4444'} strokeWidth="2" />
        <text x="225" y="204" fill="white" fontSize="14" fontFamily="monospace">Y={output}</text>
        
        {/* GND */}
        <line x1="140" y1="360" x2="160" y2="360" stroke="#EF4444" strokeWidth="2" />
        <text x="142" y="375" fill="#EF4444" fontSize="12" fontFamily="monospace">GND</text>
        
        {/* Inputs */}
        <line x1="50" y1="120" x2="100" y2="120" stroke="white" strokeWidth="2" />
        <line x1="50" y1="280" x2="100" y2="280" stroke="white" strokeWidth="2" />
        <text x="30" y="124" fill="white" fontSize="14" fontFamily="monospace">A={A ? 1 : 0}</text>
        <text x="30" y="284" fill="white" fontSize="14" fontFamily="monospace">B={B ? 1 : 0}</text>
      </svg>
    );
  };

  const renderStickDiagram = () => {
    if (gateType === 'Custom Function') {
      return (
        <div className="text-slate-400 font-mono text-sm text-center max-w-sm">
          Stick diagram generation for custom boolean expressions is not supported in this view. Use the Stick Diagram Gen tab for custom logic layout synthesis.
        </div>
      );
    }
    return (
      <svg width="300" height="300" viewBox="0 0 300 300" className="mx-auto">
        <text x="150" y="150" fill="#94A3B8" fontSize="14" fontFamily="monospace" textAnchor="middle">
          Stick Diagram for {gateType}
        </text>
        {/* Key/Legend */}
        <rect x="50" y="20" width="10" height="10" fill="#3B82F6" />
        <text x="65" y="29" fill="#94A3B8" fontSize="10" fontFamily="monospace">Metal</text>
        
        <rect x="120" y="20" width="10" height="10" fill="#EF4444" />
        <text x="135" y="29" fill="#94A3B8" fontSize="10" fontFamily="monospace">Poly</text>

        <rect x="180" y="20" width="10" height="10" fill="#10B981" />
        <text x="195" y="29" fill="#94A3B8" fontSize="10" fontFamily="monospace">Diffusion</text>

        {/* Abstract representation */}
        <line x1="50" y1="80" x2="250" y2="80" stroke="#3B82F6" strokeWidth="6" />
        <text x="50" y="75" fill="#3B82F6" fontSize="12" fontFamily="monospace">VDD</text>

        <line x1="50" y1="220" x2="250" y2="220" stroke="#3B82F6" strokeWidth="6" />
        <text x="50" y="235" fill="#3B82F6" fontSize="12" fontFamily="monospace">GND</text>
        
        <line x1="80" y1="120" x2="220" y2="120" stroke="#10B981" strokeWidth="6" />
        <line x1="80" y1="180" x2="220" y2="180" stroke="#10B981" strokeWidth="6" />
        
        <line x1="120" y1="100" x2="120" y2="200" stroke="#EF4444" strokeWidth="6" />
        <text x="115" y="215" fill="#EF4444" fontSize="12" fontFamily="monospace">A</text>

        {gateType !== 'NOT' && (
          <>
            <line x1="180" y1="100" x2="180" y2="200" stroke="#EF4444" strokeWidth="6" />
            <text x="175" y="215" fill="#EF4444" fontSize="12" fontFamily="monospace">B</text>
          </>
        )}
      </svg>
    );
  };

  const getTruthTableRows = () => {
    if (gateType === 'NOT') {
      return [
        { A: 0, Y: 1 },
        { A: 1, Y: 0 }
      ];
    }

    const calcY = (A: number, B: number) => {
      switch (gateType) {
        case 'NAND': return !(A && B) ? 1 : 0;
        case 'NOR': return !(A || B) ? 1 : 0;
        case 'AND (CMOS)': return (A && B) ? 1 : 0;
        case 'OR (CMOS)': return (A || B) ? 1 : 0;
        case 'XOR': return (A !== B) ? 1 : 0;
        case 'XNOR': return (A === B) ? 1 : 0;
        default: return 0;
      }
    };

    return [
      { A: 0, B: 0, Y: calcY(0, 0) },
      { A: 0, B: 1, Y: calcY(0, 1) },
      { A: 1, B: 0, Y: calcY(1, 0) },
      { A: 1, B: 1, Y: calcY(1, 1) }
    ];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Configuration & Info Panel */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Config Card */}
        <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
            <Settings2 className="h-5 w-5 text-emerald-accent" />
            <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Generator Settings</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-400">LOGIC GATE</label>
              <select 
                value={gateType}
                onChange={(e) => handleGateTypeChange(e.target.value as LogicGateType)}
                className="w-full bg-navy-dark border border-navy-light rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-accent"
              >
                <option value="NOT">NOT</option>
                <option value="NAND">NAND</option>
                <option value="NOR">NOR</option>
                <option value="AND (CMOS)">AND (CMOS)</option>
                <option value="OR (CMOS)">OR (CMOS)</option>
                <option value="XOR">XOR</option>
                <option value="XNOR">XNOR</option>
                <option value="Custom Function">Custom Function</option>
              </select>
            </div>

            {gateType === 'Custom Function' && (
              <div className="space-y-3 pt-3 border-t border-navy-light/60">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-slate-400">BOOLEAN EXPRESSION</label>
                  <input 
                    type="text" 
                    value={customExpression}
                    onChange={(e) => setCustomExpression(e.target.value)}
                    placeholder="e.g., Y = ~((A*B)+C)"
                    className="w-full bg-navy-dark border border-navy-light rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-accent font-mono"
                  />
                </div>
                <button
                  onClick={generateCustomCMOS}
                  disabled={isGeneratingCustom || !customExpression}
                  className="w-full bg-emerald-accent/10 hover:bg-emerald-accent/20 text-emerald-accent border border-emerald-accent/30 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGeneratingCustom ? 'Synthesizing...' : 'Synthesize CMOS'}
                </button>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-400">VISUALIZATION MODE</label>
              <div className="flex bg-navy-dark rounded-xl border border-navy-light overflow-hidden p-1">
                <button
                  onClick={() => setViewMode('Schematic')}
                  className={`flex-1 py-2 text-xs font-bold transition-all rounded-lg ${viewMode === 'Schematic' ? 'bg-navy-light text-emerald-accent' : 'text-slate-400 hover:text-white'}`}
                >
                  Schematic
                </button>
                <button
                  onClick={() => setViewMode('Stick Diagram')}
                  className={`flex-1 py-2 text-xs font-bold transition-all rounded-lg ${viewMode === 'Stick Diagram' ? 'bg-navy-light text-emerald-accent' : 'text-slate-400 hover:text-white'}`}
                >
                  Stick Diagram
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Simulation Card */}
        {gateType !== 'Custom Function' && (
        <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
            <Play className="h-5 w-5 text-emerald-accent" />
            <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Interactive Simulation</h3>
          </div>

          <div className="flex gap-4 items-center justify-center">
            <div className="text-center space-y-2">
              <div className="text-xs font-mono text-slate-400">Input A</div>
              <button
                onClick={() => handleInputToggle(0)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all ${inputs[0] === 1 ? 'bg-emerald-accent text-navy-dark shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-navy-dark border border-navy-light text-slate-400'}`}
              >
                {inputs[0]}
              </button>
            </div>
            
            {gateType !== 'NOT' && (
              <div className="text-center space-y-2">
                <div className="text-xs font-mono text-slate-400">Input B</div>
                <button
                  onClick={() => handleInputToggle(1)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all ${inputs[1] === 1 ? 'bg-emerald-accent text-navy-dark shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-navy-dark border border-navy-light text-slate-400'}`}
                >
                  {inputs[1]}
                </button>
              </div>
            )}
            
            <div className="text-center px-4">
              <ArrowRight />
            </div>

            <div className="text-center space-y-2">
              <div className="text-xs font-mono text-emerald-accent">Output Y</div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all ${output === 1 ? 'bg-emerald-accent text-navy-dark shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-navy-dark border border-emerald-accent/20 text-slate-400'}`}>
                {output}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Truth Table */}
        {gateType !== 'Custom Function' && (
        <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono border-b border-navy-light/60 pb-3">Live Truth Table</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 uppercase bg-navy-dark border-b border-navy-light">
                <tr>
                  <th className="px-4 py-2 font-mono">A</th>
                  {gateType !== 'NOT' && <th className="px-4 py-2 font-mono">B</th>}
                  <th className="px-4 py-2 font-mono">Y</th>
                </tr>
              </thead>
              <tbody>
                {getTruthTableRows().map((row, idx) => {
                  const isActive = gateType === 'NOT' 
                    ? row.A === inputs[0]
                    : row.A === inputs[0] && row.B === inputs[1];

                  return (
                    <tr key={idx} className={`border-b border-navy-light/40 font-mono transition-colors ${isActive ? 'bg-emerald-accent/10 text-emerald-accent' : 'text-slate-300'}`}>
                      <td className="px-4 py-2">{row.A}</td>
                      {gateType !== 'NOT' && <td className="px-4 py-2">{row.B}</td>}
                      <td className={`px-4 py-2 font-bold ${isActive && row.Y === 1 ? 'text-emerald-accent' : isActive && row.Y === 0 ? 'text-rose-400' : ''}`}>{row.Y}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>

      {/* Main Visualization Area */}
      <div className="lg:col-span-8 bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[500px] flex flex-col relative overflow-hidden">
        
        {/* Background Grid */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-20" />

        <div className="relative z-10 flex justify-between items-center pb-4 border-b border-navy-light/60 mb-8">
          <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-accent" /> 
            {viewMode} Renderer
          </h3>
          <div className="bg-navy-dark px-3 py-1.5 rounded-lg border border-navy-light text-xs font-mono text-slate-400">
            Transistors: <span className="text-emerald-accent font-bold">{gateType === 'Custom Function' ? '?' : transistorCount}</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center relative z-10 bg-navy-dark/30 rounded-xl border border-navy-light/40 overflow-hidden p-8">
          {viewMode === 'Schematic' ? renderSchematic() : renderStickDiagram()}
        </div>
      </div>
    </div>
  );
}

const ArrowRight = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
    <path d="M5 12h14"></path>
    <path d="m12 5 7 7-7 7"></path>
  </svg>
);
