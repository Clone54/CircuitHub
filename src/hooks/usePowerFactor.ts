import { useState, useMemo } from 'react';

export interface PowerFactorInputs {
  realPowerKW: number;
  currentPF: number; // lagging
  targetPF: number; // lagging
  voltageRms: number; // Volts
  frequency: number; // Hz
}

export interface PowerFactorOutputs {
  q1: number; // kVAR
  q2: number; // kVAR
  qc: number; // kVAR
  capacitance: number; // microFarads
  s1: number; // kVA
  s2: number; // kVA
}

export function usePowerFactor(initialInputs: PowerFactorInputs) {
  const [inputs, setInputs] = useState<PowerFactorInputs>(initialInputs);

  const outputs = useMemo<PowerFactorOutputs>(() => {
    const { realPowerKW, currentPF, targetPF, voltageRms, frequency } = inputs;
    const P = realPowerKW; // kW
    
    if (P <= 0 || currentPF <= 0 || currentPF >= 1 || targetPF <= 0 || targetPF > 1 || currentPF >= targetPF) {
        return { q1: 0, q2: 0, qc: 0, capacitance: 0, s1: 0, s2: 0 };
    }
    
    const angle1 = Math.acos(currentPF);
    const angle2 = Math.acos(targetPF);
    
    const q1 = P * Math.tan(angle1);
    const q2 = P * Math.tan(angle2);
    
    const qc = q1 - q2;
    
    const Qc_VAR = qc * 1000;
    const omega = 2 * Math.PI * frequency;
    
    const capacitanceFarads = Qc_VAR / (Math.pow(voltageRms, 2) * omega);
    const capacitance = capacitanceFarads * 1e6; // in microFarads
    
    const s1 = P / currentPF;
    const s2 = P / targetPF;
    
    return {
      q1, q2, qc, capacitance, s1, s2
    };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
