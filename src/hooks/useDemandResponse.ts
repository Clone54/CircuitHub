import { useState, useMemo } from 'react';

export interface DERAssets {
  solarPV: boolean;
  evCharger: boolean;
  homeBattery: boolean;
}

export function useDemandResponse() {
  // Price spike simulation slider ($ per kWh)
  const [peakPrice, setPeakPrice] = useState<number>(0.65);
  
  // Battery lifecycle age (0 to 5 years)
  const [batteryAge, setBatteryAge] = useState<number>(2);

  // DER Asset toggles
  const [assets, setAssets] = useState<DERAssets>({
    solarPV: true,
    evCharger: true,
    homeBattery: true
  });

  // Target pricing threshold where DR triggers
  const DR_THRESHOLD_PRICE = 0.40;

  // 12V 130Ah battery specifications & 5-year degradation calculations
  const batteryStats = useMemo(() => {
    const nominalVoltage = 12; // V
    const nominalCapacityAh = 130; // Ah
    // Theoretical initial capacity = 12 * 130 = 1.56 kWh
    const baseCapacityKWh = (nominalVoltage * nominalCapacityAh) / 1000; 

    // State of Health (SoH) degrades by 5% every year
    const soh = Math.max(75, 100 - batteryAge * 5); // Year 5 = 75%
    const currentCapacityKWh = baseCapacityKWh * (soh / 100);

    // Efficiency degrades from 92% down to 80% at year 5
    const efficiency = 0.92 - batteryAge * 0.024;

    // Internal resistance increases from 15 mΩ to 26 mΩ
    const internalResistanceMilliOhms = 15 * (1 + batteryAge * 0.15);

    return {
      nominalCapacityKWh: parseFloat(baseCapacityKWh.toFixed(2)),
      currentCapacityKWh: parseFloat(currentCapacityKWh.toFixed(2)),
      soh,
      efficiencyPercent: parseFloat((efficiency * 100).toFixed(1)),
      internalResistance: parseFloat(internalResistanceMilliOhms.toFixed(2)),
      maxDischargeRateKW: parseFloat((currentCapacityKWh * 0.8).toFixed(2)) // C-rate limit
    };
  }, [batteryAge]);

  // Hourly profile calculator for 24-hour cycle
  const { hourlyData, stats } = useMemo(() => {
    const data = [];
    let baseDailyCost = 0;
    let drDailyCost = 0;
    let maxBaseLoad = 0;
    let maxDrLoad = 0;

    // Dynamic battery tracking across the 24-hour simulation
    // Start with 50% charge
    let batterySoCKWh = batteryStats.currentCapacityKWh * 0.5; 
    const maxSoCKWh = batteryStats.currentCapacityKWh;

    for (let hour = 0; hour < 24; hour++) {
      // 1. Determine hourly price ($ per kWh)
      // Standard pricing profile: cheap at night, expensive in the evening
      let hourPrice = 0.12; // Base nighttime rate
      if (hour >= 7 && hour <= 9) {
        hourPrice = 0.28; // Morning bump
      } else if (hour >= 10 && hour <= 16) {
        hourPrice = 0.18; // Midday shoulder
      } else if (hour >= 17 && hour <= 21) {
        // Evening peak spike, bound by the user's slider
        hourPrice = peakPrice;
      } else if (hour >= 22) {
        hourPrice = 0.15; // Late night winding down
      }

      // Check if price triggers Demand Response
      const isDRActive = hourPrice >= DR_THRESHOLD_PRICE;

      // 2. Base Load calculation (double-peak residential curve)
      let houseBaseLoad = 1.2; // kW background
      if (hour >= 7 && hour <= 9) {
        houseBaseLoad = 3.2; // Morning peak (cooking, water heating)
      } else if (hour >= 11 && hour <= 16) {
        houseBaseLoad = 1.8; // Afternoon background
      } else if (hour >= 17 && hour <= 21) {
        houseBaseLoad = 4.8; // Evening cooking & HVAC peak
      } else if (hour >= 22) {
        houseBaseLoad = 1.5;
      }

      // 3. EV Charger load
      // Standard EV Charger draws 7.0 kW between 18:00 (6 PM) and 21:00 (9 PM)
      let evLoadBase = 0;
      let evLoadDr = 0;
      if (assets.evCharger && hour >= 18 && hour <= 21) {
        evLoadBase = 7.0; // Uncontrolled EV charging
        
        if (isDRActive) {
          // DR is active: throttle charging to Smart Eco Mode (1.5 kW)
          evLoadDr = 1.5;
        } else {
          evLoadDr = 7.0;
        }
      }

      const totalUncontrolledDemand = houseBaseLoad + evLoadBase;
      const totalDRDemandBeforeDER = houseBaseLoad + evLoadDr;

      // 4. Solar PV generation potential (bell-curve centered at noon)
      let solarGen = 0;
      if (assets.solarPV && hour >= 6 && hour <= 18) {
        // Peak of 4.5 kW solar at 12:00 PM
        const x = (hour - 12) / 3;
        solarGen = Math.max(0, 4.5 * Math.exp(-x * x));
      }

      // 5. Battery Charging & Discharging scheduling
      let batteryDischarge = 0;
      let batteryCharge = 0;

      if (assets.homeBattery) {
        if (isDRActive && batterySoCKWh > 0.1) {
          // Peak hours: Discharge battery to cover remaining load
          const remainingLoad = Math.max(0, totalDRDemandBeforeDER - solarGen);
          // Discharge at max C-rate limit or remaining load, limited by state of charge
          const dischargeAmount = Math.min(
            remainingLoad, 
            batteryStats.maxDischargeRateKW, 
            batterySoCKWh - 0.05 // leave 5% reserve
          );
          batteryDischarge = dischargeAmount;
          batterySoCKWh -= (dischargeAmount / batteryStats.efficiencyPercent) * 100;
        } else if (hour >= 10 && hour <= 15 && solarGen > totalDRDemandBeforeDER) {
          // Midday: Charge battery using excess solar power
          const excessSolar = solarGen - totalDRDemandBeforeDER;
          const chargeAmount = Math.min(excessSolar, 0.5, maxSoCKWh - batterySoCKWh);
          batteryCharge = chargeAmount;
          batterySoCKWh += chargeAmount * batteryStats.efficiencyPercent / 100;
        } else if (hour >= 1 && hour <= 5 && batterySoCKWh < maxSoCKWh * 0.8) {
          // Overnight: Off-peak grid trickle-charge battery to 80% to prepare for peaks
          const chargeAmount = Math.min(0.3, maxSoCKWh - batterySoCKWh);
          batteryCharge = chargeAmount;
          batterySoCKWh += chargeAmount * batteryStats.efficiencyPercent / 100;
        }
      }

      // Guard SoC limits
      batterySoCKWh = Math.max(0, Math.min(maxSoCKWh, batterySoCKWh));

      // 6. Net Grid imports
      // Base (Uncontrolled) grid imports: Total demand minus Solar (all excess solar wasted/fed-in at 0 value)
      const baseGridImport = Math.max(0, totalUncontrolledDemand - solarGen);
      
      // DR (Optimized) grid imports: DR Demand + Battery Charge - Solar Gen - Battery Discharge
      const drGridImport = Math.max(0, totalDRDemandBeforeDER + batteryCharge - solarGen - batteryDischarge);

      // Hourly Costs
      const baseHourCost = baseGridImport * hourPrice;
      const drHourCost = drGridImport * hourPrice;

      baseDailyCost += baseHourCost;
      drDailyCost += drHourCost;

      if (totalUncontrolledDemand > maxBaseLoad) maxBaseLoad = totalUncontrolledDemand;
      if (drGridImport > maxDrLoad) maxDrLoad = drGridImport;

      data.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        price: hourPrice,
        demand: parseFloat(totalUncontrolledDemand.toFixed(2)),
        gridImport: parseFloat(drGridImport.toFixed(2)),
        solarGen: parseFloat(solarGen.toFixed(2)),
        batteryDischarge: parseFloat(batteryDischarge.toFixed(2)),
        batterySoC: parseFloat(((batterySoCKWh / maxSoCKWh) * 100).toFixed(1)),
        isDRActive,
        baseGridImport: parseFloat(baseGridImport.toFixed(2))
      });
    }

    const costSavings = baseDailyCost - drDailyCost;
    const peakReductionKW = maxBaseLoad - maxDrLoad;
    const co2ReductionKg = peakReductionKW * 0.42 * 4; // 0.42kg of CO2 saved per avoided peak kW-hr (simulated)

    return {
      hourlyData: data,
      stats: {
        baseCost: parseFloat(baseDailyCost.toFixed(2)),
        drCost: parseFloat(drDailyCost.toFixed(2)),
        costSavings: parseFloat(Math.max(0, costSavings).toFixed(2)),
        peakReductionKW: parseFloat(peakReductionKW.toFixed(2)),
        co2ReductionKg: parseFloat(Math.max(0, co2ReductionKg).toFixed(1))
      }
    };
  }, [peakPrice, batteryStats, assets]);

  return {
    peakPrice,
    setPeakPrice,
    batteryAge,
    setBatteryAge,
    assets,
    setAssets,
    batteryStats,
    hourlyData,
    stats,
    drThreshold: DR_THRESHOLD_PRICE
  };
}
