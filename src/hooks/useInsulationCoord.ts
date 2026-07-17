import { useMemo, useState } from 'react';

export interface VtCurvePoint {
  timeUs: number;
  equipmentWithstandKv: number;
  arresterProtectionKv: number;
  marginKv: number;
}

export interface UseInsulationCoordParams {
  initialBil?: number; // kV
  initialArresterLevel?: number; // kV
  initialSurgeVoltage?: number; // kV
}

export function useInsulationCoord({
  initialBil = 550.0,
  initialArresterLevel = 390.0,
  initialSurgeVoltage = 750.0
}: UseInsulationCoordParams = {}) {
  const [bil, setBil] = useState<number>(initialBil);
  const [arresterLevel, setArresterLevel] = useState<number>(initialArresterLevel);
  const [surgeVoltage, setSurgeVoltage] = useState<number>(initialSurgeVoltage);

  const coordinationResult = useMemo(() => {
    // 1. Calculate Protective Margin
    // PM (%) = ((BIL - Arrester_Level) / Arrester_Level) * 100
    let protectiveMargin = 0;
    if (arresterLevel > 0) {
      protectiveMargin = ((bil - arresterLevel) / arresterLevel) * 100;
    }

    const isMarginLow = protectiveMargin < 20.0;

    // 2. Determine if equipment survives with arrester in place
    // Arrester clamps the voltage to its protective level.
    // If the clamped level is lower than the equipment's withstand capability, the equipment survives.
    const isEquipmentSafe = bil > arresterLevel;

    // 3. Generate Volt-Time (V-t) characteristics points for plotting
    // Typical insulation withstand curve decays exponentially with time (dielectric strength is higher for short impulses)
    // Formula: V_equip(t) = BIL * (1.0 + 0.30 * exp(-t / 2.0))
    // Arrester protective curve also droops slightly but stays lower
    // Formula: V_arrest(t) = Arrester_Level * (1.0 + 0.12 * exp(-t / 1.5))
    const points: VtCurvePoint[] = [];
    const steps = 40;
    const maxTime = 10.0; // microseconds

    for (let i = 0; i <= steps; i++) {
      // Sweep time from 0.2 us to 10.0 us
      const t = 0.2 + (i / steps) * (maxTime - 0.2);
      
      const vEquip = bil * (1.0 + 0.35 * Math.exp(-t / 2.0));
      const vArrest = arresterLevel * (1.0 + 0.15 * Math.exp(-t / 1.5));
      const diff = vEquip - vArrest;

      points.push({
        timeUs: parseFloat(t.toFixed(2)),
        equipmentWithstandKv: parseFloat(vEquip.toFixed(1)),
        arresterProtectionKv: parseFloat(vArrest.toFixed(1)),
        marginKv: parseFloat(Math.max(0, diff).toFixed(1))
      });
    }

    return {
      protectiveMargin: parseFloat(protectiveMargin.toFixed(1)),
      isMarginLow,
      isEquipmentSafe,
      points
    };
  }, [bil, arresterLevel, surgeVoltage]);

  return {
    bil,
    setBil,
    arresterLevel,
    setArresterLevel,
    surgeVoltage,
    setSurgeVoltage,
    coordinationResult
  };
}
