import { useState, useMemo } from 'react';

export interface ConverterInputs {
  type: 'ADC-Flash' | 'ADC-SAR' | 'DAC-BinaryWeighted';
  resolution: number; // N bits
  Vref: number; // Volts
}

export interface ConverterOutputs {
  LSB: number;
  Q_error: number;
  plotData: { v_in: number; code: number; v_out: number }[];
}

export function useDataConverter(initialInputs: ConverterInputs) {
  const [inputs, setInputs] = useState<ConverterInputs>(initialInputs);

  const outputs = useMemo<ConverterOutputs>(() => {
    const { type, resolution: N, Vref } = inputs;
    
    const levels = Math.pow(2, N);
    let LSB = Vref / levels; 
    let Q_error = LSB / 2;

    if (type.startsWith('DAC')) {
      LSB = Vref / (levels - 1);
      Q_error = 0; 
    }

    const plotData = [];
    const pointsToPlot = Math.min(levels, 64); 

    for (let i = 0; i < pointsToPlot; i++) {
      if (type.startsWith('ADC')) {
        // Step function for ADC
        const v_in_start = i * LSB;
        const v_in_end = (i + 1) * LSB;
        plotData.push({ v_in: v_in_start, code: i, v_out: i * LSB });
        plotData.push({ v_in: v_in_end, code: i, v_out: i * LSB });
      } else {
        // DAC output
        plotData.push({ v_in: i, code: i, v_out: i * LSB });
      }
    }

    return { LSB, Q_error, plotData };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
