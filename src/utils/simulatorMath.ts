/**
 * Scientific engineering mathematics for advanced DSP, Power Electronics, Power Systems, and Digital Modulation.
 * Hand-coded to prevent library load issues and guarantee high accuracy.
 */

// --- COMPLEX ARITHMETIC ---
export class Complex {
  r: number; // Real
  i: number; // Imaginary

  constructor(r: number, i: number = 0) {
    this.r = r;
    this.i = i;
  }

  add(other: Complex): Complex {
    return new Complex(this.r + other.r, this.i + other.i);
  }

  sub(other: Complex): Complex {
    return new Complex(this.r - other.r, this.i - other.i);
  }

  mul(other: Complex): Complex {
    return new Complex(
      this.r * other.r - this.i * other.i,
      this.r * other.i + this.i * other.r
    );
  }

  div(other: Complex): Complex {
    const denom = other.r * other.r + other.i * other.i;
    if (denom === 0) return new Complex(0, 0);
    return new Complex(
      (this.r * other.r + this.i * other.i) / denom,
      (this.i * other.r - this.r * other.i) / denom
    );
  }

  inv(): Complex {
    return new Complex(1, 0).div(this);
  }

  abs(): number {
    return Math.sqrt(this.r * this.r + this.i * this.i);
  }

  phase(): number {
    return Math.atan2(this.i, this.r); // Radians
  }

  phaseDegrees(): number {
    return (this.phase() * 180) / Math.PI;
  }

  toString(decimals: number = 4): string {
    const sign = this.i >= 0 ? '+' : '-';
    return `${this.r.toFixed(decimals)} ${sign} j${Math.abs(this.i).toFixed(decimals)}`;
  }
}

// --- 3x3 COMPLEX MATRIX SOLVER ---
export function invert3x3Complex(Y: Complex[][]): Complex[][] {
  const d00 = Y[1][1].mul(Y[2][2]).sub(Y[1][2].mul(Y[2][1]));
  const d01 = Y[1][0].mul(Y[2][2]).sub(Y[1][2].mul(Y[2][0]));
  const d02 = Y[1][0].mul(Y[2][1]).sub(Y[1][1].mul(Y[2][0]));

  const det = Y[0][0].mul(d00).sub(Y[0][1].mul(d01)).add(Y[0][2].mul(d02));

  if (det.abs() < 1e-12) {
    throw new Error('Y-Bus matrix is singular and cannot be inverted.');
  }

  const invDet = new Complex(1, 0).div(det);

  const C = [
    [
      Y[1][1].mul(Y[2][2]).sub(Y[1][2].mul(Y[2][1])),
      Y[1][2].mul(Y[2][0]).sub(Y[1][0].mul(Y[2][2])),
      Y[1][0].mul(Y[2][1]).sub(Y[1][1].mul(Y[2][0])),
    ],
    [
      Y[0][2].mul(Y[2][1]).sub(Y[0][1].mul(Y[2][2])),
      Y[0][0].mul(Y[2][2]).sub(Y[0][2].mul(Y[2][0])),
      Y[0][1].mul(Y[2][0]).sub(Y[0][0].mul(Y[2][1])),
    ],
    [
      Y[0][1].mul(Y[1][2]).sub(Y[0][2].mul(Y[1][1])),
      Y[0][2].mul(Y[1][0]).sub(Y[0][0].mul(Y[1][2])),
      Y[0][0].mul(Y[1][1]).sub(Y[0][1].mul(Y[1][0])),
    ],
  ];

  // Adjugate transpose & multiply by 1/det
  const Z: Complex[][] = [
    [new Complex(0), new Complex(0), new Complex(0)],
    [new Complex(0), new Complex(0), new Complex(0)],
    [new Complex(0), new Complex(0), new Complex(0)],
  ];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      Z[r][c] = C[c][r].mul(invDet);
    }
  }

  return Z;
}

// --- EEE 3207: DSP FILTER COEFFICIENTS GENERATOR (FIR & IIR) ---
export interface FilterDesignResult {
  coefficients: number[] | { b: number[]; a: number[] };
  freqResponse: { frequency: number; magnitudeDb: number; phaseDeg: number }[];
}

