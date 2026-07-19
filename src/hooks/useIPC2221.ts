import { useState, useMemo } from 'react';

export interface IPCInputs {
  current: number; // Amps
  thickness: number; // oz/ft^2
  deltaT: number; // °C
}

export function useIPC2221(initialInputs: IPCInputs) {
  const [inputs, setInputs] = useState(initialInputs);

  const outputs = useMemo(() => {
    const { current, thickness, deltaT } = inputs;
    
    // Area = (Current / (k * DeltaT^b))^(1/c)
    // Width = Area / (Thickness * 1.378)
    
    let areaOuter = 0;
    let widthOuter = 0;
    let areaInner = 0;
    let widthInner = 0;

    if (current > 0 && thickness > 0 && deltaT > 0) {
      // Outer layer (k=0.048, b=0.44, c=0.725)
      areaOuter = Math.pow(current / (0.048 * Math.pow(deltaT, 0.44)), 1 / 0.725);
      widthOuter = areaOuter / (thickness * 1.378);

      // Inner layer (k=0.024, b=0.44, c=0.725)
      areaInner = Math.pow(current / (0.024 * Math.pow(deltaT, 0.44)), 1 / 0.725);
      widthInner = areaInner / (thickness * 1.378);
    }

    return { widthOuter, widthInner };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
