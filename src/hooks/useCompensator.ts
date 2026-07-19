import { useState, useMemo } from 'react';

function polyMul(p1: number[], p2: number[]) {
  const res = Array(p1.length + p2.length - 1).fill(0);
  for(let i=0; i<p1.length; i++) {
    for(let j=0; j<p2.length; j++) {
      res[i+j] += p1[i]*p2[j];
    }
  }
  return res;
}

function polyAdd(p1: number[], p2: number[]) {
  const len = Math.max(p1.length, p2.length);
  const p1Pad = [...Array(len - p1.length).fill(0), ...p1];
  const p2Pad = [...Array(len - p2.length).fill(0), ...p2];
  return p1Pad.map((v, i) => v + p2Pad[i]);
}

function tfToSS(num: number[], den: number[]) {
  let b = [...num];
  const a = [...den];
  while (b.length < a.length) b.unshift(0);
  const a0 = a[0];
  const an = a.map(x => x/a0);
  const bn = b.map(x => x/a0);
  const n = an.length - 1;
  
  const A = Array(n).fill(0).map(() => Array(n).fill(0));
  const B = Array(n).fill(0);
  const C = Array(n).fill(0);
  
  for(let i=0; i<n-1; i++) A[i][i+1] = 1;
  for(let i=0; i<n; i++) A[n-1][i] = -an[n-i];
  if (n > 0) B[n-1] = 1;
  
  const d = bn[0];
  for(let i=0; i<n; i++) C[i] = bn[n-i] - d * an[n-i];
  
  return {A, B, C, D: d, n};
}

function calcDx(A: number[][], B: number[], x: number[], u: number) {
  const dx = Array(x.length).fill(0);
  for(let i=0; i<x.length; i++) {
    for(let j=0; j<x.length; j++) {
      dx[i] += A[i][j] * x[j];
    }
    dx[i] += B[i] * u;
  }
  return dx;
}

function simulateStepResponse(num: number[], den: number[], tMax: number, dt: number) {
  if (den.length === 0 || den[0] === 0) return [];
  const sys = tfToSS(num, den);
  let x = Array(sys.n).fill(0);
  const data = [];
  
  for (let t = 0; t <= tMax; t += dt) {
    const u = 1; // Step input
    let y = sys.D * u;
    for(let i=0; i<sys.n; i++) y += sys.C[i] * x[i];
    data.push({ t, y });
    
    if (sys.n > 0) {
      const k1 = calcDx(sys.A, sys.B, x, u);
      const x2 = x.map((xi, i) => xi + k1[i]*dt/2);
      const k2 = calcDx(sys.A, sys.B, x2, u);
      const x3 = x.map((xi, i) => xi + k2[i]*dt/2);
      const k3 = calcDx(sys.A, sys.B, x3, u);
      const x4 = x.map((xi, i) => xi + k3[i]*dt);
      const k4 = calcDx(sys.A, sys.B, x4, u);
      
      x = x.map((xi, i) => xi + (dt/6)*(k1[i] + 2*k2[i] + 2*k3[i] + k4[i]));
    }
  }
  return data;
}

export function useCompensator(initialNum: string, initialDen: string) {
  const [inputs, setInputs] = useState({ 
    numStr: initialNum, 
    denStr: initialDen,
    Kp: 10,
    Ki: 5,
    Kd: 1
  });

  const outputs = useMemo(() => {
    let plotData: { t: number, uncomp: number, comp: number }[] = [];
    try {
      const num = inputs.numStr.split(',').map(n => parseFloat(n.trim()));
      const den = inputs.denStr.split(',').map(n => parseFloat(n.trim()));
      
      // Uncompensated Closed Loop: num / (den + num)
      const clNumUncomp = [...num];
      const clDenUncomp = polyAdd(den, num);
      
      // Compensated: PID = [Kd, Kp, Ki] / [1, 0]
      const pidNum = [inputs.Kd, inputs.Kp, inputs.Ki];
      const pidDen = [1, 0];
      
      const olNumComp = polyMul(num, pidNum);
      const olDenComp = polyMul(den, pidDen);
      
      const clNumComp = [...olNumComp];
      const clDenComp = polyAdd(olDenComp, olNumComp);
      
      const tMax = 10;
      const dt = 0.05;
      
      const uncompData = simulateStepResponse(clNumUncomp, clDenUncomp, tMax, dt);
      const compData = simulateStepResponse(clNumComp, clDenComp, tMax, dt);
      
      if (uncompData.length > 0 && compData.length > 0) {
        plotData = uncompData.map((d, i) => ({
          t: d.t,
          uncomp: d.y,
          comp: compData[i].y
        }));
      }
      
    } catch(e) {}
    
    return { plotData };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
