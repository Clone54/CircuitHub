import { useState, useMemo } from 'react';

export interface ReliabilityComponent {
  id: string;
  name: string;
  lambda: number; // failure rate (failures / year)
}

export interface ReliabilityDataPoint {
  time: number; // years
  [key: string]: number; // component and system reliability values
}

export function useSystemReliability() {
  const [components, setComponents] = useState<ReliabilityComponent[]>([
    { id: '1', name: 'Transformer T1', lambda: 0.15 },
    { id: '2', name: 'Circuit Breaker CB1', lambda: 0.08 },
    { id: '3', name: 'Busbar BB1', lambda: 0.02 },
  ]);

  const [connectionType, setConnectionType] = useState<'series' | 'parallel'>('series');

  // Add a component
  const addComponent = (name: string, lambda: number) => {
    const id = (Math.max(...components.map(c => parseInt(c.id) || 0), 0) + 1).toString();
    setComponents([...components, { id, name, lambda }]);
  };

  // Delete a component
  const removeComponent = (id: string) => {
    // Keep at least one component
    if (components.length <= 1) return;
    setComponents(components.filter(c => c.id !== id));
  };

  // Update failure rate of a component
  const updateComponentLambda = (id: string, lambda: number) => {
    setComponents(components.map(c => c.id === id ? { ...c, lambda: Math.max(0.001, lambda) } : c));
  };

  // Update name of a component
  const updateComponentName = (id: string, name: string) => {
    setComponents(components.map(c => c.id === id ? { ...c, name } : c));
  };

  // Calculations
  const results = useMemo(() => {
    if (components.length === 0) {
      return {
        systemLambda: 0,
        systemMTTF: 0,
        chartData: [],
      };
    }

    // 1. Calculate System Failure Rate & MTTF
    let systemLambda = 0;
    let systemMTTF = 0;

    if (connectionType === 'series') {
      // Series failure rate is sum of failure rates
      systemLambda = components.reduce((sum, c) => sum + c.lambda, 0);
      systemMTTF = 1 / systemLambda;
    } else {
      // Parallel configuration
      // We integrate R_sys(t) = 1 - Prod(1 - e^(-lambda_i * t)) from 0 to infinity
      // Numerical integration is highly accurate and handles any component counts easily.
      let mttfSum = 0;
      const dt = 0.05; // 0.05 years step size
      const maxT = 1000; // Cap it to avoid infinite loops, though it usually terminates fast
      let t_int = 0;
      let r_prev = 1;

      while (t_int < maxT) {
        t_int += dt;
        let unreliabilityProd = 1;
        components.forEach(c => {
          const r_comp = Math.exp(-c.lambda * t_int);
          unreliabilityProd *= (1 - r_comp);
        });
        const r_sys = 1 - unreliabilityProd;

        // Trapezoidal integration step
        mttfSum += ((r_prev + r_sys) / 2) * dt;
        r_prev = r_sys;

        // If system reliability is virtually zero, we can terminate early
        if (r_sys < 0.0001) break;
      }

      systemMTTF = mttfSum;
      // Equivalent lambda for parallel is not a single constant, but we can write equivalent representative lambda as 1 / MTTF
      systemLambda = 1 / systemMTTF;
    }

    // 2. Generate Reliability Decay Curve over 10 Years
    const chartData: ReliabilityDataPoint[] = [];
    const maxTime = 10; // 10 years
    const steps = 20; // 0.5 year step size

    for (let i = 0; i <= steps; i++) {
      const t = (i * maxTime) / steps;
      const point: ReliabilityDataPoint = { time: parseFloat(t.toFixed(1)) };

      let systemUnreliabilityProd = 1;
      let systemReliabilityProd = 1;

      components.forEach(c => {
        const r_comp = Math.exp(-c.lambda * t);
        point[c.name] = parseFloat(r_comp.toFixed(4));

        systemReliabilityProd *= r_comp;
        systemUnreliabilityProd *= (1 - r_comp);
      });

      if (connectionType === 'series') {
        point['System'] = parseFloat(systemReliabilityProd.toFixed(4));
      } else {
        point['System'] = parseFloat((1 - systemUnreliabilityProd).toFixed(4));
      }

      chartData.push(point);
    }

    return {
      systemLambda: parseFloat(systemLambda.toFixed(4)),
      systemMTTF: parseFloat(systemMTTF.toFixed(2)),
      chartData,
    };
  }, [components, connectionType]);

  return {
    components,
    connectionType,
    setConnectionType,
    addComponent,
    removeComponent,
    updateComponentLambda,
    updateComponentName,
    ...results,
  };
}
