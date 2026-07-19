import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  Sliders,
  CheckCircle,
  HelpCircle,
  Plus,
  Trash2,
  Activity,
  Zap,
  Info,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { IEEEReportButton } from '../components/IEEEReportButton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Generator {
  id: number;
  name: string;
  a: number; // $/MW^2h (quadratic coefficient)
  b: number; // $/MWh (linear coefficient)
  c: number; // $/h (constant fuel cost)
  pMin: number; // Minimum capacity MW
  pMax: number; // Maximum capacity MW
  allocatedPower?: number;
  costPerHour?: number;
  isPinned?: boolean;
}

interface ReliabilityGenerator {
  id: number;
  capacity: number; // MW
  forRate: number; // Forced Outage Rate (e.g. 0.05 for 5%)
}

export default function PowerOperationsView() {
  // --- Economic Dispatch State ---
  const [powerDemand, setPowerDemand] = useState<number>(300); // Pd in MW
  const [generators, setGenerators] = useState<Generator[]>([
    { id: 1, name: 'Gen-1 (Thermal Coal)', a: 0.004, b: 8.0, c: 200, pMin: 50, pMax: 250 },
    { id: 2, name: 'Gen-2 (Thermal Gas)', a: 0.006, b: 10.0, c: 150, pMin: 30, pMax: 150 },
    { id: 3, name: 'Gen-3 (Heavy Fuel Oil)', a: 0.008, b: 12.0, c: 100, pMin: 20, pMax: 100 }
  ]);

  const [lambda, setLambda] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // --- Reliability (LOLP) State ---
  const [peakLoad, setPeakLoad] = useState<number>(220); // MW
  const [loadDurationPct, setLoadDurationPct] = useState<number>(60); // % duration of peak load
  const [relGenerators, setRelGenerators] = useState<ReliabilityGenerator[]>([
    { id: 1, capacity: 100, forRate: 0.02 }, // 100MW unit, 2% FOR
    { id: 2, capacity: 100, forRate: 0.02 }, // 100MW unit, 2% FOR
    { id: 3, capacity: 50, forRate: 0.04 }   // 50MW unit, 4% FOR
  ]);
  
  const [lolpResult, setLolpResult] = useState<number>(0);
  const [coptData, setCoptData] = useState<Array<{ outageCapacity: number, probability: number, cumulativeProb: number }>>([]);

  // --- ECONOMIC DISPATCH ALGORITHM (EEE 4249) ---
  // Coordinates using iterative Lagrange multiplier technique to handle lower/upper bounds
  const solveEconomicDispatch = () => {
    setDispatchError(null);
    let activeGens = generators.map(g => ({ ...g, allocatedPower: 0, isPinned: false }));
    
    // Check feasibility: sum(pMin) <= Pd <= sum(pMax)
    const minSum = activeGens.reduce((sum, g) => sum + g.pMin, 0);
    const maxSum = activeGens.reduce((sum, g) => sum + g.pMax, 0);

    if (powerDemand < minSum) {
      setDispatchError(`Power demand (${powerDemand} MW) is below minimum cumulative generator limits (${minSum} MW).`);
      return;
    }
    if (powerDemand > maxSum) {
      setDispatchError(`Power demand (${powerDemand} MW) exceeds maximum cumulative generator capacity (${maxSum} MW).`);
      return;
    }

    let iterationCount = 0;
    const maxIterations = 10;
    let converged = false;

    while (!converged && iterationCount < maxIterations) {
      iterationCount++;
      
      // Calculate Lambda
      // Lambda = (Pd + sum(b_i / (2*a_i))) / sum(1 / (2*a_i)) for all non-pinned generators
      const unpinnedGens = activeGens.filter(g => !g.isPinned);
      
      let sumInverse2a = 0;
      let sumBOver2a = 0;
      let pinnedPowerSum = activeGens.filter(g => g.isPinned).reduce((sum, g) => sum + (g.allocatedPower || 0), 0);
      
      unpinnedGens.forEach(g => {
        sumInverse2a += 1 / (2 * g.a);
        sumBOver2a += g.b / (2 * g.a);
      });

      const currentDemand = powerDemand - pinnedPowerSum;
      const calculatedLambda = (currentDemand + sumBOver2a) / sumInverse2a;

      // Allocate power based on lambda
      let violatesLimit = false;

      activeGens.forEach(g => {
        if (!g.isPinned) {
          let pi = (calculatedLambda - g.b) / (2 * g.a);
          
          if (pi < g.pMin) {
            g.allocatedPower = g.pMin;
            g.isPinned = true;
            violatesLimit = true;
          } else if (pi > g.pMax) {
            g.allocatedPower = g.pMax;
            g.isPinned = true;
            violatesLimit = true;
          } else {
            g.allocatedPower = parseFloat(pi.toFixed(2));
          }
        }
      });

      if (!violatesLimit) {
        setLambda(parseFloat(calculatedLambda.toFixed(4)));
        converged = true;
      }
    }

    // Calculate final operational fuel costs: C_i = a_i * Pi^2 + b_i * Pi + c_i
    let totalCostAccumulator = 0;
    const solvedGens = activeGens.map(g => {
      const p = g.allocatedPower || 0;
      const cost = g.a * p * p + g.b * p + g.c;
      totalCostAccumulator += cost;
      return {
        ...g,
        costPerHour: parseFloat(cost.toFixed(2))
      };
    });

    setTotalCost(parseFloat(totalCostAccumulator.toFixed(2)));
    setGenerators(solvedGens);
  };

  useEffect(() => {
    solveEconomicDispatch();
  }, [powerDemand]);

  // Generators dynamic field handlers
  const handleUpdateGenerator = (id: number, key: keyof Generator, value: number) => {
    setGenerators(prev => prev.map(g => g.id === id ? { ...g, [key]: value } : g));
  };

  const handleAddGenerator = () => {
    if (generators.length >= 6) return;
    const nextId = generators.length + 1;
    const newGen: Generator = {
      id: nextId,
      name: `Gen-${nextId} (Co-gen Block)`,
      a: 0.005,
      b: 11.0,
      c: 120,
      pMin: 10,
      pMax: 120
    };
    setGenerators([...generators, newGen]);
  };

  const handleRemoveGenerator = (id: number) => {
    if (generators.length <= 2) return;
    setGenerators(generators.filter(g => g.id !== id).map((g, i) => ({ ...g, id: i + 1 })));
  };


  // --- RELIABILITY (COPT & LOLP) CALCULATOR (EEE 4251) ---
  // Calculates cumulative outage probabilities for 3-unit binary combinations
  const calculateReliability = () => {
    // Generate the COPT table
    // For n generators, each can be UP (prob = 1 - FOR) or DOWN (prob = FOR)
    // Binary combinations tree:
    let states: Array<{ outage: number, prob: number }> = [{ outage: 0, prob: 1.0 }];

    relGenerators.forEach(gen => {
      let nextStates: Array<{ outage: number, prob: number }> = [];
      
      states.forEach(state => {
        // Option 1: Gen is UP (Available)
        nextStates.push({
          outage: state.outage,
          prob: state.prob * (1 - gen.forRate)
        });
        // Option 2: Gen is DOWN (Outage)
        nextStates.push({
          outage: state.outage + gen.capacity,
          prob: state.prob * gen.forRate
        });
      });

      states = nextStates;
    });

    // Group matching outage capacities together
    const groupedMap: { [key: number]: number } = {};
    states.forEach(s => {
      const roundedOutage = Math.round(s.outage);
      groupedMap[roundedOutage] = (groupedMap[roundedOutage] || 0) + s.prob;
    });

    // Convert map to sorted list
    const sortedCOPT = Object.keys(groupedMap)
      .map(key => ({
        outageCapacity: Number(key),
        probability: groupedMap[Number(key)]
      }))
      .sort((a, b) => a.outageCapacity - b.outageCapacity);

    // Calculate Cumulative Probability (probability that outage is >= X)
    let cumulative = 1.0;
    const finalCOPT = sortedCOPT.map((item, idx) => {
      if (idx > 0) {
        cumulative -= sortedCOPT[idx - 1].probability;
      }
      return {
        ...item,
        probability: parseFloat(item.probability.toFixed(6)),
        cumulativeProb: parseFloat(Math.max(0, cumulative).toFixed(6))
      };
    });

    setCoptData(finalCOPT);

    // Compute Loss of Load Probability (LOLP)
    // LOLP occurs when: Available Capacity < Peak Load
    // Available Capacity = Total Capacity - Outage Capacity
    const totalCapacity = relGenerators.reduce((sum, g) => sum + g.capacity, 0);
    
    let outageThresholdProb = 0;
    finalCOPT.forEach(item => {
      const availableCap = totalCapacity - item.outageCapacity;
      if (availableCap < peakLoad) {
        outageThresholdProb += item.probability;
      }
    });

    // LOLP = Outage Prob * duration percentage
    const lolpVal = outageThresholdProb * (loadDurationPct / 100);
    setLolpResult(parseFloat((lolpVal * 100).toFixed(4))); // in percent
  };

  useEffect(() => {
    calculateReliability();
  }, [peakLoad, loadDurationPct, relGenerators]);

  const handleUpdateRelGenerator = (id: number, key: keyof ReliabilityGenerator, value: number) => {
    setRelGenerators(prev => prev.map(g => g.id === id ? { ...g, [key]: value } : g));
  };


  // Chart formatting data
  const dispatchChartData = generators.map(g => ({
    name: g.name,
    Allocated: g.allocatedPower || 0,
    Maximum: g.pMax,
    Minimum: g.pMin
  }));

  const COLORS = ['#22d3ee', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div id="power-operations-view" className="min-h-screen bg-navy-dark text-slate-100 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Back button */}
        <div className="mb-6">
          <Link
            to="/tools"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> BACK TO TOOLS CATALOG
          </Link>
        </div>

        {/* Header Title */}
        <div className="relative mb-8 rounded-2xl border border-navy-light/60 bg-navy-light/20 p-6 md:p-8 overflow-hidden">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-emerald-accent/5 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-indigo-500/5 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-start justify-between gap-6" id="power-ops-chart">
            <div>
              <div className="flex items-center gap-2 text-emerald-accent font-semibold text-xs tracking-wider uppercase mb-2">
                <TrendingUp className="h-4 w-4 animate-pulse" /> EEE 4249 / EEE 4251 Power Operations
              </div>
              <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
                Power Operations & <span className="text-emerald-accent">Grid Reliability</span> Solver
              </h1>
              <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
                Design dispatch strategy schemes. Apply quadratic fuel coefficients to calculate Economic Load Dispatch using iterative Lagrange optimization, alongside capacity loss probability tables (COPT) for grid Loss of Load Probability (LOLP).
              </p>
            </div>
            <div className="shrink-0">
              <IEEEReportButton
                experimentName="Power Operations & Grid Reliability Solver"
                inputData={{
                  'Power Demand': powerDemand + ' MW',
                  'Peak Load': peakLoad + ' MW',
                  'Generators (Dispatch)': generators.length.toString(),
                  'Generators (Reliability)': relGenerators.length.toString()
                }}
                outputData={{
                  'Incremental Cost (λ)': lambda.toFixed(2) + ' $/MWh',
                  'Total Cost': totalCost.toFixed(2) + ' $/hr',
                  'LOLP Result': lolpResult.toFixed(4)
                }}
                chartSelectors={['#power-ops-chart']}
              />
            </div>
          </div>
        </div>

        {/* Main Grid Splits: economic dispatch vs system reliability */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT: ECONOMIC DISPATCH CALCULATOR */}
          <div className="rounded-2xl border border-navy-light/60 bg-navy-light/10 p-6 space-y-6">
            
            <div className="flex items-center justify-between pb-4 border-b border-navy-light/60">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Zap className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-display font-black text-white text-base">
                    Economic Load Dispatch (ELD)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Solve Lagrange optimization of fuel costs vs operational capacity.
                  </p>
                </div>
              </div>

              <button
                onClick={handleAddGenerator}
                disabled={generators.length >= 5}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono font-bold bg-navy-dark border border-navy-light hover:border-emerald-accent/40 text-slate-300 hover:text-emerald-accent rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Generator</span>
              </button>
            </div>

            {/* Demand Slider Input */}
            <div className="p-4 rounded-xl bg-navy-dark/60 border border-navy-light/60 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-mono text-slate-400 font-bold uppercase">Total System Demand (Pd):</span>
                <span className="text-xl font-black font-mono text-emerald-accent">{powerDemand} MW</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="10"
                value={powerDemand}
                onChange={(e) => setPowerDemand(parseInt(e.target.value))}
                className="w-full accent-emerald-accent cursor-pointer"
              />
            </div>

            {/* Error alerts */}
            {dispatchError && (
              <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-200 text-xs flex items-center gap-2 leading-relaxed">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <span>{dispatchError}</span>
              </div>
            )}

            {/* Generators dynamic table lists */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Generator Parameter Curves
              </h4>
              
              <div className="space-y-3 overflow-y-auto max-h-72 pr-1">
                {generators.map((gen, idx) => (
                  <div key={gen.id} className="p-4 rounded-xl border border-navy-light/60 bg-navy-dark/40 space-y-3 relative group">
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white font-mono uppercase">
                        {gen.name}
                      </span>
                      {generators.length > 2 && (
                        <button
                          onClick={() => handleRemoveGenerator(gen.id)}
                          className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                          title="Remove Generator"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-5 gap-2 text-xs font-mono">
                      <div>
                        <label className="text-[10px] text-slate-500 block">Coeff a</label>
                        <input
                          type="number"
                          step="0.001"
                          value={gen.a}
                          onChange={(e) => handleUpdateGenerator(gen.id, 'a', parseFloat(e.target.value) || 0.001)}
                          className="w-full bg-navy-dark border border-navy-light/60 rounded px-1.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-accent"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Coeff b</label>
                        <input
                          type="number"
                          step="0.1"
                          value={gen.b}
                          onChange={(e) => handleUpdateGenerator(gen.id, 'b', parseFloat(e.target.value) || 0.1)}
                          className="w-full bg-navy-dark border border-navy-light/60 rounded px-1.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-accent"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Coeff c</label>
                        <input
                          type="number"
                          value={gen.c}
                          onChange={(e) => handleUpdateGenerator(gen.id, 'c', parseFloat(e.target.value) || 0)}
                          className="w-full bg-navy-dark border border-navy-light/60 rounded px-1.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-accent"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Min MW</label>
                        <input
                          type="number"
                          value={gen.pMin}
                          onChange={(e) => handleUpdateGenerator(gen.id, 'pMin', parseInt(e.target.value) || 0)}
                          className="w-full bg-navy-dark border border-navy-light/60 rounded px-1.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-accent"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block">Max MW</label>
                        <input
                          type="number"
                          value={gen.pMax}
                          onChange={(e) => handleUpdateGenerator(gen.id, 'pMax', parseInt(e.target.value) || 0)}
                          className="w-full bg-navy-dark border border-navy-light/60 rounded px-1.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-accent"
                        />
                      </div>
                    </div>

                    {gen.allocatedPower !== undefined && !dispatchError && (
                      <div className="flex justify-between items-center bg-navy-dark px-3 py-1.5 rounded-lg border border-navy-light/40 text-xs">
                        <span className="text-slate-400">Allocated Dispatch:</span>
                        <span className="font-mono text-emerald-accent font-black">
                          {gen.allocatedPower} MW <span className="text-slate-500">/ {gen.pMax} MW</span>
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Final Output Summary Billboard */}
            {!dispatchError && (
              <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl border border-emerald-accent/20 bg-emerald-accent/5">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Incremental Cost (λ):</span>
                  <div className="text-xl font-black font-mono text-emerald-accent mt-1">
                    {lambda} <span className="text-xs font-normal text-slate-400">$/MWh</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Total Operations Cost:</span>
                  <div className="text-xl font-black font-mono text-emerald-accent mt-1">
                    ${totalCost} <span className="text-xs font-normal text-slate-400">/hr</span>
                  </div>
                </div>
              </div>
            )}

            {/* Recharts Allocation bar graph */}
            {!dispatchError && (
              <div className="h-56 w-full pt-4 border-t border-navy-light/60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dispatchChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                    <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '10px' }} />
                    <YAxis label={{ value: 'Allocated MW', angle: -90, position: 'insideLeft', fill: '#64748b', style: {fontSize: '11px'} }} stroke="#64748b" style={{ fontSize: '10px' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0b1329', borderColor: '#1e293b' }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                    <Bar dataKey="Allocated" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

          </div>

          {/* RIGHT: SYSTEM RELIABILITY (LOLP) CALCULATOR */}
          <div className="rounded-2xl border border-navy-light/60 bg-navy-light/10 p-6 space-y-6 flex flex-col justify-between">
            
            <div className="space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-navy-light/60">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <Activity className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-display font-black text-white text-base">
                    Grid Loss of Load Probability (LOLP)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Map Forced Outage Rates (FOR) to calculate grid capacity failure tables.
                  </p>
                </div>
              </div>

              {/* Outputs Billboard */}
              <div className="p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Calculated Loss of Load Probability (LOLP)
                </span>
                <div className="text-3xl font-black text-indigo-400 font-mono mt-2">
                  {lolpResult}%
                </div>
                <div className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  Represents the statistical probability that the system capacity cannot meet total peak demand during its specified duration cycle.
                </div>
              </div>

              {/* Parameters sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* System Peak Load */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 block">
                    System Peak Demand:
                  </label>
                  <div className="flex items-center bg-navy-dark border border-navy-light/80 rounded-xl px-3 py-2">
                    <input
                      type="number"
                      value={peakLoad}
                      onChange={(e) => setPeakLoad(Math.max(1, Number(e.target.value)))}
                      className="bg-transparent w-full text-white font-mono text-sm focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-mono">MW</span>
                  </div>
                </div>

                {/* Duration percentage of peak load */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-slate-400 block">
                    Peak Load Duration:
                  </label>
                  <div className="flex items-center bg-navy-dark border border-navy-light/80 rounded-xl px-3 py-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={loadDurationPct}
                      onChange={(e) => setLoadDurationPct(Math.max(1, Math.min(100, Number(e.target.value))))}
                      className="bg-transparent w-full text-white font-mono text-sm focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-mono">%</span>
                  </div>
                </div>

              </div>

              {/* COPT Table display */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Capacity Outage Probability Table (COPT)
                </h4>
                
                <div className="border border-navy-light/60 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left font-mono">
                    <thead className="bg-navy-dark/80 text-slate-400 border-b border-navy-light/60">
                      <tr>
                        <th className="p-3">Outage Cap (MW)</th>
                        <th className="p-3">State Probability</th>
                        <th className="p-3">Cumulative Prob</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-light/40 text-slate-300">
                      {coptData.map((item, idx) => (
                        <tr key={idx} className="hover:bg-navy-light/20">
                          <td className="p-3 font-bold text-slate-200">{item.outageCapacity} MW</td>
                          <td className="p-3">{item.probability.toFixed(5)}</td>
                          <td className="p-3 text-indigo-400">{item.cumulativeProb.toFixed(5)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Reliable Generators list config */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Grid Generation Fleet Forced Outages
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {relGenerators.map((gen, idx) => (
                    <div key={gen.id} className="p-3 rounded-xl border border-navy-light/60 bg-navy-dark/40 space-y-2">
                      <div className="text-[10px] font-bold text-slate-300 font-mono">
                        UNIT-{gen.id} THERMAL
                      </div>
                      
                      <div className="space-y-1 font-mono text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-[10px]">CAP</span>
                          <input
                            type="number"
                            value={gen.capacity}
                            onChange={(e) => handleUpdateRelGenerator(gen.id, 'capacity', parseInt(e.target.value) || 10)}
                            className="w-16 bg-navy-dark border border-navy-light/60 rounded text-right px-1 text-xs"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-[10px]">FOR (q)</span>
                          <input
                            type="number"
                            step="0.01"
                            value={gen.forRate}
                            onChange={(e) => handleUpdateRelGenerator(gen.id, 'forRate', parseFloat(e.target.value) || 0.01)}
                            className="w-16 bg-navy-dark border border-navy-light/60 rounded text-right px-1 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Mathematical help footer box */}
            <div className="p-4 rounded-xl bg-navy-dark/40 border border-navy-light/60 text-xs text-slate-400 space-y-2 mt-6">
              <div className="flex items-center gap-1 font-bold text-slate-300 uppercase font-mono text-[10px]">
                <Info className="h-3.5 w-3.5 text-indigo-400" /> Reliability Engineering
              </div>
              <p className="leading-relaxed">
                Forced Outage Rate (q = FOR) is the probability a unit is down when needed: q = Outage Hours / (Service Hours + Outage Hours). LOLP compiles these binary outages to determine risk envelopes.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