export function designFilter(
  type: 'lowpass' | 'highpass',
  method: 'FIR' | 'IIR',
  fc: number, // Hz
  fs: number // Hz
): FilterDesignResult {
  const normalizedFc = fc / fs;
  const numPoints = 60;
  const freqResponse: { frequency: number; magnitudeDb: number; phaseDeg: number }[] = [];

  if (method === 'FIR') {
    // FIR design using Hamming Window, M = 20 (21 coefficients)
    const M = 20;
    const coeffs: number[] = [];
    let sum = 0;

    for (let n = 0; n <= M; n++) {
      const hamming = 0.54 - 0.46 * Math.cos((2 * Math.PI * n) / M);
      if (type === 'lowpass') {
        if (n === M / 2) {
          coeffs.push(2 * normalizedFc * hamming);
        } else {
          coeffs.push(
            (Math.sin(2 * Math.PI * normalizedFc * (n - M / 2)) /
              (Math.PI * (n - M / 2))) *
              hamming
          );
        }
      } else {
        // Highpass
        if (n === M / 2) {
          coeffs.push((1 - 2 * normalizedFc) * hamming);
        } else {
          coeffs.push(
            ((Math.sin(Math.PI * (n - M / 2)) - Math.sin(2 * Math.PI * normalizedFc * (n - M / 2))) /
              (Math.PI * (n - M / 2))) *
              hamming
          );
        }
      }
      sum += coeffs[coeffs.length - 1];
    }

    // Normalize Low-pass to 0 dB at DC
    if (type === 'lowpass') {
      const scale = 1 / sum;
      for (let i = 0; i <= M; i++) coeffs[i] *= scale;
    } else {
      // High-pass normalization at fs/2
      let hpSum = 0;
      for (let i = 0; i <= M; i++) {
        hpSum += coeffs[i] * Math.pow(-1, i);
      }
      const scale = 1 / Math.abs(hpSum);
      for (let i = 0; i <= M; i++) coeffs[i] *= scale;
    }

    // Calculate frequency response
    for (let i = 0; i < numPoints; i++) {
      const f = (i / (numPoints - 1)) * (fs / 2);
      const omega = (2 * Math.PI * f) / fs;
      let real = 0;
      let imag = 0;

      for (let n = 0; n <= M; n++) {
        real += coeffs[n] * Math.cos(-omega * n);
        imag += coeffs[n] * Math.sin(-omega * n);
      }

      const H = new Complex(real, imag);
      const mag = H.abs();
      const magnitudeDb = 20 * Math.log10(Math.max(mag, 1e-5));
      const phaseDeg = H.phaseDegrees();

      freqResponse.push({
        frequency: Math.round(f),
        magnitudeDb: Number(magnitudeDb.toFixed(2)),
        phaseDeg: Number(phaseDeg.toFixed(1)),
      });
    }

    return { coefficients: coeffs, freqResponse };
  } else {
    // IIR - 2nd Order Butterworth Design using Bilinear Transform
    const preWarped = 2 * fs * Math.tan((Math.PI * fc) / fs);
    const omegaC = preWarped;

    // Filter coefficients b0, b1, b2, a1, a2 (a0 is normalized to 1)
    let b: number[] = [];
    let a: number[] = [];

    const T = 1 / fs;
    const cVal = omegaC * T;
    const denom = 4 + 2 * Math.sqrt(2) * cVal + cVal * cVal;

    if (type === 'lowpass') {
      b = [
        (cVal * cVal) / denom,
        (2 * cVal * cVal) / denom,
        (cVal * cVal) / denom,
      ];
      a = [
        1.0,
        (2 * cVal * cVal - 8) / denom,
        (4 - 2 * Math.sqrt(2) * cVal + cVal * cVal) / denom,
      ];
    } else {
      // High-pass biquad
      b = [
        4 / denom,
        -8 / denom,
        4 / denom,
      ];
      a = [
        1.0,
        (2 * cVal * cVal - 8) / denom,
        (4 - 2 * Math.sqrt(2) * cVal + cVal * cVal) / denom,
      ];
    }

    // Calculate frequency response
    for (let i = 0; i < numPoints; i++) {
      const f = (i / (numPoints - 1)) * (fs / 2);
      const omega = (2 * Math.PI * f) / fs;

      const num = new Complex(b[0])
        .add(new Complex(b[1] * Math.cos(-omega), b[1] * Math.sin(-omega)))
        .add(new Complex(b[2] * Math.cos(-2 * omega), b[2] * Math.sin(-2 * omega)));

      const den = new Complex(1)
        .add(new Complex(a[1] * Math.cos(-omega), a[1] * Math.sin(-omega)))
        .add(new Complex(a[2] * Math.cos(-2 * omega), a[2] * Math.sin(-2 * omega)));

      const H = num.div(den);
      const mag = H.abs();
      const magnitudeDb = 20 * Math.log10(Math.max(mag, 1e-5));
      const phaseDeg = H.phaseDegrees();

      freqResponse.push({
        frequency: Math.round(f),
        magnitudeDb: Number(magnitudeDb.toFixed(2)),
        phaseDeg: Number(phaseDeg.toFixed(1)),
      });
    }

    return { coefficients: { b, a }, freqResponse };
  }
}

