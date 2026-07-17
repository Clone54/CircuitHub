import { useState, useMemo } from 'react';

export interface TransformerInputs {
  voc: number; // Open circuit voltage
  ioc: number; // Open circuit current
  poc: number; // Open circuit power
  vsc: number; // Short circuit voltage
  isc: number; // Short circuit current
  psc: number; // Short circuit power
}

export interface TransformerOutputs {
  rc: number; // Core loss resistance
  xm: number; // Magnetizing reactance
  req: number; // Equivalent series resistance
  xeq: number; // Equivalent series reactance
  zeq: number; // Equivalent series impedance
  pfOC: number; // Power factor during OC test
  pfSC: number; // Power factor during SC test
  error?: string;
}

export function useTransformerMath(initialInputs: TransformerInputs) {
  const [inputs, setInputs] = useState<TransformerInputs>(initialInputs);

  const outputs = useMemo<TransformerOutputs>(() => {
    const { voc, ioc, poc, vsc, isc, psc } = inputs;

    // Strict validation
    if (voc <= 0 || ioc <= 0 || poc <= 0 || vsc <= 0 || isc <= 0 || psc <= 0) {
      return {
        rc: 0,
        xm: 0,
        req: 0,
        xeq: 0,
        zeq: 0,
        pfOC: 0,
        pfSC: 0,
        error: 'All electrical values (V, I, P) must be strictly greater than 0.'
      };
    }

    // Power factor validation
    const pfOC = poc / (voc * ioc);
    const pfSC = psc / (vsc * isc);

    if (pfOC > 1.0001) {
      return {
        rc: 0,
        xm: 0,
        req: 0,
        xeq: 0,
        zeq: 0,
        pfOC: 0,
        pfSC: 0,
        error: `OC test power factor (${pfOC.toFixed(3)}) cannot exceed 1.0. Verify Voc, Ioc, and Poc values.`
      };
    }

    if (pfSC > 1.0001) {
      return {
        rc: 0,
        xm: 0,
        req: 0,
        xeq: 0,
        zeq: 0,
        pfOC: 0,
        pfSC: 0,
        error: `SC test power factor (${pfSC.toFixed(3)}) cannot exceed 1.0. Verify Vsc, Isc, and Psc values.`
      };
    }

    // 1. Shunt Branch Parameters from OC Test
    // R_c = Voc^2 / Poc
    const rc = Math.pow(voc, 2) / poc;

    // I_c = Voc / R_c
    const ic = voc / rc;

    // I_m = sqrt(Ioc^2 - I_c^2)
    const imSquared = Math.pow(ioc, 2) - Math.pow(ic, 2);
    const im = imSquared > 0 ? Math.sqrt(imSquared) : 1e-6;

    // X_m = Voc / I_m
    const xm = voc / im;

    // 2. Series Branch Parameters from SC Test
    // Z_eq = Vsc / Isc
    const zeq = vsc / isc;

    // R_eq = Psc / Isc^2
    const req = psc / Math.pow(isc, 2);

    // X_eq = sqrt(Z_eq^2 - R_eq^2)
    const xeqSquared = Math.pow(zeq, 2) - Math.pow(req, 2);
    const xeq = xeqSquared > 0 ? Math.sqrt(xeqSquared) : 0;

    return {
      rc,
      xm,
      req,
      xeq,
      zeq,
      pfOC: Math.min(1, pfOC),
      pfSC: Math.min(1, pfSC)
    };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
