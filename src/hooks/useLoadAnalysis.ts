import { useState, useCallback, useMemo } from 'react';

export interface LoadRow {
  Hour: number;
  Residential: number;
  Commercial: number;
  Industrial: number;
}

export const GENERATOR_LOAD_SAMPLES: LoadRow[] = [
  { Hour: 1, Residential: 40, Commercial: 20, Industrial: 60 },
  { Hour: 2, Residential: 35, Commercial: 15, Industrial: 60 },
  { Hour: 3, Residential: 30, Commercial: 15, Industrial: 60 },
  { Hour: 4, Residential: 25, Commercial: 15, Industrial: 65 },
  { Hour: 5, Residential: 30, Commercial: 20, Industrial: 70 },
  { Hour: 6, Residential: 45, Commercial: 30, Industrial: 80 },
  { Hour: 7, Residential: 60, Commercial: 45, Industrial: 95 },
  { Hour: 8, Residential: 75, Commercial: 60, Industrial: 110 },
  { Hour: 9, Residential: 80, Commercial: 75, Industrial: 115 },
  { Hour: 10, Residential: 85, Commercial: 80, Industrial: 120 },
  { Hour: 11, Residential: 90, Commercial: 85, Industrial: 120 },
  { Hour: 12, Residential: 85, Commercial: 80, Industrial: 115 },
  { Hour: 13, Residential: 80, Commercial: 70, Industrial: 110 },
  { Hour: 14, Residential: 85, Commercial: 75, Industrial: 110 },
  { Hour: 15, Residential: 90, Commercial: 80, Industrial: 115 },
  { Hour: 16, Residential: 85, Commercial: 75, Industrial: 120 },
  { Hour: 17, Residential: 95, Commercial: 70, Industrial: 120 },
  { Hour: 18, Residential: 120, Commercial: 85, Industrial: 125 },
  { Hour: 19, Residential: 135, Commercial: 95, Industrial: 110 },
  { Hour: 20, Residential: 140, Commercial: 90, Industrial: 95 },
  { Hour: 21, Residential: 130, Commercial: 80, Industrial: 80 },
  { Hour: 22, Residential: 105, Commercial: 65, Industrial: 75 },
  { Hour: 23, Residential: 80, Commercial: 45, Industrial: 70 },
  { Hour: 24, Residential: 60, Commercial: 30, Industrial: 65 }
];

export function useLoadAnalysis() {
  const [gridData, setGridData] = useState<LoadRow[]>(GENERATOR_LOAD_SAMPLES);

  const resetData = useCallback(() => {
    setGridData(GENERATOR_LOAD_SAMPLES);
  }, []);

  const loadSampleData = useCallback(() => {
    setGridData(GENERATOR_LOAD_SAMPLES);
  }, []);

  const updateCell = useCallback((hourIndex: number, sector: 'Residential' | 'Commercial' | 'Industrial', val: number) => {
    setGridData(prev => prev.map((row, idx) => {
      if (idx !== hourIndex) return row;
      return {
        ...row,
        [sector]: Math.max(0, val)
      };
    }));
  }, []);

  // Compute calculated values
  const results = useMemo(() => {
    // 24 hours of data with totals
    const chronologicalData = gridData.map(row => {
      const Total = row.Residential + row.Commercial + row.Industrial;
      return {
        ...row,
        Total
      };
    });

    // Find separate peaks to calculate diversity factor
    let maxRes = 0;
    let maxCom = 0;
    let maxInd = 0;
    let maxTotal = 0;
    let sumTotal = 0;

    chronologicalData.forEach(d => {
      if (d.Residential > maxRes) maxRes = d.Residential;
      if (d.Commercial > maxCom) maxCom = d.Commercial;
      if (d.Industrial > maxInd) maxInd = d.Industrial;
      if (d.Total > maxTotal) maxTotal = d.Total;
      sumTotal += d.Total;
    });

    const averageLoad = sumTotal / 24;

    // Load Factor = Average Load / Peak System Load
    const systemLoadFactorPercent = maxTotal > 0 ? (averageLoad / maxTotal) * 100 : 0;

    // Diversity Factor = Sum of individual maximum demands / Maximum demand of entire system
    const sumIndividualMax = maxRes + maxCom + maxInd;
    const diversityFactor = maxTotal > 0 ? sumIndividualMax / maxTotal : 1.0;

    // 2. Load Duration Curve (Total load sorted in descending order)
    const sortedTotalLoads = chronologicalData
      .map(d => d.Total)
      .sort((a, b) => b - a);

    // Map to a percentage of duration (1 to 24 hours)
    const loadDurationData = sortedTotalLoads.map((load, idx) => {
      const percentageOfTime = ((idx + 1) / 24) * 100;
      
      // Classify as base load or peak load region
      // Let's say bottom 70% duration is base load region, top 30% is peak load
      const isBaseLoadRegion = percentageOfTime > 30;

      return {
        Index: idx + 1,
        DurationPercent: Math.round(percentageOfTime),
        Load_MW: load,
        BaseLoad_MW: isBaseLoadRegion ? load : 0,
        PeakLoad_MW: !isBaseLoadRegion ? load : 0
      };
    });

    return {
      chronologicalData,
      loadDurationData,
      maxResidentialPeak: maxRes,
      maxCommercialPeak: maxCom,
      maxIndustrialPeak: maxInd,
      systemPeakLoad: maxTotal,
      averageLoad: Math.round(averageLoad * 10) / 10,
      systemLoadFactorPercent: Math.round(systemLoadFactorPercent * 10) / 10,
      diversityFactor: Math.round(diversityFactor * 100) / 100,
    };
  }, [gridData]);

  return {
    gridData,
    updateCell,
    resetData,
    loadSampleData,
    ...results
  };
}