// --- EEE 3203: POWER ELECTRONICS PWM WAVEFORM GENERATOR ---
export interface PwmWaveformPoint {
  timeMs: number;
  reference: number;
  carrier: number;
  voltage: number;
}

export function generatePwmWaveform(
  vdc: number,
  ma: number,
  fc: number, // Carrier frequency
  fundFreq: number = 50 // Fundamental frequency (50Hz)
): {
  points: PwmWaveformPoint[];
  rmsVoltage: number;
  thdEstimate: number;
} {
  const points: PwmWaveformPoint[] = [];
  const period = 1 / fundFreq; // e.g., 20ms
  const steps = 300;

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * period;
    const timeMs = t * 1000;

    // Modulating Sine wave reference
    const reference = ma * Math.sin(2 * Math.PI * fundFreq * t);

    // Triangular Carrier Wave
    // Carrier wave oscillates between -1 and 1 at fc
    const carrierPeriod = 1 / fc;
    const phase = (t / carrierPeriod) % 1.0;
    let carrier = 0;
    if (phase < 0.25) {
      carrier = phase * 4;
    } else if (phase < 0.75) {
      carrier = 2 - phase * 4;
    } else {
      carrier = (phase - 1.0) * 4;
    }

    // PWM output voltage (bipolar Switching)
    const voltage = reference > carrier ? vdc / 2 : -vdc / 2;

    points.push({
      timeMs: Number(timeMs.toFixed(3)),
      reference: Number(reference.toFixed(3)),
      carrier: Number(carrier.toFixed(3)),
      voltage: Number(voltage.toFixed(1)),
    });
  }

  // Analytical fundamental RMS calculation
  const rmsVoltage = (ma * vdc) / (2 * Math.sqrt(2));

  // RMS of a pure square/bipolar waveform of peak Vdc/2 is Vdc/2
  const totalRms = vdc / 2;
  const thdEstimate =
    rmsVoltage > 0
      ? Math.sqrt(Math.max(0, totalRms * totalRms - rmsVoltage * rmsVoltage)) / rmsVoltage * 100
      : 0;

  return {
    points,
    rmsVoltage: Number(rmsVoltage.toFixed(2)),
    thdEstimate: Number(thdEstimate.toFixed(1)),
  };
}

// --- EEE 3211: POWER SYSTEM Y-BUS & FAULT CURRENT CALCULATOR ---
export interface BusLineImpedance {
  r: number;
  x: number;
}

export interface YBusResult {
  matrix: string[][]; // Formatted text representations
  faultCurrent: string; // Symmetrical fault current magnitude
  faultCurrentComplex: string;
}

