import { useState, useMemo } from 'react';

export interface MotorInputs {
  frequency: number;
  poles: number;
  rotorSpeed: number;
}

export interface MotorOutputs {
  synchronousSpeed: number;
  slip: number;
  slipPercentage: string;
  frequencyRotor: number;
  status: 'normal' | 'generator' | 'stalled' | 'invalid';
  error?: string;
}

export function useMotorMath(initialInputs: MotorInputs) {
  const [inputs, setInputs] = useState<MotorInputs>(initialInputs);

  const outputs = useMemo<MotorOutputs>(() => {
    const { frequency, poles, rotorSpeed } = inputs;

    if (frequency <= 0 || poles <= 0 || poles % 2 !== 0) {
      return {
        synchronousSpeed: 0,
        slip: 0,
        slipPercentage: '0.00',
        frequencyRotor: 0,
        status: 'invalid',
        error: 'Poles must be a positive even integer, and frequency must be greater than zero.',
      };
    }

    // Synchronous Speed Ns = 120 * f / P
    const synchronousSpeed = (120 * frequency) / poles;

    if (rotorSpeed > synchronousSpeed) {
      return {
        synchronousSpeed,
        slip: 0,
        slipPercentage: '0.00',
        frequencyRotor: 0,
        status: 'invalid',
        error: `Rotor Speed (Nr = ${rotorSpeed} RPM) cannot be greater than Synchronous Speed (Ns = ${synchronousSpeed} RPM) in motor operation.`,
      };
    }

    // Slip s = (Ns - Nr) / Ns
    const slip = synchronousSpeed === 0 ? 0 : (synchronousSpeed - rotorSpeed) / synchronousSpeed;
    const slipPercentage = (slip * 100).toFixed(2);
    
    // Rotor frequency fr = s * f
    const frequencyRotor = slip * frequency;

    let status: MotorOutputs['status'] = 'normal';
    if (slip === 1) {
      status = 'stalled';
    } else if (slip < 0) {
      status = 'generator';
    }

    return {
      synchronousSpeed,
      slip,
      slipPercentage,
      frequencyRotor,
      status,
    };
  }, [inputs]);

  return {
    inputs,
    setInputs,
    outputs,
  };
}
