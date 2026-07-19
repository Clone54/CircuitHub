import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calculator, Activity, FunctionSquare, LineChart as ChartIcon } from 'lucide-react';
import { LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, ReferenceLine } from 'recharts';

import { useRootFinder } from '../hooks/useRootFinder';
import { useODESolver } from '../hooks/useODESolver';
import { useCurveFitting } from '../hooks/useCurveFitting';

export default function ComputationalToolsView() {
  const [activeTab, setActiveTab] = useState<'root' | 'ode' | 'curve'>('root');

  const { inputs: rootInputs, setInputs: setRootInputs, outputs: rootOutputs } = useRootFinder({
    expression: 'x^3 - 4*x - 9',
    method: 'bisection',
    a: 2,
    b: 3,
    x0: 2.5,
    tol: 0.001,
    maxIter: 20
  });

  const { inputs: odeInputs, setInputs: setOdeInputs, outputs: odeOutputs } = useODESolver({
    expression: 'x - y^2',
    x0: 0,
    y0: 1,
    xEnd: 3,
    h: 0.2
  });

  const { inputs: curveInputs, setInputs: setCurveInputs, outputs: curveOutputs } = useCurveFitting({
    dataText: '1 2.1\n2 3.9\n3 6.1\n4 8.2\n5 10.1\n6 12.3',
    model: 'linear'
  });

  return (
    <div className="min-h-screen bg-navy-dark text-slate-100 pb-12 font-sans selection:bg-rose-500/30 selection:text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all">
          <ArrowLeft className="h-4 w-4" /> BACK TO HOME
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        <div className="relative rounded-2xl border border-navy-light/60 bg-navy-light/20 p-6 md:p-8 overflow-hidden">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-rose-500/10 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Calculator className="h-4 w-4 animate-pulse" /> EEE 3109 Computational Methods
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              Computational <span className="text-indigo-400">Methods</span> Suite
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
              Numerical Root Finding, ODE Solvers (Runge-Kutta), and Curve Fitting & Regression Studio.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-navy-light/60 pb-px">
          <button onClick={() => setActiveTab('root')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'root' ? 'border-amber-400 text-amber-400 bg-amber-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><FunctionSquare className="h-4 w-4" /> Root Finding</div>
          </button>
          <button onClick={() => setActiveTab('ode')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'ode' ? 'border-rose-400 text-rose-400 bg-rose-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Activity className="h-4 w-4" /> ODE Solver</div>
          </button>
          <button onClick={() => setActiveTab('curve')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'curve' ? 'border-indigo-400 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><ChartIcon className="h-4 w-4" /> Curve Fitting</div>
          </button>
        </div>

        {/* TAB 1: Root Finding */}
        {activeTab === 'root' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <FunctionSquare className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Algorithm Settings</h3>
              </div>
              <div className="space-y-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <label className="text-slate-400 block">Function f(x) = 0</label>
                  <input type="text" value={rootInputs.expression} onChange={e => setRootInputs({...rootInputs, expression: e.target.value})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 block">Method</label>
                  <select value={rootInputs.method} onChange={e => setRootInputs({...rootInputs, method: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white">
                    <option value="bisection">Bisection Method</option>
                    <option value="newton">Newton-Raphson</option>
                  </select>
                </div>
                {rootInputs.method === 'bisection' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Lower [a]</label>
                      <input type="number" step="0.1" value={rootInputs.a} onChange={e => setRootInputs({...rootInputs, a: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Upper [b]</label>
                      <input type="number" step="0.1" value={rootInputs.b} onChange={e => setRootInputs({...rootInputs, b: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Initial Guess (x0)</label>
                    <input type="number" step="0.1" value={rootInputs.x0} onChange={e => setRootInputs({...rootInputs, x0: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 border-t border-navy-light/40 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Tolerance</label>
                    <input type="number" step="0.001" value={rootInputs.tol} onChange={e => setRootInputs({...rootInputs, tol: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Max Iterations</label>
                    <input type="number" value={rootInputs.maxIter} onChange={e => setRootInputs({...rootInputs, maxIter: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                </div>
              </div>
              {rootOutputs.errorStr && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400 text-xs font-mono">
                  {rootOutputs.errorStr}
                </div>
              )}
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[350px] flex flex-col">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-navy-light/40 pb-2">Convergence Plot</h4>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis type="number" dataKey="x" domain={['dataMin', 'dataMax']} stroke="#64748b" style={{ fontSize: '11px' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} formatter={(val: any) => typeof val === 'number' ? val.toFixed(4) : val} />
                      <ReferenceLine y={0} stroke="#f43f5e" strokeDasharray="3 3" />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                      <Line data={rootOutputs.plotData} type="monotone" dataKey="fx" stroke="#38bdf8" strokeWidth={2} dot={false} name="f(x)" />
                      <Scatter data={rootOutputs.history} dataKey="fx" name="Iterations" fill="#f59e0b" shape="circle" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-navy-card border border-navy-light/60 p-6 rounded-2xl">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-navy-light/40 pb-2">Iteration History</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono text-left">
                    <thead className="text-slate-400 border-b border-navy-light/40">
                      <tr>
                        <th className="py-2 px-3">Iter</th>
                        <th className="py-2 px-3">x</th>
                        <th className="py-2 px-3">f(x)</th>
                        <th className="py-2 px-3">Error</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300 divide-y divide-navy-light/30">
                      {rootOutputs.history.map((h, i) => (
                        <tr key={i} className="hover:bg-navy-light/10">
                          <td className="py-2 px-3 text-amber-400">{h.iter}</td>
                          <td className="py-2 px-3">{h.x.toFixed(6)}</td>
                          <td className="py-2 px-3">{h.fx.toExponential(3)}</td>
                          <td className="py-2 px-3">{h.err.toExponential(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ODE Solver */}
        {activeTab === 'ode' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <Activity className="h-5 w-5 text-rose-400" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">IVP Parameters</h3>
              </div>
              <div className="space-y-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <label className="text-slate-400 block">ODE: dy/dx = f(x,y)</label>
                  <input type="text" value={odeInputs.expression} onChange={e => setOdeInputs({...odeInputs, expression: e.target.value})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Initial x0</label>
                    <input type="number" step="0.1" value={odeInputs.x0} onChange={e => setOdeInputs({...odeInputs, x0: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Initial y0</label>
                    <input type="number" step="0.1" value={odeInputs.y0} onChange={e => setOdeInputs({...odeInputs, y0: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-navy-light/40 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Target x_end</label>
                    <input type="number" step="0.1" value={odeInputs.xEnd} onChange={e => setOdeInputs({...odeInputs, xEnd: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Step Size (h)</label>
                    <input type="number" step="0.01" value={odeInputs.h} onChange={e => setOdeInputs({...odeInputs, h: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-2 py-1.5 text-white" />
                  </div>
                </div>
              </div>
              {odeOutputs.errorStr && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400 text-xs font-mono">
                  {odeOutputs.errorStr}
                </div>
              )}
            </div>

            <div className="lg:col-span-8 bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[400px] flex flex-col">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-navy-light/40 pb-2">Euler vs Runge-Kutta 4th Order</h4>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={odeOutputs.plotData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="x" type="number" domain={['dataMin', 'dataMax']} stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'x', position: 'insideBottom', offset: -15, fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'y(x)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} formatter={(val: number) => val.toFixed(4)} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="yEuler" stroke="#fb7185" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Forward Euler" />
                    <Line type="monotone" dataKey="yRK4" stroke="#38bdf8" strokeWidth={3} dot={false} name="RK4 (More Accurate)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Curve Fitting */}
        {activeTab === 'curve' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                <ChartIcon className="h-5 w-5 text-indigo-400" />
                <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Regression Studio</h3>
              </div>
              <div className="space-y-4 text-xs font-mono">
                <div className="space-y-1.5">
                  <label className="text-slate-400 block">Data Points (X Y, one per line)</label>
                  <textarea value={curveInputs.dataText} onChange={e => setCurveInputs({...curveInputs, dataText: e.target.value})} className="w-full h-40 bg-navy-dark border border-navy-light rounded px-3 py-2 text-white resize-none custom-scrollbar" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 block">Model</label>
                  <select value={curveInputs.model} onChange={e => setCurveInputs({...curveInputs, model: e.target.value as any})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white">
                    <option value="linear">Linear (y = mx + c)</option>
                    <option value="quadratic">Quadratic (y = ax² + bx + c)</option>
                    <option value="exponential">Exponential (y = a*e^(bx))</option>
                  </select>
                </div>
              </div>
              {curveOutputs.errorStr ? (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400 text-xs font-mono">
                  {curveOutputs.errorStr}
                </div>
              ) : (
                <div className="bg-navy-dark border border-indigo-500/30 rounded-xl p-4 mt-6 space-y-2 font-mono text-sm">
                  <div className="text-slate-400 text-[10px] uppercase mb-1">Fitted Equation</div>
                  <div className="text-indigo-400 font-bold">{curveOutputs.equationStr}</div>
                  <div className="flex justify-between items-center border-t border-navy-light/40 pt-2 mt-2">
                    <span className="text-slate-400 text-[10px] uppercase">R-Squared</span>
                    <span className="text-emerald-400 font-bold">{curveOutputs.rSquared.toFixed(4)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-8 bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[400px] flex flex-col">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-navy-light/40 pb-2">Regression Curve</h4>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={curveOutputs.plotData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="x" type="number" domain={['dataMin', 'dataMax']} stroke="#64748b" style={{ fontSize: '11px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '11px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', fontSize: '12px' }} formatter={(val: number) => val?.toFixed(4)} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                    <Scatter dataKey="yRaw" name="Raw Data" fill="#f59e0b" shape="circle" />
                    <Line type="monotone" dataKey="yFit" stroke="#818cf8" strokeWidth={3} dot={false} name="Fitted Curve" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
