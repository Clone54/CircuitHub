import { useState, useMemo } from 'react';

export interface TransformerInputs {
  S: number; // kVA
  V1: number;
  V2: number;
  Pi: number; // Core Loss (W)
  Pcu: number; // Full Load Copper Loss (W)
  Req: number; // Ohms ref to secondary
  Xeq: number; // Ohms ref to secondary
}

export interface TransformerOutputs {
  maxEffFraction: number;
  maxEffValue: number;
  effData: { load: number; efficiency: number }[];
  regData: { pf: number; pfStr: string; regulation: number }[];
}

export function useTransformerAnalytics(initialInputs: TransformerInputs) {
  const [inputs, setInputs] = useState<TransformerInputs>(initialInputs);

  const outputs = useMemo<TransformerOutputs>(() => {
    const { S, V2, Pi, Pcu, Req, Xeq } = inputs;
    
    const maxEffFraction = Pcu > 0 ? Math.sqrt(Pi / Pcu) : 0;
    const maxEff_load = maxEffFraction * S * 1000;
    const maxEffValue = maxEff_load > 0 ? (maxEff_load * 0.8) / (maxEff_load * 0.8 + Pi + Math.pow(maxEffFraction, 2) * Pcu) * 100 : 0;

    const effData = [];
    for (let i = 10; i <= 125; i += 5) {
      const x = i / 100;
      const P_out = x * S * 1000 * 0.8; // Assume 0.8 PF for eff curve
      const P_loss = Pi + (x * x * Pcu);
      const efficiency = (P_out / (P_out + P_loss)) * 100;
      effData.push({ load: i, efficiency });
    }

    const regData = [];
    const I2_fl = (S * 1000) / (V2 || 1);
    
    // PF from 0.1 Lag to 1.0 to 0.1 Lead
    // We will plot from -90 to +90 degrees, but represent x axis as -1 to 1?
    // Let's use PF angle from -80 deg to +80 deg (negative is lead, positive is lag)
    for (let angle = -80; angle <= 80; angle += 5) {
      const rad = angle * (Math.PI / 180);
      const pf = Math.cos(rad);
      const sin_theta = Math.sin(rad); // Positive for lag, negative for lead (if we consider standard V = V + I(R cos + X sin))
      
      const V_drop = I2_fl * (Req * pf + Xeq * sin_theta);
      const regulation = (V_drop / (V2 || 1)) * 100;
      
      let pfStr = pf.toFixed(2);
      if (angle > 0) pfStr += ' Lag';
      else if (angle < 0) pfStr += ' Lead';
      else pfStr = 'Unity';

      // We use angle for x-axis to keep it monotonic for charting
      regData.push({ angle, pf, pfStr, regulation });
    }

    return { maxEffFraction, maxEffValue, effData, regData };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
