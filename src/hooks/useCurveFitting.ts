import { useState, useMemo } from 'react';
import * as math from 'mathjs';

export interface DataPoint {
  x: number;
  y: number;
}

export interface CurveFittingInputs {
  dataText: string;
  model: 'linear' | 'quadratic' | 'exponential';
}

export function useCurveFitting(initialInputs: CurveFittingInputs) {
  const [inputs, setInputs] = useState<CurveFittingInputs>(initialInputs);

  const outputs = useMemo(() => {
    let plotData: { x: number, yRaw?: number, yFit?: number }[] = [];
    let equationStr = '';
    let rSquared = 0;
    let errorStr = '';

    try {
      const lines = inputs.dataText.trim().split(/\r?\n/);
      const data: DataPoint[] = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.trim().split(/[\s,]+/);
        if (parts.length >= 2) {
          const x = parseFloat(parts[0]);
          const y = parseFloat(parts[1]);
          if (!isNaN(x) && !isNaN(y)) {
            data.push({ x, y });
          }
        }
      }

      if (data.length < 2) throw new Error("At least 2 valid data points required.");
      if (inputs.model === 'quadratic' && data.length < 3) throw new Error("At least 3 valid data points required for quadratic.");

      const n = data.length;
      let minX = data[0].x, maxX = data[0].x;
      data.forEach(d => {
        if (d.x < minX) minX = d.x;
        if (d.x > maxX) maxX = d.x;
      });

      let fFit: (x: number) => number;

      if (inputs.model === 'linear') {
        // y = mx + c
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        data.forEach(d => {
          sumX += d.x;
          sumY += d.y;
          sumXY += d.x * d.y;
          sumX2 += d.x * d.x;
        });
        const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const c = (sumY - m * sumX) / n;
        fFit = (x) => m * x + c;
        equationStr = `y = ${m.toFixed(4)}x ${c >= 0 ? '+' : ''} ${c.toFixed(4)}`;
      } 
      else if (inputs.model === 'quadratic') {
        // y = ax^2 + bx + c
        let sumX = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0;
        let sumY = 0, sumXY = 0, sumX2Y = 0;
        data.forEach(d => {
          const x = d.x, y = d.y, x2 = x*x;
          sumX += x; sumX2 += x2; sumX3 += x2*x; sumX4 += x2*x2;
          sumY += y; sumXY += x*y; sumX2Y += x2*y;
        });
        const Xmat = math.matrix([
          [sumX4, sumX3, sumX2],
          [sumX3, sumX2, sumX],
          [sumX2, sumX, n]
        ]);
        const Ymat = math.matrix([
          [sumX2Y],
          [sumXY],
          [sumY]
        ]);
        const invX = math.inv(Xmat);
        const res = math.multiply(invX, Ymat);
        const a = res.get([0, 0]);
        const b = res.get([1, 0]);
        const c = res.get([2, 0]);
        
        fFit = (x) => a * x * x + b * x + c;
        equationStr = `y = ${a.toFixed(4)}x² ${b >= 0 ? '+' : ''} ${b.toFixed(4)}x ${c >= 0 ? '+' : ''} ${c.toFixed(4)}`;
      }
      else if (inputs.model === 'exponential') {
        // y = a * e^(bx)  => ln(y) = ln(a) + bx
        let sumX = 0, sumLnY = 0, sumXLnY = 0, sumX2 = 0;
        let validDataCount = 0;
        data.forEach(d => {
          if (d.y > 0) {
            const lnY = Math.log(d.y);
            sumX += d.x;
            sumLnY += lnY;
            sumXLnY += d.x * lnY;
            sumX2 += d.x * d.x;
            validDataCount++;
          }
        });
        if (validDataCount < 2) throw new Error("Exponential requires at least 2 points with y > 0");
        const b = (validDataCount * sumXLnY - sumX * sumLnY) / (validDataCount * sumX2 - sumX * sumX);
        const lnA = (sumLnY - b * sumX) / validDataCount;
        const a = Math.exp(lnA);
        
        fFit = (x) => a * Math.exp(b * x);
        equationStr = `y = ${a.toFixed(4)} e^(${b.toFixed(4)}x)`;
      }

      // Calculate R^2
      let sumY = 0;
      data.forEach(d => sumY += d.y);
      const yMean = sumY / n;
      let ssTot = 0, ssRes = 0;
      data.forEach(d => {
        const y_est = fFit(d.x);
        ssTot += (d.y - yMean) ** 2;
        ssRes += (d.y - y_est) ** 2;
      });
      rSquared = 1 - (ssRes / ssTot);

      // Plot data
      const dataMap = new Map<number, number>();
      data.forEach(d => dataMap.set(d.x, d.y));

      const range = Math.max(maxX - minX, 1);
      const step = range / 100;
      const plotMin = minX - range * 0.1;
      const plotMax = maxX + range * 0.1;
      
      for (let x = plotMin; x <= plotMax; x += step) {
        plotData.push({ x, yFit: fFit(x) });
      }
      // Insert raw data points
      data.forEach(d => {
        plotData.push({ x: d.x, yRaw: d.y, yFit: fFit(d.x) });
      });
      
      plotData.sort((p1, p2) => p1.x - p2.x);

    } catch (e: any) {
      errorStr = e.message || 'Error parsing data or fitting model';
    }

    return { plotData, equationStr, rSquared, errorStr };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
