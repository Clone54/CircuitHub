import { useState, useMemo } from 'react';

export function useCoding() {
  const [dataWord, setDataWord] = useState<string>("1011");
  // Default (7,4) Hamming code Generator Matrix
  const [G, setG] = useState<number[][]>([
    [1, 0, 0, 0, 1, 1, 0],
    [0, 1, 0, 0, 1, 0, 1],
    [0, 0, 1, 0, 0, 1, 1],
    [0, 0, 0, 1, 1, 1, 1]
  ]);
  const [errorIndex, setErrorIndex] = useState<number>(-1);

  const results = useMemo(() => {
    const k = G.length;
    const n = G[0].length;
    
    // Parse data
    const d = dataWord.padEnd(k, '0').slice(0, k).split('').map(x => parseInt(x, 10) || 0);
    
    // Generate Codeword: c = d * G
    let codeword = Array(n).fill(0);
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let i = 0; i < k; i++) {
        sum += d[i] * G[i][j];
      }
      codeword[j] = sum % 2;
    }
    
    // Inject Error
    const rx = [...codeword];
    if (errorIndex >= 0 && errorIndex < n) {
      rx[errorIndex] = rx[errorIndex] === 0 ? 1 : 0;
    }
    
    // Find systematic H matrix (assumes G is [I_k | P])
    // H = [P^T | I_(n-k)]
    const pRows = k;
    const pCols = n - k;
    const P = G.map(row => row.slice(k)); // k x (n-k)
    
    const H: number[][] = [];
    for (let i = 0; i < pCols; i++) {
      const row = [];
      // P^T part
      for (let j = 0; j < pRows; j++) {
        row.push(P[j][i]);
      }
      // I_(n-k) part
      for (let j = 0; j < pCols; j++) {
        row.push(i === j ? 1 : 0);
      }
      H.push(row);
    }
    
    // Calculate Syndrome: s = rx * H^T
    // rx is 1 x n. H^T is n x (n-k).
    // Syndrome is 1 x (n-k). Same as H * rx^T
    const syndrome = Array(pCols).fill(0);
    for (let i = 0; i < pCols; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        sum += H[i][j] * rx[j];
      }
      syndrome[i] = sum % 2;
    }
    
    // Error correction matching syndrome to H columns
    let syndromeStr = syndrome.join('');
    let detectedErrorIndex = -1;
    let isError = syndromeStr.includes('1');
    
    if (isError) {
      for (let col = 0; col < n; col++) {
        let match = true;
        for (let row = 0; row < pCols; row++) {
          if (H[row][col] !== syndrome[row]) {
            match = false;
            break;
          }
        }
        if (match) {
          detectedErrorIndex = col;
          break;
        }
      }
    }
    
    const correctedRx = [...rx];
    if (detectedErrorIndex !== -1) {
      correctedRx[detectedErrorIndex] = correctedRx[detectedErrorIndex] === 0 ? 1 : 0;
    }

    return { k, n, d, codeword, rx, H, syndrome, syndromeStr, detectedErrorIndex, correctedRx, isError };
  }, [dataWord, G, errorIndex]);

  return {
    dataWord, setDataWord,
    G, setG,
    errorIndex, setErrorIndex,
    results
  };
}
