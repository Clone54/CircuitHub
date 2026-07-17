import { useState, useMemo } from 'react';

export interface MarkovDataPoint {
  time: number; // months or years
  pUp: number; // probability of being in UP state
  pDown: number; // probability of being in DOWN state
}

export function useMarkovProcess() {
  const [lambda, setLambda] = useState<number>(0.5); // failure rate (failures/year)
  const [mu, setMu] = useState<number>(12.0); // repair rate (repairs/year)
  
  // Steady-state calculations
  const steadyState = useMemo(() => {
    const totalRate = lambda + mu;
    const availability = mu / totalRate;
    const unavailability = lambda / totalRate; // Forced Outage Rate (FOR)
    const mttf = 1 / lambda; // years
    const mttr = 1 / mu; // years
    
    // Convert to days/hours for extra user clarity
    const mttrDays = mttr * 365.25;
    const mttfDays = mttf * 365.25;

    return {
      availability: parseFloat(availability.toFixed(5)),
      unavailability: parseFloat(unavailability.toFixed(5)),
      mttf: parseFloat(mttf.toFixed(3)),
      mttr: parseFloat(mttr.toFixed(4)),
      mttfDays: parseFloat(mttfDays.toFixed(1)),
      mttrDays: parseFloat(mttrDays.toFixed(1)),
      frequencyOfOutage: parseFloat((availability * lambda).toFixed(4)), // A * lambda
    };
  }, [lambda, mu]);

  // Transient state probability over time (assuming initially 100% UP)
  // P_up(t) = A_ss + (1 - A_ss) * e^(-(lambda+mu)*t)
  const transientData = useMemo(() => {
    const data: MarkovDataPoint[] = [];
    const A_ss = mu / (lambda + mu);
    const sumRate = lambda + mu;
    const maxTime = 1.5; // years
    const steps = 30;

    for (let i = 0; i <= steps; i++) {
      const t = (i * maxTime) / steps;
      const pUp = A_ss + (1 - A_ss) * Math.exp(-sumRate * t);
      const pDown = 1 - pUp;

      data.push({
        time: parseFloat(t.toFixed(2)),
        pUp: parseFloat(pUp.toFixed(4)),
        pDown: parseFloat(pDown.toFixed(4)),
      });
    }

    return data;
  }, [lambda, mu]);

  return {
    lambda,
    setLambda,
    mu,
    setMu,
    ...steadyState,
    transientData,
  };
}
