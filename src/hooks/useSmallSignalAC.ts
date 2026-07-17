import { useState, useMemo } from 'react';

export interface SmallSignalInputs {
  transistorType: 'BJT' | 'FET';
  config: 'CE-Fixed' | 'CE-Divider' | 'CC-Follower' | 'CS';
  beta: number; // BJT hfe
  ro: number; // BJT ro (kOhms)
  gm: number; // FET transconductance (mS)
  rd: number; // FET rd (kOhms)
  Rs: number; // Source resistance (kOhms)
  R1: number; // Bias resistor 1 / RB / RG (kOhms)
  R2: number; // Bias resistor 2 (kOhms, 0 if not used)
  Rc: number; // Collector / Drain resistor (kOhms)
  Re: number; // Emitter / Source resistor (kOhms)
  RL: number; // Load resistor (kOhms)
  IE: number; // Emitter current (mA) for BJT
  reBypassed: boolean; // Is Re bypassed by a capacitor?
}

export interface SmallSignalOutputs {
  re: number; // Ohms
  Zi: number; // kOhms
  Zo: number; // kOhms
  AvNL: number; 
  Av: number;
  Ai: number;
}

const par = (r1: number, r2: number) => {
  if (r1 === 0 || r2 === 0) return 0;
  if (r1 === Infinity) return r2;
  if (r2 === Infinity) return r1;
  return (r1 * r2) / (r1 + r2);
};

export function useSmallSignalAC(initialInputs: SmallSignalInputs) {
  const [inputs, setInputs] = useState<SmallSignalInputs>(initialInputs);

  const outputs = useMemo<SmallSignalOutputs>(() => {
    const { transistorType, config, beta, ro, gm, rd, Rs, R1, R2, Rc, Re, RL, IE, reBypassed } = inputs;
    
    let re_ohms = 0;
    if (transistorType === 'BJT' && IE > 0) {
      re_ohms = 26 / IE; // re in Ohms
    }
    
    const re_k = re_ohms / 1000; // re in kOhms
    const r_pi = beta * re_k;
    
    const RB = R2 > 0 ? par(R1, R2) : R1;
    
    let Zi = 0;
    let Zo = 0;
    let AvNL = 0;
    let Av = 0;
    let Ai = 0;

    if (transistorType === 'BJT') {
      if (config === 'CE-Fixed' || config === 'CE-Divider') {
        const RE_active = reBypassed ? 0 : Re;
        const Zb = RE_active > 0 ? beta * (re_k + RE_active) : r_pi;
        
        Zi = par(RB, Zb);
        Zo = par(Rc, ro);
        
        // Gain approximations
        if (RE_active === 0) {
          AvNL = -par(Rc, ro) / re_k;
          Av = -par(par(Rc, ro), RL > 0 ? RL : Infinity) / re_k;
        } else {
          AvNL = -par(Rc, ro) / RE_active;
          Av = -par(par(Rc, ro), RL > 0 ? RL : Infinity) / RE_active;
        }
        
      } else if (config === 'CC-Follower') {
        const ReLoad = par(Re, RL > 0 ? RL : Infinity);
        const Zb = beta * (re_k + ReLoad);
        Zi = par(RB, Zb);
        
        const Rsource = par(Rs, RB);
        Zo = re_k + (Rsource / beta);
        
        AvNL = Re / (re_k + Re);
        Av = ReLoad / (re_k + ReLoad);
      }
    } else {
      // FET
      if (config === 'CS') {
        Zi = RB; // RG
        const Rd_active = par(Rc, rd); // Rc represents Drain resistor here
        Zo = Rd_active;
        
        AvNL = -gm * Rd_active;
        Av = -gm * par(Rd_active, RL > 0 ? RL : Infinity);
      }
    }

    // Ai calculation A_i = - A_v * (Z_i / R_L)
    if (RL > 0) {
      Ai = -Av * (Zi / RL);
    }

    return {
      re: re_ohms,
      Zi,
      Zo,
      AvNL,
      Av,
      Ai
    };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
