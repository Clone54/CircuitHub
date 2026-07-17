import { useState, useMemo } from 'react';

export interface HVDCConverterInputs {
  acVoltage: number;       // RMS Line-to-Line AC input (kV), e.g. 100 to 500
  frequency: number;       // AC Frequency (50 or 60 Hz)
  alpha: number;           // Firing angle (degrees), 0 to 180
  mu: number;              // Overlap angle (degrees), 0 to 30
}

export function useHVDCConverter(initialInputs: HVDCConverterInputs) {
  const [inputs, setInputs] = useState<HVDCConverterInputs>(initialInputs);

  const stats = useMemo(() => {
    const { acVoltage, alpha, mu } = inputs;
    const alphaRad = (alpha * Math.PI) / 180;
    const muRad = (mu * Math.PI) / 180;

    // Ideal DC no-load voltage (for 12-pulse, typically two 6-pulse bridges in series)
    // V_do = (6 * sqrt(2) / pi) * V_ac_rms_phase (approx 2.7 * V_ac_rms)
    const V_do = 2.7 * acVoltage;

    // DC voltage with firing angle alpha and overlap angle mu
    // Average V_dc = V_do * cos(alpha) - V_do * [cos(alpha) - cos(alpha + mu)] / 2
    // Which simplifies to V_do * [cos(alpha) + cos(alpha + mu)] / 2
    const V_dc = V_do * (Math.cos(alphaRad) + Math.cos(alphaRad + muRad)) / 2;

    // DC Voltage ripple percentage (approximate)
    // 6-pulse ripple is around 4.2% minimum at alpha=0, increases with alpha
    // 12-pulse ripple is around 1.0% minimum, significantly reduced
    const ripple6PulsePercent = Math.max(4.2, 4.2 + 15 * Math.abs(Math.sin(alphaRad)));
    const ripple12PulsePercent = Math.max(1.0, 1.0 + 3.5 * Math.abs(Math.sin(alphaRad)));

    return {
      vDo: parseFloat(V_do.toFixed(2)),
      vDc: parseFloat(Math.max(0, V_dc).toFixed(2)),
      ripple6PulsePercent: parseFloat(ripple6PulsePercent.toFixed(2)),
      ripple12PulsePercent: parseFloat(ripple12PulsePercent.toFixed(2)),
    };
  }, [inputs]);

  // Waveform data for 1 cycle of AC input
  const waveformData = useMemo(() => {
    const { frequency, alpha, mu } = inputs;
    const { vDc } = stats;
    
    const alphaRad = (alpha * Math.PI) / 180;
    const muRad = (mu * Math.PI) / 180;
    
    const pointsCount = 120;
    const data = [];
    
    // Cycle duration in ms
    const periodMs = 1000 / frequency;

    for (let i = 0; i < pointsCount; i++) {
      const t = (i / pointsCount) * periodMs;
      // Angle theta in radians
      const theta = (i / pointsCount) * 2 * Math.PI;

      // Construct a realistic 6-pulse ripple (6 crests per cycle)
      // V_6p has ripple matching cos(6*theta) offset by alpha
      const ripple6 = 0.08 * Math.cos(6 * theta - alphaRad) * (1 - muRad / (Math.PI / 3));
      // Base average voltage could go negative if alpha > 90, but in reality inverter mode occurs
      const v6 = vDc * (1 + ripple6);

      // Construct 12-pulse ripple (12 crests per cycle, 4x smaller amplitude)
      const ripple12 = 0.02 * Math.cos(12 * theta - alphaRad) * (1 - muRad / (Math.PI / 6));
      const v12 = vDc * (1 + ripple12);

      // Simple AC reference phase A for comparison (scaled to make visual sense)
      const acRef = inputs.acVoltage * Math.sqrt(2) * Math.sin(theta);

      data.push({
        time: parseFloat(t.toFixed(2)),
        sixPulse: parseFloat(Math.max(0, v6).toFixed(2)),
        twelvePulse: parseFloat(Math.max(0, v12).toFixed(2)),
        acPhaseA: parseFloat(acRef.toFixed(2)),
      });
    }

    return data;
  }, [inputs, stats]);

  // AC Harmonics spectrum data
  const harmonicsData = useMemo(() => {
    // Orders of harmonics up to 25th
    const orders = [1, 5, 7, 11, 13, 17, 19, 23, 25];
    
    return orders.map(order => {
      // 6-pulse has 100/n % of fundamental.
      const amplitude6 = order === 1 ? 100 : parseFloat((100 / order).toFixed(1));
      
      // 12-pulse cancels 5, 7, 17, 19
      const isCancelledIn12 = [5, 7, 17, 19].includes(order);
      const amplitude12 = order === 1 
        ? 100 
        : (isCancelledIn12 ? 0 : parseFloat((100 / order).toFixed(1)));

      return {
        harmonic: `${order}${order === 1 ? 'st (Fund)' : 'th'}`,
        order,
        '6-Pulse Amplitude (%)': amplitude6,
        '12-Pulse Amplitude (%)': amplitude12,
      };
    });
  }, []);

  return {
    inputs,
    setInputs,
    stats,
    waveformData,
    harmonicsData,
  };
}
