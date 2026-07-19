import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu,
  Zap,
  Activity,
  Grid,
  BookOpen,
  GraduationCap,
  Calculator,
  Sliders,
  MessageSquare,
  Wrench,
  Layers,
  Network,
  FolderGit2,
  ArrowRight,
  Sparkles,
  TrendingUp,
  FileText,
  BadgeAlert,
  Terminal,
  Share2,
  Shield,
  Radio,
  Repeat,
  FunctionSquare,
  Search,
  X,
  Power,
  Ruler,
  Cable
} from 'lucide-react';
import Timer555Calc from './Timer555Calc';
import BJTCalc from './BJTCalc';
import OpAmpCalc from './OpAmpCalc';
import TruthTableGen from './TruthTableGen';

// Categories type
type ToolCategory = 'all' | 'calculators' | 'power' | 'embedded' | 'academic';

// Inline playground tool IDs
type PlaygroundToolId = 'timer555' | 'bjt' | 'opamp' | 'truthtable';

interface PlaygroundTool {
  id: PlaygroundToolId;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType;
}

const PLAYGROUND_TOOLS: PlaygroundTool[] = [
  {
    id: 'timer555',
    title: '555 Timer Designer',
    description: 'Calculate frequency, duty cycle, and timings for astable and monostable circuits.',
    icon: Cpu,
    component: Timer555Calc
  },
  {
    id: 'bjt',
    title: 'BJT Voltage Divider Bias',
    description: 'Calculate node voltages, currents, and detect Cutoff, Active, and Saturation regions.',
    icon: Zap,
    component: BJTCalc
  },
  {
    id: 'opamp',
    title: 'Operational Amplifier',
    description: 'Simulate Inverting, Non-Inverting, and Differential gains with clipping and AC waveforms.',
    icon: Activity,
    component: OpAmpCalc
  },
  {
    id: 'truthtable',
    title: 'Logic Truth Table Generator',
    description: 'Parse Boolean algebra expressions and render full-range binary logic truth tables.',
    icon: Grid,
    component: TruthTableGen
  }
];

// High-level catalog tools
interface CatalogTool {
  id: string;
  title: string;
  category: ToolCategory;
  description: string;
  syllabus: string;
  icon: React.ComponentType<any>;
  route: string;
  badge?: string;
  isExternal?: boolean;
}

