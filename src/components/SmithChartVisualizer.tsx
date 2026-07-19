import React from 'react';

interface SmithChartVisualizerProps {
  zReal: number;
  zImag: number;
  z0: number;
  gammaReal: number;
  gammaImag: number;
  gammaMag: number;
  vswrNum: number;
}

export function SmithChartVisualizer({
  zReal,
  zImag,
  z0,
  gammaReal,
  gammaImag,
  gammaMag,
  vswrNum
}: SmithChartVisualizerProps) {
  const size = 320;
  const center = size / 2;
  const radius = 130; // Chart boundary radius

  // Map Gamma coordinates to SVG pixels
  const px = center + gammaReal * radius;
  const py = center - gammaImag * radius; // Invert Y-axis for positive reactance going up

  // Constant resistance values to draw circles
  const rValues = [0.2, 0.5, 1.0, 2.0, 5.0];
  // Constant reactance values to draw arcs
  const xValues = [0.2, 0.5, 1.0, 2.0, 5.0, -0.2, -0.5, -1.0, -2.0, -5.0];

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-navy-dark/40 border border-navy-light/60 rounded-2xl relative overflow-hidden">
      <div className="absolute top-3 left-4 text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider">
        Interactive Smith Chart Plotter (Z-Chart)
      </div>

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto mt-6">
        <defs>
          {/* Clip path to keep all arcs and lines inside the boundary circle */}
          <clipPath id="smith-chart-clip">
            <circle cx={center} cy={center} r={radius} />
          </clipPath>
          {/* Subtle grid pattern for visual depth */}
          <radialGradient id="smith-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
        </defs>

        {/* Outer Circular Boundary with Radial Gradient */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="url(#smith-bg)"
          stroke="#334155"
          strokeWidth="2"
        />

        {/* Horizontal Center Axis (Purely resistive) */}
        <line
          x1={center - radius}
          y1={center}
          x2={center + radius}
          y2={center}
          stroke="#475569"
          strokeWidth="1.5"
        />

        {/* Smith Chart grid clipped to unit circle */}
        <g clipPath="url(#smith-chart-clip)">
          {/* 1. Constant Resistance Circles */}
          {rValues.map((r) => {
            const circleRadius = radius / (r + 1);
            const circleCenter = center + (r / (r + 1)) * radius;
            return (
              <circle
                key={`r-${r}`}
                cx={circleCenter}
                cy={center}
                r={circleRadius}
                fill="none"
                stroke="#1e293b"
                strokeWidth="1"
              />
            );
          })}

          {/* 2. Constant Reactance Circles (Arcs inside) */}
          {xValues.map((x) => {
            const circleRadius = radius / Math.abs(x);
            const cxX = center + radius;
            const cxY = center - (1 / x) * radius;
            return (
              <circle
                key={`x-${x}`}
                cx={cxX}
                cy={cxY}
                r={circleRadius}
                fill="none"
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="2 3"
              />
            );
          })}
        </g>

        {/* 3. Constant VSWR Circle (Glowing Green/Emerald) */}
        {gammaMag > 0.01 && (
          <circle
            cx={center}
            cy={center}
            r={gammaMag * radius}
            fill="none"
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="animate-pulse"
          />
        )}

        {/* 4. Origin Indicator (Z0 Center) */}
        <circle cx={center} cy={center} r="3" fill="#64748b" />

        {/* 5. Path to active coordinate */}
        {gammaMag > 0.01 && (
          <line
            x1={center}
            y1={center}
            x2={px}
            y2={py}
            stroke="#10b981"
            strokeWidth="1"
            opacity="0.5"
          />
        )}

        {/* 6. Active Impedance point */}
        <g>
          <circle
            cx={px}
            cy={py}
            r="8"
            fill="#10b981"
            fillOpacity="0.2"
            stroke="#10b981"
            strokeWidth="1"
          />
          <circle cx={px} cy={py} r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
        </g>

        {/* Text Labels */}
        <g className="text-[8px] font-mono fill-slate-400 select-none">
          {/* Resistance labels along the axis */}
          <text x={center - 110} y={center - 4} textAnchor="middle">0.2</text>
          <text x={center - 55} y={center - 4} textAnchor="middle">0.5</text>
          <text x={center} y={center - 4} textAnchor="middle">1.0</text>
          <text x={center + 55} y={center - 4} textAnchor="middle">2.0</text>
          <text x={center + 100} y={center - 4} textAnchor="middle">5.0</text>

          {/* Special point labels */}
          <text x={center - radius - 10} y={center + 4} textAnchor="end" className="fill-red-400">SHORT</text>
          <text x={center + radius + 10} y={center + 4} textAnchor="start" className="fill-amber-400">OPEN</text>

          {/* Inductive vs Capacitive Hemispheres */}
          <text x={center} y={center - radius + 15} textAnchor="middle" className="fill-slate-500 font-bold uppercase tracking-wider text-[7px]">
            +jX Inductive Hemisphere
          </text>
          <text x={center} y={center + radius - 10} textAnchor="middle" className="fill-slate-500 font-bold uppercase tracking-wider text-[7px]">
            -jX Capacitive Hemisphere
          </text>
        </g>
      </svg>

      <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-mono text-slate-400 bg-navy-dark px-3 py-2 border border-navy-light/40 rounded-xl justify-center">
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-accent/20 border border-emerald-accent"></span>
          <span>Constant VSWR Circle: <strong>{vswrNum > 100 ? '∞' : vswrNum.toFixed(2)}</strong></span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-600"></span>
          <span>Center: <strong>{z0} Ω</strong> (Normalized 1.0)</span>
        </div>
      </div>
    </div>
  );
}
