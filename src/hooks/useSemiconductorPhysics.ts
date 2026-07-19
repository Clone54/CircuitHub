import { useState, useMemo } from 'react';

export interface SemiInputs {
  material: 'Si' | 'Ge' | 'GaAs';
  temperature: number; // K
  dopingType: 'N' | 'P' | 'Intrinsic';
  dopingConcentration: number; // cm^-3
}

export interface SemiOutputs {
  ni: number;
  n: number;
  p: number;
  Ef_minus_Ei: number;
  Ec: number; // relative to Ei=0 (eV)
  Ev: number; // relative to Ei=0 (eV)
}

const MATERIAL_PROPERTIES = {
  Si: { Eg300: 1.12, Nc300: 2.8e19, Nv300: 1.04e19 },
  Ge: { Eg300: 0.66, Nc300: 1.04e19, Nv300: 6.0e18 },
  GaAs: { Eg300: 1.42, Nc300: 4.7e17, Nv300: 7.0e18 },
};

const KB_EV = 8.6173e-5; // Boltzmann constant in eV/K

export function useSemiconductorPhysics(initialInputs: SemiInputs) {
  const [inputs, setInputs] = useState<SemiInputs>(initialInputs);

  const outputs = useMemo<SemiOutputs>(() => {
    const { material, temperature: T, dopingType, dopingConcentration: N_dop } = inputs;
    
    // Guard against 0 or negative temperature
    const safeT = Math.max(1, T);

    const props = MATERIAL_PROPERTIES[material];
    
    // Scale density of states with T^(3/2)
    const Nc = props.Nc300 * Math.pow(safeT / 300, 1.5);
    const Nv = props.Nv300 * Math.pow(safeT / 300, 1.5);
    const Eg = props.Eg300; // Simplified, assuming Eg is constant for this tool

    // Calculate intrinsic carrier concentration
    let ni = Math.sqrt(Nc * Nv) * Math.exp(-Eg / (2 * KB_EV * safeT));
    if (ni < 1e-20) ni = 1e-20; // prevent divide by zero issues

    let n = ni;
    let p = ni;

    if (dopingType === 'N') {
      // Assuming full ionization
      n = (N_dop + Math.sqrt(N_dop * N_dop + 4 * ni * ni)) / 2;
      p = (ni * ni) / n;
    } else if (dopingType === 'P') {
      p = (N_dop + Math.sqrt(N_dop * N_dop + 4 * ni * ni)) / 2;
      n = (ni * ni) / p;
    }

    let Ef_minus_Ei = 0;
    if (dopingType === 'N' || (dopingType === 'Intrinsic' && n > ni)) {
      Ef_minus_Ei = KB_EV * safeT * Math.log(n / ni);
    } else if (dopingType === 'P' || (dopingType === 'Intrinsic' && p > ni)) {
      Ef_minus_Ei = -KB_EV * safeT * Math.log(p / ni);
    }

    const Ec = Eg / 2;
    const Ev = -Eg / 2;

    return {
      ni,
      n,
      p,
      Ef_minus_Ei,
      Ec,
      Ev
    };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
