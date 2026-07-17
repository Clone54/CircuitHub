import { useState, useMemo } from 'react';

export type CombiningTechnique = 'SC' | 'MRC' | 'EGC';

export interface Branch {
  id: number;
  gain: number; // linear amplitude gain (h)
  noise: number; // noise power variance (N)
}

export function useDiversity() {
  const [technique, setTechnique] = useState<CombiningTechnique>('MRC');
  const [branches, setBranches] = useState<Branch[]>([
    { id: 1, gain: 0.8, noise: 0.1 },
    { id: 2, gain: 0.4, noise: 0.1 },
    { id: 3, gain: 0.6, noise: 0.2 },
  ]);
  
  const [hChannelStr, setHChannelStr] = useState("0.8, -0.4, 0.2");

  const results = useMemo(() => {
    // Transmit power P = 1 for simplicity
    const branchSnrs = branches.map(b => (b.gain * b.gain) / b.noise);
    
    let snrOut = 0;
    
    if (technique === 'SC') {
      snrOut = Math.max(...branchSnrs);
    } else if (technique === 'MRC') {
      snrOut = branchSnrs.reduce((sum, snr) => sum + snr, 0);
    } else if (technique === 'EGC') {
      const sumH = branches.reduce((sum, b) => sum + b.gain, 0);
      const sumN = branches.reduce((sum, b) => sum + b.noise, 0);
      snrOut = (sumH * sumH) / sumN;
    }

    const plotData = branches.map((b, i) => ({
      name: `Branch ${i+1}`,
      snrDb: 10 * Math.log10(branchSnrs[i] > 0 ? branchSnrs[i] : 1e-10)
    }));
    
    plotData.push({
      name: 'Combined',
      snrDb: 10 * Math.log10(snrOut > 0 ? snrOut : 1e-10)
    });
    
    // Simple Zero Forcing calculation (inverse of H(z))
    // H(z) = h0 + h1 z^-1 + h2 z^-2 ...
    // E(z) = 1 / H(z). We can find this by polynomial long division (impulse response of 1/H)
    let eCoeffs: number[] = [];
    try {
        const hVals = hChannelStr.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
        if (hVals.length > 0 && hVals[0] !== 0) {
            eCoeffs = [1 / hVals[0]]; // E[0]
            // Calculate up to 5 taps
            for (let k = 1; k < 5; k++) {
                let sum = 0;
                for (let i = 1; i <= k; i++) {
                    if (i < hVals.length) {
                        sum += hVals[i] * (eCoeffs[k - i] || 0);
                    }
                }
                eCoeffs.push(-sum / hVals[0]);
            }
        }
    } catch(e) {
        // ignore
    }

    return { branchSnrs, snrOut, plotData, eCoeffs };
  }, [branches, technique, hChannelStr]);

  return {
    technique, setTechnique,
    branches, setBranches,
    hChannelStr, setHChannelStr,
    results
  };
}
