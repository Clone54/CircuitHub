import { useState, useMemo } from 'react';

export function useStability() {
  const [Pm, setPm] = useState(1.0);
  const [PeMax, setPeMax] = useState(2.0); // pre-fault
  const [PeMaxFault, setPeMaxFault] = useState(0.5); // during fault
  const [PeMaxPost, setPeMaxPost] = useState(1.5); // post fault
  const [deltaC, setDeltaC] = useState(60); // degrees
  
  const results = useMemo(() => {
    const d0 = Math.asin(Pm / PeMax); // radians
    const dc = deltaC * Math.PI / 180;
    const dMax = Math.PI - Math.asin(Pm / PeMaxPost);
    
    // A1: integral from d0 to dc of (Pm - PeMaxFault*sin(d)) dd
    // = Pm(dc - d0) + PeMaxFault(cos(dc) - cos(d0))
    const A1 = Pm * (dc - d0) + PeMaxFault * (Math.cos(dc) - Math.cos(d0));
    
    // A2: integral from dc to dMax of (PeMaxPost*sin(d) - Pm) dd
    // = PeMaxPost(cos(dc) - cos(dMax)) - Pm(dMax - dc)
    const A2 = PeMaxPost * (Math.cos(dc) - Math.cos(dMax)) - Pm * (dMax - dc);
    
    const isStable = A1 <= A2;
    
    // Calculate Critical Clearing Angle
    // cos(dcr) = (Pm(dMax - d0) - PeMaxPost*cos(dMax) + PeMaxFault*cos(d0)) / (PeMaxPost - PeMaxFault)
    const cosDcr = (Pm * (dMax - d0) - PeMaxPost * Math.cos(dMax) + PeMaxFault * Math.cos(d0)) / (PeMaxPost - PeMaxFault);
    let dcr = NaN;
    if (cosDcr >= -1 && cosDcr <= 1) {
      dcr = Math.acos(cosDcr) * 180 / Math.PI;
    }
    
    // Generate Plot Data
    const plotData = [];
    for (let d = 0; d <= 180; d += 2) {
      const rad = d * Math.PI / 180;
      const pre = PeMax * Math.sin(rad);
      const during = PeMaxFault * Math.sin(rad);
      const post = PeMaxPost * Math.sin(rad);
      plotData.push({ delta: d, pre, during, post, Pm });
    }
    
    return {
      d0: d0 * 180 / Math.PI,
      dMax: dMax * 180 / Math.PI,
      A1, A2, isStable, dcr, plotData
    };
  }, [Pm, PeMax, PeMaxFault, PeMaxPost, deltaC]);

  return {
    Pm, setPm,
    PeMax, setPeMax,
    PeMaxFault, setPeMaxFault,
    PeMaxPost, setPeMaxPost,
    deltaC, setDeltaC,
    results
  };
}
