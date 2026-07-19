import { useState, useMemo } from 'react';

export type BridgeType = 'maxwell' | 'schering';

export interface BridgeInputs {
  bridgeType: BridgeType;
  frequency: number; // in Hz

  // Maxwell Bridge Inputs
  maxwellR1: number; // Resistor in parallel with C1 (Ohms)
  maxwellR2: number; // Resistor in arm 2 (Ohms)
  maxwellR3: number; // Resistor in arm 3 (Ohms)
  maxwellC1: number; // Capacitor in parallel with R1 (Farads or microFarads, we'll take microFarads)

  // Schering Bridge Inputs
  scheringC2: number; // Standard capacitor (microFarads)
  scheringR3: number; // Resistor in arm 3 (Ohms)
  scheringR4: number; // Resistor in parallel with C4 (Ohms)
  scheringC4: number; // Capacitor in parallel with R4 (microFarads)
}

export interface BridgeOutputs {
  // Maxwell Outputs
  lx?: number; // Unknown inductance (Henries)
  rxMaxwell?: number; // Unknown resistance of inductor (Ohms)
  qFactor?: number; // Quality factor

  // Schering Outputs
  cx?: number; // Unknown capacitance (microFarads)
  rxSchering?: number; // Unknown series resistance of capacitor (Ohms)
  dissipationFactor?: number; // Dissipation factor (D)

  error?: string;
}

export function useBridgeMath(initialInputs: BridgeInputs) {
  const [inputs, setInputs] = useState<BridgeInputs>(initialInputs);

  const outputs = useMemo<BridgeOutputs>(() => {
    const {
      bridgeType,
      frequency,
      maxwellR1,
      maxwellR2,
      maxwellR3,
      maxwellC1,
      scheringC2,
      scheringR3,
      scheringR4,
      scheringC4
    } = inputs;

    // Common validations
    if (frequency <= 0) {
      return { error: 'Operating frequency must be strictly greater than 0.' };
    }

    const omega = 2 * Math.PI * frequency;

    if (bridgeType === 'maxwell') {
      if (maxwellR1 <= 0 || maxwellR2 <= 0 || maxwellR3 <= 0 || maxwellC1 <= 0) {
        return { error: 'All Maxwell arm resistors and capacitors must be strictly greater than 0.' };
      }

      // convert C1 from microFarads to Farads for standard calculations
      const c1_F = maxwellC1 * 1e-6;

      // Lx = R2 * R3 * C1
      const lx = maxwellR2 * maxwellR3 * c1_F;

      // Rx = (R2 * R3) / R1
      const rxMaxwell = (maxwellR2 * maxwellR3) / maxwellR1;

      // Q = omega * Lx / Rx = omega * R1 * C1
      const qFactor = omega * maxwellR1 * c1_F;

      return {
        lx, // in Henries
        rxMaxwell, // in Ohms
        qFactor
      };
    } else {
      // Schering Bridge
      if (scheringC2 <= 0 || scheringR3 <= 0 || scheringR4 <= 0 || scheringC4 <= 0) {
        return { error: 'All Schering arm resistors and capacitors must be strictly greater than 0.' };
      }

      // Convert microFarads to Farads for internal calculation, but we can output Cx in microFarads directly
      // Cx = C2 * (R4 / R3)
      const cx = scheringC2 * (scheringR4 / scheringR3);

      // Rx = R3 * (C4 / C2) -> ratio of microFarads is same as Farads, so no conversion needed
      const rxSchering = scheringR3 * (scheringC4 / scheringC2);

      // D = omega * R4 * C4 (C4 in Farads)
      const c4_F = scheringC4 * 1e-6;
      const dissipationFactor = omega * scheringR4 * c4_F;

      return {
        cx, // in microFarads
        rxSchering, // in Ohms
        dissipationFactor
      };
    }
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
