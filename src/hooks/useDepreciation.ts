import { useState, useMemo } from 'react';

export interface DepreciationInputs {
  initialCost: number; // P
  salvageValue: number; // S
  usefulLifeYears: number; // n
  interestRatePercent: number; // r %
}

export interface DepreciationYearPoint {
  year: number;
  slAccumulated: number;
  slBookValue: number;
  sfAccumulated: number;
  sfBookValue: number;
}

export interface DepreciationResults {
  yearlyData: DepreciationYearPoint[];
  slAnnualDepreciation: number;
  sfAnnualDepreciation: number; // Initial sinking fund deposit
}

export function useDepreciation() {
  const [inputs, setInputs] = useState<DepreciationInputs>({
    initialCost: 1000000, // $1M
    salvageValue: 100000,  // $100k
    usefulLifeYears: 15,
    interestRatePercent: 6 // 6% Sinking fund rate
  });

  const updateInput = (field: keyof DepreciationInputs, val: number) => {
    setInputs(prev => ({
      ...prev,
      [field]: Math.max(0, val)
    }));
  };

  const results = useMemo<DepreciationResults>(() => {
    const { initialCost, salvageValue, usefulLifeYears, interestRatePercent } = inputs;
    const P = initialCost;
    const S = salvageValue;
    const n = Math.max(1, usefulLifeYears);
    const r = interestRatePercent / 100;

    // 1. Straight Line calculation
    const slAnnual = (P - S) / n;

    // 2. Sinking Fund calculation
    // D_sf = (P - S) * r / ((1+r)^n - 1)
    let sfAnnual = 0;
    if (r > 0) {
      sfAnnual = (P - S) * r / (Math.pow(1 + r, n) - 1);
    } else {
      sfAnnual = (P - S) / n;
    }

    const yearlyData: DepreciationYearPoint[] = [];

    // Year 0 (initial state)
    yearlyData.push({
      year: 0,
      slAccumulated: 0,
      slBookValue: P,
      sfAccumulated: 0,
      sfBookValue: P
    });

    for (let t = 1; t <= n; t++) {
      // Straight line
      const slAccum = slAnnual * t;
      const slBV = P - slAccum;

      // Sinking fund
      let sfAccum = 0;
      if (r > 0) {
        sfAccum = sfAnnual * (Math.pow(1 + r, t) - 1) / r;
      } else {
        sfAccum = sfAnnual * t;
      }
      const sfBV = P - sfAccum;

      yearlyData.push({
        year: t,
        slAccumulated: Math.round(slAccum),
        slBookValue: Math.max(S, Math.round(slBV)),
        sfAccumulated: Math.round(sfAccum),
        sfBookValue: Math.max(S, Math.round(sfBV))
      });
    }

    return {
      yearlyData,
      slAnnualDepreciation: Math.round(slAnnual * 100) / 100,
      sfAnnualDepreciation: Math.round(sfAnnual * 100) / 100
    };
  }, [inputs]);

  return {
    inputs,
    updateInput,
    ...results
  };
}
