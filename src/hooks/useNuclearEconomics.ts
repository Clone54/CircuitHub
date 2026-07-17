import { useState, useMemo } from 'react';

export interface EconomicDataPoint {
  year: number;
  nuclearCumulative: number; // in Millions USD
  fossilCumulative: number; // in Millions USD
  nuclearAnnual: number;
  fossilAnnual: number;
}

export function useNuclearEconomics() {
  // Common
  const [discountRate, setDiscountRate] = useState<number>(6); // % discount rate
  const [plantSizeMW, setPlantSizeMW] = useState<number>(1000); // Plant capacity in MW

  // Nuclear Parameters
  const [nucCapital, setNucCapital] = useState<number>(6800); // $/kW overnight construction cost
  const [nucOM, setNucOM] = useState<number>(14.5); // $/MWh fixed & variable O&M
  const [nucFuel, setNucFuel] = useState<number>(6.5); // $/MWh enriched uranium fuel cycle
  const [nucLifespan, setNucLifespan] = useState<number>(60); // Years operating license
  const [nucCF, setNucCF] = useState<number>(92); // % Capacity Factor

  // Fossil Parameters (Coal/Gas)
  const [fosCapital, setFosCapital] = useState<number>(2400); // $/kW overnight construction cost
  const [fosOM, setFosOM] = useState<number>(6.8); // $/MWh fixed & variable O&M
  const [fosFuel, setFosFuel] = useState<number>(38.5); // $/MWh fossil fuel fuel feed
  const [fosLifespan, setFosLifespan] = useState<number>(30); // Years operating license
  const [fosCF, setFosCF] = useState<number>(75); // % Capacity Factor

  // LCOE and Cumulative Cost Curve Calculation
  const economicAnalysis = useMemo(() => {
    const years = 60; // Max horizontal timeline of simulation
    const r = discountRate / 100;

    // 1. Calculate Levelized Cost of Energy (LCOE)
    // Formula: LCOE = Sum( (Cap_t + O&M_t + Fuel_t) / (1+r)^t ) / Sum( Elec_t / (1+r)^t )
    
    // NUCLEAR LCOE
    let nucDiscountedCostsSum = 0;
    let nucDiscountedElecSum = 0;
    // Year 0: Construction capital outflow
    const nucInitialCap = nucCapital * plantSizeMW * 1000; // in USD
    nucDiscountedCostsSum += nucInitialCap;
    
    const nucAnnualGenMWh = plantSizeMW * 8760 * (nucCF / 100);
    const nucAnnualOMFuel = nucAnnualGenMWh * (nucOM + nucFuel);

    for (let t = 1; t <= nucLifespan; t++) {
      const discountFactor = Math.pow(1 + r, t);
      nucDiscountedCostsSum += nucAnnualOMFuel / discountFactor;
      nucDiscountedElecSum += nucAnnualGenMWh / discountFactor;
    }
    const nucLCOE = nucDiscountedElecSum > 0 ? (nucDiscountedCostsSum / nucDiscountedElecSum) : 0; // $/MWh

    // FOSSIL LCOE (Accounting for rebuilding / extension at Year fosLifespan + 1)
    let fosDiscountedCostsSum = 0;
    let fosDiscountedElecSum = 0;
    const fosInitialCap = fosCapital * plantSizeMW * 1000; // in USD
    fosDiscountedCostsSum += fosInitialCap;

    const fosAnnualGenMWh = plantSizeMW * 8760 * (fosCF / 100);
    const fosAnnualOMFuel = fosAnnualGenMWh * (fosOM + fosFuel);

    for (let t = 1; t <= nucLifespan; t++) {
      const discountFactor = Math.pow(1 + r, t);
      
      // If fossil plant reaches its lifespan, it must be rebuilt (add capital cost again!)
      let activeCap = 0;
      if (t === fosLifespan + 1) {
        activeCap = fosInitialCap;
      }
      
      fosDiscountedCostsSum += (activeCap + fosAnnualOMFuel) / discountFactor;
      fosDiscountedElecSum += fosAnnualGenMWh / discountFactor;
    }
    const fosLCOE = fosDiscountedElecSum > 0 ? (fosDiscountedCostsSum / fosDiscountedElecSum) : 0; // $/MWh

    // 2. Generate Nominal Cumulative Cost Over 60 Years
    const chartData: EconomicDataPoint[] = [];
    let nucCum = nucInitialCap / 1e6; // in Millions USD
    let fosCum = fosInitialCap / 1e6; // in Millions USD

    let breakevenYear: number | null = null;

    for (let t = 1; t <= years; t++) {
      // Nuclear operating expenses
      let nucCostThisYear = 0;
      if (t <= nucLifespan) {
        nucCostThisYear = nucAnnualOMFuel / 1e6;
      }
      nucCum += nucCostThisYear;

      // Fossil operating expenses + rebuild capital expense
      let fosCostThisYear = nucAnnualOMFuel / 1e6; // Default operational
      if (t <= nucLifespan) {
        fosCostThisYear = fosAnnualOMFuel / 1e6;
        if (t === fosLifespan + 1) {
          fosCostThisYear += fosInitialCap / 1e6; // Add Rebuild Cost
        }
      }
      fosCum += fosCostThisYear;

      // Find breakeven year (intersection where nuclear cumulative cost drops below fossil)
      if (nucCum < fosCum && breakevenYear === null && t > 1) {
        breakevenYear = t;
      }

      chartData.push({
        year: t,
        nuclearCumulative: parseFloat(nucCum.toFixed(1)),
        fossilCumulative: parseFloat(fosCum.toFixed(1)),
        nuclearAnnual: parseFloat(nucCostThisYear.toFixed(2)),
        fossilAnnual: parseFloat(fosCostThisYear.toFixed(2)),
      });
    }

    const lifetimeSavingsMillions = fosCum - nucCum;

    return {
      nucLCOE: parseFloat(nucLCOE.toFixed(2)),
      fosLCOE: parseFloat(fosLCOE.toFixed(2)),
      breakevenYear,
      lifetimeSavingsMillions: parseFloat(Math.max(0, lifetimeSavingsMillions).toFixed(1)),
      chartData,
    };
  }, [
    discountRate,
    plantSizeMW,
    nucCapital,
    nucOM,
    nucFuel,
    nucLifespan,
    nucCF,
    fosCapital,
    fosOM,
    fosFuel,
    fosLifespan,
    fosCF,
  ]);

  return {
    discountRate,
    setDiscountRate,
    plantSizeMW,
    setPlantSizeMW,
    
    nucCapital,
    setNucCapital,
    nucOM,
    setNucOM,
    nucFuel,
    setNucFuel,
    nucLifespan,
    setNucLifespan,
    nucCF,
    setNucCF,

    fosCapital,
    setFosCapital,
    fosOM,
    setFosOM,
    fosFuel,
    setFosFuel,
    fosLifespan,
    setFosLifespan,
    fosCF,
    setFosCF,

    ...economicAnalysis,
  };
}