const CATALOG_TOOLS: CatalogTool[] = [
  {
    id: 'circuit-tools',
    title: 'Circuit Fundamentals Suite',
    category: 'calculators',
    description: 'Analyze AC power dynamics, Power Factor, RLC resonance, and Max Power Transfer with interactive graphing tools.',
    syllabus: 'EEE 1101 / EEE 1201',
    icon: Zap,
    route: '/circuit-tools',
    badge: '1st Year Module'
  },
  {
    id: 'advanced-circuit-tools',
    title: 'Advanced Circuit Analysis Suite',
    category: 'calculators',
    description: 'Analyze polyphase networks, simulate time-domain transients, convert two-port parameters, and design passive analog filters.',
    syllabus: 'EEE 1201',
    icon: Zap,
    route: '/circuit-tools/advanced',
    badge: '2nd Year Module'
  },
  {
    id: 'electronics-i-tools',
    title: 'Analog Electronics I Suite',
    category: 'calculators',
    description: 'Visualize diode wave-shaping, perform small-signal AC modeling for BJTs/FETs, and design Zener voltage regulators.',
    syllabus: 'EEE 1203',
    icon: Zap,
    route: '/circuit-tools/electronics-i',
    badge: '1st Year Module'
  },
  {
    id: 'electronics-ii-tools',
    title: 'Advanced Analog Electronics Suite',
    category: 'calculators',
    description: 'Design power amplifiers and heat sinks, visualize high/low frequency responses with Bode plots, and calculate sinusoidal oscillator networks.',
    syllabus: 'EEE 2103',
    icon: Zap,
    route: '/circuit-tools/electronics-ii',
    badge: '2nd Year Module'
  },
  {
    id: 'material-tools',
    title: 'Material Science Analysis Suite',
    category: 'calculators',
    description: 'Explore semiconductor carrier statistics, analyze dielectric polarization and relaxation, and visualize superconductor phase boundaries.',
    syllabus: 'EEE 1205',
    icon: Layers,
    route: '/material-tools',
    badge: '1st Year Module'
  },
  {
    id: 'em-tools',
    title: 'Electromagnetic Fields Suite',
    category: 'calculators',
    description: 'Visualize plane wave propagation and skin depth, dielectric boundary conditions, and agentic vector field calculus.',
    syllabus: 'EEE 2107',
    icon: Radio,
    route: '/em-tools',
    badge: '2nd Year Module'
  },
  {
    id: 'digital-tools',
    title: 'Digital Design Analysis Suite',
    category: 'calculators',
    description: 'Minimize logic with K-Maps, dynamically generate Verilog FSMs, and visualize ADC/DAC quantization errors.',
    syllabus: 'EEE 2113',
    icon: Cpu,
    route: '/digital-tools',
    badge: '2nd Year Module'
  },
  {
    id: 'linear-systems-tools',
    title: 'Signals & Linear Systems Suite',
    category: 'calculators',
    description: 'Visualize LTI convolution, perform stability analysis via Pole-Zero plotting, and demonstrate Nyquist sampling.',
    syllabus: 'EEE 2201',
    icon: Activity,
    route: '/signal-tools/linear-systems',
    badge: '2nd Year Module'
  },
  {
    id: 'machine-tools',
    title: 'Electrical Machines I Suite',
    category: 'calculators',
    description: 'Analyze DC motor characteristics, calculate transformer efficiency and regulation, and design DC motor starters.',
    syllabus: 'EEE 2207',
    icon: Power,
    route: '/machine-tools',
    badge: '2nd Year Module'
  },
  {
    id: 'measurement-tools',
    title: 'Instrumentation & Measurements',
    category: 'calculators',
    description: 'Condition sensor signals, localize underground cable faults, and compute statistical propagation of errors.',
    syllabus: 'EEE 2211',
    icon: Ruler,
    route: '/measurement-tools',
    badge: '2nd Year Module'
  },
  {
    id: 'vlsi-tools',
    title: 'VLSI Circuits & Design Suite',
    category: 'calculators',
    description: 'Synthesize CMOS layouts with an AI agent, plot RC delay scaling bounds, and analyze SA0/SA1 faults.',
    syllabus: 'EEE 2213',
    icon: Layers,
    route: '/vlsi-tools',
    badge: '2nd Year Module'
  },
  {
    id: 'hardware-shop',
    title: 'Hardware Design & Practice Suite',
    category: 'calculators',
    description: 'MCU sensor interfacing, PCB trace calculations with EMC guidelines, and hardware business pitch generation.',
    syllabus: 'EEE 3100',
    icon: Search,
    route: '/hardware-shop',
    badge: '3rd Year Module'
  },
  {
    id: 'ac-machines',
    title: 'AC Machines Suite',
    category: 'power',
    description: '3-Phase Induction Motors, Synchronous Generators, and V-Curve Analysis.',
    syllabus: 'EEE 3107',
    icon: Repeat,
    route: '/machine-tools/ac-machines',
    badge: '3rd Year Module'
  },
  {
    id: 'machine-drives',
    title: 'Motor Drives & Special Machines Suite',
    category: 'power',
    description: 'Analyze Brushless DC (BLDC) 6-step commutation with SVG inverters, calculate Clarke & Park d-q transformations, and tune closed-loop Field Oriented Control (FOC) PI regulators.',
    syllabus: 'EEE 4149',
    icon: Sliders,
    route: '/machine-drives',
    badge: '4th Year Specialization'
  },
  {
    id: 'control-tools',
    title: 'Advanced Control Systems Suite',
    category: 'calculators',
    description: 'State-Space modeling, Root Locus/Nyquist plotting, and Compensator/PID Design.',
    syllabus: 'EEE 3105',
    icon: Activity,
    route: '/control-tools',
    badge: '3rd Year Module'
  },
  {
    id: 'computational-tools',
    title: 'Computational Methods Suite',
    category: 'calculators',
    description: 'Numerical Root Finding, ODE Solvers, and Curve Fitting & Regression.',
    syllabus: 'EEE 3109',
    icon: FunctionSquare,
    route: '/computational-tools',
    badge: '3rd Year Module'
  },
  {
    id: 'transmission-design',
    title: 'Transmission Design Suite',
    category: 'power',
    description: 'Overhead Line Sag & Tension, String Efficiency, and Cable Stress.',
    syllabus: 'EEE 3111',
    icon: Cable,
    route: '/power-tools/transmission-design',
    badge: '3rd Year Module'
  },
  {
    id: 'communication-tools',
    title: 'Communication Systems Suite',
    category: 'calculators',
    description: 'Digital Line Coding, AM/FM Spectrum Analysis, and Receiver Noise Cascade.',
    syllabus: 'EEE 3117',
    icon: Radio,
    route: '/communication-tools',
    badge: '3rd Year Module'
  },
  {
    id: 'power-electronics',
    title: 'Power Electronics Suite',
    category: 'power',
    description: 'DC-DC Choppers, SCR Rectifiers, and SPWM Inverter Harmonics.',
    syllabus: 'EEE 3203',
    icon: Cpu,
    route: '/power-electronics',
    badge: '3rd Year Module'
  },
  {
    id: 'dsp-tools',
    title: 'Digital Signal Processing Suite',
    category: 'calculators',
    description: 'Discrete Convolution, FFT Analyzers, and FIR/IIR Filter Design.',
    syllabus: 'EEE 3207',
    icon: Activity,
    route: '/dsp-tools',
    badge: '3rd Year Module'
  },
  {
    id: 'power-systems-ii',
    title: 'Power Systems II Suite',
    category: 'power',
    description: 'Iterative Power Flow, Symmetrical/Unsymmetrical Fault Analysis, and Transient Stability (Swing Equation).',
    syllabus: 'EEE 3211',
    icon: Zap,
    route: '/power-tools/system-analysis',
    badge: '3rd Year Module'
  },
  {
    id: 'advanced-comm-tools',
    title: 'Advanced Comm Suite',
    category: 'calculators',
    description: 'High-Order Modulation (M-ary), Error Correcting Codes, and Diversity Combining.',
    syllabus: 'EEE 3217',
    icon: Radio,
    route: '/communication-tools/advanced',
    badge: '3rd Year Module'
  },
  {
    id: 'services-design',
    title: 'Electrical Services Design',
    category: 'power',
    description: 'A complete illumination and breaker sizing suite. Calculate lumens, copper/aluminum feeder cable sizes, and get real-time NEC guidelines.',
    syllabus: 'EEE 4100 / Illumination & Distribution',
    icon: Wrench,
    route: '/services-design',
    badge: '4th Year Module'
  },
  {
    id: 'embedded-tools',
    title: 'EEE 4109 Embedded Systems Suite',
    category: 'embedded',
    description: 'A unified laboratory suite. Features bare-metal C/Assembly generators for STM32, RISC-V, and PLC; 8086 register step-trace; Timer/PWM frequency synthesis; and interactive ladder logic simulator.',
    syllabus: 'EEE 4109 / Microprocessors & Embedded Systems',
    icon: Cpu,
    route: '/embedded-tools',
    badge: 'Simulation Suite'
  },
  {
    id: 'power-economics',
    title: 'Power Plant Economics Suite',
    category: 'power',
    description: 'Evaluate Load Curve analysis, compute Diversity Factor, run Incremental Cost ELD optimization, and graph Straight-Line vs. Sinking Fund asset depreciation.',
    syllabus: 'EEE 4111 / Power Plant Engineering',
    icon: TrendingUp,
    route: '/power-tools/plant-economics',
    badge: '4th Year Module'
  },
  {
    id: 'capstone-workspace',
    title: 'Capstone Hub & Thesis Writer',
    category: 'academic',
    description: 'Collaborative Gantt charts, project tasks, and an LLM academic chapter supervisor that drafts well-structured thesis sections in formal Markdown.',
    syllabus: 'EEE 4002 / Capstone Design II',
    icon: GraduationCap,
    route: '/capstone-workspace',
    badge: 'Thesis Desk'
  },
  {
    id: 'ai-tutor',
    title: 'Syllabus AI Tutor',
    category: 'embedded',
    description: 'Interactive AI tutor specifically aligned with university syllabus milestones. Solve complex academic homework or explain circuit theory.',
    syllabus: 'All EEE Core Syllabus Levels',
    icon: MessageSquare,
    route: '/ai-tutor',
    badge: 'Conversational'
  },
  {
    id: 'research-assistant',
    title: 'IEEE Literature Assistant',
    category: 'academic',
    description: 'Synthesize academic engineering papers. Generate LaTeX formulas, compose document abstracts, and draft hardware design patent applications.',
    syllabus: 'IEEE Academic Style Guides',
    icon: BookOpen,
    route: '/research-assistant'
  },
  {
    id: 'pro-simulators',
    title: 'Pro Interactive Simulators',
    category: 'calculators',
    description: 'Immersive simulated labs. Launch an oscilloscope stream, inspect live power grid generators, or wire standard logic gate sandboxes.',
    syllabus: 'General Lab Simulators',
    icon: Sliders,
    route: '/pro-simulators',
    badge: 'Interactive'
  },
  {
    id: 'core-tools',
    title: 'Syllabus Solvers Suite',
    category: 'calculators',
    description: 'Highly-calibrated mathematical solvers for waveguides propagation, transformer core losses, Maxwell/Schering Bridges, and VLSI profiles.',
    syllabus: 'EEE 2107 / 2207 / 2211 / 2213',
    icon: Grid,
    route: '/core-tools'
  },
  {
    id: 'advanced-tools',
    title: 'Advanced Machine Cores',
    category: 'calculators',
    description: 'Deep physical simulation engines for 3-phase induction motors, DC-DC buck/boost switches, and PID closed-loop transient response.',
    syllabus: 'Electrical Machines & Control Systems',
    icon: Layers,
    route: '/advanced-tools'
  },
  {
    id: 'hardware-ai',
    title: 'Edge Intelligence Hub',
    category: 'embedded',
    description: 'Explore neural network optimizations for microcontrollers, map tinyML quantizations, and inspect edge AI processor frameworks.',
    syllabus: 'EEE 4000+ Specializations',
    icon: Network,
    route: '/hardware-ai'
  },
  {
    id: 'capstone-hub',
    title: 'Historical Project Catalog',
    category: 'academic',
    description: 'A searchable index of historic university capstone projects, final year hardware prototypes, and digital circuit schematics.',
    syllabus: 'Project Archive Desk',
    icon: FolderGit2,
    route: '/capstone-hub'
  },
  {
    id: 'protection-tools',
    title: 'Protection & Switchgear Analytics',
    category: 'power',
    description: 'IDMT relay coordination simulator with logarithmic TCC graphs, Mho Distance Relay R-X plane trajectory plotter, Transient Recovery Voltage calculations, and an interactive AI switchgear advisor.',
    syllabus: 'EEE 4211 / Power System Protection',
    icon: Shield,
    route: '/power-tools/protection',
    badge: '4th Year Even'
  },
  {
    id: 'stability-control',
    title: 'Power System Stability Suite',
    category: 'power',
    description: 'Analyze Small Signal Stability via SMIB eigenvalues & PSS tuning, numerically integrate non-linear Swing equations using RK4, and compute P-V Nose voltage stability limits.',
    syllabus: 'EEE 4141 / Power System Stability',
    icon: Zap,
    route: '/power-tools/stability-control',
    badge: '4th Year Odd'
  },
  {
    id: 'high-voltage',
    title: 'High Voltage Engineering Suite',
    category: 'power',
    description: 'Analyze Gas Breakdown via Paschen\'s Law, simulate Marx Generator stage discharge and Standard lightning impulse waveforms, and design Insulation Coordination with BIL protective margins.',
    syllabus: 'EEE 4143 / High Voltage Engineering',
    icon: Sparkles,
    route: '/power-tools/high-voltage',
    badge: '4th Year Odd'
  },
  {
    id: 'hvdc-facts',
    title: 'HV Transmission & FACTS Suite',
    category: 'power',
    description: 'Simulate FACTS midpoint voltage profile enhancers (STATCOM/SVC), analyze 12-pulse HVDC converter harmonics cancellation, and model HVAC vs HVDC breakeven economic distances.',
    syllabus: 'EEE 4243 / High Voltage Transmission',
    icon: Zap,
    route: '/power-tools/hvdc-facts',
    badge: '4th Year Even'
  },
  {
    id: 'smart-grids-advanced',
    title: 'Advanced Smart Grid Suite',
    category: 'power',
    description: 'Simulate AMI multi-layer data flows with dynamic network layers, optimize DER battery and EV load shaping using dynamic pricing demand response, and visualize GIS-based optimal power flow (OPF) routing.',
    syllabus: 'EEE 4247 / Smart Grids',
    icon: Cpu,
    route: '/smart-grids-advanced',
    badge: '4th Year Even'
  },
  {
    id: 'nuclear-tools',
    title: 'Nuclear Power Engineering Suite',
    category: 'power',
    description: 'Simulate real-time PWR reactor core kinetics & thermal dynamics with automatic SCRAM safety shutdown, calculate Levelized Cost of Energy (LCOE) breakeven economics, and interactively step through critical reactor disaster sequences.',
    syllabus: 'EEE 4245 / Nuclear Power Engineering',
    icon: Shield,
    route: '/nuclear-tools',
    badge: '4th Year Even'
  },
  {
    id: 'grid-operations',
    title: 'Grid Operation & Control Suite',
    category: 'power',
    description: 'Model Automatic Generation Control (AGC/LFC) frequency transient dynamics, compute dynamic 24-hour Unit Commitment (UC) schedules, and evaluate security rankings with N-1 contingency analysis.',
    syllabus: 'EEE 4249 / Power System Operation & Control',
    icon: Activity,
    route: '/grid-operations',
    badge: '4th Year Even'
  },
  {
    id: 'reliability-tools',
    title: 'Power System Reliability Suite',
    category: 'power',
    description: 'Compute equivalent MTTF and series/parallel decay, simulate Markov chain generator state transitions with availability nodes, and analyze cumulative blackout risk with recursive LOLP & LOEP COPT modeling.',
    syllabus: 'EEE 4251 / Power System Reliability',
    icon: Shield,
    route: '/reliability-tools',
    badge: '4th Year Even'
  },
  {
    id: 'automation-tools',
    title: 'Industrial Automation Suite',
    category: 'power',
    description: 'Simulate closed-loop tank level PID controller tuning with leakage disturbance and real-time SVG water filling, optimize VFD pump energy savings using Affinity Laws compared to mechanical throttling, and visualize 2D top-down Stepper Motor drive sequences.',
    syllabus: 'EEE 4145 / Industrial Automation',
    icon: Sliders,
    route: '/automation-tools',
    badge: '4th Year Even'
  },
  {
    id: 'microwave-tools',
    title: 'Microwave & RF Design Suite',
    category: 'embedded',
    description: 'Friis free-space transmission & link budget analyzer with animated wave propagation, alongside complex-valued VSWR & impedance matching analysis.',
    syllabus: 'EEE 4217 / Microwave Engineering',
    icon: Radio,
    route: '/microwave-tools',
    badge: '4th Year Even'
  },
  {
    id: 'renewable-tools',
    title: 'Renewable Energy & Automation Hub',
    category: 'power',
    description: 'Solar PV single-diode model simulator with dynamic I-V & P-V curves tracking the MPP, and high-voltage Paschen\'s Law breakdown estimators.',
    syllabus: 'EEE 4147 / PV & MPPT Systems',
    icon: Zap,
    route: '/renewable-tools',
    badge: 'Renewables Track'
  },
  {
    id: 'comm-tools',
    title: 'Advanced Communication & Coding Suite',
    category: 'embedded',
    description: 'Hexagonal cellular planner with 1st-tier co-channel SIR calculations, and a complete source coding suite computing Shannon entropy and Huffman dictionaries.',
    syllabus: 'EEE 4183 / 4185 Information Theory',
    icon: Radio,
    route: '/comm-tools',
    badge: 'Telecomms Track'
  },
  {
    id: 'ml-engineering',
    title: 'AI Data Classification & ML Code Generator',
    category: 'academic',
    description: 'A privacy-preserving machine learning engineering assistant. Upload sensor CSV headers, get recommended neural/forest architectures, and export Python pipeline training scripts.',
    syllabus: 'EEE 4121 / Machine Learning',
    icon: Cpu,
    route: '/ml-engineering',
    badge: 'AI & ML Track'
  },
  {
    id: 'iot-dashboard',
    title: 'Smart Grid & IoT Dashboard',
    category: 'power',
    description: 'A real-time simulated Microgrid/IoT monitoring panel tracking solar PV, grid, and home load, with an LLM-powered Demand Side Management (DSM) optimizer.',
    syllabus: 'EEE 4241 / EEE 4247 IoT & Smart Grids',
    icon: Grid,
    route: '/iot-dashboard',
    badge: '4th Year Even'
  },
  {
    id: 'iiot-tools',
    title: 'Industrial IoT (IIoT) Suite',
    category: 'power',
    description: 'Simulate real-time sensor telemetry with alarm logic, compare local Fog vs Cloud network propagation topologies, and perform Predictive Maintenance via Linear Regression.',
    syllabus: 'EEE 4241 / Industrial IoT',
    icon: Network,
    route: '/iiot-tools',
    badge: '4th Year Even'
  },
  {
    id: 'biomedical-analyzer',
    title: 'Biomedical Signal AI Analyzer',
    category: 'embedded',
    description: 'Upload diagnostic bio-signal CSV files, chart interactive ECG waveforms, and obtain a clinical-style signal assessment and filtration summary from the LLM.',
    syllabus: 'EEE 4261 / Biomedical Engineering',
    icon: Activity,
    route: '/biomedical-analyzer',
    badge: '4th Year Even'
  },
  {
    id: 'telecom-radar',
    title: 'Telecom & Radar Design Suite',
    category: 'embedded',
    description: 'Model 2D polar/scatter antenna array Radiation Patterns using Array Factor math, and calculate Maximum Radar Range using multi-parameter radar equations.',
    syllabus: 'EEE 4281 / 4283 Communication & Radar',
    icon: Radio,
    route: '/telecom-radar',
    badge: '4th Year Even'
  },
  {
    id: 'power-operations',
    title: 'Power Operations & Reliability Solver',
    category: 'power',
    description: 'Solve optimal generator load dispatch with Lagrange multipliers and fuel curve coefficients, and analyze grid Loss of Load Probability (LOLP).',
    syllabus: 'EEE 4249 / 4251 Power Operations',
    icon: TrendingUp,
    route: '/power-operations',
    badge: '4th Year Even'
  },
  {
    id: 'robotics-hub',
    title: 'Robotics Kinematics & Embedded AI',
    category: 'embedded',
    description: 'Input joint parameters to compute step-by-step D-H Forward Kinematics matrices and final end-effector positions, plus generate bare-metal STM32/RTOS servo control code.',
    syllabus: 'EEE 4223 / 4225 Robotics & Control',
    icon: Cpu,
    route: '/robotics-hub',
    badge: '4th Year Even'
  }
];

