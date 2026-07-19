import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Cpu,
  Sliders,
  HelpCircle,
  Activity,
  Zap,
  Info,
  ShieldCheck,
  CheckCircle,
  RefreshCw,
  Code,
  FileCode,
  Terminal,
  Grid
} from 'lucide-react';
import { IEEEReportButton } from '../components/IEEEReportButton';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface DHParameter {
  link: number;
  theta: number; // joint angle in degrees (variable)
  d: number; // joint offset in meters
  a: number; // link length in meters
  alpha: number; // joint twist in degrees
}

interface JointCoordinate {
  name: string;
  x: number;
  y: number;
  z: number;
}

export default function RoboticsHubView() {
  // --- D-H Parameters State ---
  const [dhTable, setDhTable] = useState<DHParameter[]>([
    { link: 1, theta: 45, d: 0.5, a: 0.0, alpha: 90 },   // Joint 1: Rotational Base
    { link: 2, theta: 30, d: 0.0, a: 1.0, alpha: 0 },    // Joint 2: Shoulder
    { link: 3, theta: -60, d: 0.0, a: 0.8, alpha: 0 }    // Joint 3: Elbow
  ]);

  const [jointCoords, setJointCoords] = useState<JointCoordinate[]>([]);
  const [transformMatrix, setTransformMatrix] = useState<number[][]>([]);

  // --- Embedded C Code Generation State ---
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Helper: Multiply two 4x4 matrices
  const multiplyMatrices = (m1: number[][], m2: number[][]): number[][] => {
    const result = Array(4).fill(0).map(() => Array(4).fill(0));
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 4; k++) {
          result[i][j] += m1[i][k] * m2[k][j];
        }
      }
    }
    return result;
  };

  // Helper: Get Single A-matrix using DH formula
  const getAMatrix = (param: DHParameter): number[][] => {
    const rTheta = (param.theta * Math.PI) / 180;
    const rAlpha = (param.alpha * Math.PI) / 180;
    
    const cosT = Math.cos(rTheta);
    const sinT = Math.sin(rTheta);
    const cosA = Math.cos(rAlpha);
    const sinA = Math.sin(rAlpha);

    // Standard D-H homogeneous transformation matrix
    return [
      [cosT, -sinT * cosA, sinT * sinA, param.a * cosT],
      [sinT, cosT * cosA, -cosT * sinA, param.a * sinT],
      [0, sinA, cosA, param.d],
      [0, 0, 0, 1]
    ];
  };

  // Solve Homogeneous Forward Kinematics (T_03 = A1 * A2 * A3)
  const calculateKinematics = () => {
    const A1 = getAMatrix(dhTable[0]);
    const A2 = getAMatrix(dhTable[1]);
    const A3 = getAMatrix(dhTable[2]);

    // Homogeneous transformation chains
    const T_01 = A1;
    const T_02 = multiplyMatrices(T_01, A2);
    const T_03 = multiplyMatrices(T_02, A3);

    setTransformMatrix(T_03);

    // Coordinate positions
    // Origin Base (Joint 0)
    const j0: JointCoordinate = { name: 'Base (J0)', x: 0, y: 0, z: 0 };
    
    // Joint 1 position: col 3 of T_01
    const j1: JointCoordinate = {
      name: 'Joint 1',
      x: parseFloat(T_01[0][3].toFixed(4)),
      y: parseFloat(T_01[1][3].toFixed(4)),
      z: parseFloat(T_01[2][3].toFixed(4))
    };

    // Joint 2 position: col 3 of T_02
    const j2: JointCoordinate = {
      name: 'Joint 2',
      x: parseFloat(T_02[0][3].toFixed(4)),
      y: parseFloat(T_02[1][3].toFixed(4)),
      z: parseFloat(T_02[2][3].toFixed(4))
    };

    // End-Effector Joint 3 position: col 3 of T_03
    const j3: JointCoordinate = {
      name: 'End-Effector (J3)',
      x: parseFloat(T_03[0][3].toFixed(4)),
      y: parseFloat(T_03[1][3].toFixed(4)),
      z: parseFloat(T_03[2][3].toFixed(4))
    };

    setJointCoords([j0, j1, j2, j3]);
  };

  useEffect(() => {
    calculateKinematics();
  }, [dhTable]);

  // Table parameters modifier
  const handleParamChange = (index: number, key: keyof DHParameter, value: number) => {
    setDhTable(prev => prev.map((param, i) => i === index ? { ...param, [key]: value } : param));
  };

  // Handle STM32 FreeRTOS C Code Generation
  const handleGenerateCode = async () => {
    setIsLoadingAI(true);
    setAiError(null);
    setGeneratedCode(null);

    try {
      const response = await fetch('/api/robotics-kinematics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dhTable })
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve embedded C solver from server.');
      }

      const data = await response.json();
      setGeneratedCode(data.code);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'An error occurred during C file generation.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Scatter data formatted for 2D X-Y mapping of Arm Joints
  const armPathData = jointCoords.map(j => ({
    x: j.x,
    y: j.y,
    z: j.z,
    name: j.name
  }));

  return (
    <div id="robotics-hub-view" className="min-h-screen bg-navy-dark text-slate-100 pb-16">
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

        {/* Header Dashboard Card */}
        <div className="relative mb-8 rounded-2xl border border-navy-light/60 bg-navy-light/20 p-6 md:p-8 overflow-hidden">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-emerald-accent/5 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-indigo-500/5 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-2">
                <Cpu className="h-4 w-4 animate-pulse" /> EEE 4223 / EEE 4225 Robotics & Embedded AI
              </div>
              <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
                Robotics Kinematics & <span className="text-indigo-400">Embedded AI</span> Hub
              </h1>
              <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
                Configure joint Denavit-Hartenberg equations to solve forward kinematics coordinate transformations. Generate professional STM32 C source files running FreeRTOS multi-tasking schedulers dynamically.
              </p>
            </div>
            
            <button
              onClick={handleGenerateCode}
              disabled={isLoadingAI}
              className="flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold uppercase rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none shrink-0"
            >
              {isLoadingAI ? (
                <>
                  <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                  <span>Generating Hal Code...</span>
                </>
              ) : (
                <>
                  <Code className="h-4.5 w-4.5" />
                  <span>Generate STM32 HAL C</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Body content splitting layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: KINEMATICS MATHEMATICS MATRIX SOLVER */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Table inputs card */}
            <div className="rounded-xl border border-navy-light/60 bg-navy-light/10 p-6 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Grid className="h-4.5 w-4.5 text-indigo-400" /> Joint DH Parameter Table
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-navy-dark border-b border-navy-light/60 text-slate-400">
                    <tr>
                      <th className="p-3">Joint</th>
                      <th className="p-3">Angle θ (deg)</th>
                      <th className="p-3">Offset d (m)</th>
                      <th className="p-3">Length a (m)</th>
                      <th className="p-3">Twist α (deg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-light/40 text-slate-200">
                    {dhTable.map((param, index) => (
                      <tr key={index} className="hover:bg-navy-light/20">
                        <td className="p-3 font-bold text-indigo-400">Joint {param.link}</td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={param.theta}
                            onChange={(e) => handleParamChange(index, 'theta', Number(e.target.value))}
                            className="bg-navy-dark border border-navy-light/80 text-white w-20 px-2 py-1.5 rounded focus:border-indigo-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.1"
                            value={param.d}
                            onChange={(e) => handleParamChange(index, 'd', Number(e.target.value))}
                            className="bg-navy-dark border border-navy-light/80 text-white w-20 px-2 py-1.5 rounded focus:border-indigo-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.1"
                            value={param.a}
                            onChange={(e) => handleParamChange(index, 'a', Number(e.target.value))}
                            className="bg-navy-dark border border-navy-light/80 text-white w-20 px-2 py-1.5 rounded focus:border-indigo-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            value={param.alpha}
                            onChange={(e) => handleParamChange(index, 'alpha', Number(e.target.value))}
                            className="bg-navy-dark border border-navy-light/80 text-white w-20 px-2 py-1.5 rounded focus:border-indigo-500 focus:outline-none"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transformations path visualizer chart */}
            <div className="rounded-xl border border-navy-light/60 bg-navy-light/10 p-6">
              <h3 className="text-sm font-bold text-white mb-4">
                2D Arm Trajectory Plot (X-Y Projection)
              </h3>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={armPathData}
                    margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                    <XAxis
                      dataKey="x"
                      type="number"
                      domain={[-2.0, 2.0]}
                      stroke="#64748b"
                      label={{ value: 'X coordinate (meters)', position: 'insideBottom', offset: -5, fill: '#64748b', style: {fontSize: '11px'} }}
                      style={{ fontSize: '10px', fontFamily: 'monospace' }}
                    />
                    <YAxis
                      dataKey="y"
                      type="number"
                      domain={[-2.0, 2.0]}
                      stroke="#64748b"
                      label={{ value: 'Y coordinate (meters)', angle: -90, position: 'insideLeft', fill: '#64748b', style: {fontSize: '11px'} }}
                      style={{ fontSize: '10px', fontFamily: 'monospace' }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0b1329', borderColor: '#1e293b' }}
                      formatter={(value: any, name: string, props: any) => [`${value}m`, props.payload.name]}
                      labelFormatter={() => 'Robot Arm Node'}
                    />
                    <Line
                      type="monotone"
                      dataKey="y"
                      stroke="#818cf8"
                      strokeWidth={3}
                      dot={{ r: 6, fill: '#6366f1', stroke: '#818cf8' }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-around gap-2 text-center text-xs font-mono pt-4 border-t border-navy-light/40">
                {jointCoords.map((jc, i) => (
                  <div key={i}>
                    <span className="text-indigo-400 font-bold block">{jc.name}</span>
                    <span className="text-slate-400 block mt-1">({jc.x}, {jc.y}, {jc.z})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Generated Code display if available */}
            {(generatedCode || isLoadingAI || aiError) && (
              <div className="rounded-xl border border-navy-light/60 bg-navy-light/10 p-6 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Terminal className="h-5 w-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      STM32 FreeRTOS PWM C Driver Code
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Output target: stm32f4xx_hal.c with FreeRTOS priority queues
                    </p>
                  </div>
                </div>

                {isLoadingAI && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin" />
                    <p className="text-xs font-mono text-slate-400">
                      Formulating FreeRTOS stack variables & PID PWM drivers...
                    </p>
                  </div>
                )}

                {aiError && (
                  <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-200 text-xs">
                    {aiError}
                  </div>
                )}

                {generatedCode && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-300 flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 shrink-0 mt-0.5 text-indigo-400" />
                      <div>
                        <h4 className="text-xs font-mono font-bold uppercase">Ready-to-Flash Target Output</h4>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Includes PWM output timer register setup, mutex-guarded target angle updates, and full C structure.
                        </p>
                      </div>
                    </div>

                    <pre className="p-4 rounded-xl bg-navy-dark border border-navy-light/80 text-xs text-indigo-300 font-mono overflow-x-auto max-h-96 leading-relaxed">
                      <code>{generatedCode}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* RIGHT: DETAILED TRANSFORMATION MATRIX & DH COEFFICIENTS EXPLANATION */}
          <div className="lg:col-span-5 space-y-6" id="robotics-chart">
            <div className="flex justify-end">
              <IEEEReportButton
                experimentName="Robotics: Forward Kinematics"
                inputData={{
                  "Joints": dhTable.length.toString(),
                  "Alpha(0)": dhTable[0]?.alpha + "°",
                  "A(0)": dhTable[0]?.a + " mm",
                  "Theta(0)": dhTable[0]?.theta + "°",
                  "D(0)": dhTable[0]?.d + " mm"
                }}
                outputData={{
                  "End Effector X": transformMatrix[0]?.[3]?.toFixed(3) + " mm",
                  "End Effector Y": transformMatrix[1]?.[3]?.toFixed(3) + " mm",
                  "End Effector Z": transformMatrix[2]?.[3]?.toFixed(3) + " mm"
                }}
                chartSelectors={["#robotics-chart"]}
              />
            </div>
            
            {/* Homogeneous Transformation Matrix output */}
            <div className="rounded-xl border border-navy-light/60 bg-navy-light/20 p-5 space-y-4">
              <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-indigo-400" /> End-Effector T03 Matrix
              </h3>
              
              <div className="p-4 rounded-xl bg-navy-dark border border-navy-light/60 font-mono text-xs text-indigo-300 leading-relaxed text-center space-y-1">
                {transformMatrix.map((row, rIdx) => (
                  <div key={rIdx} className="flex justify-around">
                    {row.map((val, cIdx) => (
                      <span key={cIdx} className="w-16 block">
                        {val.toFixed(3)}
                      </span>
                    ))}
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-slate-500">
                Homogeneous Coordinate Matrix mapping base frame origin [0,0,0]^T to end-effector workspace. The top-left 3x3 is orientation rotation, and column 4 is translation.
              </p>
            </div>

            {/* Explanation card */}
            <div className="rounded-xl border border-navy-light/60 bg-navy-light/10 p-5 text-xs text-slate-400 space-y-3.5">
              <div className="flex items-center gap-1 font-bold text-slate-300 uppercase font-mono text-[10px]">
                <HelpCircle className="h-3.5 w-3.5 text-indigo-400" /> DH Coordinate Rules
              </div>
              
              <p className="leading-relaxed">
                Denavit-Hartenberg parameter coordinates represent successive coordinate transformations of links in robotic spatial chains:
              </p>
              
              <ul className="space-y-2 text-[11px] list-disc list-inside pl-1">
                <li><strong className="text-indigo-400">θ (Joint Angle)</strong>: Rotation angle around the Z-axis mapping joint frames.</li>
                <li><strong className="text-indigo-400">d (Joint Offset)</strong>: Translation distance along the Z-axis from the previous origin.</li>
                <li><strong className="text-indigo-400">a (Link Length)</strong>: Translation offset along the X-axis to the joint node.</li>
                <li><strong className="text-indigo-400">α (Link Twist)</strong>: Rotational tilt of the Z-axis around the joint's X baseline.</li>
              </ul>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
