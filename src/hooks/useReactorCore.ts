import { useState, useEffect, useRef } from 'react';

export interface CoreDataPoint {
  time: string;
  power: number; // Thermal Power in MW
  temperature: number; // Core Outlet Temp in °C
  keff: number; // Multiplication factor
}

export function useReactorCore() {
  // Inputs
  const [controlRodPosition, setControlRodPosition] = useState<number>(75); // % withdrawn (0 = fully inserted, 100 = fully withdrawn)
  const [coolantFlow, setCoolantFlow] = useState<number>(80); // % primary loop pump speed

  // Core States
  const [power, setPower] = useState<number>(2400); // Current thermal power in MWth (max licensed: 3200 MWth)
  const [temperature, setTemperature] = useState<number>(315); // Core average temperature in °C
  const [keff, setKeff] = useState<number>(1.000); // Effective neutron multiplication factor
  const [isScrammed, setIsScrammed] = useState<boolean>(false);
  const [scramReason, setScramReason] = useState<string>('');

  // History for Recharts LineChart (last 40 points)
  const [history, setHistory] = useState<CoreDataPoint[]>(() => {
    // Initialize dummy history
    const initialHistory: CoreDataPoint[] = [];
    for (let i = 40; i >= 0; i--) {
      initialHistory.push({
        time: `-${i}s`,
        power: 2400,
        temperature: 315,
        keff: 1.000,
      });
    }
    return initialHistory;
  });

  const stateRef = useRef({
    controlRodPosition,
    coolantFlow,
    power,
    temperature,
    isScrammed,
  });

  // Sync ref to avoid closure issues in setInterval
  useEffect(() => {
    stateRef.current = {
      controlRodPosition,
      coolantFlow,
      power,
      temperature,
      isScrammed,
    };
  }, [controlRodPosition, coolantFlow, power, temperature, isScrammed]);

  // Main simulation loop running every 250ms (updating real-time grid metrics)
  useEffect(() => {
    let tickCount = 0;
    const interval = setInterval(() => {
      const {
        controlRodPosition: rod,
        coolantFlow: flow,
        power: p,
        temperature: t,
        isScrammed: scram,
      } = stateRef.current;

      // 1. Calculate k_eff (multiplication factor) with physics parameters
      // If SCRAM is active, control rod is forced to 0
      const activeRod = scram ? 0 : rod;

      // Base k_eff at zero-power, cold conditions
      const kBase = 0.965;

      // Reactivity from control rods: max addition of +0.065 delta-k when fully withdrawn
      const kRod = 0.075 * (activeRod / 100);

      // Reactivity from coolant: PWRs have moderator temperature coefficient (MTC)
      // High coolant flow increases moderator density slightly or keeps it cooler,
      // adding positive reactivity, up to +0.01 delta-k
      const kCoolant = 0.005 * (flow / 100);

      // Negative Doppler & Moderator feedback (Temperature coefficient)
      // Normal operating range is ~280°C to ~345°C.
      // Negative temperature coefficient: -0.0003 delta-k per °C above 280°C
      const kTempFeedback = -0.00038 * (t - 290);

      // Total effective k_eff
      let currentKeff = kBase + kRod + kCoolant + kTempFeedback;
      if (scram) {
        // Absolute negative shutdown margin if SCRAM is active
        currentKeff = Math.min(0.88, currentKeff);
      }

      // 2. Reactivity calculation: rho = (k - 1) / k
      const rho = (currentKeff - 1) / currentKeff;

      // 3. Reactor Kinetics (Simplified Point Kinetics with 1 delayed neutron group)
      // dP/dt = (rho - beta) / lambda * P + decay_heat_contribution
      const beta = 0.0065; // Delayed neutron fraction
      const lambdaRef = 0.0001; // Prompt neutron lifetime (s)
      
      // Compute kinetics change rate
      // To prevent crazy numerical explosion, clamp rho - beta
      const reactivityDrive = (rho - beta) / lambdaRef;
      
      // Calculate power change
      // Time step dt = 0.25 seconds
      const dt = 0.25;
      
      let nextPower = p;
      if (scram) {
        // Fast exponential decay to decay heat floor (7% of nominal, cooling down to ~1.5%)
        const decayHeatFloor = 45; // MWth decay heat minimum
        nextPower = p - (p - decayHeatFloor) * 0.45; // Rapid drop
      } else {
        // Standard neutron dynamics
        // We add a stable delayed neutron representation and clamp rate of change
        const dP = (reactivityDrive * p + (beta / lambdaRef) * p) * 0.0003;
        nextPower = p + dP;
        
        // Add random micro-fluctuations (reactor noise)
        nextPower += (Math.random() - 0.5) * 6;
      }

      // Safety limit bounds
      if (nextPower < 5) nextPower = 5; // Absolute physics floor
      if (nextPower > 4000) nextPower = 4000; // Thermal design limits (overpower trip is at 3520 MW)

      // 4. Reactor Thermal Dynamics (Core heat transfer to primary loop)
      // Heat generation = Power (MWth)
      // Heat removal = Flow rate * (Temp - InletTemp) * Const
      const inletTemp = 280; // Secondary inlet feed temp in °C
      const heatCapacityCoeff = 0.09; // Primary loop thermal capacity
      const heatRemoved = (t - inletTemp) * (flow / 100) * 12.0 * heatCapacityCoeff;
      const heatGenerated = nextPower * 0.41;

      // Core Outlet Temperature rate of change
      const dT = (heatGenerated - heatRemoved) * 0.15;
      let nextTemp = t + dT * dt;

      // Ambient thermal coupling bounds
      if (nextTemp < 20) nextTemp = 20;

      // 5. Automatic SCRAM System check
      let shouldScram = scram;
      let reason = scramReason;

      if (!scram) {
        if (nextTemp >= 340) {
          shouldScram = true;
          reason = 'COLET (Core Outlet Temperature) Limit Exceeded (>340°C)';
        } else if (nextPower >= 3520) {
          shouldScram = true;
          reason = 'OPDT (Overpower Delta-T) Reactor Trip (>110% Licensed Power)';
        } else if (flow < 20 && p > 200) {
          shouldScram = true;
          reason = 'MCP-TRIP (Loss of Reactor Coolant Flow <20% Pump Speed)';
        }
      }

      if (shouldScram && !scram) {
        setIsScrammed(true);
        setScramReason(reason);
        setControlRodPosition(0); // Instantly drop rods
      }

      // Update state hooks
      setPower(nextPower);
      setTemperature(nextTemp);
      setKeff(currentKeff);

      // 6. Update chart history
      setHistory((prev) => {
        const nextHistory = [...prev.slice(1)];
        tickCount++;
        nextHistory.push({
          time: `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
          power: parseFloat(nextPower.toFixed(1)),
          temperature: parseFloat(nextTemp.toFixed(1)),
          keff: parseFloat(currentKeff.toFixed(4)),
        });
        return nextHistory;
      });

    }, 250);

    return () => clearInterval(interval);
  }, [scramReason]);

  // SCRAM Manual Trigger
  const triggerManualScram = () => {
    setIsScrammed(true);
    setScramReason('Manual Operators Push-Button Emergency SCRAM');
    setControlRodPosition(0);
  };

  // Reset SCRAM
  const resetReactor = () => {
    if (temperature > 220) {
      // Core is too hot to reset safely!
      return false;
    }
    setIsScrammed(false);
    setScramReason('');
    setPower(50); // Reset to very low start-up power
    setControlRodPosition(15); // Start with rods barely out
    return true;
  };

  return {
    controlRodPosition,
    setControlRodPosition: (val: number) => {
      if (!isScrammed) setControlRodPosition(val);
    },
    coolantFlow,
    setCoolantFlow,
    power,
    temperature,
    keff,
    isScrammed,
    scramReason,
    history,
    triggerManualScram,
    resetReactor,
  };
}
