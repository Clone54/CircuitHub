import { useState, useMemo } from 'react';

export type DisasterType = 'fukushima' | 'chernobyl';

export interface TimelineStep {
  step: number;
  time: string;
  title: string;
  description: string;
  physicsExplain: string; // Detailed scientific/safety analysis
  visuals: {
    coolantLevel: number; // % height of core covered by liquid (0 to 100)
    coreTemperatureColor: string; // HEX color of core (slate, yellow, red, bright red, melting)
    controlRodPosition: number; // % inserted (0 to 100)
    containmentPressure: number; // relative to atmospheric (1.0 to 8.0 bar)
    isHydrogenLeaking: boolean;
    isExploded: boolean;
    isLoopCirculating: boolean;
    glowPulse: boolean;
  };
}

export function useDisasterTimeline() {
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterType>('fukushima');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const fukushimaTimeline: TimelineStep[] = useMemo(() => [
    {
      step: 0,
      time: 'Normal Operations',
      title: 'Stable Basemain Grid Load',
      description: 'The Boiling Water Reactor (BWR) is generating 1380 MWe. Water is circulating vigorously in primary loops, vaporizing to drive steam turbines directly.',
      physicsExplain: 'Continuous forced circulation maintains fuel temperature at a stable 300°C. High redundancy safety systems are on standby.',
      visuals: {
        coolantLevel: 100,
        coreTemperatureColor: '#2563eb', // blue (normal/cool)
        controlRodPosition: 30, // partially inserted
        containmentPressure: 1.01, // 1 atm
        isHydrogenLeaking: false,
        isExploded: false,
        isLoopCirculating: true,
        glowPulse: false,
      },
    },
    {
      step: 1,
      time: 'T+0:00 (14:46 JST)',
      title: 'M9.0 Tohoku Earthquake',
      description: 'Massive seismic shockwaves hit the plant. Grid connection cables are ripped apart. On-site backup Emergency Diesel Generators (EDGs) start up instantly to supply reactor control cooling power.',
      physicsExplain: 'The reactors detect seismic shock and trigger automated shutdown (SCRAM). Control rods fully insert within 3.5 seconds. Active thermal fission drops to zero; core is now cooled solely for decay heat (~7% of normal thermal power).',
      visuals: {
        coolantLevel: 100,
        coreTemperatureColor: '#eab308', // orange/yellow (decay heat)
        controlRodPosition: 100, // fully inserted (SCRAM succeeded)
        containmentPressure: 1.2,
        isHydrogenLeaking: false,
        isExploded: false,
        isLoopCirculating: true,
        glowPulse: true,
      },
    },
    {
      step: 2,
      time: 'T+0:46 (15:32 JST)',
      title: 'Tsunami Breaches Defenses',
      description: 'A colossal 14-meter tsunami wall is overtopped. Low-lying turbine buildings are flooded, submerging backup diesel fuel tanks, air intakes, and essential DC batteries.',
      physicsExplain: 'The Station Blackout (SBO) begins. All AC and DC electric power is lost. Primary loops and core isolation cooling systems (RCIC) stop active recirculation, trapping stagnant decay heat inside containment.',
      visuals: {
        coolantLevel: 90,
        coreTemperatureColor: '#f97316', // orange (heating up)
        controlRodPosition: 100,
        containmentPressure: 1.8,
        isHydrogenLeaking: false,
        isExploded: false,
        isLoopCirculating: false, // flow stops
        glowPulse: true,
      },
    },
    {
      step: 3,
      time: 'T+4:00 to T+12:00',
      title: 'Core Boil-Off & Exposure',
      description: 'Stagnant coolant water absorbs decay heat, vaporizes into steam, and vents through emergency safety relief valves into containment. Liquid levels plunge.',
      physicsExplain: 'Water levels drop below the top of active fuel (TAF), exposing highly radioactive fuel assemblies directly to high-temperature steam. Without liquid heat transfer, cladding temperature shoots past 1200°C.',
      visuals: {
        coolantLevel: 25, // severely exposed
        coreTemperatureColor: '#ef4444', // red hot
        controlRodPosition: 100,
        containmentPressure: 4.5, // rising steam pressure
        isHydrogenLeaking: false,
        isExploded: false,
        isLoopCirculating: false,
        glowPulse: true,
      },
    },
    {
      step: 4,
      time: 'T+16:00 to T+22:00',
      title: 'Cladding Zirconium Reaction',
      description: 'Superheated zirconium alloy fuel cladding reacts chemically with high-temperature steam. The exothermic reaction feeds back additional heat and generates massive amounts of gas.',
      physicsExplain: 'Zr + 2H2O -> ZrO2 + 2H2. This reaction accelerates cladding degradation, liquefies fuel oxides into a molten corium pool at the bottom of the vessel, and vents hydrogen into the secondary building.',
      visuals: {
        coolantLevel: 5, // empty
        coreTemperatureColor: '#b91c1c', // dark red melting
        controlRodPosition: 100,
        containmentPressure: 7.2, // extreme pressure
        isHydrogenLeaking: true,
        isExploded: false,
        isLoopCirculating: false,
        glowPulse: true,
      },
    },
    {
      step: 5,
      time: 'T+24:00+',
      title: 'Hydrogen Containment Explosion',
      description: 'Hydrogen gas leaks past containment seals, accumulates in the unvented upper refuelling floor, and mixes with oxygen. A spark ignites a devastating chemical explosion.',
      physicsExplain: 'A shockwave blows off the light reinforced concrete cladding roof of the secondary reactor building, breaching the auxiliary confinement barriers and initiating significant atmospheric radioisotope dispersal.',
      visuals: {
        coolantLevel: 0,
        coreTemperatureColor: '#dc2626', // molten corium
        controlRodPosition: 100,
        containmentPressure: 2.1, // dropped due to breach
        isHydrogenLeaking: true,
        isExploded: true, // detonated
        isLoopCirculating: false,
        glowPulse: true,
      },
    },
  ], []);

  const chernobylTimeline: TimelineStep[] = useMemo(() => [
    {
      step: 0,
      time: 'Pre-Test Phase',
      title: 'Unstable Low-Power State',
      description: 'Operators are preparing RBMK-1000 Reactor 4 for a safety turbine coastdown test. Power is dragged too low (200 MWth) where the core becomes highly unstable.',
      physicsExplain: 'Strong positive void coefficient of reactivity makes the RBMK notoriously volatile at low power. Severe Xe-135 poisoning is choking neutron flux, prompting operators to manually pull almost all control rods out to maintain power.',
      visuals: {
        coolantLevel: 100,
        coreTemperatureColor: '#2563eb',
        controlRodPosition: 5, // control rods pulled fully out (unsafe configuration!)
        containmentPressure: 1.01,
        isHydrogenLeaking: false,
        isExploded: false,
        isLoopCirculating: true,
        glowPulse: false,
      },
    },
    {
      step: 1,
      time: 'T=0:00 (01:23:04)',
      title: 'Turbine Valves Shut',
      description: 'Operators seal the main turbine valves to initiate generator coastdown. Steam pressure increases inside the steam separators, which reduces feedwater circulation pumps speed.',
      physicsExplain: 'As coolant flow decreases, cooling water inside the pressure channels absorbs heat and begins to boil, forming localized pockets of steam (voids).',
      visuals: {
        coolantLevel: 80,
        coreTemperatureColor: '#eab308',
        controlRodPosition: 5,
        containmentPressure: 1.5,
        isHydrogenLeaking: false,
        isExploded: false,
        isLoopCirculating: true,
        glowPulse: true,
      },
    },
    {
      step: 2,
      time: 'T+0:15 (01:23:19)',
      title: 'Positive Void runaway Feedback',
      description: 'Fewer liquid water absorbers are present to capture neutrons because of massive steaming. Fission rates in local fuel channels begin to surge exponentially.',
      physicsExplain: 'Positive Void Coefficient: Liquid water serves as a neutron absorber in RBMKs, whereas steam voids act as transparent pathways. Steam creation adds positive reactivity, raising power, producing more steam, in a prompt thermal-runaway feedback loop.',
      visuals: {
        coolantLevel: 60,
        coreTemperatureColor: '#ea580c', // deep orange
        controlRodPosition: 5,
        containmentPressure: 2.5,
        isHydrogenLeaking: false,
        isExploded: false,
        isLoopCirculating: false,
        glowPulse: true,
      },
    },
    {
      step: 3,
      time: 'T+0:36 (01:23:40)',
      title: 'Manual SCRAM EPS-5 Button Pressed',
      description: 'The shift supervisor, realizing power is climbing unstably, triggers a manual SCRAM (AZ-5) emergency button to insert all 211 control rods.',
      physicsExplain: 'The RBMK control rods are styled with highly moderating graphite follower tips to displace water under normal operation. As the rods enter the core, these tips displace absorbing water with moderating graphite at the bottom.',
      visuals: {
        coolantLevel: 40,
        coreTemperatureColor: '#ef4444',
        controlRodPosition: 20, // rods jammed early on entry
        containmentPressure: 4.8,
        isHydrogenLeaking: false,
        isExploded: false,
        isLoopCirculating: false,
        glowPulse: true,
      },
    },
    {
      step: 4,
      time: 'T+0:40 (01:23:44)',
      title: 'Positive SCRAM Criticality Surge',
      description: 'Instead of quenching the core, the entering graphite tips create a colossal localized reactivity spike in the bottom 1 meter of the reactor. Power surges past 33,000 MWth (10x licensed limit).',
      physicsExplain: 'Localized prompt-critical runaway. Superheated fuel rods instantly crack, vaporize fuel pellets, and expand cladding. The expanding fuel elements deform the pressure channels, trapping the control rods permanently at 20% insertion.',
      visuals: {
        coolantLevel: 10,
        coreTemperatureColor: '#ef4444',
        controlRodPosition: 20,
        containmentPressure: 9.0, // massive steam expansion
        isHydrogenLeaking: true,
        isExploded: false,
        isLoopCirculating: false,
        glowPulse: true,
      },
    },
    {
      step: 5,
      time: 'T+0:44 (01:23:48)',
      title: 'Double Steam & Core Explosion',
      description: 'Severe fuel-coolant interaction vaporizes all water instantly. Overheated steam pressure blows off the 2000-ton reactor biological lid shield. A second oxygen-hydrogen explosion follows.',
      physicsExplain: 'A purely physical steam explosion destroys the reactor vault. Oxygen rushes into the exposed core, igniting the hot structural graphite block moderator, leading to a long-lived nuclear fire distributing radioisotopes directly into high altitudes.',
      visuals: {
        coolantLevel: 0,
        coreTemperatureColor: '#7f1d1d', // destroyed / core exposed
        controlRodPosition: 20,
        containmentPressure: 1.0, // containment ruptured
        isHydrogenLeaking: true,
        isExploded: true,
        isLoopCirculating: false,
        glowPulse: true,
      },
    },
  ], []);

  const timelineSteps = selectedDisaster === 'fukushima' ? fukushimaTimeline : chernobylTimeline;
  const currentStep = timelineSteps[currentStepIndex] || timelineSteps[0];

  const handleDisasterChange = (disaster: DisasterType) => {
    setSelectedDisaster(disaster);
    setCurrentStepIndex(0);
  };

  return {
    selectedDisaster,
    setSelectedDisaster: handleDisasterChange,
    currentStepIndex,
    setCurrentStepIndex,
    currentStep,
    timelineSteps,
  };
}
