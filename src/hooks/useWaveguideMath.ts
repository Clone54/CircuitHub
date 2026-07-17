import { useState, useMemo } from 'react';

export interface WaveguideInputs {
  a: number; // in cm
  b: number; // in cm
  frequency: number; // in GHz
  m: number; // mode index m
  n: number; // mode index n
  modeType: 'TE' | 'TM';
}

export interface WaveguideOutputs {
  cutoffFrequency: number; // in GHz
  freeSpaceWavelength: number; // in cm
  guideWavelength: number | null; // in cm, null if evanescent
  phaseVelocity: number | null; // in m/s, null if evanescent
  groupVelocity: number | null; // in m/s, null if evanescent
  propagates: boolean;
  error?: string;
}

export function useWaveguideMath(initialInputs: WaveguideInputs) {
  const [inputs, setInputs] = useState<WaveguideInputs>(initialInputs);

  const outputs = useMemo<WaveguideOutputs>(() => {
    const { a, b, frequency, m, n, modeType } = inputs;

    // Strict validation
    if (a <= 0 || b <= 0) {
      return {
        cutoffFrequency: 0,
        freeSpaceWavelength: 0,
        guideWavelength: null,
        phaseVelocity: null,
        groupVelocity: null,
        propagates: false,
        error: 'Dimensions "a" and "b" must be strictly greater than 0.'
      };
    }
    if (frequency <= 0) {
      return {
        cutoffFrequency: 0,
        freeSpaceWavelength: 0,
        guideWavelength: null,
        phaseVelocity: null,
        groupVelocity: null,
        propagates: false,
        error: 'Operating frequency must be strictly greater than 0.'
      };
    }
    if (m < 0 || n < 0 || (m === 0 && n === 0)) {
      return {
        cutoffFrequency: 0,
        freeSpaceWavelength: 0,
        guideWavelength: null,
        phaseVelocity: null,
        groupVelocity: null,
        propagates: false,
        error: 'Mode indices m and n cannot both be zero.'
      };
    }
    if (modeType === 'TM' && (m === 0 || n === 0)) {
      return {
        cutoffFrequency: 0,
        freeSpaceWavelength: 0,
        guideWavelength: null,
        phaseVelocity: null,
        groupVelocity: null,
        propagates: false,
        error: 'TM modes require both m and n to be greater than or equal to 1.'
      };
    }

    const c = 3.0e8; // speed of light in m/s
    const c_cm_GHz = 30.0; // speed of light in cm * GHz (3e10 cm/s = 30 GHz * cm)

    // Calculate cutoff frequency (fc) in GHz
    // fc = (c / 2) * sqrt( (m/a)^2 + (n/b)^2 )
    const cutoffFrequency = 15.0 * Math.sqrt(Math.pow(m / a, 2) + Math.pow(n / b, 2));

    // Calculate free-space wavelength in cm
    const freeSpaceWavelength = c_cm_GHz / frequency;

    const ratio = cutoffFrequency / frequency;
    const propagates = frequency > cutoffFrequency;

    if (!propagates) {
      return {
        cutoffFrequency,
        freeSpaceWavelength,
        guideWavelength: null,
        phaseVelocity: null,
        groupVelocity: null,
        propagates: false
      };
    }

    const factor = Math.sqrt(1 - Math.pow(ratio, 2));

    // Guide wavelength: lambda_g = lambda_0 / factor
    const guideWavelength = freeSpaceWavelength / factor;

    // Phase velocity: vp = c / factor
    const phaseVelocity = c / factor;

    // Group velocity: vg = c * factor
    const groupVelocity = c * factor;

    return {
      cutoffFrequency,
      freeSpaceWavelength,
      guideWavelength,
      phaseVelocity,
      groupVelocity,
      propagates: true
    };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
