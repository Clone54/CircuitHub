import { useMemo, useState } from 'react';

export interface UseDistanceRelayParams {
  initialRLine?: number;
  initialXLine?: number;
  initialZone1Percent?: number;
  initialZone2Percent?: number;
  initialZone3Percent?: number;
  initialRFault?: number;
  initialXFault?: number;
}

export interface Coordinates {
  r: number;
  x: number;
}

export function useDistanceRelay({
  initialRLine = 6.0,
  initialXLine = 15.0,
  initialZone1Percent = 80,
  initialZone2Percent = 120,
  initialZone3Percent = 150,
  initialRFault = 4.0,
  initialXFault = 10.0
}: UseDistanceRelayParams = {}) {
  const [rLine, setRLine] = useState<number>(initialRLine);
  const [xLine, setXLine] = useState<number>(initialXLine);
  const [zone1Percent, setZone1Percent] = useState<number>(initialZone1Percent);
  const [zone2Percent, setZone2Percent] = useState<number>(initialZone2Percent);
  const [zone3Percent, setZone3Percent] = useState<number>(initialZone3Percent);
  const [rFault, setRFault] = useState<number>(initialRFault);
  const [xFault, setXFault] = useState<number>(initialXFault);

  // Line Impedance magnitude and angle
  const lineImpedanceMag = useMemo(() => {
    return Math.sqrt(rLine * rLine + xLine * xLine);
  }, [rLine, xLine]);

  const lineAngleDeg = useMemo(() => {
    return (Math.atan2(xLine, rLine) * 180) / Math.PI;
  }, [rLine, xLine]);

  // Reach values in Ohms (r, x coordinates)
  const zone1Reach = useMemo<Coordinates>(() => {
    const mult = zone1Percent / 100;
    return { r: rLine * mult, x: xLine * mult };
  }, [rLine, xLine, zone1Percent]);

  const zone2Reach = useMemo<Coordinates>(() => {
    const mult = zone2Percent / 100;
    return { r: rLine * mult, x: xLine * mult };
  }, [rLine, xLine, zone2Percent]);

  const zone3Reach = useMemo<Coordinates>(() => {
    const mult = zone3Percent / 100;
    return { r: rLine * mult, x: xLine * mult };
  }, [rLine, xLine, zone3Percent]);

  // Magnitudes of Zone Impedance Reach
  const z1Mag = useMemo(() => Math.sqrt(zone1Reach.r * zone1Reach.r + zone1Reach.x * zone1Reach.x), [zone1Reach]);
  const z2Mag = useMemo(() => Math.sqrt(zone2Reach.r * zone2Reach.r + zone2Reach.x * zone2Reach.x), [zone2Reach]);
  const z3Mag = useMemo(() => Math.sqrt(zone3Reach.r * zone3Reach.r + zone3Reach.x * zone3Reach.x), [zone3Reach]);

  // Center and Radii of Mho Circles
  // Since a self-polarized Mho circle passes through (0,0) and reach Z,
  // Center is Z/2, Radius is |Z|/2
  const zone1Center = useMemo<Coordinates>(() => ({ r: zone1Reach.r / 2, x: zone1Reach.x / 2 }), [zone1Reach]);
  const zone1Radius = useMemo(() => z1Mag / 2, [z1Mag]);

  const zone2Center = useMemo<Coordinates>(() => ({ r: zone2Reach.r / 2, x: zone2Reach.x / 2 }), [zone2Reach]);
  const zone2Radius = useMemo(() => z2Mag / 2, [z2Mag]);

  const zone3Center = useMemo<Coordinates>(() => ({ r: zone3Reach.r / 2, x: zone3Reach.x / 2 }), [zone3Reach]);
  const zone3Radius = useMemo(() => z3Mag / 2, [z3Mag]);

  // Determine if the fault point (rFault, xFault) falls within each Zone
  const isInsideZone1 = useMemo(() => {
    const distSq = Math.pow(rFault - zone1Center.r, 2) + Math.pow(xFault - zone1Center.x, 2);
    return distSq <= Math.pow(zone1Radius, 2);
  }, [rFault, xFault, zone1Center, zone1Radius]);

  const isInsideZone2 = useMemo(() => {
    const distSq = Math.pow(rFault - zone2Center.r, 2) + Math.pow(xFault - zone2Center.x, 2);
    return distSq <= Math.pow(zone2Radius, 2);
  }, [rFault, xFault, zone2Center, zone2Radius]);

  const isInsideZone3 = useMemo(() => {
    const distSq = Math.pow(rFault - zone3Center.r, 2) + Math.pow(xFault - zone3Center.x, 2);
    return distSq <= Math.pow(zone3Radius, 2);
  }, [rFault, xFault, zone3Center, zone3Radius]);

  // Dynamic Trip Class
  const tripStatus = useMemo(() => {
    if (isInsideZone1) {
      return {
        status: 'ZONE_1_TRIP',
        label: 'Zone 1 Instantaneous Trip',
        delay: 'Instantaneous (< 50 ms)',
        severity: 'critical',
        color: 'text-red-400 border-red-500/30 bg-red-500/10',
        description: 'Primary fault detected directly on the protected transmission line segment. High-speed breaker open initiated immediately to minimize grid disturbance.'
      };
    } else if (isInsideZone2) {
      return {
        status: 'ZONE_2_TRIP',
        label: 'Zone 2 Delayed Backup Trip',
        delay: '300 - 400 ms',
        severity: 'major',
        color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
        description: 'End-of-line fault or adjacent segment boundary overlap. Tripping is intentionally delayed to allow primary protection systems on neighboring lines to clear the fault first.'
      };
    } else if (isInsideZone3) {
      return {
        status: 'ZONE_3_TRIP',
        label: 'Zone 3 Remote Backup Trip',
        delay: '600 - 1000 ms',
        severity: 'minor',
        color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
        description: 'Remote backup zone. Intervenes with a longer coordination delay only if both primary and secondary systems on downstream lines fail to clear the fault.'
      };
    } else {
      return {
        status: 'RESTRAIN',
        label: 'Restrain (Normal/External)',
        delay: 'N/A (Continuous Monitoring)',
        severity: 'normal',
        color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
        description: 'Impedance is within safe load margins or represents an external out-of-zone system fault. Relays remain stable and restrain from tripping.'
      };
    }
  }, [isInsideZone1, isInsideZone2, isInsideZone3]);

  // Generate Circle Points for Plotting (theta 0 to 2*pi)
  const generateCirclePoints = (center: Coordinates, radius: number, pointsCount = 40) => {
    const points: Coordinates[] = [];
    for (let i = 0; i <= pointsCount; i++) {
      const theta = (i * 2 * Math.PI) / pointsCount;
      points.push({
        r: center.r + radius * Math.cos(theta),
        x: center.x + radius * Math.sin(theta)
      });
    }
    return points;
  };

  const zone1CirclePoints = useMemo(() => generateCirclePoints(zone1Center, zone1Radius), [zone1Center, zone1Radius]);
  const zone2CirclePoints = useMemo(() => generateCirclePoints(zone2Center, zone2Radius), [zone2Center, zone2Radius]);
  const zone3CirclePoints = useMemo(() => generateCirclePoints(zone3Center, zone3Radius), [zone3Center, zone3Radius]);

  // Transmission line vector
  const lineVector = useMemo<Coordinates[]>(() => [
    { r: 0, x: 0 },
    { r: rLine, x: xLine }
  ], [rLine, xLine]);

  // Combine data into structured array for ScatterChart representation
  // We want to combine the circle points so Recharts can draw continuous closed-loop boundaries.
  // In ScatterChart, to draw multiple boundaries we can keep them in separate series or pre-formatted lists.
  return {
    rLine,
    setRLine,
    xLine,
    setXLine,
    zone1Percent,
    setZone1Percent,
    zone2Percent,
    setZone2Percent,
    zone3Percent,
    setZone3Percent,
    rFault,
    setRFault,
    xFault,
    setXFault,
    lineImpedanceMag,
    lineAngleDeg,
    zone1Reach,
    zone2Reach,
    zone3Reach,
    zone1Center,
    zone1Radius,
    zone2Center,
    zone2Radius,
    zone3Center,
    zone3Radius,
    isInsideZone1,
    isInsideZone2,
    isInsideZone3,
    tripStatus,
    zone1CirclePoints,
    zone2CirclePoints,
    zone3CirclePoints,
    lineVector
  };
}
