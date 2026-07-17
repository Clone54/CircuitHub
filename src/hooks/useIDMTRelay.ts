import { useMemo, useState } from 'react';

export type RelayStandard = 'IEC' | 'IEEE';

export type IECResultCurveType = 'NI' | 'VI' | 'EI';
export type IEEEResultCurveType = 'MI' | 'VI' | 'EI';

export interface UseIDMTRelayParams {
  initialFaultCurrent?: number;
  initialCtPrimary?: number;
  initialCtSecondary?: number;
  initialPlugSetting?: number; // in %
  initialTms?: number;
  initialStandard?: RelayStandard;
  initialIecCurve?: IECResultCurveType;
  initialIeeeCurve?: IEEEResultCurveType;
}

export function useIDMTRelay({
  initialFaultCurrent = 6000,
  initialCtPrimary = 1000,
  initialCtSecondary = 5,
  initialPlugSetting = 100,
  initialTms = 0.2,
  initialStandard = 'IEC',
  initialIecCurve = 'NI',
  initialIeeeCurve = 'VI'
}: UseIDMTRelayParams = {}) {
  const [faultCurrent, setFaultCurrent] = useState<number>(initialFaultCurrent);
  const [ctPrimary, setCtPrimary] = useState<number>(initialCtPrimary);
  const [ctSecondary, setCtSecondary] = useState<number>(initialCtSecondary);
  const [plugSetting, setPlugSetting] = useState<number>(initialPlugSetting);
  const [tms, setTms] = useState<number>(initialTms);
  const [standard, setStandard] = useState<RelayStandard>(initialStandard);
  const [iecCurve, setIecCurve] = useState<IECResultCurveType>(initialIecCurve);
  const [ieeeCurve, setIeeeCurve] = useState<IEEEResultCurveType>(initialIeeeCurve);

  // Derived Relay Setting Current (Is) in Amps (secondary side)
  const settingCurrent = useMemo(() => {
    return (ctSecondary * plugSetting) / 100;
  }, [ctSecondary, plugSetting]);

  // Derived Plug Setting Multiplier (PSM)
  const psm = useMemo(() => {
    const primarySettingCurrent = ctPrimary * (plugSetting / 100);
    if (primarySettingCurrent <= 0) return 0;
    return faultCurrent / primarySettingCurrent;
  }, [faultCurrent, ctPrimary, plugSetting]);

  // Derived Operating Time (t) based on selected curve formulas
  const operatingTime = useMemo(() => {
    if (psm <= 1.0) return null; // Below pickup threshold

    if (standard === 'IEC') {
      // IEC 60255 constants
      let k = 0.14;
      let alpha = 0.02;

      if (iecCurve === 'VI') {
        k = 13.5;
        alpha = 1.0;
      } else if (iecCurve === 'EI') {
        k = 80.0;
        alpha = 2.0;
      }

      const t = (k * tms) / (Math.pow(psm, alpha) - 1);
      return Math.max(t, 0.01);
    } else {
      // IEEE C37.112 constants
      // MI (Moderately Inverse): A = 0.0515, B = 0.1140, p = 0.02
      // VI (Very Inverse): A = 19.61, B = 0.491, p = 2.0
      // EI (Extremely Inverse): A = 28.2, B = 0.1217, p = 2.0
      let A = 19.61;
      let B = 0.491;
      let p = 2.0;

      if (ieeeCurve === 'MI') {
        A = 0.0515;
        B = 0.1140;
        p = 0.02;
      } else if (ieeeCurve === 'EI') {
        A = 28.2;
        B = 0.1217;
        p = 2.0;
      }

      const t = tms * (A / (Math.pow(psm, p) - 1) + B);
      return Math.max(t, 0.01);
    }
  }, [psm, tms, standard, iecCurve, ieeeCurve]);

  // Dynamic TCC Curve data generation for Recharts
  // X-axis: PSM from 1.1 to 30 on log scale
  const tccData = useMemo(() => {
    const psms = [1.1, 1.2, 1.4, 1.6, 1.8, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30];
    return psms.map(p => {
      // IEC Curves
      const tIecNI = (0.14 * tms) / (Math.pow(p, 0.02) - 1);
      const tIecVI = (13.5 * tms) / (p - 1);
      const tIecEI = (80.0 * tms) / (Math.pow(p, 2) - 1);

      // IEEE Curves
      const tIeeeMI = tms * (0.0515 / (Math.pow(p, 0.02) - 1) + 0.1140);
      const tIeeeVI = tms * (19.61 / (Math.pow(p, 2) - 1) + 0.491);
      const tIeeeEI = tms * (28.2 / (Math.pow(p, 2) - 1) + 0.1217);

      return {
        psm: p,
        'IEC Normal Inverse': parseFloat(tIecNI.toFixed(3)),
        'IEC Very Inverse': parseFloat(tIecVI.toFixed(3)),
        'IEC Extremely Inverse': parseFloat(tIecEI.toFixed(3)),
        'IEEE Moderately Inverse': parseFloat(tIeeeMI.toFixed(3)),
        'IEEE Very Inverse': parseFloat(tIeeeVI.toFixed(3)),
        'IEEE Extremely Inverse': parseFloat(tIeeeEI.toFixed(3)),
      };
    });
  }, [tms]);

  const activeCurveLabel = useMemo(() => {
    if (standard === 'IEC') {
      if (iecCurve === 'NI') return 'IEC Normal Inverse';
      if (iecCurve === 'VI') return 'IEC Very Inverse';
      return 'IEC Extremely Inverse';
    } else {
      if (ieeeCurve === 'MI') return 'IEEE Moderately Inverse';
      if (ieeeCurve === 'VI') return 'IEEE Very Inverse';
      return 'IEEE Extremely Inverse';
    }
  }, [standard, iecCurve, ieeeCurve]);

  return {
    faultCurrent,
    setFaultCurrent,
    ctPrimary,
    setCtPrimary,
    ctSecondary,
    setCtSecondary,
    plugSetting,
    setPlugSetting,
    tms,
    setTms,
    standard,
    setStandard,
    iecCurve,
    setIecCurve,
    ieeeCurve,
    setIeeeCurve,
    settingCurrent,
    psm,
    operatingTime,
    tccData,
    activeCurveLabel
  };
}
