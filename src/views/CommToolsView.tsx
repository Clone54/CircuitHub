import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Radio, 
  Hash, 
  HelpCircle, 
  Info, 
  TrendingUp, 
  Zap, 
  CheckCircle2, 
  X,
  Plus,
  RefreshCw,
  ArrowLeft,
  Binary
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { IEEEReportButton } from '../components/IEEEReportButton';

// Huffman coding tree types
interface HuffmanNode {
  symbol?: string;
  prob: number;
  left?: HuffmanNode;
  right?: HuffmanNode;
}

export default function CommToolsView() {
  const [activeSubTab, setActiveSubTab] = useState<'cellular' | 'huffman'>('cellular');

  // --- Cellular Planning State ---
  const [clusterSize, setClusterSize] = useState<number>(7); // N (usually 1, 3, 4, 7, 9, 12)
  const [pathLossExponent, setPathLossExponent] = useState<number>(4.0); // gamma (2.0 to 5.0)
  const [totalBandwidth, setTotalBandwidth] = useState<number>(25); // MHz
  const [channelBandwidth, setChannelBandwidth] = useState<number>(200); // kHz
  const [totalCells, setTotalCells] = useState<number>(100);

  // --- Huffman / Entropy State ---
  const [inputMode, setInputMode] = useState<'text' | 'probs'>('text');
  const [textString, setTextString] = useState<string>('COMMUNICATION SYSTEMS AND CODING THEOREMS');
  const [probPairs, setProbPairs] = useState<{ symbol: string; prob: number }[]>([
    { symbol: 'A', prob: 0.40 },
    { symbol: 'B', prob: 0.25 },
    { symbol: 'C', prob: 0.15 },
    { symbol: 'D', prob: 0.12 },
    { symbol: 'E', prob: 0.08 },
  ]);
  const [newSymbol, setNewSymbol] = useState<string>('');
  const [newProb, setNewProb] = useState<number>(0.1);

  // --- Cellular Calculations ---
  const cellPlan = useMemo(() => {
    // Reuse ratio: q = sqrt(3 * N)
    const q = Math.sqrt(3 * clusterSize);
    
    // SIR = (sqrt(3 * N))^gamma / 6 (assuming 1st tier of 6 co-channel interferers)
    const sirLinear = Math.pow(Math.sqrt(3 * clusterSize), pathLossExponent) / 6;
    const sirDb = 10 * Math.log10(sirLinear);

    // Channels calculations
    const totalChannels = (totalBandwidth * 1000) / channelBandwidth; // channels
    const channelsPerCell = totalChannels / clusterSize;
    const totalSystemCapacity = channelsPerCell * totalCells;

    return {
      reuseRatio: parseFloat(q.toFixed(2)),
      sirLinear: parseFloat(sirLinear.toFixed(1)),
      sirDb: parseFloat(sirDb.toFixed(2)),
      totalChannels: Math.floor(totalChannels),
      channelsPerCell: Math.floor(channelsPerCell),
      totalSystemCapacity: Math.floor(totalSystemCapacity)
    };
  }, [clusterSize, pathLossExponent, totalBandwidth, channelBandwidth, totalCells]);

  // --- Huffman Coding and Entropy Calculations ---
  const codingResults = useMemo(() => {
    let symbolsWithProbs: { symbol: string; prob: number }[] = [];

    if (inputMode === 'text') {
      if (!textString.trim()) {
        return null;
      }
      // Compute probabilities from text
      const counts: Record<string, number> = {};
      const trimmedText = textString;
      for (const char of trimmedText) {
        counts[char] = (counts[char] || 0) + 1;
      }
      const totalChars = trimmedText.length;
      symbolsWithProbs = Object.keys(counts).map(char => ({
        symbol: char === ' ' ? 'SPC' : char,
        prob: parseFloat((counts[char] / totalChars).toFixed(4))
      }));
    } else {
      // Use user-defined probabilities, norm them to sum to 1
      const totalP = probPairs.reduce((sum, item) => sum + item.prob, 0);
      if (totalP <= 0) return null;
      symbolsWithProbs = probPairs.map(item => ({
        symbol: item.symbol,
        prob: item.prob / totalP // normalization
      }));
    }

    // Sort symbols by probability descending
    symbolsWithProbs.sort((a, b) => b.prob - a.prob);

    // Calculate Entropy: H = - sum(p * log2(p))
    let entropy = 0;
    symbolsWithProbs.forEach(item => {
      if (item.prob > 0) {
        entropy -= item.prob * Math.log2(item.prob);
      }
    });

    // Build Huffman Tree
    // Priority queue like logic: array sorted by probability
    let nodes: HuffmanNode[] = symbolsWithProbs.map(item => ({
      symbol: item.symbol,
      prob: item.prob
    }));

    // If there is only one symbol, huffman tree is trivial
    let codeMap: Record<string, string> = {};
    if (nodes.length === 1) {
      codeMap[nodes[0].symbol!] = '0';
    } else if (nodes.length > 1) {
      // Loop merging the two nodes with lowest probability
      while (nodes.length > 1) {
        // Sort ascending by prob
        nodes.sort((a, b) => a.prob - b.prob);
        const left = nodes[0];
        const right = nodes[1];

        const parent: HuffmanNode = {
          prob: left.prob + right.prob,
          left,
          right
        };

        // Remove first two and push parent
        nodes = [parent, ...nodes.slice(2)];
      }

      // Root of tree remains
      const root = nodes[0];

      // Traverse tree to generate codes
      const assignCodes = (node: HuffmanNode, currentCode: string) => {
        if (!node) return;
        if (node.symbol) {
          codeMap[node.symbol] = currentCode;
          return;
        }
        if (node.left) assignCodes(node.left, currentCode + '0');
        if (node.right) assignCodes(node.right, currentCode + '1');
      };

      assignCodes(root, '');
    }

    // Map results with code details
    let avgCodeLength = 0;
    const items = symbolsWithProbs.map(item => {
      const code = codeMap[item.symbol] || '0';
      const bits = code.length;
      avgCodeLength += item.prob * bits;
      return {
        symbol: item.symbol,
        prob: item.prob,
        code,
        bits
      };
    });

    // Efficiency: eta = H / L_avg
    const efficiency = avgCodeLength > 0 ? (entropy / avgCodeLength) * 100 : 0;

    return {
      items,
      entropy: parseFloat(entropy.toFixed(3)),
      avgCodeLength: parseFloat(avgCodeLength.toFixed(3)),
      efficiency: parseFloat(efficiency.toFixed(2))
    };
  }, [inputMode, textString, probPairs]);

  // Handle Probability modification
  const handleAddProbPair = () => {
    if (!newSymbol.trim()) return;
    const cleaned = newSymbol.trim().toUpperCase().slice(0, 4);
    if (probPairs.find(p => p.symbol === cleaned)) return; // duplicate check
    setProbPairs([...probPairs, { symbol: cleaned, prob: Math.max(0.001, newProb) }]);
    setNewSymbol('');
  };

  const handleRemoveProbPair = (symbol: string) => {
    setProbPairs(probPairs.filter(p => p.symbol !== symbol));
  };

  const handleResetProbPairs = () => {
    setProbPairs([
      { symbol: 'A', prob: 0.40 },
      { symbol: 'B', prob: 0.25 },
      { symbol: 'C', prob: 0.15 },
      { symbol: 'D', prob: 0.12 },
      { symbol: 'E', prob: 0.08 },
    ]);
  };

  return (
    <div className="min-h-screen bg-navy text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header Block */}
        <div className="flex items-center justify-between border-b border-navy-light pb-4">
          <div className="flex items-center gap-3">
            <Link 
              to="/tools" 
              className="p-2 bg-navy-card/60 hover:bg-navy-light/40 border border-navy-light rounded-xl transition-all text-emerald-accent"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">4th Year Elective / Comm Track</span>
              <h1 className="text-2xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
                Advanced Communication & Coding Suite
              </h1>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-navy-card/60 border border-navy-light rounded-xl p-1">
            <button
              onClick={() => setActiveSubTab('cellular')}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${
                activeSubTab === 'cellular'
                  ? 'bg-emerald-accent text-navy shadow-lg shadow-emerald-accent/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cellular Planner (SIR)
            </button>
            <button
              onClick={() => setActiveSubTab('huffman')}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all ${
                activeSubTab === 'huffman'
                  ? 'bg-emerald-accent text-navy shadow-lg shadow-emerald-accent/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Entropy & Huffman Coder
            </button>
          </div>
        </div>

        {/* ==============================================
            CELLULAR NETWORK PLANNER (SIR & CAPACITY)
            ============================================== */}
        {activeSubTab === 'cellular' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Control Column (1/3 Width) */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-navy-card border border-navy-light p-6 rounded-2xl shadow-xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/50">
                  <Radio className="h-5 w-5 text-sky-400" />
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Cluster Config</h2>
                    <p className="text-2xl font-mono text-emerald-accent">EEE 4185</p>
                  </div>
                </div>

                {/* Cluster Size Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400 block">Cluster Size (N)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[3, 4, 7, 9, 12, 19].map((n) => (
                      <button
                        key={n}
                        onClick={() => setClusterSize(n)}
                        className={`p-2.5 rounded-xl border text-xs font-bold font-mono transition-all ${
                          clusterSize === n
                            ? 'bg-emerald-accent/10 border-emerald-accent/40 text-emerald-accent'
                            : 'bg-navy/40 border-navy-light/40 text-slate-400 hover:text-slate-200 hover:bg-navy-light/10'
                        }`}
                      >
                        N = {n}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 italic">Determines the frequency reuse distance.</p>
                </div>

                {/* Path Loss Exponent */}
                <div className="space-y-2 pt-2 border-t border-navy-light/30">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Path Loss Exponent (γ)</span>
                    <span className="text-white font-bold">{pathLossExponent.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="2.0"
                    max="5.0"
                    step="0.1"
                    value={pathLossExponent}
                    onChange={(e) => setPathLossExponent(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-navy-light rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>2.0 (Free Space)</span>
                    <span>5.0 (Urban Shadow)</span>
                  </div>
                </div>

                {/* Spectrum Allocation */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-navy-light/30">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Allocated Bandwidth</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={totalBandwidth}
                        onChange={(e) => setTotalBandwidth(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-navy bg-opacity-50 text-xs font-mono p-2 pr-10 rounded-lg border border-navy-light text-emerald-accent focus:outline-none"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] font-mono text-slate-500 pointer-events-none">
                        MHz
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Channel width</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="10"
                        max="1000"
                        value={channelBandwidth}
                        onChange={(e) => setChannelBandwidth(Math.max(10, parseInt(e.target.value) || 10))}
                        className="w-full bg-navy bg-opacity-50 text-xs font-mono p-2 pr-10 rounded-lg border border-navy-light text-emerald-accent focus:outline-none"
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-[10px] font-mono text-slate-500 pointer-events-none">
                        kHz
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grid Density */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Total Cell Nodes</span>
                    <span className="text-white font-bold">{totalCells} cells</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={totalCells}
                    onChange={(e) => setTotalCells(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-navy-light rounded-lg appearance-none cursor-pointer accent-emerald-accent"
                  />
                </div>
              </div>

              {/* Informational Box */}
              <div className="bg-navy-card/40 border border-navy-light p-5 rounded-2xl space-y-3 text-xs">
                <h3 className="font-bold text-white flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-emerald-accent" />
                  Frequency Reuse Principle
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Hexagonal tessellation models dividing total bandwidth channels by cluster size <code className="text-white font-mono">N</code>. Co-channel interference assumes 1st-tier hexagonal rings.
                </p>
                <div className="text-[10px] text-emerald-accent/80 font-mono bg-navy/60 p-2 rounded border border-navy-light/60">
                  SIR = (3 * N)^(γ/2) / 6
                </div>
              </div>
            </div>

            {/* Right Display & Hex Visualization Column (2/3 Width) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-end mb-4">
                <IEEEReportButton
                  experimentName="Telecommunication Engineering: Cellular Network Architecture"
                  inputData={{
                    'Cluster Size (N)': clusterSize,
                    'Path Loss Exponent (γ)': pathLossExponent.toFixed(1),
                    'Total Bandwidth': totalBandwidth + ' MHz',
                    'Channel Bandwidth': channelBandwidth + ' kHz',
                    'Total Area Cells': totalCells
                  }}
                  outputData={{
                    'Co-Channel Reuse Ratio (q)': cellPlan.reuseRatio,
                    'Total Channels (S)': cellPlan.totalChannels.toString(),
                    'Channels per Cell (k)': cellPlan.channelsPerCell.toString(),
                    'Signal-to-Interference Ratio (SIR)': cellPlan.sirDb + ' dB',
                    'Total System Capacity (C)': cellPlan.totalSystemCapacity.toString()
                  }}
                  chartSelectors={['#cellular-chart']}
                />
              </div>
              
              {/* Output Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-navy-card border border-navy-light p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Reuse Ratio (q)</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold font-mono text-amber-500">{cellPlan.reuseRatio}</span>
                  </div>
                </div>
                <div className="bg-navy-card border border-navy-light p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Total Channels</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold font-mono text-sky-400">{cellPlan.totalChannels}</span>
                  </div>
                </div>
                <div className="bg-navy-card border border-navy-light p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Channels / Cell</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold font-mono text-emerald-accent">{cellPlan.channelsPerCell}</span>
                  </div>
                </div>
                <div className="bg-navy-card border border-navy-light p-4 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">System Capacity</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold font-mono text-teal-400">{cellPlan.totalSystemCapacity}</span>
                  </div>
                </div>
              </div>

              {/* Interference DB Readout */}
              <div className="bg-navy-card border border-navy-light p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block">Co-channel SIR (1st-Tier Ring)</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className={`text-5xl font-black font-mono tracking-tight ${
                      cellPlan.sirDb >= 18 ? 'text-emerald-accent' : cellPlan.sirDb >= 15 ? 'text-yellow-400' : 'text-rose-500'
                    }`}>
                      {cellPlan.sirDb}
                    </span>
                    <span className="text-lg text-slate-400 font-bold">dB</span>
                  </div>
                </div>
                <div className="flex-1 text-xs text-slate-400 leading-relaxed sm:border-l sm:border-navy-light sm:pl-6 max-w-md">
                  {cellPlan.sirDb >= 18 ? (
                    <p className="text-emerald-400/90 flex items-start gap-1.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                      Excellent link margin. The SIR exceeds the 18 dB GSM threshold limit, guaranteeing high carrier-to-interference stability and low bit error rates (BER).
                    </p>
                  ) : cellPlan.sirDb >= 14 ? (
                    <p className="text-yellow-400/90 flex items-start gap-1.5">
                      <Info className="h-4 w-4 shrink-0 mt-0.5" />
                      Marginal operation. Susceptible to fading, voice dropouts, or packet loss in dense urban environments or cell margins. Consider upgrading N.
                    </p>
                  ) : (
                    <p className="text-rose-400/90 flex items-start gap-1.5">
                      <X className="h-4 w-4 shrink-0 mt-0.5" />
                      Critical interference levels. Cross-talk and co-channel overlap will degrade quality. Increase your cluster size (N) or adjust path loss.
                    </p>
                  )}
                </div>
              </div>

              {/* Geometric Hex Cluster Visualization */}
              <div className="bg-navy-card border border-navy-light p-6 rounded-2xl shadow-xl space-y-4" id="cellular-chart">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Hexagonal Frequency Reuse Topology</h3>
                
                {/* Responsive SVG Grid of Cells */}
                <div className="flex justify-center p-4 bg-navy rounded-xl border border-navy-light/60">
                  <svg viewBox="0 0 500 280" className="w-full max-w-lg h-auto">
                    {/* Definitions for gradients and symbols */}
                    <defs>
                      <polygon id="hex" points="30,0 60,17 60,52 30,69 0,52 0,17" className="transition-all duration-300" />
                    </defs>

                    {/* Standard Hex layout representing a cellular grid. Color depends on frequency group */}
                    {/* Frequency groups: calculated modulo N */}
                    {[
                      { r: 0, c: 0, x: 250, y: 140, id: 0 },
                      // Tier 1 Ring
                      { r: 0, c: 1, x: 312, y: 104, id: 1 },
                      { r: 1, c: 0, x: 250, y: 210, id: 2 },
                      { r: 0, c: -1, x: 188, y: 176, id: 3 },
                      { r: -1, c: 0, x: 250, y: 70, id: 4 },
                      { r: -1, c: 1, x: 312, y: 176, id: 5 },
                      { r: 1, c: -1, x: 188, y: 104, id: 6 },
                      // Additional grid cells
                      { r: 0, c: 2, x: 374, y: 68, id: 7 },
                      { r: 0, c: -2, x: 126, y: 212, id: 8 },
                      { r: 1, c: 1, x: 312, y: 246, id: 9 },
                      { r: -1, c: -1, x: 188, y: 32, id: 10 },
                    ].map((cell, idx) => {
                      // Determine frequency channel group index based on cell id and cluster size
                      const groupIndex = cell.id % clusterSize;
                      
                      // Theme-aligned group colors
                      const colors = [
                        '#10b981', // Emerald
                        '#38bdf8', // Sky
                        '#f59e0b', // Amber
                        '#ec4899', // Pink
                        '#8b5cf6', // Violet
                        '#14b8a6', // Teal
                        '#ef4444', // Red
                      ];
                      
                      const hexColor = colors[groupIndex % colors.length];

                      return (
                        <g key={idx} transform={`translate(${cell.x - 30}, ${cell.y - 35})`} className="group/cell cursor-pointer">
                          <use 
                            href="#hex" 
                            fill={hexColor} 
                            fillOpacity={0.12} 
                            stroke={hexColor} 
                            strokeWidth={cell.id === 0 ? 3 : 1.5}
                          />
                          <text 
                            x="30" 
                            y="40" 
                            textAnchor="middle" 
                            fill={hexColor} 
                            className="font-mono text-[10px] font-black"
                          >
                            f{groupIndex + 1}
                          </text>
                          {cell.id === 0 && (
                            <circle cx="30" cy="20" r="3" fill="#ef4444" className="animate-ping" />
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 bg-emerald-accent/20 border border-emerald-accent rounded inline-block"></span>
                    Central Target Node (f1)
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    *Co-channels share matching group indices (e.g. f1)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================
            INFORMATION ENTROPY & HUFFMAN CODER
            ============================================== */}
        {activeSubTab === 'huffman' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Input Column (1/3 Width) */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-navy-card border border-navy-light p-6 rounded-2xl shadow-xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/50">
                  <Binary className="h-5 w-5 text-emerald-accent" />
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider">Source Encoder</h2>
                    <p className="text-2xl font-mono text-emerald-accent">EEE 4183</p>
                  </div>
                </div>

                {/* Input Mode Switch */}
                <div className="flex bg-navy p-1 rounded-xl border border-navy-light/60">
                  <button
                    onClick={() => setInputMode('text')}
                    className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all ${
                      inputMode === 'text'
                        ? 'bg-navy-light text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Text String
                  </button>
                  <button
                    onClick={() => setInputMode('probs')}
                    className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all ${
                      inputMode === 'probs'
                        ? 'bg-navy-light text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Custom Probs
                  </button>
                </div>

                {/* Mode 1: Text string */}
                {inputMode === 'text' && (
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-slate-400 block">Source Message String</label>
                    <textarea
                      value={textString}
                      onChange={(e) => setTextString(e.target.value.toUpperCase().slice(0, 150))}
                      rows={4}
                      className="w-full bg-navy bg-opacity-50 text-xs font-mono p-3 rounded-lg border border-navy-light text-emerald-accent focus:outline-none focus:border-emerald-accent/60 uppercase"
                      placeholder="ENTER TEXT STRING TO CODE..."
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Length: {textString.length} chars</span>
                      <span>Max 150</span>
                    </div>
                  </div>
                )}

                {/* Mode 2: Custom Probs list */}
                {inputMode === 'probs' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono text-slate-400">Probability Distribution</label>
                      <button
                        onClick={handleResetProbPairs}
                        className="text-[10px] font-mono text-emerald-accent hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="h-3 w-3" /> Reset Defaults
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border-b border-navy-light/40 pb-3">
                      {probPairs.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-navy/60 p-2 rounded-lg border border-navy-light/40 font-mono text-xs">
                          <span className="text-white font-bold">{p.symbol}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-emerald-accent">{p.prob.toFixed(3)}</span>
                            <button
                              onClick={() => handleRemoveProbPair(p.symbol)}
                              className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add symbol form */}
                    <div className="bg-navy/40 p-3 rounded-xl border border-navy-light/50 space-y-2.5">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">Add Symbol</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={3}
                          value={newSymbol}
                          onChange={(e) => setNewSymbol(e.target.value)}
                          placeholder="Sym"
                          className="w-16 bg-navy text-center uppercase text-xs font-mono p-2 rounded-lg border border-navy-light text-white"
                        />
                        <input
                          type="number"
                          step="0.05"
                          min="0.01"
                          max="1.0"
                          value={newProb}
                          onChange={(e) => setNewProb(parseFloat(e.target.value) || 0)}
                          placeholder="0.1"
                          className="flex-1 bg-navy text-center text-xs font-mono p-2 rounded-lg border border-navy-light text-white"
                        />
                        <button
                          onClick={handleAddProbPair}
                          className="bg-emerald-accent text-navy p-2 rounded-lg font-bold hover:bg-emerald-hover transition-colors flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Informational Box */}
              <div className="bg-navy-card/40 border border-navy-light p-5 rounded-2xl space-y-3 text-xs">
                <h3 className="font-bold text-white flex items-center gap-1.5">
                  <Binary className="h-4 w-4 text-emerald-accent" />
                  Entropy & Efficiency Limits
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  Shannon&apos;s source coding theorem states that the average code length <code className="text-white">L</code> cannot be less than the source entropy <code className="text-white">H</code>.
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Huffman coding generates optimal prefix-free codes with near 100% coding efficiency.
                </p>
              </div>
            </div>

            {/* Coding Output Results Column (2/3 Width) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-end mb-4">
                <IEEEReportButton
                  experimentName="Telecommunication Engineering: Huffman Source Coding"
                  inputData={{
                    'Input Mode': inputMode,
                    'Text String': inputMode === 'text' ? textString : 'N/A',
                    'Alphabet Size': codingResults ? codingResults.items.length.toString() : '0'
                  }}
                  outputData={codingResults ? {
                    'Source Entropy (H)': codingResults.entropy.toFixed(4) + ' bits/symbol',
                    'Average Code Length (L)': codingResults.avgCodeLength.toFixed(4) + ' bits/symbol',
                    'Coding Efficiency (η)': (codingResults.efficiency * 100).toFixed(2) + ' %'
                  } : {}}
                  chartSelectors={['#huffman-chart']}
                />
              </div>
              {codingResults ? (
                <>
                  {/* Stats display bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-navy-card border border-navy-light p-4 rounded-2xl flex flex-col justify-between">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Source Entropy (H)</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-bold font-mono text-sky-400">{codingResults.entropy}</span>
                        <span className="text-xs text-slate-400 font-mono">bits/symbol</span>
                      </div>
                    </div>
                    <div className="bg-navy-card border border-navy-light p-4 rounded-2xl flex flex-col justify-between">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Avg Code Length (L)</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-bold font-mono text-amber-500">{codingResults.avgCodeLength}</span>
                        <span className="text-xs text-slate-400 font-mono">bits/symbol</span>
                      </div>
                    </div>
                    <div className="bg-navy-card border border-navy-light p-4 rounded-2xl flex flex-col justify-between">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Coding Efficiency (η)</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-bold font-mono text-emerald-accent">{codingResults.efficiency}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Huffman codebook dictionary table */}
                  <div className="bg-navy-card border border-navy-light rounded-2xl shadow-xl overflow-hidden" id="huffman-chart">
                    <div className="p-5 border-b border-navy-light/40">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Huffman Codebook Dictionary</h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-navy border-b border-navy-light text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                            <th className="p-4 pl-6">Symbol</th>
                            <th className="p-4">Probability (P_i)</th>
                            <th className="p-4">Prefix Binary Code</th>
                            <th className="p-4">Length (Bits)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-light/40 text-xs font-mono">
                          {codingResults.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-navy-light/10 transition-colors">
                              <td className="p-4 pl-6 text-white font-bold">{item.symbol}</td>
                              <td className="p-4 text-emerald-accent">{(item.prob * 100).toFixed(2)}% <span className="text-[10px] text-slate-500">({item.prob.toFixed(4)})</span></td>
                              <td className="p-4">
                                <span className="px-2.5 py-1 bg-navy/60 text-amber-500 rounded border border-navy-light/50 font-bold">
                                  {item.code}
                                </span>
                              </td>
                              <td className="p-4 text-slate-300 font-bold">{item.bits}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-navy-card border border-navy-light p-12 rounded-2xl text-center space-y-4">
                  <Binary className="h-10 w-10 text-slate-600 mx-auto animate-pulse" />
                  <p className="text-slate-400">Please provide a valid text string or symbol probabilities list.</p>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
