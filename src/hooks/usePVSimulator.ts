import { useState, useEffect, useMemo, useRef } from 'react';

export interface PVPoint {
  voltage: number;
  current: number;
  power: number;
}

export interface MPPTState {
  voltage: number;
  current: number;
  power: number;
  prevVoltage: number;
  prevPower: number;
  direction: number; // 1 for increasing, -1 for decreasing
  status: 'idle' | 'tracking' | 'sweeping' | 'settled';
  path: { x: number; y: number }[];
}

export function usePVSimulator(
  irradiance: number,
  temperature: number,
  partialShading: boolean,
  isc0: number = 8.5,
  voc0: number = 21.5
) {
  const [mpptType, setMpptType] = useState<'po' | 'global'>('po');
  const [mpptRunning, setMpptRunning] = useState<boolean>(false);
  const [mpptState, setMpptState] = useState<MPPTState>({
    voltage: 4.0,
    current: 0,
    power: 0,
    prevVoltage: 4.0,
    prevPower: 0,
    direction: 1,
    status: 'idle',
    path: []
  });

  const [tickCount, setTickCount] = useState<number>(0);

  // 1. Generate I-V and P-V curve points
  const points = useMemo(() => {
    const q = 1.602176634e-19; // Electron charge
    const k = 1.380649e-23; // Boltzmann constant
    const T_kelvin = temperature + 273.15;
    const Vt = (k * T_kelvin) / q; // Thermal voltage of a single cell
    const a = 1.25; // Diode ideality factor

    const N_s = 18; // 18 cells in series per substring (36 cells total for the module)
    
    // Temperature coefficient of current
    const alpha_Isc = 0.0004;
    const Iph1 = isc0 * (irradiance / 1000) * (1 + alpha_Isc * (temperature - 25));
    const Iph2 = partialShading ? Iph1 * 0.35 : Iph1; // Shaded substring receives 35% irradiance

    const tempPoints: PVPoint[] = [];
    const numSteps = 100;
    
    // Step current from 0 to slightly below Iph1
    const maxI = Iph1 - 1e-4;
    const dI = maxI / numSteps;

    for (let i = 0; i <= numSteps; i++) {
      const I = Math.min(maxI, i * dI);

      // Substring 1 voltage
      let V1 = 0;
      if (I < Iph1) {
        // Single-diode inverse equation: V = a*Ns*Vt*ln((Iph - I)/I0 + 1) - I*Rs
        V1 = a * N_s * Vt * Math.log((Iph1 - I) / 1e-8 + 1) - I * 0.02;
      }
      V1 = Math.max(-0.7, V1); // Bypass diode clamps negative voltage

      // Substring 2 voltage
      let V2 = 0;
      if (I < Iph2) {
        V2 = a * N_s * Vt * Math.log((Iph2 - I) / 1e-8 + 1) - I * 0.02;
      } else {
        V2 = -0.7; // Bypass diode is fully bypass-conducting
      }
      V2 = Math.max(-0.7, V2);

      const V_total = V1 + V2;
      if (V_total <= 0) {
        // If total voltage is negative or zero, we reached short circuit limit
        continue;
      }

      tempPoints.push({
        voltage: parseFloat(V_total.toFixed(2)),
        current: parseFloat(I.toFixed(2)),
        power: parseFloat((V_total * I).toFixed(1))
      });
    }

    // Add explicit short circuit point (V=0, I=Isc)
    tempPoints.push({
      voltage: 0,
      current: parseFloat(Iph1.toFixed(2)),
      power: 0
    });

    // Sort by voltage ascending for plotting
    tempPoints.sort((a, b) => a.voltage - b.voltage);

    return tempPoints;
  }, [irradiance, temperature, partialShading, isc0, voc0]);

  // 2. Find Global MPP
  const mpp = useMemo(() => {
    let best = { voltage: 0, current: 0, power: 0 };
    for (const p of points) {
      if (p.power > best.power) {
        best = p;
      }
    }
    return best;
  }, [points]);

  // Helper: query PV parameters at any arbitrary voltage
  const getPointAtVoltage = (v: number): PVPoint => {
    if (points.length === 0) return { voltage: 0, current: 0, power: 0 };
    let closest = points[0];
    let minDiff = Math.abs(points[0].voltage - v);
    for (const p of points) {
      const diff = Math.abs(p.voltage - v);
      if (diff < minDiff) {
        minDiff = diff;
        closest = p;
      }
    }
    return closest;
  };

  // Reset tracker state
  const resetMppt = () => {
    // Start at some moderate voltage
    const startV = 4.0;
    const pt = getPointAtVoltage(startV);
    setMpptState({
      voltage: startV,
      current: pt.current,
      power: pt.power,
      prevVoltage: startV,
      prevPower: pt.power,
      direction: 1,
      status: 'idle',
      path: [{ x: startV, y: pt.power }]
    });
    setMpptRunning(false);
  };

  // Run the step-by-step MPPT logic on interval
  useEffect(() => {
    if (!mpptRunning) return;

    const interval = setInterval(() => {
      setMpptState((prev) => {
        const ptCurrent = getPointAtVoltage(prev.voltage);
        const maxV = points[points.length - 1]?.voltage || 22;
        const minV = points[0]?.voltage || 0;

        if (mpptType === 'po') {
          // --- PERTURB AND OBSERVE (P&O) MPPT ---
          const dP = ptCurrent.power - prev.prevPower;
          const dV = prev.voltage - prev.prevVoltage;

          let nextDir = prev.direction;
          if (dP > 0) {
            // Power increased: keep the same direction
            nextDir = dV >= 0 ? 1 : -1;
          } else if (dP < 0) {
            // Power decreased: reverse direction
            nextDir = dV >= 0 ? -1 : 1;
          }

          // Step size (0.35 Volts per tick)
          const stepSize = 0.35;
          let nextV = prev.voltage + nextDir * stepSize;

          // Clamping and boundary bouncing
          if (nextV > maxV) {
            nextV = maxV;
            nextDir = -1;
          }
          if (nextV < minV) {
            nextV = minV;
            nextDir = 1;
          }

          const ptNext = getPointAtVoltage(nextV);
          
          // Check if we are oscillating around MPP (meaning we settled)
          // Simple heuristic: if we have taken more than 20 steps and are within 1.5W of a local peak
          const isSettled = prev.path.length > 25 && Math.abs(dP) < 0.15;

          const updatedPath = [...prev.path, { x: nextV, y: ptNext.power }];
          // Keep path length reasonable
          if (updatedPath.length > 40) updatedPath.shift();

          return {
            voltage: parseFloat(nextV.toFixed(2)),
            current: ptNext.current,
            power: ptNext.power,
            prevVoltage: prev.voltage,
            prevPower: ptCurrent.power,
            direction: nextDir,
            status: isSettled ? 'settled' : 'tracking',
            path: updatedPath
          };

        } else {
          // --- GLOBAL SWEEP MPPT ---
          // Sweeps from 0V to MaxV, then jumps directly to global maximum
          const sweepStep = 0.7; // Scan in larger chunks
          let nextV = prev.voltage + sweepStep;
          let status = prev.status;
          let nextDir = 1;

          if (prev.status !== 'settled' && nextV >= maxV) {
            // Sweep complete! Find the highest power point in the accumulated sweep path
            let maxSweepPower = 0;
            let maxSweepV = 4.0;
            
            prev.path.forEach((p) => {
              if (p.y > maxSweepPower) {
                maxSweepPower = p.y;
                maxSweepV = p.x;
              }
            });

            // Jump directly to that Global MPP
            nextV = maxSweepV;
            status = 'settled';
            const ptSettled = getPointAtVoltage(nextV);
            return {
              voltage: parseFloat(nextV.toFixed(2)),
              current: ptSettled.current,
              power: ptSettled.power,
              prevVoltage: nextV,
              prevPower: ptSettled.power,
              direction: 0,
              status: 'settled',
              path: [...prev.path, { x: nextV, y: ptSettled.power }]
            };
          }

          if (status === 'settled') {
            // Already settled, stay there (or minor P&O oscillations if desired, but we can lock it)
            const ptSettled = getPointAtVoltage(prev.voltage);
            return {
              ...prev,
              current: ptSettled.current,
              power: ptSettled.power,
              status: 'settled'
            };
          }

          // Otherwise, we are actively sweeping
          const ptNext = getPointAtVoltage(nextV);
          return {
            voltage: parseFloat(nextV.toFixed(2)),
            current: ptNext.current,
            power: ptNext.power,
            prevVoltage: prev.voltage,
            prevPower: ptCurrent.power,
            direction: nextDir,
            status: 'sweeping',
            path: [...prev.path, { x: nextV, y: ptNext.power }]
          };
        }
      });
    }, 120);

    return () => clearInterval(interval);
  }, [mpptRunning, mpptType, points]);

  return {
    points,
    mpp,
    mpptState,
    mpptType,
    setMpptType,
    mpptRunning,
    setMpptRunning,
    resetMppt,
    getPointAtVoltage
  };
}
