import { useState, useMemo } from 'react';

export interface TransmissionInputs {
  vs: number; // Sending-end voltage (kV, Line-to-Line)
  pLoad: number; // Load real power (MW, 3-Phase)
  qLoad: number; // Load reactive power (MVAR, 3-Phase)
  r: number; // Line Resistance (Ohms/phase)
  x: number; // Line Reactance (Ohms/phase)
}

export interface TransmissionOutputs {
  vr: number; // Receiving-end voltage (kV, Line-to-Line)
  voltageRegulation: number; // VR %
  efficiency: number; // Transmission Efficiency %
  losses: number; // Total transmission line losses (MW)
  currentMag: number; // Line Current (Amperes)
  powerFactor: number; // Load power factor
  pfType: 'lagging' | 'leading' | 'unity';
  error?: string;
}

export function useTransmissionLine(initialInputs: TransmissionInputs) {
  const [inputs, setInputs] = useState<TransmissionInputs>(initialInputs);

  const outputs = useMemo<TransmissionOutputs>(() => {
    const { vs, pLoad, qLoad, r, x } = inputs;

    if (vs <= 0) {
      return {
        vr: 0,
        voltageRegulation: 0,
        efficiency: 0,
        losses: 0,
        currentMag: 0,
        powerFactor: 1,
        pfType: 'unity',
        error: 'Sending-end voltage must be greater than zero.',
      };
    }

    // Convert to per-phase SI units
    // Vs per phase in Volts
    const vsPhase = (vs * 1000) / Math.sqrt(3);
    
    // P and Q per phase in Watts and VAR
    const pPhase = (pLoad * 1000000) / 3;
    const qPhase = (qLoad * 1000000) / 3;

    // Load Power Factor calculation
    const sApparent = Math.sqrt(pPhase * pPhase + qPhase * qPhase);
    const powerFactor = sApparent > 0 ? pPhase / sApparent : 1;
    const pfType = qPhase > 0 ? 'lagging' : qPhase < 0 ? 'leading' : 'unity';

    // Solve quadratic equation for Vr_phase^2 (u)
    // u^2 + b*u + c = 0
    // b = 2*(P*R + Q*X) - Vs_phase^2
    // c = (P*R + Q*X)^2 + (P*X - Q*R)^2
    const prqx = pPhase * r + qPhase * x;
    const pxqr = pPhase * x - qPhase * r;

    const b = 2 * prqx - vsPhase * vsPhase;
    const c = prqx * prqx + pxqr * pxqr;

    const discriminant = b * b - 4 * c;

    if (discriminant < 0) {
      return {
        vr: 0,
        voltageRegulation: 0,
        efficiency: 0,
        losses: 0,
        currentMag: 0,
        powerFactor,
        pfType,
        error: 'Voltage Collapse condition! The requested power load exceeds the maximum power transfer capability of this short transmission line.',
      };
    }

    // u = (-b + sqrt(b^2 - 4c)) / 2
    const u = (-b + Math.sqrt(discriminant)) / 2;

    if (u <= 0) {
      return {
        vr: 0,
        voltageRegulation: 0,
        efficiency: 0,
        losses: 0,
        currentMag: 0,
        powerFactor,
        pfType,
        error: 'No stable voltage solution found. The line resistance and reactance are too high for this sending voltage.',
      };
    }

    const vrPhase = Math.sqrt(u);
    // Convert back to Line-to-Line kV
    const vr = (vrPhase * Math.sqrt(3)) / 1000;

    // Line current magnitude (per-phase): I = S_phase / Vr_phase
    const currentMag = vrPhase > 0 ? sApparent / vrPhase : 0;

    // Total 3-Phase active power loss = 3 * I^2 * R (in MW)
    const losses = (3 * currentMag * currentMag * r) / 1000000;

    // Transmission Efficiency % = P_load / (P_load + P_loss) * 100
    const efficiency = pLoad > 0 ? (pLoad / (pLoad + losses)) * 100 : 100;

    // Voltage Regulation % = (Vs - Vr) / Vr * 100
    const voltageRegulation = vr > 0 ? ((vs - vr) / vr) * 100 : 0;

    return {
      vr,
      voltageRegulation,
      efficiency,
      losses,
      currentMag,
      powerFactor,
      pfType,
    };
  }, [inputs]);

  return {
    inputs,
    setInputs,
    outputs,
  };
}