interface SemesterOption {
  id: string;
  year: number;
  semester: 'odd' | 'even';
  label: string;
  courses: { code: string; name: string; tools: string[]; description?: string }[];
}

const SEMESTER_OPTIONS: SemesterOption[] = [
  {
    id: 'y1-odd',
    year: 1,
    semester: 'odd',
    label: '1st Year - Odd Semester',
    courses: [
      { code: 'EEE 1101', name: 'Electrical Circuits I', tools: ['circuit-tools', 'pro-simulators', 'core-tools'], description: 'Fundamental circuit variables, Ohm\'s law, Kirchhoff\'s laws, mesh and nodal analysis.' },
      { code: 'CSE 1111', name: 'Computer Programming', tools: ['embedded-assistant'], description: 'Basic C programming, logic structures, functions, arrays, and algorithm design.' },
      { code: 'Math 1101', name: 'Engineering Mathematics I', tools: ['computational-tools'], description: 'Differential and integral calculus, infinite series, and solid geometry.' },
      { code: 'Phy 1111', name: 'Physics', tools: ['em-tools'], description: 'Heat and thermodynamics, waves, physical optics, and modern physics.' },
      { code: 'Hum 1111', name: 'Technical English', tools: ['research-assistant'], description: 'Grammar, vocabulary, writing, technical report writing, and presentations.' }
    ]
  },
  {
    id: 'y1-even',
    year: 1,
    semester: 'even',
    label: '1st Year - Even Semester',
    courses: [
      { code: 'EEE 1201', name: 'Electrical Circuits II', tools: ['circuit-tools', 'pro-simulators', 'core-tools'], description: 'Sinusoidal steady-state analysis, impedance, phasor diagrams, resonance, and three-phase circuits.' },
      { code: 'EEE 1203', name: 'Electronics I', tools: ['electronics-i-tools', 'pro-simulators'], description: 'Semiconductor diode characteristics, rectifiers, zener diodes, BJT and MOSFET operations.' },
      { code: 'EEE 1205', name: 'Electrical Engineering Materials', tools: ['material-tools'], description: 'Properties of conductors, dielectrics, semiconductors, magnetic materials, and superconductors.' },
      { code: 'Chem 1211', name: 'Chemistry', tools: ['material-tools'], description: 'Atomic structure, periodic table, chemical bonding, electrochemistry, and thermodynamics.' },
      { code: 'Math 1201', name: 'Engineering Mathematics II', tools: ['computational-tools'], description: 'Ordinary differential equations, series solutions, Laplace transforms, and Fourier series.' }
    ]
  },
  {
    id: 'y2-odd',
    year: 2,
    semester: 'odd',
    label: '2nd Year - Odd Semester',
    courses: [
      { code: 'EEE 2103', name: 'Electronics II', tools: ['electronics-ii-tools', 'pro-simulators', 'core-tools'], description: 'BJT and MOSFET amplifiers, frequency response, feedback topologies, and operational amplifiers.' },
      { code: 'EEE 2107', name: 'Electromagnetic Fields and Waves', tools: ['em-tools', 'core-tools'], description: 'Electrostatics, magnetostatics, Maxwell\'s equations, and electromagnetic wave propagation.' },
      { code: 'EEE 2113', name: 'Digital Electronics I', tools: ['digital-tools', 'pro-simulators'], description: 'Logic minimization, K-Maps, finite state machines, Verilog HDL, and data converters.' },
      { code: 'Math 2101', name: 'Engineering Mathematics III', tools: ['computational-tools'], description: 'Complex variables, Fourier transforms, Laplace transforms, and linear algebra.' },
      { code: 'ME 2101', name: 'Basic Mechanical Engineering', tools: ['material-tools'], description: 'Energy sources, steam generators, steam and gas turbines, and internal combustion engines.' }
    ]
  },
  {
    id: 'y2-even',
    year: 2,
    semester: 'even',
    label: '2nd Year - Even Semester',
    courses: [
      { code: 'Math 2201', name: 'Engineering Mathematics IV', tools: ['computational-tools'], description: 'Fourier analysis, vector calculus, partial differential equations, and complex analysis.' },
      { code: 'EEE 2201', name: 'Signals and Linear Systems', tools: ['linear-systems-tools', 'pro-simulators', 'core-tools'], description: 'Continuous-time signals, Fourier series, Fourier transform, Laplace transform, and system functions.' },
      { code: 'EEE 2207', name: 'Electrical Machines I', tools: ['machine-tools', 'advanced-tools'], description: 'Transformers, DC generators and DC motors: operating principles, characteristics, and testing.' },
      { code: 'EEE 2211', name: 'Measurements and Instrumentation', tools: ['measurement-tools', 'core-tools'], description: 'Sensor signal conditioning, bridge circuits, underground cable faults, and statistical error analysis.' },
      { code: 'EEE 2213', name: 'VLSI Circuits and Design I', tools: ['vlsi-tools'], description: 'CMOS layout, stick diagrams, RC scaling limits, and sensitized path fault testing.' }
    ]
  },
  {
    id: 'y3-odd',
    year: 3,
    semester: 'odd',
    label: '3rd Year - Odd Semester',
    courses: [
      { code: 'EEE 3105', name: 'Control System Engineering', tools: ['control-tools', 'core-tools'], description: 'State-space, stability, Root Locus, Nyquist, and PID compensators.' },
      { code: 'EEE 3107', name: 'Electrical Machines II', tools: ['ac-machines', 'machine-tools', 'advanced-tools'], description: 'Induction motors, synchronous generators and motors: analysis, starting, and speed control.' },
      { code: 'EEE 3109', name: 'Computational Methods in Engineering', tools: ['computational-tools', 'core-tools'], description: 'Numerical root finding, ODE solvers, and curve fitting regression.' },
      { code: 'EEE 3111', name: 'Power Systems I', tools: ['transmission-design', 'power-economics'], description: 'Transmission line parameters, sag calculations, insulator performance, and cable parameter modeling.' },
      { code: 'EEE 3117', name: 'Communication Engineering I', tools: ['communication-tools', 'microwave-tools'], description: 'Line coding, analog modulation (AM, FM), superheterodyne receivers, noise calculations.' },
      { code: 'EEE 3100', name: 'Electronics Shop Practice', tools: ['hardware-shop', 'core-tools'], description: 'Practical PCB design, microcontroller interfacing, electromagnetic compatibility, and prototyping.' }
    ]
  },
  {
    id: 'y3-even',
    year: 3,
    semester: 'even',
    label: '3rd Year - Even Semester',
    courses: [
      { code: 'EEE 3203', name: 'Power Electronics', tools: ['power-electronics', 'power-operations'], description: 'DC-DC converters, phase-controlled rectifiers, and SPWM inverters.' },
      { code: 'EEE 3207', name: 'Digital Signal Processing', tools: ['dsp-tools', 'core-tools'], description: 'Discrete convolution, DFT, FFT algorithms, and FIR/IIR filter design.' },
      { code: 'EEE 3211', name: 'Power Systems II', tools: ['power-systems-ii', 'power-economics'], description: 'Power flow, fault analysis, sequence networks, and transient stability.' },
      { code: 'EEE 3217', name: 'Communication Engineering II', tools: ['advanced-comm-tools', 'communication-tools'], description: 'Digital modulation techniques (QAM, PSK), information theory, and channel coding.' },
      { code: 'Hum 3211', name: 'Financial Account and Economic Analysis', tools: ['power-economics'], description: 'Principles of accounting, financial statement analysis, cost-benefit analysis, and engineering economics.' },
      { code: 'EEE 3202', name: 'Capstone Project Design I', tools: ['capstone-workspace', 'research-assistant'], description: 'Literature review, project formulation, budgeting, scheduling, and initial design simulation.' }
    ]
  },
  {
    id: 'y4-odd',
    year: 4,
    semester: 'odd',
    label: '4th Year - Odd Semester',
    courses: [
      { code: 'EEE 4100', name: 'Electrical Services Design', tools: ['services-design'], description: 'Sizing feeders, switchgear, illumination calculations, and substation layout design.' },
      { code: 'EEE 4109', name: 'Microprocessors and Embedded Systems', tools: ['embedded-assistant', 'hardware-ai'], description: 'Assembly and C language development, RTOS, memory interfacing, and hardware peripherals.' },
      { code: 'EEE 4111', name: 'Power Plant Engineering and Economy', tools: ['power-economics', 'power-operations'], description: 'Power plant economics, load curves, hydrothermal coordination, and environmental impacts.' },
      { code: 'IPE 4111', name: 'Engineering Management, Laws and Safety', tools: ['power-economics'], description: 'Project management techniques, commercial laws, safety standards, and industrial management.' },
      { code: 'EEE 4141', name: 'Power System Stability and Control (Elective I)', tools: ['stability-control'], description: 'Power system transient stability, small-signal oscillations, and swing equation modeling.' },
      { code: 'EEE 4143', name: 'High Voltage Engineering (Elective I)', tools: ['high-voltage'], description: 'Gas breakdown models, Marx impulse generators, and insulation coordination.' },
      { code: 'EEE 4145', name: 'Industrial Automation and Control (Elective I)', tools: ['automation-tools'], description: 'PID process control, industrial instrumentation, and automated feedback loops.' },
      { code: 'EEE 4147', name: 'Renewable Energy (Elective II)', tools: ['power-economics'], description: 'Solar, wind, biomass energy systems conversion and grid integration.' },
      { code: 'EEE 4149', name: 'Special Machines and AC Drives (Elective II)', tools: ['machine-drives'], description: 'Field Oriented Control, special electrical machines, and adjustable speed AC motor drives.' },
      { code: 'EEE 4002', name: 'Capstone Project Design II', tools: ['capstone-workspace', 'capstone-hub'], description: 'Hardware prototype construction, system integration, validation, and final thesis defense.' }
    ]
  },
  {
    id: 'y4-even',
    year: 4,
    semester: 'even',
    label: '4th Year - Even Semester',
    courses: [
      { code: 'EEE 4211', name: 'Power System Protection and Switchgear', tools: ['protection-tools'], description: 'IDMT relay coordination, circuit breakers, busbar, transformer and generator protection.' },
      { code: 'EEE 4217', name: 'Microwave Engineering', tools: ['microwave-tools', 'telecom-radar'], description: 'Transmission lines, Smith chart, waveguides, passive microwave devices, RF link budget.' },
      { code: 'Hum 4212', name: 'Engineering Ethics, Sustainability and Innovation', tools: ['research-assistant'], description: 'Professional ethics, sustainable engineering practices, environmental protection, and technological innovation.' },
      { code: 'EEE 4241', name: 'Internet of Things (Elective III)', tools: ['iot-dashboard'], description: 'Sensors integration, communication protocols, cloud connectivity, and IoT architectures.' },
      { code: 'EEE 4243', name: 'High Voltage Transmission Systems (Elective III)', tools: ['hvdc-facts'], description: 'HVDC converters, FACTS devices, STATCOM, SVC, and high-voltage transmission economics.' },
      { code: 'EEE 4245', name: 'Nuclear Power Engineering (Elective IV)', tools: ['nuclear-tools'], description: 'Reactor physics, heat generation and removal, SCRAM safety, and nuclear plant cycles.' },
      { code: 'EEE 4247', name: 'Smart Grids (Elective IV)', tools: ['smart-grids-advanced'], description: 'Smart metering, demand response, distributed energy resource management, and battery storage.' },
      { code: 'EEE 4249', name: 'Power System Operation and Control (Elective V)', tools: ['grid-operations'], description: 'Load frequency control, unit commitment, dynamic programming, and economic dispatch.' },
      { code: 'EEE 4251', name: 'Power System Reliability (Elective V)', tools: ['reliability-tools'], description: 'Loss of load probability (LOLP), capacity outage probability tables (COPT), and availability analysis.' }
    ]
  }
];

