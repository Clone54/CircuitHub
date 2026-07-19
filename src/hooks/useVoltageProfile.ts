import { useState, useMemo } from 'react';

export interface VoltageProfileInputs {
  length: number;          // Line length (km), e.g. 100 to 1000
  silMultiplier: number;   // SIL loading ratio, e.g. 0.2 to 2.5
  statcomEnabled: boolean;
  qInjection: number;      // STATCOM reactive power injection (MVAR), e.g. -100 to 300
}

export function useVoltageProfile(initialInputs: VoltageProfileInputs) {
  const [inputs, setInputs] = useState<VoltageProfileInputs>(initialInputs);

  const profileData = useMemo(() => {
    const { length, silMultiplier, statcomEnabled, qInjection } = inputs;
    const steps = 50;
    const data = [];

    // Base voltage uncompensated (sag/rise depending on SIL)
    // At L/2, maximum sag/rise occurs.
    // Standard power transmission line voltage profile equation approximation:
    // V(x) = V_s - (V_s - V_r)*(x/L) - K * (SIL - 1) * sin(pi * x / L)
    // Let's assume V_s = V_r = 1.0 p.u.
    // So V_uncomp(x) = 1.0 - 0.12 * (silMultiplier - 1.0) * Math.sin((Math.PI * x) / L)
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * length;
      const baseSag = 0.12 * (silMultiplier - 1.0) * Math.sin((Math.PI * x) / length);
      const V_uncomp = 1.0 - baseSag;

      // STATCOM compensation effect peaks at the midpoint and decays linearly to the ends
      let compensation = 0;
      if (statcomEnabled) {
        // Boost factor proportional to injected Q (e.g., 200 MVAR gives 0.08 p.u. boost at midpoint)
        const midpointBoost = qInjection * 0.0004; 
        const distanceFactor = x <= length / 2 
          ? x / (length / 2) 
          : (length - x) / (length / 2);
        compensation = midpointBoost * distanceFactor;
      }

      const V_comp = V_uncomp + compensation;

      data.push({
        distance: Math.round(x),
        uncompensated: parseFloat(Math.max(0.5, Math.min(1.5, V_uncomp)).toFixed(3)),
        compensated: parseFloat(Math.max(0.5, Math.min(1.5, V_comp)).toFixed(3)),
        // Upper and lower bounds for improvement shaded area
        minVal: parseFloat(Math.min(V_uncomp, V_comp).toFixed(3)),
        maxVal: parseFloat(Math.max(V_uncomp, V_comp).toFixed(3)),
      });
    }

    return data;
  }, [inputs]);

  return {
    inputs,
    setInputs,
    profileData,
  };
}
