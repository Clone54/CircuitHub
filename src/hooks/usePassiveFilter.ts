import { useState, useMemo } from 'react';

export interface PassiveFilterInputs {
  type: 'LP' | 'HP';
  proto: 'constant-k' | 'm-derived';
  R0: number; // Ohms
  fc: number; // kHz
  m: number; // 0 < m < 1
  Km: number; // Magnitude scale
  Kf: number; // Frequency scale
}

export interface ComponentVal {
  label: string;
  value: number; // Base unit (H or F)
}

export interface FilterSection {
  series1: ComponentVal[];
  series2: ComponentVal[]; // for T
  shunt1: ComponentVal[];
  shunt2: ComponentVal[]; // for Pi
}

export interface PassiveFilterOutputs {
  baseL: number; // H
  baseC: number; // F
  scaledL: number; // H
  scaledC: number; // F
  tSection: FilterSection;
  piSection: FilterSection;
}

export function usePassiveFilter(initialInputs: PassiveFilterInputs) {
  const [inputs, setInputs] = useState<PassiveFilterInputs>(initialInputs);

  const outputs = useMemo<PassiveFilterOutputs>(() => {
    const { type, proto, R0, fc, m, Km, Kf } = inputs;
    const fc_Hz = fc * 1000;
    
    let baseL = 0;
    let baseC = 0;

    if (type === 'LP') {
      baseL = R0 / (Math.PI * fc_Hz);
      baseC = 1 / (Math.PI * R0 * fc_Hz);
    } else {
      baseL = R0 / (4 * Math.PI * fc_Hz);
      baseC = 1 / (4 * Math.PI * R0 * fc_Hz);
    }

    const scaledL = (Km / Kf) * baseL;
    const scaledC = baseC / (Km * Kf);

    const tSection: FilterSection = { series1: [], series2: [], shunt1: [], shunt2: [] };
    const piSection: FilterSection = { series1: [], series2: [], shunt1: [], shunt2: [] };

    // Use scaled values for the actual components
    const L = scaledL;
    const C = scaledC;

    if (proto === 'constant-k') {
      if (type === 'LP') {
        tSection.series1 = [{ label: 'L/2', value: L / 2 }];
        tSection.series2 = [{ label: 'L/2', value: L / 2 }];
        tSection.shunt1 = [{ label: 'C', value: C }];
        
        piSection.series1 = [{ label: 'L', value: L }];
        piSection.shunt1 = [{ label: 'C/2', value: C / 2 }];
        piSection.shunt2 = [{ label: 'C/2', value: C / 2 }];
      } else { // HP
        tSection.series1 = [{ label: '2C', value: C * 2 }];
        tSection.series2 = [{ label: '2C', value: C * 2 }];
        tSection.shunt1 = [{ label: 'L', value: L }];
        
        piSection.series1 = [{ label: 'C', value: C }];
        piSection.shunt1 = [{ label: '2L', value: L * 2 }];
        piSection.shunt2 = [{ label: '2L', value: L * 2 }];
      }
    } else {
      // m-derived
      const m_val = Math.max(0.01, Math.min(0.99, m));
      if (type === 'LP') {
        tSection.series1 = [{ label: 'mL/2', value: m_val * L / 2 }];
        tSection.series2 = [{ label: 'mL/2', value: m_val * L / 2 }];
        tSection.shunt1 = [
          { label: 'mC', value: m_val * C },
          { label: '(1-m²)/4m * L', value: ((1 - m_val*m_val) / (4 * m_val)) * L }
        ];

        piSection.series1 = [
          { label: 'mL', value: m_val * L },
          { label: '(1-m²)/4m * C', value: ((1 - m_val*m_val) / (4 * m_val)) * C }
        ];
        piSection.shunt1 = [{ label: 'mC/2', value: m_val * C / 2 }];
        piSection.shunt2 = [{ label: 'mC/2', value: m_val * C / 2 }];
      } else { // HP
        tSection.series1 = [{ label: '2C/m', value: (2 * C) / m_val }];
        tSection.series2 = [{ label: '2C/m', value: (2 * C) / m_val }];
        tSection.shunt1 = [
          { label: 'L/m', value: L / m_val },
          { label: '4m/(1-m²) * C', value: (4 * m_val / (1 - m_val*m_val)) * C }
        ];

        piSection.series1 = [
          { label: 'C/m', value: C / m_val },
          { label: '4m/(1-m²) * L', value: (4 * m_val / (1 - m_val*m_val)) * L }
        ];
        piSection.shunt1 = [{ label: '2L/m', value: (2 * L) / m_val }];
        piSection.shunt2 = [{ label: '2L/m', value: (2 * L) / m_val }];
      }
    }

    return { baseL, baseC, scaledL, scaledC, tSection, piSection };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