export default function ToolsLayout() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'playground'>('catalog');
  const [categoryFilter, setCategoryFilter] = useState<ToolCategory>('all');
  const [playgroundToolId, setPlaygroundToolId] = useState<PlaygroundToolId>('timer555');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [isPreferredModalOpen, setIsPreferredModalOpen] = useState(false);

  const activePlaygroundTool = PLAYGROUND_TOOLS.find(t => t.id === playgroundToolId) || PLAYGROUND_TOOLS[0];
  const ActivePlaygroundComponent = activePlaygroundTool.component;

  // Filter tools based on selected filter and search query
  const filteredCatalogTools = CATALOG_TOOLS.filter(tool => {
    // If a preferred semester is selected, filter by the tools mapped to that semester's courses
    if (selectedSemesterId) {
      const sem = SEMESTER_OPTIONS.find(s => s.id === selectedSemesterId);
      if (sem) {
        const semToolIds = sem.courses.flatMap(c => c.tools || []);
        if (!semToolIds.includes(tool.id)) {
          return false;
        }
      }
    }

    const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter;
    if (!matchesCategory) return false;

    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const matchesTitle = tool.title.toLowerCase().includes(query);
    const matchesDescription = tool.description.toLowerCase().includes(query);
    const matchesSyllabus = tool.syllabus.toLowerCase().includes(query);
    const matchesCategoryName = tool.category.toLowerCase().includes(query);
    const matchesBadge = tool.badge ? tool.badge.toLowerCase().includes(query) : false;

    return matchesTitle || matchesDescription || matchesSyllabus || matchesCategoryName || matchesBadge;
  });

  return (
    <div id="tools-layout" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-navy-light/60">
        <div>
          <div className="flex items-center gap-2 text-emerald-accent font-semibold text-xs tracking-wider uppercase mb-1">
            <Sparkles className="h-4.5 w-4.5 animate-pulse" /> EEE Engineering Suites
          </div>
          <h1 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
            Departmental <span className="text-emerald-accent">Tools Hub</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
            A comprehensive, modular environment housing interactive design calculators, 4th-year power and embedded systems suites, and academic capstone research utilities.
          </p>
        </div>

        {/* Major Mode Toggle (Catalog vs Sandbox) */}
        <div className="flex bg-navy-dark/80 p-1.5 rounded-xl border border-navy-light/60 self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-emerald-accent text-navy-dark shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="h-4 w-4" />
            Tools Catalog
          </button>
          <button
            onClick={() => setActiveTab('playground')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer ${
              activeTab === 'playground'
                ? 'bg-emerald-accent text-navy-dark shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Cpu className="h-4 w-4" />
            Circuit Lab Sandbox
          </button>
        </div>
      </div>

      {/* CATALOG VIEW */}
      {activeTab === 'catalog' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Filter & Search Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-navy-light/40 pb-4">
              {/* Category Filter bar */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: 'All EEE Suites' },
                { id: 'calculators', label: 'Calculators & Solvers' },
                { id: 'power', label: 'Power & Distribution' },
                { id: 'embedded', label: 'Embedded Systems & AI' },
                { id: 'academic', label: 'Research & Capstone' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id as ToolCategory)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide border transition-all cursor-pointer ${
                    categoryFilter === cat.id
                      ? 'bg-emerald-accent/10 border-emerald-accent/30 text-emerald-accent shadow-sm'
                      : 'bg-navy-card/40 border-navy-light/40 text-slate-400 hover:bg-navy-light/20 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}

              {/* Preferred stage button */}
              <button
                onClick={() => setIsPreferredModalOpen(true)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide border transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedSemesterId
                    ? 'bg-emerald-accent/15 border-emerald-accent text-emerald-accent shadow-md font-black animate-pulse'
                    : 'bg-navy-card/40 border-navy-light/40 text-slate-400 hover:bg-navy-light/20 hover:text-slate-200'
                }`}
                title="Select Year and Semester for Preferred Tools"
              >
                <GraduationCap className="h-4 w-4" />
                {selectedSemesterId 
                  ? `Preferred: ${SEMESTER_OPTIONS.find(s => s.id === selectedSemesterId)?.label.replace(' Semester', '').replace(' Year', 'Yr')}` 
                  : 'Preferred'}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search tools by name or purpose..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-navy-card/80 text-xs text-white placeholder-slate-500 pl-10 pr-10 py-2.5 rounded-xl border border-navy-light focus:border-emerald-accent/60 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Preferred Selection Summary Banner */}
          {selectedSemesterId && (
            <div className="bg-navy-card/80 border border-emerald-accent/30 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fadeIn">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-accent uppercase tracking-widest bg-emerald-accent/10 border border-emerald-accent/20 px-2.5 py-1 rounded-md">
                  Active Preferred Filter
                </span>
                <h3 className="text-base font-bold text-white mt-2">
                  {SEMESTER_OPTIONS.find(s => s.id === selectedSemesterId)?.label}
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {SEMESTER_OPTIONS.find(s => s.id === selectedSemesterId)?.courses.map(course => (
                    <span key={course.code} className="text-[11px] font-mono text-slate-300 bg-navy-light/40 px-2.5 py-1 rounded-lg border border-navy-light/60" title={course.name}>
                      <strong className="text-emerald-accent font-semibold">{course.code}</strong>: {course.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2.5 shrink-0 self-stretch md:self-auto justify-end">
                <button
                  onClick={() => setIsPreferredModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white bg-navy-light/30 hover:bg-navy-light/50 border border-navy-light rounded-xl cursor-pointer transition-all"
                >
                  Change Semester
                </button>
                <button
                  onClick={() => setSelectedSemesterId(null)}
                  className="px-4 py-2 text-xs font-bold text-navy-dark bg-emerald-accent hover:bg-emerald-hover rounded-xl cursor-pointer transition-all"
                >
                  Clear Filter
                </button>
              </div>
            </div>
          )}

          {/* Featured Sandbox Banner in All or Calculators */}
          {(categoryFilter === 'all' || categoryFilter === 'calculators') && (
            <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-accent/20 via-navy-light/30 to-blue-500/5 border border-emerald-accent/25 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2 max-w-2xl z-10">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-accent/10 border border-emerald-accent/20 text-[10px] font-mono text-emerald-accent uppercase tracking-widest font-bold">
                  Featured Core Solvers
                </div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Interactive Circuit & Semiconductor Laboratory
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Preserve your core design flow. Simulate 555 astable/monostable timing, BJT voltage dividers bias saturation points, operational amplifier clipping limits, and custom truth table generators in a live modular dashboard.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('playground')}
                className="z-10 px-5 py-3 bg-emerald-accent hover:bg-emerald-hover text-navy-dark font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer self-stretch md:self-auto justify-center"
              >
                Open Sandbox Lab
                <ArrowRight className="h-4 w-4" />
              </button>
              {/* Abs grid pattern bg */}
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>
            </div>
          )}

          {/* Catalog Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCatalogTools.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <Link
                  key={tool.id}
                  to={tool.route}
                  className="group relative flex flex-col justify-between bg-navy-card hover:bg-navy-light/10 border border-navy-light hover:border-emerald-accent/30 p-5 rounded-2xl shadow-md transition-all duration-300 cursor-pointer text-left"
                >
                  <div className="space-y-3.5">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-light/40 group-hover:bg-emerald-accent/10 border border-navy-light/60 group-hover:border-emerald-accent/30 text-slate-300 group-hover:text-emerald-accent transition-all">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block bg-navy-dark/60 border border-navy-light/40 px-2 py-0.5 rounded-md">
                          {tool.category}
                        </span>
                        {tool.badge && (
                          <span className="text-[8px] font-sans font-bold text-emerald-accent uppercase tracking-wider block bg-emerald-accent/10 border border-emerald-accent/20 px-1.5 py-0.5 rounded">
                            {tool.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-accent transition-colors">
                        {tool.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed min-h-[56px]">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  {/* Syllabus link */}
                  <div className="mt-5 pt-3.5 border-t border-navy-light/40 flex justify-between items-center text-[10px]">
                    <div className="text-slate-500 font-mono">
                      {tool.syllabus}
                    </div>
                    <div
                      className="inline-flex items-center gap-1 text-emerald-accent font-bold group-hover:text-emerald-hover transition-colors"
                    >
                      Launch Suite
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {filteredCatalogTools.length === 0 && (
            <div className="p-12 text-center border border-dashed border-navy-light rounded-2xl">
              <BadgeAlert className="h-8 w-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No active tools in this category filter. Select another filter to explore.</p>
            </div>
          )}
        </div>
      )}

      {/* PLAYGROUND SANDBOX VIEW */}
      {activeTab === 'playground' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
          {/* Navigation - Sidebar on desktop, horizontal bar on mobile */}
          <aside className="lg:col-span-3 space-y-4">
            <button
              onClick={() => setActiveTab('catalog')}
              className="w-full flex items-center gap-2 px-3 py-2 bg-navy-light/10 hover:bg-navy-light/20 border border-navy-light/50 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Back to Tools Catalog
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex flex-col space-y-1 bg-navy-light/20 p-2.5 rounded-xl border border-navy-light/60">
              <span className="px-3 pt-1 pb-2 text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold block border-b border-navy-light/40 mb-2">
                Select Calculator
              </span>
              {PLAYGROUND_TOOLS.map((tool) => {
                const Icon = tool.icon;
                const isActive = tool.id === playgroundToolId;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setPlaygroundToolId(tool.id)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-accent text-navy-dark shadow-md'
                        : 'text-slate-300 hover:bg-navy-light/30 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    <span className="truncate">{tool.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Navigation Scroll List */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {PLAYGROUND_TOOLS.map((tool) => {
                const Icon = tool.icon;
                const isActive = tool.id === playgroundToolId;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setPlaygroundToolId(tool.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide whitespace-nowrap transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-emerald-accent text-navy-dark border-emerald-accent'
                        : 'bg-navy-light/20 text-slate-300 border-navy-light/50'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{tool.title}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Content Panel */}
          <main className="lg:col-span-9 bg-navy-light/10 border border-navy-light/60 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
            {/* Card Header */}
            <div className="mb-6 pb-4 border-b border-navy-light">
              <div className="flex items-center gap-2.5 text-emerald-accent mb-1">
                <activePlaygroundTool.icon className="h-5 w-5 animate-pulse" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">EEE LAB SANDBOX</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {activePlaygroundTool.title}
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {activePlaygroundTool.description}
              </p>
            </div>

            {/* Render Active Component */}
            <ActivePlaygroundComponent />
          </main>
        </div>
      )}

      {/* Preferred Semester Selection Modal */}
      {isPreferredModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/90 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-navy-card border border-navy-light/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-navy-light/60 flex justify-between items-center bg-navy-dark/40">
              <div className="flex items-center gap-2.5">
                <GraduationCap className="h-6 w-6 text-emerald-accent" />
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    Select Your Curriculum Stage
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Filter tools mapped directly to your year and semester courses.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPreferredModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-light/30 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content / Grid */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SEMESTER_OPTIONS.map((sem) => {
                  const isSelected = selectedSemesterId === sem.id;
                  return (
                    <button
                      key={sem.id}
                      onClick={() => {
                        setSelectedSemesterId(sem.id);
                        setIsPreferredModalOpen(false);
                      }}
                      className={`text-left p-4 rounded-xl border transition-all flex flex-col justify-between cursor-pointer group ${
                        isSelected
                          ? 'bg-emerald-accent/10 border-emerald-accent text-white shadow-lg'
                          : 'bg-navy-dark/40 border-navy-light/60 hover:bg-navy-light/20 hover:border-emerald-accent/30 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-emerald-accent transition-colors">
                            Year {sem.year}
                          </span>
                          {isSelected && (
                            <span className="text-[9px] font-mono font-bold bg-emerald-accent text-navy-dark px-1.5 py-0.5 rounded uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white group-hover:text-emerald-accent transition-colors">
                          {sem.label}
                        </h4>
                        
                        <div className="mt-3.5 space-y-1.5">
                          {sem.courses.map(course => (
                            <div key={course.code} className="text-[10px] leading-relaxed text-slate-400 flex items-start gap-1">
                              <span className="font-mono text-emerald-accent font-bold shrink-0">{course.code}:</span>
                              <span className="truncate text-slate-300 font-sans">{course.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-navy-light/30 flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 font-mono">
                          {sem.courses.flatMap(c => c.tools || []).length} Tools Available
                        </span>
                        <span className="text-emerald-accent font-bold group-hover:translate-x-0.5 transition-transform">
                          Apply Filter &rarr;
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-navy-dark/40 border-t border-navy-light/60 flex justify-between items-center">
              <button
                onClick={() => {
                  setSelectedSemesterId(null);
                  setIsPreferredModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Clear Stage Filter
              </button>
              <button
                onClick={() => setIsPreferredModalOpen(false)}
                className="px-5 py-2.5 bg-emerald-accent hover:bg-emerald-hover text-navy-dark text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
