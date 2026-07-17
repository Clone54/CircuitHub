import { useMemo } from 'react';

export interface SubstationInputs {
  capacityKVA: number; // S in kVA
  primaryVoltageKV: number; // e.g., 11 kV
  secondaryVoltageV: number; // e.g., 400 V
  pfInitial: number; // e.g., 0.8
  pfTarget: number; // e.g., 0.98
}

export interface SubstationResults {
  htNominalCurrent: number; // I_HT in Amps
  ltNominalCurrent: number; // I_LT in Amps
  recommendedHtBreaker: number; // in Amps
  recommendedLtBreaker: number; // in Amps
  pfiCapacityKVAR: number; // Q in kVAR
  transformerLossesEst: number; // copper + iron losses estimate in kW
  recommendedLtCable: string; // recommended cable spec
}

export function useSubstationRating(inputs: SubstationInputs): SubstationResults {
  return useMemo(() => {
    const { capacityKVA, primaryVoltageKV, secondaryVoltageV, pfInitial, pfTarget } = inputs;

    // HT side calculations (Voltage in kV, current in Amps)
    // I_HT = S / (sqrt(3) * V_HT)
    const htNominalCurrent = capacityKVA / (Math.sqrt(3) * primaryVoltageKV);

    // LT side calculations (Voltage in V, current in Amps)
    // I_LT = S / (sqrt(3) * V_LT_kV)
    const secondaryVoltageKV = secondaryVoltageV / 1000;
    const ltNominalCurrent = capacityKVA / (Math.sqrt(3) * secondaryVoltageKV);

    // Standard HT Switchgear Ratings (e.g. LBS/VCB standard minimum is 630A, but can be 200A for smaller settings)
    const standardHtBreakers = [100, 200, 430, 630, 800, 1250];
    const minHtBreakerReq = htNominalCurrent * 1.5; // safety margin for HT transient magnetizing inrush
    const recommendedHtBreaker = standardHtBreakers.find(r => r >= minHtBreakerReq) || 630;

    // Standard LT Air Circuit Breakers (ACB) / Molded Case Circuit Breakers (MCCB) Ratings
    const standardLtBreakers = [100, 160, 200, 250, 400, 630, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000];
    const minLtBreakerReq = ltNominalCurrent * 1.25; // 125% continuous rating rule
    const recommendedLtBreaker = standardLtBreakers.find(r => r >= minLtBreakerReq) || 4000;

    // PFI capacity calculation: Q = P * (tan(theta_1) - tan(theta_2))
    // P = S * pfInitial
    const p = capacityKVA * pfInitial; // kW active power
    const theta1 = Math.acos(pfInitial);
    const theta2 = Math.acos(pfTarget);
    const tanDiff = Math.tan(theta1) - Math.tan(theta2);
    const pfiCapacityKVAR = Math.max(0, p * tanDiff);

    // Transformer standard losses estimation: roughly 1% - 1.5% of rating
    const transformerLossesEst = capacityKVA * 0.013;

    // Recommend LT Cables (typically multi-run XLPE copper single core cables)
    let recommendedLtCable = '1 run of 3C x 95 mm² PVC/Cu';
    if (ltNominalCurrent <= 100) {
      recommendedLtCable = '1 run of 4C x 35 mm² XLPE/Cu';
    } else if (ltNominalCurrent <= 160) {
      recommendedLtCable = '1 run of 4C x 70 mm² XLPE/Cu';
    } else if (ltNominalCurrent <= 250) {
      recommendedLtCable = '1 run of 4C x 120 mm² XLPE/Cu';
    } else if (ltNominalCurrent <= 400) {
      recommendedLtCable = '1 run of 4C x 240 mm² XLPE/Cu';
    } else if (ltNominalCurrent <= 630) {
      recommendedLtCable = '2 runs of 4C x 150 mm² XLPE/Cu';
    } else if (ltNominalCurrent <= 800) {
      recommendedLtCable = '2 runs of 4C x 240 mm² XLPE/Cu';
    } else if (ltNominalCurrent <= 1000) {
      recommendedLtCable = '3 runs of 4C x 185 mm² XLPE/Cu';
    } else if (ltNominalCurrent <= 1250) {
      recommendedLtCable = '3 runs of 4C x 240 mm² XLPE/Cu';
    } else if (ltNominalCurrent <= 1600) {
      recommendedLtCable = '4 runs of 4C x 240 mm² XLPE/Cu';
    } else {
      recommendedLtCable = '5 runs of 4C x 240 mm² XLPE/Cu';
    }

    return {
      htNominalCurrent: Math.round(htNominalCurrent * 100) / 100,
      ltNominalCurrent: Math.round(ltNominalCurrent * 100) / 100,
      recommendedHtBreaker,
      recommendedLtBreaker,
      pfiCapacityKVAR: Math.round(pfiCapacityKVAR * 10) / 10,
      transformerLossesEst: Math.round(transformerLossesEst * 100) / 100,
      recommendedLtCable
    };
  }, [
    inputs.capacityKVA,
    inputs.primaryVoltageKV,
    inputs.secondaryVoltageV,
    inputs.pfInitial,
    inputs.pfTarget
  ]);
}
