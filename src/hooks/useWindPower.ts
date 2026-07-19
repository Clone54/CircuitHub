import { useMemo } from 'react';

export interface WindPoint {
  speed: number;
  uncontrolledPower: number; // Theoretical power without pitch control limits
  actualPower: number;       // Power with cut-in, rated pitch control, and cut-out braking
  betzLimit: number;         // Absolute limit of power (Cp = 0.593)
}

export function useWindPower(
  bladeRadius: number,
  airDensity: number,
  powerCoefficient: number,
  cutInSpeed: number = 3.0,
  ratedSpeed: number = 12.0,
  cutOutSpeed: number = 20.0
) {
  const data = useMemo(() => {
    const A = Math.PI * Math.pow(bladeRadius, 2); // Swept area in m^2
    const points: WindPoint[] = [];

    // Rated Power is the actual power at rated speed
    const ratedPowerVal = 0.5 * airDensity * A * Math.pow(ratedSpeed, 3) * powerCoefficient;

    // Generate wind speeds from 0 to 25 m/s in steps of 0.5
    for (let speed = 0; speed <= 25; speed += 0.5) {
      // 1. Theoretical Power (uncontrolled, purely aerodynamic)
      const uncontrolledPower = 0.5 * airDensity * A * Math.pow(speed, 3) * powerCoefficient;

      // 2. Betz Limit Power (Cp = 0.593, theoretical upper boundary)
      const betzLimit = 0.5 * airDensity * A * Math.pow(speed, 3) * 0.593;

      // 3. Actual Power with turbine operational zones (Pitch and Brake control)
      let actualPower = 0;
      if (speed < cutInSpeed) {
        // Below cut-in speed: blades spinning but generator not engaged
        actualPower = 0;
      } else if (speed >= cutInSpeed && speed < ratedSpeed) {
        // Normal operating zone (MPPT tracking of wind power)
        actualPower = uncontrolledPower;
      } else if (speed >= ratedSpeed && speed <= cutOutSpeed) {
        // Pitch Control: Blade pitch is active, spilling excess aerodynamic energy
        // to maintain exactly the rated power.
        actualPower = ratedPowerVal;
      } else {
        // Cut-out speed exceeded: mechanical brakes engage, power drops to zero for survival
        actualPower = 0;
      }

      points.push({
        speed: parseFloat(speed.toFixed(1)),
        uncontrolledPower: parseFloat((uncontrolledPower / 1000).toFixed(2)), // in kW
        actualPower: parseFloat((actualPower / 1000).toFixed(2)),             // in kW
        betzLimit: parseFloat((betzLimit / 1000).toFixed(2))                 // in kW
      });
    }

    // Convert values
    const sweptArea = parseFloat(A.toFixed(1));
    const ratedPowerKW = parseFloat((ratedPowerVal / 1000).toFixed(1));
    
    // Efficiency relative to Betz limit
    const betzEfficiency = powerCoefficient / 0.593 * 100;

    return {
      points,
      sweptArea,
      ratedPowerKW,
      betzEfficiency: parseFloat(betzEfficiency.toFixed(1))
    };
  }, [bladeRadius, airDensity, powerCoefficient, cutInSpeed, ratedSpeed, cutOutSpeed]);

  return data;
}