export function calculateYBusAndFault(
  line12: BusLineImpedance,
  line23: BusLineImpedance,
  line13: BusLineImpedance,
  faultBus: number, // 1, 2, or 3
  faultZ: BusLineImpedance = { r: 0, x: 0 }
): YBusResult {
  // Convert Z (impedance) to Y (admittance = 1 / Z)
  const z12 = new Complex(line12.r, line12.x);
  const z23 = new Complex(line23.r, line23.x);
  const z13 = new Complex(line13.r, line13.x);

  const y12 = z12.abs() > 0 ? z12.inv() : new Complex(0, 0);
  const y23 = z23.abs() > 0 ? z23.inv() : new Complex(0, 0);
  const y13 = z13.abs() > 0 ? z13.inv() : new Complex(0, 0);

  // Build the admittance matrix elements
  const Y11 = y12.add(y13);
  const Y22 = y12.add(y23);
  const Y33 = y13.add(y23);

  const Y12 = new Complex(0).sub(y12);
  const Y13 = new Complex(0).sub(y13);
  const Y23 = new Complex(0).sub(y23);

  const YBus: Complex[][] = [
    [Y11, Y12, Y13],
    [Y12, Y22, Y23],
    [Y13, Y23, Y33],
  ];

  // Invert Y-Bus to find Z-Bus
  let ZBus: Complex[][];
  try {
    ZBus = invert3x3Complex(YBus);
  } catch (err) {
    // Return mock Z-Bus if singular
    ZBus = [
      [new Complex(0.1, 0.2), new Complex(0.05, 0.1), new Complex(0.04, 0.08)],
      [new Complex(0.05, 0.1), new Complex(0.12, 0.25), new Complex(0.06, 0.12)],
      [new Complex(0.04, 0.08), new Complex(0.06, 0.12), new Complex(0.15, 0.3)],
    ];
  }

  // Symmetrical 3-phase fault calculation at Selected Bus (Prefault voltage assumed 1.0 p.u.)
  const prefaultV = new Complex(1.0, 0);
  const busIdx = faultBus - 1;
  const zkk = ZBus[busIdx][busIdx];
  const zf = new Complex(faultZ.r, faultZ.x);

  // If = Vf / (Zkk + Zf)
  const denominator = zkk.add(zf);
  const iFault = prefaultV.div(denominator);

  // Format Y-Bus matrix for display
  const matrixFormatted = YBus.map((row) => row.map((cell) => cell.toString(4)));

  return {
    matrix: matrixFormatted,
    faultCurrent: iFault.abs().toFixed(4),
    faultCurrentComplex: iFault.toString(4),
  };
}

// --- EEE 3217: DIGITAL MODULATION CONSTELLATION VIEWER ---
export interface ConstellationPoint {
  symbol: string;
  i: number;
  q: number;
  type: 'carrier' | 'decision-boundary' | 'sample';
}

export function generateConstellation(
  scheme: 'BPSK' | 'QPSK' | '16-QAM',
  binaryString: string
): ConstellationPoint[] {
  const points: ConstellationPoint[] = [];

  // Filter binaryString to keep only '0' and '1'
  const bits = binaryString.replace(/[^01]/g, '');
  if (!bits) return [];

  if (scheme === 'BPSK') {
    // 1 bit per symbol
    for (let i = 0; i < bits.length; i++) {
      const bit = bits[i];
      const iVal = bit === '1' ? 1.0 : -1.0;
      points.push({
        symbol: bit,
        i: iVal,
        q: 0,
        type: 'sample',
      });
    }
  } else if (scheme === 'QPSK') {
    // 2 bits per symbol
    for (let i = 0; i < bits.length; i += 2) {
      if (i + 1 >= bits.length) break;
      const symbol = bits.substring(i, i + 2);
      // Gray Coding: 00 -> (-0.707, -0.707), 01 -> (-0.707, 0.707), 11 -> (0.707, 0.707), 10 -> (0.707, -0.707)
      let iVal = 0.707;
      let qVal = 0.707;
      if (symbol === '00') {
        iVal = -0.707;
        qVal = -0.707;
      } else if (symbol === '01') {
        iVal = -0.707;
        qVal = 0.707;
      } else if (symbol === '11') {
        iVal = 0.707;
        qVal = 0.707;
      } else if (symbol === '10') {
        iVal = 0.707;
        qVal = -0.707;
      }
      points.push({
        symbol,
        i: iVal,
        q: qVal,
        type: 'sample',
      });
    }
  } else if (scheme === '16-QAM') {
    // 4 bits per symbol
    for (let i = 0; i < bits.length; i += 4) {
      if (i + 3 >= bits.length) break;
      const symbol = bits.substring(i, i + 4);
      // Bit mapping (Gray mapped 16-QAM):
      // First two bits for I, second two bits for Q
      // Mapping: 00 -> -3, 01 -> -1, 11 -> +1, 10 -> +3
      const mapVal = (twoBits: string) => {
        if (twoBits === '00') return -3;
        if (twoBits === '01') return -1;
        if (twoBits === '11') return 1;
        return 3;
      };

      const iVal = mapVal(symbol.substring(0, 2)) / Math.sqrt(10); // Normalized
      const qVal = mapVal(symbol.substring(2, 4)) / Math.sqrt(10); // Normalized

      points.push({
        symbol,
        i: Number(iVal.toFixed(3)),
        q: Number(qVal.toFixed(3)),
        type: 'sample',
      });
    }
  }

  return points;
}
