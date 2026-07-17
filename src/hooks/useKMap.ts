import { useState, useMemo } from 'react';

export interface KMapInputs {
  variables: 2 | 3 | 4;
  minterms: string;
  dontcares: string;
}

export interface KMapOutputs {
  grid: (number | 'X')[][];
  minimizedExpression: string;
  error?: string;
}

export function useKMap(initialInputs: KMapInputs) {
  const [inputs, setInputs] = useState<KMapInputs>(initialInputs);

  const outputs = useMemo<KMapOutputs>(() => {
    const { variables, minterms, dontcares } = inputs;
    
    // Parse input strings
    const parseList = (str: string) => str.split(',').map(s => s.trim()).filter(s => s !== '').map(Number).filter(n => !isNaN(n) && n >= 0 && n < Math.pow(2, variables));
    
    const m = parseList(minterms);
    const d = parseList(dontcares);
    
    // Check for overlap
    const overlap = m.find(x => d.includes(x));
    if (overlap !== undefined) {
      return { grid: [], minimizedExpression: '', error: `Term ${overlap} cannot be both minterm and don't care.` };
    }

    // Generate K-Map grid
    // Gray code ordering
    let rowGray = [0, 1];
    let colGray = [0, 1];
    
    if (variables === 3) {
      rowGray = [0, 1];
      colGray = [0, 1, 3, 2];
    } else if (variables === 4) {
      rowGray = [0, 1, 3, 2];
      colGray = [0, 1, 3, 2];
    }

    const grid: (number | 'X')[][] = [];
    for (let r = 0; r < rowGray.length; r++) {
      const row: (number | 'X')[] = [];
      for (let c = 0; c < colGray.length; c++) {
        let cellIndex = 0;
        if (variables === 2) {
          cellIndex = (rowGray[r] << 1) | colGray[c];
        } else if (variables === 3) {
          cellIndex = (rowGray[r] << 2) | colGray[c];
        } else {
          cellIndex = (rowGray[r] << 2) | colGray[c];
        }
        
        if (m.includes(cellIndex)) row.push(1);
        else if (d.includes(cellIndex)) row.push('X');
        else row.push(0);
      }
      grid.push(row);
    }

    // Basic QMC minimizer
    function toBin(num: number, bits: number) {
      return num.toString(2).padStart(bits, '0');
    }

    let implicants = new Set<string>();
    [...m, ...d].forEach(num => implicants.add(toBin(num, variables)));

    let primeImplicants = new Set<string>();
    
    while (implicants.size > 0) {
      let nextImplicants = new Set<string>();
      let combined = new Set<string>();
      
      const impList = Array.from(implicants);
      for (let i = 0; i < impList.length; i++) {
        for (let j = i + 1; j < impList.length; j++) {
          let diffCount = 0;
          let diffIdx = -1;
          for (let k = 0; k < variables; k++) {
            if (impList[i][k] !== impList[j][k]) {
              diffCount++;
              diffIdx = k;
            }
          }
          if (diffCount === 1) {
            const combinedStr = impList[i].substring(0, diffIdx) + '-' + impList[i].substring(diffIdx + 1);
            nextImplicants.add(combinedStr);
            combined.add(impList[i]);
            combined.add(impList[j]);
          }
        }
      }
      
      impList.forEach(imp => {
        if (!combined.has(imp)) {
          primeImplicants.add(imp);
        }
      });
      
      implicants = nextImplicants;
    }

    // We have prime implicants. Now select minimum cover for minterms
    let remainingMinterms = new Set(m.map(num => toBin(num, variables)));
    let selectedPrimes: string[] = [];
    
    // Find essential prime implicants first
    const piList = Array.from(primeImplicants);
    let madeProgress = true;
    while (madeProgress && remainingMinterms.size > 0) {
      madeProgress = false;
      for (let minterm of remainingMinterms) {
        const coveringPIs = piList.filter(pi => {
          for (let k = 0; k < variables; k++) {
            if (pi[k] !== '-' && pi[k] !== minterm[k]) return false;
          }
          return true;
        });
        
        if (coveringPIs.length === 1) {
          // Essential PI
          const epi = coveringPIs[0];
          if (!selectedPrimes.includes(epi)) {
            selectedPrimes.push(epi);
            // Remove covered minterms
            const toRemove = [];
            for (let mt of remainingMinterms) {
               let covers = true;
               for (let k = 0; k < variables; k++) {
                 if (epi[k] !== '-' && epi[k] !== mt[k]) { covers = false; break; }
               }
               if (covers) toRemove.push(mt);
            }
            toRemove.forEach(mt => remainingMinterms.delete(mt));
            madeProgress = true;
          }
        }
      }
    }
    
    // Greedy cover for the rest
    while (remainingMinterms.size > 0) {
      let bestPI = '';
      let bestCoverCount = -1;
      
      for (let pi of piList) {
        if (selectedPrimes.includes(pi)) continue;
        let coverCount = 0;
        for (let mt of remainingMinterms) {
           let covers = true;
           for (let k = 0; k < variables; k++) {
             if (pi[k] !== '-' && pi[k] !== mt[k]) { covers = false; break; }
           }
           if (covers) coverCount++;
        }
        if (coverCount > bestCoverCount) {
          bestCoverCount = coverCount;
          bestPI = pi;
        }
      }
      
      if (bestCoverCount > 0 && bestPI !== '') {
        selectedPrimes.push(bestPI);
        const toRemove = [];
        for (let mt of remainingMinterms) {
           let covers = true;
           for (let k = 0; k < variables; k++) {
             if (bestPI[k] !== '-' && bestPI[k] !== mt[k]) { covers = false; break; }
           }
           if (covers) toRemove.push(mt);
        }
        toRemove.forEach(mt => remainingMinterms.delete(mt));
      } else {
        break; 
      }
    }

    if (m.length === 0) {
      return { grid, minimizedExpression: '0' };
    }
    if (selectedPrimes.length === 0) {
      return { grid, minimizedExpression: '1' };
    }
    
    const varsName = ['A', 'B', 'C', 'D'];
    const terms = selectedPrimes.map(pi => {
      if (pi === '-'.repeat(variables)) return '1';
      let term = '';
      for (let i = 0; i < variables; i++) {
        if (pi[i] === '1') term += varsName[i];
        else if (pi[i] === '0') term += varsName[i] + "'";
      }
      return term;
    });

    const minimizedExpression = terms.join(' + ');

    return { grid, minimizedExpression };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
