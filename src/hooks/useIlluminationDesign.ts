import { useMemo } from 'react';

export interface IlluminationInputs {
  length: number;
  width: number;
  mountingHeight: number;
  targetLux: number;
  lampLumens: number;
  utilFactor: number;
  maintFactor: number;
}

export interface IlluminationResults {
  area: number;
  totalLumens: number;
  rawLamps: number;
  numLamps: number;
  rows: number;
  cols: number;
  finalLamps: number;
  colSpacing: number;
  rowSpacing: number;
  actualLux: number;
  spaceRatio: number;
}

export function useIlluminationDesign(inputs: IlluminationInputs): IlluminationResults {
  return useMemo(() => {
    const { length, width, targetLux, lampLumens, utilFactor, maintFactor } = inputs;
    
    const area = length * width;
    
    // Total Lumens = (E * A) / (UF * MF)
    const totalLumens = (targetLux * area) / (utilFactor * maintFactor);
    const rawLamps = totalLumens / lampLumens;
    const numLamps = Math.max(1, Math.ceil(rawLamps));

    // Determine rows x columns layout matching the aspect ratio of the room
    const roomRatio = length / width;
    
    // rows * cols ≈ numLamps
    // cols / rows ≈ roomRatio => cols = rows * roomRatio => rows^2 * roomRatio ≈ numLamps
    let rows = Math.max(1, Math.round(Math.sqrt(numLamps / roomRatio)));
    let cols = Math.max(1, Math.ceil(numLamps / rows));
    
    // Adjust layout to guarantee it meets or exceeds the required number of lamps
    while (cols * rows < numLamps) {
      if (cols / rows < roomRatio) {
        cols++;
      } else {
        rows++;
      }
    }
    
    const finalLamps = cols * rows;
    
    // Spacing between fixtures
    const colSpacing = length / cols;
    const rowSpacing = width / rows;
    
    // Actual achieved lux
    const actualLux = (finalLamps * lampLumens * utilFactor * maintFactor) / area;
    
    // Spacing to mounting height ratio (should ideally be <= 1.5 for uniform illumination)
    const maxSpacing = Math.max(colSpacing, rowSpacing);
    const spaceRatio = maxSpacing / inputs.mountingHeight;

    return {
      area: Math.round(area * 100) / 100,
      totalLumens: Math.round(totalLumens),
      rawLamps: Math.round(rawLamps * 100) / 100,
      numLamps,
      rows,
      cols,
      finalLamps,
      colSpacing: Math.round(colSpacing * 100) / 100,
      rowSpacing: Math.round(rowSpacing * 100) / 100,
      actualLux: Math.round(actualLux),
      spaceRatio: Math.round(spaceRatio * 100) / 100
    };
  }, [
    inputs.length,
    inputs.width,
    inputs.mountingHeight,
    inputs.targetLux,
    inputs.lampLumens,
    inputs.utilFactor,
    inputs.maintFactor
  ]);
}
