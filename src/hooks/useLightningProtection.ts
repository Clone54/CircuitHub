import { useMemo } from 'react';

export interface LightningInputs {
  buildingHeight: number; // H_b in meters
  mastHeight: number; // h_mast in meters (above roof)
  buildingWidth: number; // structure width for 2D visualization (meters)
  protectionLevel: 'Class I' | 'Class II' | 'Class III' | 'Class IV';
  method: 'rolling-sphere' | 'protective-angle';
}

export interface ChartPoint {
  x: number;
  protectionY: number;
  buildingY: number;
}

export interface LightningResults {
  totalHeight: number; // h = H_b + h_mast
  rollingSphereRadius: number; // R in meters
  protectiveAngle: number; // alpha in degrees
  protectionRadiusGround: number; // r_g in meters
  protectionRadiusRoof: number; // r_r in meters
  chartData: ChartPoint[];
  isFullyProtected: boolean;
}

export function useLightningProtection(inputs: LightningInputs): LightningResults {
  return useMemo(() => {
    const { buildingHeight, mastHeight, buildingWidth, protectionLevel, method } = inputs;
    const totalHeight = buildingHeight + mastHeight;

    // 1. Define Rolling Sphere Radius 'R' based on IEC 62305/NFPA 780
    let rollingSphereRadius = 20; // Default Class I
    if (protectionLevel === 'Class II') rollingSphereRadius = 30;
    else if (protectionLevel === 'Class III') rollingSphereRadius = 45;
    else if (protectionLevel === 'Class IV') rollingSphereRadius = 60;

    // 2. Define Protective Angle 'alpha' based on IEC 62305 curves
    // Interpolated values matching standard charts
    let protectiveAngle = 45; // default fallback
    const h = totalHeight;

    if (protectionLevel === 'Class I') {
      if (h <= 2) protectiveAngle = 70;
      else if (h >= 20) protectiveAngle = 25;
      else protectiveAngle = 70 - ((h - 2) / 18) * (70 - 25);
    } else if (protectionLevel === 'Class II') {
      if (h <= 2) protectiveAngle = 72;
      else if (h >= 20) protectiveAngle = 35;
      else protectiveAngle = 72 - ((h - 2) / 18) * (72 - 35);
    } else if (protectionLevel === 'Class III') {
      if (h <= 2) protectiveAngle = 76;
      else if (h >= 20) protectiveAngle = 45;
      else protectiveAngle = 76 - ((h - 2) / 18) * (76 - 45);
    } else { // Class IV
      if (h <= 2) protectiveAngle = 80;
      else if (h >= 20) protectiveAngle = 55;
      else protectiveAngle = 80 - ((h - 2) / 18) * (80 - 55);
    }
    protectiveAngle = Math.round(protectiveAngle * 10) / 10;

    // 3. Compute Protection Radii
    let protectionRadiusGround = 0;
    let protectionRadiusRoof = 0;

    const R = rollingSphereRadius;
    const alphaRad = (protectiveAngle * Math.PI) / 180;

    if (method === 'rolling-sphere') {
      // Ground protection radius: r_g = sqrt(h * (2R - h)) if h <= R, else R
      if (totalHeight <= R) {
        protectionRadiusGround = Math.sqrt(totalHeight * (2 * R - totalHeight));
      } else {
        protectionRadiusGround = R;
      }

      // Roof protection radius: r_r = sqrt(h_mast * (2R - h_mast)) if h_mast <= R, else R
      if (mastHeight <= R) {
        protectionRadiusRoof = Math.sqrt(mastHeight * (2 * R - mastHeight));
      } else {
        protectionRadiusRoof = R;
      }
    } else {
      // Protective Angle Method
      protectionRadiusGround = totalHeight * Math.tan(alphaRad);
      protectionRadiusRoof = mastHeight * Math.tan(alphaRad);
    }

    protectionRadiusGround = Math.round(protectionRadiusGround * 100) / 100;
    protectionRadiusRoof = Math.round(protectionRadiusRoof * 100) / 100;

    // 4. Generate Plotting Coordinates for a 2D side-view of the building and protective zone
    // Let x span from -maxRadius to +maxRadius
    const maxRadius = Math.max(buildingWidth * 1.5, protectionRadiusGround * 1.2);
    const steps = 60;
    const chartData: ChartPoint[] = [];

    // Building layout: symmetric about center (x = 0)
    // Building width is buildingWidth, roof is at buildingHeight.
    const halfBWidth = buildingWidth / 2;

    for (let i = 0; i <= steps; i++) {
      // x values from -maxRadius to maxRadius
      const x = -maxRadius + (2 * maxRadius * i) / steps;
      const absX = Math.abs(x);

      // Building profile height at coordinate x
      let buildingY = 0;
      if (absX <= halfBWidth) {
        buildingY = buildingHeight;
      }
      
      // Let's also add the mast in the building profile at x = 0
      if (Math.abs(x) < maxRadius / steps) {
        buildingY = totalHeight;
      }

      // Protection boundary calculation
      let protectionY = 0;
      if (method === 'rolling-sphere') {
        // Rolling sphere centers at (+-xc, R) where xc = sqrt(h*(2R-h))
        if (totalHeight <= R) {
          const xc = Math.sqrt(totalHeight * (2 * R - totalHeight));
          if (absX <= xc) {
            // y = R - sqrt(R^2 - (absX - xc)^2)
            protectionY = R - Math.sqrt(Math.max(0, R * R - (absX - xc) * (absX - xc)));
          }
        } else {
          // If building exceeds sphere radius, side-strike zones apply.
          // The protection curve is an arc of radius R starting from (0, h) to (R, h-R)
          if (absX <= R) {
            protectionY = totalHeight - R + Math.sqrt(Math.max(0, R * R - absX * absX));
          }
        }
      } else {
        // Protective angle method: linear cone line
        if (absX <= protectionRadiusGround) {
          protectionY = totalHeight * (1 - absX / protectionRadiusGround);
        }
      }

      chartData.push({
        x: Math.round(x * 10) / 10,
        protectionY: Math.round(Math.max(0, protectionY) * 10) / 10,
        buildingY: Math.round(buildingY * 10) / 10,
      });
    }

    // A structure is fully protected if at any building coordinate x (from -halfBWidth to +halfBWidth),
    // the protection height is greater than or equal to the building roof height.
    let isFullyProtected = true;
    for (let i = 0; i < chartData.length; i++) {
      const pt = chartData[i];
      if (Math.abs(pt.x) <= halfBWidth) {
        // exclude center mast point where pt.buildingY is totalHeight
        if (Math.abs(pt.x) > 0.5 && pt.protectionY < buildingHeight) {
          isFullyProtected = false;
          break;
        }
      }
    }

    return {
      totalHeight,
      rollingSphereRadius,
      protectiveAngle,
      protectionRadiusGround,
      protectionRadiusRoof,
      chartData,
      isFullyProtected,
    };
  }, [
    inputs.buildingHeight,
    inputs.mastHeight,
    inputs.buildingWidth,
    inputs.protectionLevel,
    inputs.method,
  ]);
}
