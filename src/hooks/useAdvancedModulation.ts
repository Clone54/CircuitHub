import { useState, useMemo } from 'react';

export type ModScheme = 'QPSK' | '8-PSK' | '16-QAM' | '64-QAM';

export function useAdvancedModulation() {
  const [scheme, setScheme] = useState<ModScheme>('16-QAM');
  const [snrDb, setSnrDb] = useState<number>(15);

  const results = useMemo(() => {
    const snrLinear = Math.pow(10, snrDb / 10);
    const noiseStd = 1 / Math.sqrt(2 * snrLinear);

    const idealPoints: { i: number; q: number }[] = [];
    let numSymbols = 0;

    if (scheme === 'QPSK') {
      idealPoints.push(
        { i: 1, q: 1 }, { i: -1, q: 1 },
        { i: -1, q: -1 }, { i: 1, q: -1 }
      );
      numSymbols = 1000;
    } else if (scheme === '8-PSK') {
      for (let k = 0; k < 8; k++) {
        const angle = k * Math.PI / 4;
        idealPoints.push({ i: Math.cos(angle), q: Math.sin(angle) });
      }
      numSymbols = 1000;
    } else if (scheme === '16-QAM') {
      for (let i = -3; i <= 3; i += 2) {
        for (let q = -3; q <= 3; q += 2) {
          idealPoints.push({ i, q });
        }
      }
      // Normalize energy
      const eAvg = 10; // (2 * (1^2 + 3^2)) / 4 or similar, average power = 10
      idealPoints.forEach(p => {
        p.i /= Math.sqrt(eAvg);
        p.q /= Math.sqrt(eAvg);
      });
      numSymbols = 2000;
    } else if (scheme === '64-QAM') {
      for (let i = -7; i <= 7; i += 2) {
        for (let q = -7; q <= 7; q += 2) {
          idealPoints.push({ i, q });
        }
      }
      const eAvg = 42;
      idealPoints.forEach(p => {
        p.i /= Math.sqrt(eAvg);
        p.q /= Math.sqrt(eAvg);
      });
      numSymbols = 4000;
    }

    const noisyPoints: { i: number; q: number }[] = [];
    
    // Box-Muller transform for Gaussian noise
    const gaussianRand = () => {
      let u = 0, v = 0;
      while(u === 0) u = Math.random();
      while(v === 0) v = Math.random();
      return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    };

    for (let k = 0; k < numSymbols; k++) {
      const ideal = idealPoints[Math.floor(Math.random() * idealPoints.length)];
      const noiseI = gaussianRand() * noiseStd;
      const noiseQ = gaussianRand() * noiseStd;
      noisyPoints.push({
        i: ideal.i + noiseI,
        q: ideal.q + noiseQ
      });
    }

    return { idealPoints, noisyPoints };
  }, [scheme, snrDb]);

  return { scheme, setScheme, snrDb, setSnrDb, results };
}
