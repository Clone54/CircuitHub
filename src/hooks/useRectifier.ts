import { useState, useMemo } from 'react';

export interface RectifierInputs {
  config: '1-Ph Half-Wave' | '1-Ph Full-Wave';
  load: 'R' | 'RL';
  Vrms: number;
  freq: number;
  alpha: number; // degrees
}

export function useRectifier(initialInputs: RectifierInputs) {
  const [inputs, setInputs] = useState<RectifierInputs>(initialInputs);

  const outputs = useMemo(() => {
    const { config, load, Vrms, freq, alpha } = inputs;
    const alphaRad = (alpha * Math.PI) / 180;
    const Vm = Vrms * Math.SQRT2;
    
    let Vdc = 0, Vrms_out = 0;
    let plotData: { thetaDeg: number, vIn: number, vOut: number }[] = [];

    if (config === '1-Ph Half-Wave') {
      if (load === 'R') {
        Vdc = (Vm / (2 * Math.PI)) * (1 + Math.cos(alphaRad));
        Vrms_out = Vm * Math.sqrt(0.25 - (alphaRad / (4 * Math.PI)) + (Math.sin(2 * alphaRad) / (8 * Math.PI)));
      } else { // RL highly inductive
        Vdc = (Vm / Math.PI) * Math.cos(alphaRad); // Assuming continuous conduction up to pi+alpha
        Vrms_out = Vm * Math.sqrt(0.5); 
      }
    } else {
      if (load === 'R') {
        Vdc = (Vm / Math.PI) * (1 + Math.cos(alphaRad));
        Vrms_out = Vm * Math.sqrt(0.5 - (alphaRad / (2 * Math.PI)) + (Math.sin(2 * alphaRad) / (4 * Math.PI)));
      } else {
        Vdc = ((2 * Vm) / Math.PI) * Math.cos(alphaRad);
        Vrms_out = Vm * Math.sqrt(0.5);
      }
    }

    const steps = 360;
    for (let i = 0; i <= steps * 2; i++) {
      const thDeg = i;
      const thRad = (thDeg * Math.PI) / 180;
      const vIn = Vm * Math.sin(thRad);
      let vOut = 0;

      const thMod = thDeg % 360;
      const thMod180 = thDeg % 180;

      if (config === '1-Ph Half-Wave') {
        if (load === 'R') {
          if (thMod >= alpha && thMod <= 180) vOut = vIn;
        } else {
          // RL: conducts alpha to 180+alpha
          if (thMod >= alpha && thMod <= 180 + alpha) vOut = vIn;
        }
      } else {
        if (load === 'R') {
          if (thMod180 >= alpha && thMod180 <= 180) {
            vOut = Math.abs(vIn);
          }
        } else {
          // FW RL: follows Vm*sin(wt) from alpha to 180+alpha, then -Vm*sin(wt)
          if (thMod >= alpha && thMod < 180 + alpha) vOut = Vm * Math.sin(thRad);
          else vOut = -Vm * Math.sin(thRad);
        }
      }

      plotData.push({ thetaDeg: thDeg, vIn, vOut });
    }

    return { Vdc, Vrms_out, plotData };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
