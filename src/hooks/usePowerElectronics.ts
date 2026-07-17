import { useState, useMemo } from 'react';

export type ConverterType = 'buck' | 'boost';

export interface ConverterInputs {
  type: ConverterType;
  vin: number;
  vout: number;
  fs: number; // in kHz
  iout: number; // in A
  voltageRipplePercent: number; // e.g. 1%
  currentRipplePercent: number; // e.g. 20%
}

export interface ConverterOutputs {
  dutyCycle: number; // 0 to 1
  dutyCyclePercent: string;
  lMinCCM: number; // Minimum inductance for CCM in uH
  lDesign: number; // Inductance for target ripple in uH
  cOut: number; // Output capacitance in uF
  equivalentLoadResistance: number; // in Ohms
  error?: string;
}

export function usePowerElectronics(initialInputs: ConverterInputs) {
  const [inputs, setInputs] = useState<ConverterInputs>(initialInputs);

  const outputs = useMemo<ConverterOutputs>(() => {
    const { type, vin, vout, fs, iout, voltageRipplePercent, currentRipplePercent } = inputs;
    const fsHz = fs * 1000; // convert kHz to Hz
    const deltaV_ratio = voltageRipplePercent / 100;
    const deltaI_ratio = currentRipplePercent / 100;

    if (vin <= 0 || vout <= 0 || fs <= 0 || iout <= 0) {
      return {
        dutyCycle: 0,
        dutyCyclePercent: '0.0',
        lMinCCM: 0,
        lDesign: 0,
        cOut: 0,
        equivalentLoadResistance: 0,
        error: 'All input parameters must be positive numbers.',
      };
    }

    const R = vout / iout; // Equivalent load resistance

    let dutyCycle = 0;
    let error: string | undefined;

    if (type === 'buck') {
      if (vout >= vin) {
        error = 'For a Buck Converter, Output Voltage (Vout) must be strictly LESS than Input Voltage (Vin).';
      } else {
        dutyCycle = vout / vin;
      }
    } else {
      // boost
      if (vout <= vin) {
        error = 'For a Boost Converter, Output Voltage (Vout) must be strictly GREATER than Input Voltage (Vin).';
      } else {
        dutyCycle = 1 - vin / vout;
      }
    }

    if (error) {
      return {
        dutyCycle: 0,
        dutyCyclePercent: '0.0',
        lMinCCM: 0,
        lDesign: 0,
        cOut: 0,
        equivalentLoadResistance: R,
        error,
      };
    }

    // Calculations:
    let lMinCCM = 0; // uH
    let lDesign = 0; // uH
    let cOut = 0; // uF

    if (type === 'buck') {
      // 1. Minimum Inductance for CCM: L_min = (1 - D) * R / (2 * fs)
      lMinCCM = ((1 - dutyCycle) * R) / (2 * fsHz);

      // 2. L_design for current ripple: Delta I_L = I_out * deltaI_ratio
      // Delta I_L = (Vin - Vout) * D / (L * fs)
      const deltaIL = iout * deltaI_ratio;
      lDesign = deltaIL > 0 ? ((vin - vout) * dutyCycle) / (deltaIL * fsHz) : 0;

      // 3. C_out for voltage ripple: Delta Vout / Vout = (1 - D) / (8 * L * C * fs^2)
      // C = (1 - D) / (8 * L * fs^2 * deltaV_ratio)
      // Let's use the lDesign for calculating capacitor, or if lDesign is 0, lMinCCM.
      const lUsed = lDesign > 0 ? lDesign : lMinCCM;
      cOut = lUsed > 0 ? (1 - dutyCycle) / (8 * lUsed * Math.pow(fsHz, 2) * deltaV_ratio) : 0;
    } else {
      // boost
      // 1. Minimum Inductance for CCM: L_min = D * (1 - D)^2 * R / (2 * fs)
      lMinCCM = (dutyCycle * Math.pow(1 - dutyCycle, 2) * R) / (2 * fsHz);

      // 2. L_design for current ripple: Delta I_L = I_in * deltaI_ratio where I_in = I_out / (1 - D)
      // Delta I_L = Vin * D / (L * fs)
      const iIn = iout / (1 - dutyCycle);
      const deltaIL = iIn * deltaI_ratio;
      lDesign = deltaIL > 0 ? (vin * dutyCycle) / (deltaIL * fsHz) : 0;

      // 3. C_out for voltage ripple: Delta Vout / Vout = D / (R * C * fs)
      // C = D / (R * fs * deltaV_ratio)
      cOut = dutyCycle / (R * fsHz * deltaV_ratio);
    }

    // Convert L to uH (multiply by 10^6) and C to uF (multiply by 10^6)
    lMinCCM = lMinCCM * 1000000;
    lDesign = lDesign * 1000000;
    cOut = cOut * 1000000;

    return {
      dutyCycle,
      dutyCyclePercent: (dutyCycle * 100).toFixed(1),
      lMinCCM,
      lDesign,
      cOut,
      equivalentLoadResistance: R,
    };
  }, [inputs]);

  return {
    inputs,
    setInputs,
    outputs,
  };
}
