import { useState, useMemo } from 'react';

export interface DiodeInputs {
  type: 'half-wave' | 'full-wave' | 'series-clipper' | 'parallel-clipper' | 'clamper';
  vp: number; // Peak voltage
  f: number; // Frequency in Hz
  model: 'ideal' | 'practical';
  vref: number; // DC reference
}

export interface DiodeOutputs {
  plotData: { t: number; vin: number; vout: number }[];
}

export function useDiodeWaveforms(initialInputs: DiodeInputs) {
  const [inputs, setInputs] = useState<DiodeInputs>(initialInputs);

  const outputs = useMemo<DiodeOutputs>(() => {
    const { type, vp, f, model, vref } = inputs;
    const vd = model === 'practical' ? 0.7 : 0;
    
    if (f <= 0 || vp <= 0) return { plotData: [] };

    const T = 1 / f;
    const points = 200;
    const dt = (2 * T) / points; // 2 full cycles
    
    const plotData = [];

    // For clamper, calculate steady state DC offset
    // Positive clamper pushes wave up. Minimum of Vin is -vp.
    // Diode conducts when Vin < -V_c (or similar).
    // Vc (capacitor voltage) = Vp - vd + vref (assuming positive clamper)
    const vc = vp - vd + vref;

    for (let i = 0; i <= points; i++) {
      const t = i * dt;
      const vin = vp * Math.sin(2 * Math.PI * f * t);
      let vout = 0;

      switch (type) {
        case 'half-wave':
          vout = vin > vd ? vin - vd : 0;
          break;
        case 'full-wave':
          // Assuming bridge rectifier: 2 diode drops in practical model
          const fw_vd = model === 'practical' ? 1.4 : 0;
          vout = Math.abs(vin) > fw_vd ? Math.abs(vin) - fw_vd : 0;
          break;
        case 'series-clipper':
          // Positive series clipper with Vref: conducts when Vin > Vref + Vd
          vout = vin > (vref + vd) ? vin - vd - vref : 0;
          break;
        case 'parallel-clipper':
          // Positive parallel clipper: clips at Vref + Vd
          vout = vin > (vref + vd) ? vref + vd : vin;
          break;
        case 'clamper':
          // Positive clamper: shifts wave up
          vout = vin + vc;
          break;
      }

      plotData.push({ t: t * 1000, vin, vout }); // t in ms
    }

    return { plotData };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
