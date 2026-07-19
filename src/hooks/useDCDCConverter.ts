import { useState, useMemo } from 'react';

export interface DCDCInputs {
  topology: 'Buck' | 'Boost' | 'Buck-Boost';
  Vin: number;
  Vout: number;
  Iout: number;
  fs: number; // kHz
  deltaIL_pct: number; // %
  deltaVc_pct: number; // %
}

export function useDCDCConverter(initialInputs: DCDCInputs) {
  const [inputs, setInputs] = useState<DCDCInputs>(initialInputs);

  const outputs = useMemo(() => {
    let D = 0, L = 0, C = 0, errorStr = '';
    let plotData: { t: number, iL: number }[] = [];

    try {
      const { topology, Vin, Vout, Iout, fs, deltaIL_pct, deltaVc_pct } = inputs;
      const fs_hz = fs * 1000;
      const T = 1 / fs_hz;

      let IL_avg = 0;

      if (topology === 'Buck') {
        if (Vout >= Vin) throw new Error("Buck: Vout must be < Vin");
        D = Vout / Vin;
        IL_avg = Iout;
      } else if (topology === 'Boost') {
        if (Vout <= Vin) throw new Error("Boost: Vout must be > Vin");
        D = 1 - (Vin / Vout);
        IL_avg = Iout / (1 - D);
      } else if (topology === 'Buck-Boost') {
        D = Vout / (Vin + Vout);
        IL_avg = Iout / (1 - D);
      }

      if (D <= 0 || D >= 1) throw new Error("Invalid duty cycle calculated");

      const dIL = (deltaIL_pct / 100) * IL_avg;
      const dVc = (deltaVc_pct / 100) * Vout;

      if (topology === 'Buck') {
        L = ((Vin - Vout) * D) / (fs_hz * dIL);
        C = dIL / (8 * fs_hz * dVc);
      } else if (topology === 'Boost') {
        L = (Vin * D) / (fs_hz * dIL);
        C = (Iout * D) / (fs_hz * dVc);
      } else {
        L = (Vin * D) / (fs_hz * dIL);
        C = (Iout * D) / (fs_hz * dVc);
      }

      // Plot over 3 periods
      for (let p = 0; p < 3; p++) {
        const t0 = p * T;
        const t1 = t0 + D * T;
        const t2 = (p + 1) * T;
        
        plotData.push({ t: t0 * 1e6, iL: IL_avg - dIL/2 });
        plotData.push({ t: t1 * 1e6, iL: IL_avg + dIL/2 });
        plotData.push({ t: t2 * 1e6, iL: IL_avg - dIL/2 });
      }

    } catch (e: any) {
      errorStr = e.message;
    }

    return { D, L, C, plotData, errorStr };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
