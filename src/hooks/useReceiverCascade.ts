import { useState, useMemo } from 'react';

export interface Stage {
  id: string;
  name: string;
  gainDb: number;
  nfDb: number;
}

export interface ReceiverInputs {
  frf: number;
  fif: number;
  injection: 'High' | 'Low';
  stages: Stage[];
}

export function useReceiverCascade(initialInputs: ReceiverInputs) {
  const [inputs, setInputs] = useState<ReceiverInputs>(initialInputs);

  const outputs = useMemo(() => {
    let flo = 0;
    let fim = 0;
    let totalGainDb = 0;
    let totalNfDb = 0;
    let fTotalLinear = 0;

    try {
      const { frf, fif, injection, stages } = inputs;

      if (injection === 'High') {
        flo = frf + fif;
        fim = frf + 2 * fif;
      } else {
        flo = frf - fif;
        fim = Math.abs(frf - 2 * fif);
      }

      if (stages.length > 0) {
        let cumulative_g = 1;
        let sumGainDb = 0;

        stages.forEach((st, i) => {
          const g_linear = Math.pow(10, st.gainDb / 10);
          const f_linear = Math.pow(10, st.nfDb / 10);
          
          sumGainDb += st.gainDb;

          if (i === 0) {
            fTotalLinear = f_linear;
          } else {
            fTotalLinear += (f_linear - 1) / cumulative_g;
          }
          cumulative_g *= g_linear;
        });

        totalGainDb = sumGainDb;
        totalNfDb = 10 * Math.log10(fTotalLinear);
      }

    } catch(e) {}

    return { flo, fim, totalGainDb, totalNfDb, fTotalLinear };
  }, [inputs]);

  const addStage = () => {
    setInputs(prev => ({
      ...prev,
      stages: [...prev.stages, { id: Math.random().toString(), name: `Stage ${prev.stages.length + 1}`, gainDb: 10, nfDb: 3 }]
    }));
  };

  const updateStage = (id: string, field: keyof Stage, val: any) => {
    setInputs(prev => ({
      ...prev,
      stages: prev.stages.map(st => st.id === id ? { ...st, [field]: val } : st)
    }));
  };

  const removeStage = (id: string) => {
    setInputs(prev => ({
      ...prev,
      stages: prev.stages.filter(st => st.id !== id)
    }));
  };

  return { inputs, setInputs, outputs, addStage, updateStage, removeStage };
}
