import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu,
  Terminal,
  Play,
  RotateCcw,
  Clock,
  Zap,
  Layers,
  ArrowLeft,
  Plus,
  Trash2,
  Settings,
  HelpCircle,
  Copy,
  Check,
  Code,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  RefreshCw,
  Sliders,
  PlayCircle,
  ChevronRight,
  BookOpen,
  Info,
  CheckCircle2,
  ListCollapse
} from 'lucide-react';
import { IEEEReportButton } from '../components/IEEEReportButton';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

// Hooks
import { useAssemblySimulator } from '../hooks/useAssemblySimulator';
import { useTimerPWM, TimerInputs } from '../hooks/useTimerPWM';
import { usePLCSimulator, ContactType } from '../hooks/usePLCSimulator';

interface ArchitectureOption {
  id: string;
  name: string;
  fileExt: string;
  fileName: string;
  icon: any;
  syllabusCode: string;
  syllabusName: string;
  starterPrompt: string;
  defaultCode: string;
  defaultPinMap: { pin: string; port: string; func: string; description: string }[];
}

const ARCHITECTURES: ArchitectureOption[] = [
  {
    id: 'STM32',
    name: '32-Bit STM32 (Cortex-M)',
    fileExt: 'c',
    fileName: 'stm32_adc_pwm.c',
    icon: Cpu,
    syllabusCode: 'EEE 4109',
    syllabusName: 'Microprocessors & Embedded Systems',
    starterPrompt: 'Write STM32 register-level C code to initialize ADC1 on Pin PA0. Set up Timer 3 (TIM3) Channel 1 on Pin PA6 to output a hardware PWM signal whose duty cycle directly reflects the analog conversion value.',
    defaultCode: `/* EEE 4109: STM32 Register-level ADC to PWM Controller */
#include "stm32f4xx.h"

void GPIO_Init(void) {
    // Enable AHB1 peripheral clock for GPIOA
    RCC->AHB1ENR |= RCC_AHB1ENR_GPIOAEN;
    
    // Configure PA0 as Analog Mode (0b11) for ADC1 Channel 0
    GPIOA->MODER |= (3UL << (0 * 2));
    
    // Configure PA6 as Alternate Function Mode (0b10) for TIM3_CH1
    GPIOA->MODER &= ~(3UL << (6 * 2));
    GPIOA->MODER |= (2UL << (6 * 2));
    
    // Map PA6 to TIM3 (AF2 / 0x02)
    GPIOA->AFR[0] &= ~(0xFUL << (6 * 4));
    GPIOA->AFR[0] |= (2UL << (6 * 4));
}

void TIM3_PWM_Init(void) {
    // Enable APB1 peripheral clock for TIM3
    RCC->APB1ENR |= RCC_APB1ENR_TIM3EN;
    
    // Set auto-reload value (Period = 1000)
    TIM3->ARR = 1000 - 1;
    
    // Set prescaler (Prescaler = 16 => 1MHz clock if system clock is 16MHz)
    TIM3->PSC = 16 - 1;
    
    // Configure Channel 1 in PWM Mode 1 (OC1M = 0b110) & enable output buffer
    TIM3->CCMR1 &= ~TIM_CCMR1_OC1M;
    TIM3->CCMR1 |= (6UL << TIM_CCMR1_OC1M_Pos) | TIM_CCMR1_OC1PE;
    
    // Enable TIM3 Channel 1 Capture/Compare output
    TIM3->CCER |= TIM_CCER_CC1E;
    
    // Enable main timer counter
    TIM3->CR1 |= TIM_CR1_CEN;
}

void ADC1_Init(void) {
    // Enable APB2 peripheral clock for ADC1
    RCC->APB2ENR |= RCC_APB2ENR_ADC1EN;
    
    // Enable ADC converter module (ADON)
    ADC1->CR2 |= ADC_CR2_ADON;
    
    // Set sequence registers: single conversion on Channel 0 (PA0)
    ADC1->SQR3 = 0;
}

uint16_t ADC1_Read(void) {
    // Start conversion of regular channels
    ADC1->CR2 |= ADC_CR2_SWSTART;
    
    // Wait for conversion complete flag (EOC)
    while (!(ADC1->SR & ADC_SR_EOC));
    
    // Return analog value
    return (uint16_t)(ADC1->DR);
}

int main(void) {
    GPIO_Init();
    TIM3_PWM_Init();
    ADC1_Init();
    
    while (1) {
        uint16_t adc_val = ADC1_Read(); // Read PA0 (12-bit, 0-4095)
        
        // Scale 12-bit ADC (0-4095) to TIM3 ARR range (0-999)
        uint32_t duty_cycle = (adc_val * 999) / 4095;
        
        // Update TIM3 Capture/Compare register 1
        TIM3->CCR1 = duty_cycle;
    }
}`,
    defaultPinMap: [
      { pin: 'PA0', port: 'GPIOA', func: 'ADC1_IN0', description: 'Analog Input sensor feed' },
      { pin: 'PA6', port: 'GPIOA', func: 'TIM3_CH1', description: 'Hardware PWM output driving gate driver' },
      { pin: 'VCC', port: '3.3V Rail', func: 'Power Source', description: 'ADC analog voltage reference' },
      { pin: 'GND', port: 'Ground Rail', func: 'Power Return', description: 'Common system reference' }
    ]
  },
  {
    id: 'RISCV',
    name: 'RISC-V 32-Bit Assembly',
    fileExt: 's',
    fileName: 'riscv_gpio.s',
    icon: Terminal,
    syllabusCode: 'EEE 4109',
    syllabusName: 'Microcomputer Architectures',
    starterPrompt: 'Write RISC-V assembly code to continuously sample a digital input Pin (GPIO 4) and mirror the state to an output LED pin (GPIO 12). Add helper macros or offset calculations.',
    defaultCode: `# EEE 4109: RISC-V GPIO Input-to-Output Mirroring Assembly
.section .text
.global _start

.equ GPIO_BASE, 0x10012000     # Base address of GPIO Controller
.equ GPIO_INPUT_VAL, 0x0C      # Offset for input register value
.equ GPIO_OUTPUT_VAL, 0x0C     # Offset for output register value (bi-directional or separate)
.equ GPIO_OUTPUT_EN, 0x08      # Offset for output enable register

_start:
    # 1. Enable GPIO 12 as Output Pin
    li t0, GPIO_BASE
    lw t1, GPIO_OUTPUT_EN(t0)  # Load current output enables
    li t2, (1 << 12)           # Shift bit for GPIO 12
    or t1, t1, t2              # Enable GPIO 12
    sw t1, GPIO_OUTPUT_EN(t0)  # Write back config
    
loop:
    # 2. Sample GPIO 4 Input state
    lw t1, GPIO_INPUT_VAL(t0)  # Read GPIO input values
    andi t1, t1, (1 << 4)      # Mask bit 4
    
    # 3. Mirror state to GPIO 12
    lw t3, GPIO_OUTPUT_VAL(t0) # Read current output values
    li t2, ~(1 << 12)
    and t3, t3, t2             # Clear GPIO 12 bit
    
    # If Input was high (t1 != 0), set GPIO 12 high
    beqz t1, write_io
    ori t3, t3, (1 << 12)      # Set GPIO 12 bit high
    
write_io:
    sw t3, GPIO_OUTPUT_VAL(t0) # Update output latch register
    j loop                     # Continue monitoring loop`,
    defaultPinMap: [
      { pin: 'GPIO4', port: 'GPIO Port', func: 'Digital Input', description: 'External toggle signal' },
      { pin: 'GPIO12', port: 'GPIO Port', func: 'Digital Output', description: 'LED indicator lamp feed' }
    ]
  },
  {
    id: 'PLC',
    name: 'PLC Ladder Logic IL',
    fileExt: 'txt',
    fileName: 'plc_latching.txt',
    icon: Layers,
    syllabusCode: 'EEE 4109',
    syllabusName: 'Industrial Controls',
    starterPrompt: 'Create a PLC Instruction List program to execute standard motor latching with a START push-button (NO), STOP push-button (NC), and motor contactor relay output.',
    defaultCode: `(* EEE 4109: Industrial Controls - Standard Motor Latching *)
(* Target PLC: Standard IEC 61131-3 Instruction List (IL) *)

LD      START_PB        (* Load State of Start Push-Button *)
OR      MOTOR_OUT       (* Latch with active motor feedback relay *)
ANDN    STOP_PB         (* Stop button (Normally Closed contact checks) *)
ST      MOTOR_OUT       (* Store back to the Motor contactor coil *)

(* Ladder Diagram Representation *)
(*
   START_PB      STOP_PB           MOTOR_OUT
-----| |-----------|/|----------------( )-----
      |             |
   MOTOR_OUT        |
-----| |------------+
*)`,
    defaultPinMap: [
      { pin: 'X0', port: 'PLC input 0', func: 'START_PB', description: 'Start Pushbutton (NO)' },
      { pin: 'X1', port: 'PLC Input 1', func: 'STOP_PB', description: 'Stop Pushbutton (Normally Closed)' },
      { pin: 'Y0', port: 'PLC Output 0', func: 'MOTOR_OUT', description: 'Main magnetic contactor coil' }
    ]
  }
];

// Assembly presets
const ASSEMBLY_PRESETS = [
  {
    name: 'Arithmetic Addition & Counts',
    code: `MOV AX, 15H   ; AX = 21 (Decimal)
MOV BX, 10H   ; BX = 16 (Decimal)
ADD AX, BX    ; AX = AX + BX = 37
SUB AX, 05H   ; AX = AX - 5 = 32
INC DX        ; DX = 1
DEC BX        ; BX = 15`
  },
  {
    name: 'Register Transfer & Clear',
    code: `MOV AX, 50    ; AX = 50
INC AX        ; AX = 51
MOV BX, AX    ; BX = 51
MOV CX, 0     ; CX = 0
ADD CX, BX    ; CX = 51
DEC CX        ; CX = 50`
  }
];

export default function EmbeddedToolsView() {
  const [activeTab, setActiveTab] = useState<'assistant' | 'assembly' | 'timer' | 'plc'>('assistant');

  // ==========================================
  // Tab 4: ARM / PLC Code Architect State
  // ==========================================
  const [selectedArch, setSelectedArch] = useState<ArchitectureOption>(ARCHITECTURES[0]);
  const [customPrompt, setCustomPrompt] = useState<string>(ARCHITECTURES[0].starterPrompt);
  const [archLoading, setArchLoading] = useState<boolean>(false);
  const [aiProgress, setAiProgress] = useState<string>('');
  const [archGeneratedCode, setArchGeneratedCode] = useState<string>(ARCHITECTURES[0].defaultCode);
  const [pinMap, setPinMap] = useState<typeof ARCHITECTURES[0]['defaultPinMap']>(ARCHITECTURES[0]['defaultPinMap']);
  const [archCopied, setArchCopied] = useState<boolean>(false);

  const handleArchSelect = (arch: ArchitectureOption) => {
    setSelectedArch(arch);
    setCustomPrompt(arch.starterPrompt);
    setArchGeneratedCode(arch.defaultCode);
    setPinMap(arch.defaultPinMap);
  };

  const handleGenerateCode = async () => {
    if (!customPrompt.trim()) return;

    setArchLoading(true);
    setAiProgress('LAUNCHING COMPILER ENG...');

    const steps = [
      'PARSING INTERNAL PIN CONFIGURATION...',
      'ALLOCATING GPIO REGISTERS...',
      'OPTIMIZING REGISTER DIRECTIVES...',
      'COMPILED SUCCESSFUL! GENERATING PIN MAP...'
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setAiProgress(steps[i]);
        i++;
      }
    }, 1200);

    try {
      const response = await fetch('/api/embedded-assistant/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt,
          architecture: selectedArch.id
        })
      });

      clearInterval(interval);

      if (response.ok) {
        const data = await response.json();
        setArchGeneratedCode(data.code || '');
        setPinMap(data.pinMap || []);
      } else {
        alert('Failed to generate embedded design. Please try again.');
      }
    } catch (err) {
      alert('Connection error occurred during code generation.');
      clearInterval(interval);
    } finally {
      setArchLoading(false);
    }
  };

  const handleCopyArchCode = () => {
    navigator.clipboard.writeText(archGeneratedCode);
    setArchCopied(true);
    setTimeout(() => setArchCopied(false), 2000);
  };

  // ==========================================
  // Tab 1: Assembly Register Visualizer State
  // ==========================================
  const [assemblyPresetIdx, setAssemblyPresetIdx] = useState<number>(0);
  const assemblySim = useAssemblySimulator(ASSEMBLY_PRESETS[0].code);

  const handleAssemblyPresetChange = (idx: number) => {
    setAssemblyPresetIdx(idx);
    assemblySim.setCode(ASSEMBLY_PRESETS[idx].code);
    assemblySim.reset();
  };

  // Helper to format values
  const formatHex = (val: number) => {
    return '0x' + (val & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  };

  const formatBinary = (val: number) => {
    return (val & 0xFFFF).toString(2).padStart(16, '0');
  };

  // ==========================================
  // Tab 2: Timer & PWM Configurator State
  // ==========================================
  const [timerInputs, setTimerInputs] = useState<TimerInputs>({
    mcuClockMHz: 16,
    timerMode: 'FastPWM',
    prescaler: 64,
    topValue: 1023,
    ocrValue: 512,
    mcuType: 'ATmega328P'
  });
  const [mcuTarget, setMcuTarget] = useState<'ATmega328P' | 'STM32'>('ATmega328P');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const timerResults = useTimerPWM(timerInputs);

  const handleTimerInputChange = (field: keyof TimerInputs, value: any) => {
    setTimerInputs(prev => {
      const updated = { ...prev, [field]: value };
      // Ensure OCR is clamped to topValue
      if (field === 'topValue') {
        updated.ocrValue = Math.min(updated.ocrValue, value);
      }
      return updated;
    });
  };

  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // ==========================================
  // Tab 3: PLC Ladder Logic Simulator State
  // ==========================================
  const plcSim = usePLCSimulator();

  // Compute PLC Equation string for representation
  const plcEquation = useMemo(() => {
    if (plcSim.branches.length === 0) return `${plcSim.outputVariable} = FALSE`;
    return `${plcSim.outputVariable} = ` + plcSim.branches.map(branch => {
      if (branch.contacts.length === 0) return 'FALSE';
      const term = branch.contacts.map(c => {
        return c.type === 'NO' ? c.variable : `NOT ${c.variable}`;
      }).join(' AND ');
      return branch.contacts.length > 1 ? `(${term})` : term;
    }).join(' OR ');
  }, [plcSim.branches, plcSim.outputVariable]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 min-h-[85vh]">
      {/* Back button */}
      <div>
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO TOOLS CATALOG
        </Link>
      </div>

      {/* Header */}
      <div className="text-left border-b border-navy-light pb-6 space-y-1">
        <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-emerald-accent bg-emerald-accent/10 border border-emerald-accent/20 px-3 py-1 rounded-full">
          <Cpu className="h-3 w-3" /> EEE 4109: MICROPROCESSORS & EMBEDDED SYSTEMS SUITE
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Embedded Systems Hub
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Hardware-Software simulators for Assembly parsing, register tracing, timer frequency synthesis, and industrial PLC ladder logic circuits.
        </p>
      </div>

      {/* Tab Selector */}
      <div className="flex flex-wrap gap-2 border-b border-navy-light pb-px shrink-0">
        <button
          onClick={() => setActiveTab('assistant')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-mono font-bold border-b-2 transition-all ${
            activeTab === 'assistant'
              ? 'border-emerald-accent text-emerald-accent bg-emerald-accent/5'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-navy-light/20'
          }`}
        >
          <Sparkles className="h-4 w-4 text-emerald-accent" />
          ARM & PLC Code Architect
        </button>
        <button
          onClick={() => setActiveTab('assembly')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-mono font-bold border-b-2 transition-all ${
            activeTab === 'assembly'
              ? 'border-emerald-accent text-emerald-accent bg-emerald-accent/5'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-navy-light/20'
          }`}
        >
          <Terminal className="h-4 w-4" />
          8086 Assembly Visualizer
        </button>
        <button
          onClick={() => setActiveTab('timer')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-mono font-bold border-b-2 transition-all ${
            activeTab === 'timer'
              ? 'border-emerald-accent text-emerald-accent bg-emerald-accent/5'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-navy-light/20'
          }`}
        >
          <Clock className="h-4 w-4" />
          Timer & PWM Configurator
        </button>
        <button
          onClick={() => setActiveTab('plc')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-mono font-bold border-b-2 transition-all ${
            activeTab === 'plc'
              ? 'border-emerald-accent text-emerald-accent bg-emerald-accent/5'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-navy-light/20'
          }`}
        >
          <Layers className="h-4 w-4" />
          PLC Ladder Simulator
        </button>
      </div>

      {/* Tab 0: ARM / PLC Code Architect */}
      {activeTab === 'assistant' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side: Controller Switcher & Prompt Panel */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Architecture Switcher */}
            <div className="bg-navy-card border border-navy-light rounded-2xl p-5 space-y-3 text-left">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Target Architecture</span>
              <div className="space-y-2">
                {ARCHITECTURES.map(arch => {
                  const Icon = arch.icon;
                  return (
                    <button
                      key={arch.id}
                      id={`btn-arch-${arch.id}`}
                      onClick={() => handleArchSelect(arch)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left group ${selectedArch.id === arch.id ? 'bg-emerald-accent/10 border-emerald-accent/40 text-emerald-accent' : 'bg-navy-dark/40 border-navy-light text-slate-400 hover:text-white'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${selectedArch.id === arch.id ? 'bg-emerald-accent/10' : 'bg-navy-light'} group-hover:bg-emerald-accent/15 transition-all`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-xs sm:text-sm text-white">{arch.name}</h4>
                          <span className="text-[10px] text-slate-500 font-mono">{arch.syllabusCode} • {arch.syllabusName.split(' ')[0]}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prompt panel */}
            <div className="bg-navy-card border border-navy-light rounded-2xl p-5 space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-navy-light pb-3">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Design Specifications</span>
                <span className="text-[10px] font-mono font-bold text-slate-500">{selectedArch.fileName}</span>
              </div>

              <textarea
                id="textarea-architecture-prompt"
                rows={6}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Write a program to read sensor on ADC1 channel 5..."
                className="w-full px-4 py-3 bg-navy-dark/60 border border-navy-light focus:border-emerald-accent/40 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none resize-none leading-relaxed"
              />

              <button
                id="btn-generate-architecture"
                disabled={archLoading}
                onClick={handleGenerateCode}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-accent hover:bg-emerald-accent/90 text-navy-dark font-extrabold text-xs sm:text-sm transition-all shadow-lg hover:shadow-emerald-accent/10"
              >
                {archLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Generating Code...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Synthesize Embedded Design</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Right Side: Generated Code & Hardware Pin map */}
          <div className="lg:col-span-8 space-y-6">
            {archLoading ? (
              <div className="bg-navy-card border border-navy-light rounded-2xl p-16 flex flex-col items-center justify-center text-center space-y-4 h-[60vh]">
                <div className="h-12 w-12 items-center justify-center rounded-xl bg-emerald-accent/10 border border-emerald-accent/20 animate-spin flex">
                  <RefreshCw className="h-6 w-6 text-emerald-accent" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-mono font-bold text-emerald-accent tracking-widest uppercase">
                    {aiProgress}
                  </div>
                  <p className="text-xs text-slate-500">
                    Synthesizing schematic requirements and building fully-annotated hardware register arrays.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                
                {/* Code Panel */}
                <div className="md:col-span-7 bg-navy-card border border-navy-light rounded-2xl p-5 flex flex-col h-[65vh]">
                  <div className="flex items-center justify-between border-b border-navy-light pb-3 mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-emerald-accent" />
                      <h3 className="font-display font-bold text-sm text-white">Synthesized Firmware</h3>
                    </div>
                    <div className="flex items-center gap-2" id="embedded-chart">
                      <IEEEReportButton
                        experimentName="Embedded Systems: HAL Code Generator"
                        inputData={{
                          'Target Architecture': selectedArch.name,
                          'Syllabus': selectedArch.syllabusCode,
                          'Prompt': customPrompt
                        }}
                        outputData={{
                          'Generated Lines': archGeneratedCode.split('\n').length.toString(),
                          'Pin Assignments': pinMap.length.toString()
                        }}
                        chartSelectors={['#embedded-chart']}
                      />
                      <button
                        onClick={handleCopyArchCode}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-navy-light hover:bg-navy-light text-[10px] text-slate-400 hover:text-white transition-all font-mono"
                      >
                      {archCopied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-accent" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto rounded-xl bg-navy-dark text-[11px] leading-relaxed relative min-h-0">
                    <SyntaxHighlighter
                      language={selectedArch.id === 'RISCV' ? 'riscv' : 'cpp'}
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        background: 'transparent',
                        padding: '16px',
                        height: '100%'
                      }}
                    >
                      {archGeneratedCode}
                    </SyntaxHighlighter>
                  </div>
                </div>

                {/* Pin Mapping Panel */}
                <div className="md:col-span-5 bg-navy-card border border-navy-light rounded-2xl p-5 flex flex-col h-[65vh]">
                  <div className="flex items-center justify-between border-b border-navy-light pb-3 mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-emerald-accent" />
                      <h3 className="font-display font-bold text-sm text-white">GPIO Configuration</h3>
                    </div>
                    <span className="text-[10px] text-emerald-accent font-mono bg-emerald-accent/10 border border-emerald-accent/20 px-2 py-0.5 rounded">
                      Hardware Map
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-left min-h-0">
                    {pinMap && pinMap.length > 0 ? (
                      <div className="space-y-3">
                        {pinMap.map((pinItem, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-navy-dark/40 border border-navy-light rounded-xl hover:border-emerald-accent/30 transition-colors"
                          >
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-xs font-mono font-bold text-white bg-navy-light px-2 py-0.5 rounded">
                                {pinItem.pin}
                              </span>
                              <span className="text-[10px] text-emerald-accent font-mono">
                                {pinItem.func}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                              <div>
                                <span className="text-slate-500 font-mono block">PORT</span>
                                <span className="font-mono">{pinItem.port}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 font-mono block">DESCRIPTION</span>
                                <span className="leading-tight">{pinItem.description}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                        <ListCollapse className="h-8 w-8 text-slate-600 mb-2" />
                        <p className="text-xs">No physical GPIO ports mapped for this layout.</p>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 pt-4 border-t border-navy-light text-center flex items-center gap-2 justify-center">
                    <CheckCircle2 className="h-4 w-4 text-emerald-accent" />
                    <span className="text-[10px] text-slate-400 font-mono">Adheres to standard STM32/RISC-V/PLC guidelines.</span>
                  </div>

                </div>

              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab 1: Assembly Register Visualizer */}
      {activeTab === 'assembly' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: Code Editor */}
          <div className="lg:col-span-6 bg-navy-card border border-navy-light rounded-2xl p-5 space-y-4 flex flex-col text-left">
            <div className="flex items-center justify-between border-b border-navy-light pb-3">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-emerald-accent" />
                <h3 className="font-display font-bold text-sm text-white">Instruction Editor</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono">Preset:</span>
                <select
                  value={assemblyPresetIdx}
                  onChange={(e) => handleAssemblyPresetChange(Number(e.target.value))}
                  className="bg-navy-dark border border-navy-light text-slate-300 text-xs px-2.5 py-1 rounded-lg outline-none focus:border-emerald-accent/40"
                >
                  {ASSEMBLY_PRESETS.map((preset, idx) => (
                    <option key={idx} value={idx}>{preset.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Simulated Line Highlight and Text Editor */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-12">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                  Assembly Source Code (8086 Subset)
                </label>
                <textarea
                  value={assemblySim.code}
                  onChange={(e) => {
                    assemblySim.setCode(e.target.value);
                    assemblySim.reset();
                  }}
                  rows={8}
                  placeholder="e.g. MOV AX, 5"
                  className="w-full px-4 py-3 bg-navy-dark border border-navy-light focus:border-emerald-accent/40 rounded-xl text-xs sm:text-sm font-mono text-white placeholder-slate-600 outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Instruction Stream Visual Trace */}
            <div className="bg-navy-dark/40 border border-navy-light rounded-xl p-4.5 space-y-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Executable Trace Flow</span>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {assemblySim.code.split('\n').map((lineText, idx) => {
                  const isCurrent = idx === assemblySim.currentLineIndex;
                  const isPassed = idx < assemblySim.currentLineIndex;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                        isCurrent
                          ? 'bg-emerald-accent/15 border-emerald-accent/40 text-emerald-accent shadow-sm shadow-emerald-accent/5'
                          : isPassed
                          ? 'bg-navy-dark/40 border-navy-light/30 text-slate-500 line-through'
                          : 'bg-transparent border-transparent text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-600 w-4">{(idx + 1).toString().padStart(2, '0')}</span>
                        <span>{lineText}</span>
                      </div>
                      {isCurrent && (
                        <span className="text-[9px] font-bold bg-emerald-accent/10 border border-emerald-accent/20 px-1.5 py-0.5 rounded animate-pulse">
                          NEXT PC
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simulator Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={assemblySim.step}
                disabled={assemblySim.finished}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-accent hover:bg-emerald-accent/90 disabled:opacity-40 disabled:hover:bg-emerald-accent text-navy-dark font-extrabold text-xs sm:text-sm transition-all"
              >
                <Play className="h-4 w-4" />
                Step Over Instruction
              </button>
              <button
                onClick={assemblySim.reset}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-navy-light hover:bg-navy-light/40 text-slate-300 font-semibold text-xs sm:text-sm transition-all"
              >
                <RotateCcw className="h-4 w-4" />
                Reset CPU
              </button>
            </div>
          </div>

          {/* Right panel: Processor State & Logs */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Registers and Flag registers */}
            <div className="bg-navy-card border border-navy-light rounded-2xl p-5 space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-navy-light pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-emerald-accent" />
                  <h3 className="font-display font-bold text-sm text-white">Intel 8086 Execution Context</h3>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">16-Bit Architecture</span>
              </div>

              {/* Registers Grid */}
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(assemblySim.registers).map(([reg, val]) => (
                  <div
                    key={reg}
                    className="p-3.5 bg-navy-dark/60 border border-navy-light rounded-xl space-y-2 relative overflow-hidden group hover:border-emerald-accent/35 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono font-bold text-slate-400">{reg} Register</span>
                      <span className="text-[10px] text-emerald-accent font-mono bg-emerald-accent/10 px-1.5 py-0.5 rounded">
                        {formatHex(val)}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-mono font-extrabold text-white">{val}</span>
                      <span className="text-[10px] text-slate-500 font-mono">DEC</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-600 border-t border-navy-light/40 pt-1.5 truncate">
                      BIN: {formatBinary(val)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Flags Section */}
              <div className="bg-navy-dark/40 border border-navy-light rounded-xl p-4 space-y-3">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Status Flags</span>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(assemblySim.flags).map(([flagName, isActive]) => (
                    <div
                      key={flagName}
                      className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all ${
                        isActive
                          ? 'bg-emerald-accent/15 border-emerald-accent/40 text-emerald-accent'
                          : 'bg-navy-dark border-navy-light/50 text-slate-600'
                      }`}
                    >
                      <span className="text-lg font-mono font-extrabold">{isActive ? '1' : '0'}</span>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider">
                        {flagName === 'Z' ? 'Zero (ZF)' : flagName === 'C' ? 'Carry (CF)' : flagName === 'S' ? 'Sign (SF)' : 'Ovrflw (OF)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Simulator Trace Logger */}
            <div className="bg-navy-card border border-navy-light rounded-2xl p-5 text-left space-y-3">
              <div className="flex justify-between items-center border-b border-navy-light pb-2.5">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Micro-Execution Log</span>
                <span className="text-[10px] text-slate-600 font-mono">Active Trace</span>
              </div>
              <div className="bg-navy-dark rounded-xl p-3 h-48 overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-400 space-y-1.5">
                {assemblySim.logs.map((log, idx) => (
                  <div key={idx} className="border-b border-navy-light/10 pb-1 last:border-0">
                    <span className="text-slate-600 mr-2">❯</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 2: Timer & PWM Configurator */}
      {activeTab === 'timer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: Inputs & Presets */}
          <div className="lg:col-span-5 bg-navy-card border border-navy-light rounded-2xl p-5 space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-navy-light pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-emerald-accent" />
                <h3 className="font-display font-bold text-sm text-white">Timer Setup Parameters</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Register Level</span>
            </div>

            {/* MCU Clock Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">MCU Clock Frequency</span>
                <span className="text-white font-mono font-bold">{timerInputs.mcuClockMHz} MHz</span>
              </div>
              <input
                type="range"
                min="1"
                max="80"
                value={timerInputs.mcuClockMHz}
                onChange={(e) => handleTimerInputChange('mcuClockMHz', Number(e.target.value))}
                className="w-full accent-emerald-accent"
              />
              <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                <span>1 MHz (ATmega)</span>
                <span>80 MHz (STM32/ARM)</span>
              </div>
            </div>

            {/* Timer Mode Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-500 uppercase block">Timer Mode</label>
                <select
                  value={timerInputs.timerMode}
                  onChange={(e) => handleTimerInputChange('timerMode', e.target.value)}
                  className="w-full bg-navy-dark border border-navy-light text-slate-300 text-xs px-3 py-2 rounded-xl outline-none focus:border-emerald-accent/40"
                >
                  <option value="Normal">Normal Mode</option>
                  <option value="CTC">CTC Mode</option>
                  <option value="FastPWM">Fast PWM Mode</option>
                  <option value="PhaseCorrect">Phase Correct PWM</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-500 uppercase block">Prescaler N</label>
                <select
                  value={timerInputs.prescaler}
                  onChange={(e) => handleTimerInputChange('prescaler', Number(e.target.value))}
                  className="w-full bg-navy-dark border border-navy-light text-slate-300 text-xs px-3 py-2 rounded-xl outline-none focus:border-emerald-accent/40"
                >
                  <option value={1}>1 (No prescaling)</option>
                  <option value={8}>8</option>
                  <option value={64}>64</option>
                  <option value={256}>256</option>
                  <option value={1024}>1024</option>
                </select>
              </div>
            </div>

            {/* TOP Register Counter Selection */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">TOP Value (Period / ARR)</span>
                <span className="text-white font-mono font-bold">{timerInputs.topValue}</span>
              </div>
              <input
                type="number"
                min="1"
                max="65535"
                value={timerInputs.topValue}
                onChange={(e) => handleTimerInputChange('topValue', Math.min(65535, Math.max(1, Number(e.target.value))))}
                className="w-full px-3 py-2 bg-navy-dark border border-navy-light focus:border-emerald-accent/40 rounded-xl text-xs font-mono text-white outline-none"
              />
              <span className="text-[9px] text-slate-600 block">Defines counter period limit. For STM32 auto-reload (ARR) or ATmega ICR1.</span>
            </div>

            {/* Compare Match Value OCR Selection */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">Compare Match (OCR / CCR)</span>
                <span className="text-white font-mono font-bold">
                  {timerInputs.ocrValue} ({timerResults.dutyCyclePercent}%)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={timerInputs.topValue}
                value={timerInputs.ocrValue}
                onChange={(e) => handleTimerInputChange('ocrValue', Number(e.target.value))}
                className="w-full accent-emerald-accent"
              />
              <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                <span>0 (0% Duty)</span>
                <span>{timerInputs.topValue} (100% Duty)</span>
              </div>
            </div>

            {/* Calculations Dashboard Widget */}
            <div className="bg-navy-dark/50 border border-navy-light rounded-xl p-4.5 space-y-3.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Resulting Output Metrics</span>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-mono block">PWM Frequency</span>
                  <span className="text-lg font-mono font-extrabold text-emerald-accent">
                    {timerResults.pwmFrequencyHz >= 1000
                      ? `${(timerResults.pwmFrequencyHz / 1000).toFixed(2)} kHz`
                      : `${timerResults.pwmFrequencyHz} Hz`}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 font-mono block">Duty Cycle</span>
                  <span className="text-lg font-mono font-extrabold text-white">
                    {timerInputs.timerMode === 'Normal' ? 'N/A' : `${timerResults.dutyCyclePercent}%`}
                  </span>
                </div>
              </div>

              <div className="border-t border-navy-light/40 pt-2.5 text-[10px] text-slate-400 flex justify-between items-center">
                <span>Time Period: <span className="font-mono text-white">{timerResults.timePeriodMs} ms</span></span>
                <span>Mode Formula: <span className="font-mono text-slate-500">
                  {timerInputs.timerMode === 'FastPWM' ? 'f = CLK / (N*(1+TOP))' : timerInputs.timerMode === 'PhaseCorrect' ? 'f = CLK / (2*N*TOP)' : timerInputs.timerMode === 'CTC' ? 'f = CLK / (2*N*(1+OCR))' : 'f = CLK / (N*(TOP+1))'}
                </span></span>
              </div>
            </div>

          </div>

          {/* Right panel: Waveform Visualizer & Generated Code */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Waveform Visualizer */}
            <div className="bg-navy-card border border-navy-light rounded-2xl p-5 text-left space-y-4">
              <div className="flex items-center justify-between border-b border-navy-light pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-emerald-accent" />
                  <h3 className="font-display font-bold text-sm text-white">Time-Domain Signal Oscilloscope</h3>
                </div>
                <span className="text-[10px] text-emerald-accent font-mono bg-emerald-accent/10 border border-emerald-accent/20 px-2 py-0.5 rounded">
                  3 Full Cycles
                </span>
              </div>

              {/* Waveform Chart */}
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={timerResults.chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="timeMs"
                      tick={{ fill: '#64748b', fontSize: 9 }}
                      label={{ value: 'Time (ms)', position: 'insideBottomRight', offset: -5, fill: '#64748b', fontSize: 9 }}
                    />
                    <YAxis
                      yAxisId="tcnt"
                      domain={[0, timerInputs.topValue]}
                      tick={{ fill: '#64748b', fontSize: 9 }}
                      label={{ value: 'Counter TCNT', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 9 }}
                    />
                    <YAxis
                      yAxisId="pwm"
                      orientation="right"
                      domain={[-0.2, 1.2]}
                      ticks={[0, 1]}
                      tick={{ fill: '#10b981', fontSize: 9 }}
                      label={{ value: 'Output pin', angle: 90, position: 'insideRight', fill: '#10b981', fontSize: 9 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                      labelStyle={{ color: '#64748b', fontSize: '10px' }}
                      itemStyle={{ fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', marginTop: '5px' }} />
                    <Line
                      yAxisId="tcnt"
                      name="Timer TCNT value"
                      type="monotone"
                      dataKey="counter"
                      stroke="#475569"
                      strokeDasharray="4 4"
                      dot={false}
                    />
                    <Line
                      yAxisId="pwm"
                      name="PWM Pin Output"
                      type="stepAfter"
                      dataKey="output"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Generated Code block */}
            <div className="bg-navy-card border border-navy-light rounded-2xl p-5 text-left space-y-4">
              <div className="flex items-center justify-between border-b border-navy-light pb-3">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-emerald-accent" />
                  <h3 className="font-display font-bold text-sm text-white">Synthesized Bare-Metal Controller Code</h3>
                </div>
                
                {/* MCU Target switcher */}
                <div className="flex items-center gap-1 bg-navy-dark border border-navy-light p-1 rounded-xl">
                  <button
                    onClick={() => setMcuTarget('ATmega328P')}
                    className={`px-3 py-1 text-[10px] font-mono rounded-lg transition-all ${mcuTarget === 'ATmega328P' ? 'bg-emerald-accent text-navy-dark font-extrabold' : 'text-slate-400'}`}
                  >
                    AVR ATmega
                  </button>
                  <button
                    onClick={() => setMcuTarget('STM32')}
                    className={`px-3 py-1 text-[10px] font-mono rounded-lg transition-all ${mcuTarget === 'STM32' ? 'bg-emerald-accent text-navy-dark font-extrabold' : 'text-slate-400'}`}
                  >
                    STM32 HAL
                  </button>
                </div>
              </div>

              {/* Code output area */}
              <div className="relative">
                <div className="absolute right-3 top-3 z-10">
                  <button
                    onClick={() => handleCopyCode(mcuTarget === 'ATmega328P' ? timerResults.atmegaCode : timerResults.stm32Code)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-navy-light bg-navy-dark/80 hover:bg-navy-light text-[10px] text-slate-300 hover:text-white transition-all font-mono"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-accent" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Block</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto rounded-xl border border-navy-light text-[11px] leading-relaxed relative min-h-0">
                  <SyntaxHighlighter
                    language="cpp"
                    style={vscDarkPlus}
                    customStyle={{
                      margin: 0,
                      background: '#090d16',
                      padding: '16px',
                    }}
                  >
                    {mcuTarget === 'ATmega328P' ? timerResults.atmegaCode : timerResults.stm32Code}
                  </SyntaxHighlighter>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 3: PLC Ladder Logic Simulator */}
      {activeTab === 'plc' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main interactive PLC canvas block - Span 8 columns */}
          <div className="lg:col-span-8 bg-navy-card border border-navy-light rounded-2xl p-5 space-y-6 text-left">
            <div className="flex items-center justify-between border-b border-navy-light pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-accent" />
                <h3 className="font-display font-bold text-sm text-white">Interactive Ladder Circuit</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={plcSim.addBranch}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-accent/20 bg-emerald-accent/10 hover:bg-emerald-accent/15 text-[10px] font-mono text-emerald-accent transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Parallel Rung/Branch
                </button>
              </div>
            </div>

            {/* The Ladder Grid Representation */}
            <div className="relative bg-navy-dark/30 border border-navy-light/60 rounded-2xl p-6 overflow-x-auto min-w-[500px]">
              
              {/* Vertical Left Power Rail */}
              <div className="absolute left-6 top-6 bottom-6 w-1 bg-red-500 rounded shadow-md shadow-red-500/10" />

              {/* Vertical Right Return Rail */}
              <div className="absolute right-6 top-6 bottom-6 w-1 bg-blue-500 rounded shadow-md shadow-blue-500/10" />

              {/* Ladder rungs list */}
              <div className="space-y-12 pl-4 pr-4">
                {plcSim.branches.map((branch, bIdx) => {
                  const bState = plcSim.branchStates[bIdx];
                  const isBranchEnergized = bState?.conducting;

                  return (
                    <div key={branch.id} className="relative flex items-center justify-between">
                      
                      {/* Horizontal back wire across the entire rung */}
                      <div className={`absolute left-0 right-0 h-0.5 -z-10 transition-colors ${isBranchEnergized ? 'bg-emerald-accent shadow shadow-emerald-accent' : 'bg-slate-700'}`} />

                      {/* Left-side wire adapter leading to contacts */}
                      <div className="flex items-center gap-2 w-full pr-12">
                        {branch.contacts.map((contact, cIdx) => {
                          const cState = bState?.contacts[cIdx];
                          const isContactConducting = cState?.conducting;

                          return (
                            <div key={contact.id} className="flex items-center gap-2">
                              {/* Series wire segment before contact */}
                              {cIdx > 0 && (
                                <div className={`w-6 h-0.5 ${isBranchEnergized || (bState?.contacts.slice(0, cIdx).every(c => c.conducting)) ? 'bg-emerald-accent' : 'bg-slate-700'}`} />
                              )}

                              {/* Contact Box */}
                              <div
                                className={`relative p-3 rounded-xl border flex flex-col items-center justify-center bg-navy-dark w-24 transition-all ${
                                  isContactConducting
                                    ? 'border-emerald-accent/80 shadow-md shadow-emerald-accent/10 text-white'
                                    : 'border-navy-light text-slate-500'
                                }`}
                              >
                                {/* Contact visual symbol */}
                                <span className="font-mono text-xs font-bold block mb-1">
                                  {contact.type === 'NO' ? '-[ ]-' : '-[/]-'}
                                </span>
                                
                                {/* Variable Selector/Edit */}
                                <div className="space-y-1 text-center w-full">
                                  <input
                                    type="text"
                                    value={contact.variable}
                                    onChange={(e) => plcSim.updateContact(branch.id, contact.id, { variable: e.target.value.toUpperCase() })}
                                    className="w-full text-center bg-transparent border-0 border-b border-navy-light hover:border-slate-500 focus:border-emerald-accent text-xs font-mono font-bold text-white outline-none px-1"
                                  />
                                  <select
                                    value={contact.type}
                                    onChange={(e) => plcSim.updateContact(branch.id, contact.id, { type: e.target.value as ContactType })}
                                    className="text-[9px] bg-navy-dark text-slate-400 outline-none hover:text-white"
                                  >
                                    <option value="NO">NO (Open)</option>
                                    <option value="NC">NC (Closed)</option>
                                  </select>
                                </div>

                                {/* Quick action buttons (trash) inside contact */}
                                <button
                                  onClick={() => plcSim.removeContact(branch.id, contact.id)}
                                  className="absolute -top-1.5 -right-1.5 bg-navy-light/80 hover:bg-red-500/20 hover:text-red-400 border border-navy-light p-1 rounded-full text-slate-400 transition-colors"
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Add Contact Button on the branch */}
                        <div className="flex items-center ml-2">
                          <div className="w-4 h-0.5 bg-slate-700" />
                          <button
                            onClick={() => plcSim.addContact(branch.id)}
                            className="p-1.5 rounded-lg border border-dashed border-navy-light hover:border-emerald-accent/40 bg-navy-dark/40 text-slate-500 hover:text-emerald-accent transition-all"
                            title="Add Series Contact to this rung"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Output Coil on the Right End */}
                      <div className="flex items-center select-none">
                        <div className={`w-8 h-0.5 ${isBranchEnergized ? 'bg-emerald-accent' : 'bg-slate-700'}`} />
                        <div
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center bg-navy-dark w-20 text-center transition-all ${
                            isBranchEnergized
                              ? 'border-emerald-accent bg-emerald-accent/5 text-emerald-accent shadow shadow-emerald-accent/10 animate-pulse'
                              : 'border-navy-light text-slate-500'
                          }`}
                        >
                          <span className="font-mono text-xs font-bold block mb-1">-( )-</span>
                          <span className="text-xs font-mono font-bold text-white uppercase">{plcSim.outputVariable}</span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Equations and helpful text */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-navy-dark/40 border border-navy-light rounded-xl p-4 text-left space-y-1.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Synthesized Boolean Formula</span>
                <span className="text-sm font-mono font-extrabold text-emerald-accent break-all">
                  {plcEquation}
                </span>
              </div>
              <div className="bg-navy-dark/40 border border-navy-light rounded-xl p-4 text-left space-y-1.5 flex flex-col justify-center">
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Simulation Tip</span>
                <p className="text-xs text-slate-400">
                  Toggle variables below or modify contacts to NO/NC. Red rail represents HOT Power line, Blue rail is Return Neutral line. Green indicates energized paths.
                </p>
              </div>
            </div>
          </div>

          {/* Controller & Variable Panel - Span 4 columns */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Input Variables Controller Panel */}
            <div className="bg-navy-card border border-navy-light rounded-2xl p-5 space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-navy-light pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-emerald-accent" />
                  <h3 className="font-display font-bold text-sm text-white">Physical Switch Board</h3>
                </div>
                <button
                  onClick={plcSim.resetPLC}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
                  title="Reset Board"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Switches map */}
              <div className="space-y-2.5">
                {Object.entries(plcSim.variables).map(([varName, state]) => (
                  <div
                    key={varName}
                    onClick={() => plcSim.toggleVariable(varName)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer select-none transition-all group ${
                      state
                        ? 'bg-emerald-accent/10 border-emerald-accent/35 text-white'
                        : 'bg-navy-dark/40 border-navy-light text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${state ? 'bg-emerald-accent/20 text-emerald-accent' : 'bg-navy-light text-slate-500'}`}>
                        <Cpu className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold block text-white">{varName}</span>
                        <span className="text-[9px] text-slate-500 font-mono">Input Contact switch</span>
                      </div>
                    </div>

                    <div>
                      {state ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-extrabold text-emerald-accent uppercase">
                          Closed (ON) <ToggleRight className="h-5 w-5 text-emerald-accent" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-slate-500 uppercase">
                          Open (OFF) <ToggleLeft className="h-5 w-5 text-slate-500" />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coil Configuration Output */}
            <div className="bg-navy-card border border-navy-light rounded-2xl p-5 space-y-3.5 text-left">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Output Coil Setup</span>
              
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-mono block">Coil Variable Name</label>
                <input
                  type="text"
                  value={plcSim.outputVariable}
                  onChange={(e) => plcSim.setOutputVariable(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2.5 bg-navy-dark border border-navy-light focus:border-emerald-accent/40 rounded-xl text-xs font-mono font-bold text-white outline-none"
                />
              </div>

              <div className="bg-navy-dark/60 border border-navy-light rounded-xl p-4.5 text-center flex flex-col items-center justify-center space-y-1.5">
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Coil State</span>
                <div className={`text-sm font-mono font-bold uppercase transition-all px-3 py-1 rounded-full border ${
                  plcSim.isOutputEnergized
                    ? 'bg-emerald-accent/15 border-emerald-accent/40 text-emerald-accent shadow shadow-emerald-accent/5 animate-pulse'
                    : 'bg-navy-dark border-navy-light text-slate-500'
                }`}>
                  {plcSim.isOutputEnergized ? '⚡ ENERGIZED (1)' : '⚪ DE-ENERGIZED (0)'}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Floating Design Document Generator Button */}
      <div className="pt-6 border-t border-navy-light flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-slate-500" />
          <span className="text-xs text-slate-400 font-mono">Designed in compliance with EEE 4109 Microprocessor & PLC Syllabi.</span>
        </div>
        <IEEEReportButton
          experimentName="EEE 4109 Embedded Systems Simulator"
          inputData={{
            'Active Tab': activeTab === 'assembly' ? '8086 Assembly' : activeTab === 'timer' ? 'Timer/PWM' : 'PLC Ladder',
            'MCU Frequency': activeTab === 'timer' ? `${timerInputs.mcuClockMHz} MHz` : 'N/A',
            'Timer Mode': activeTab === 'timer' ? timerInputs.timerMode : 'N/A'
          }}
          outputData={{
            'Assembly Instructions': activeTab === 'assembly' ? assemblySim.linesCount.toString() : 'N/A',
            'PWM Frequency output': activeTab === 'timer' ? `${timerResults.pwmFrequencyHz} Hz` : 'N/A',
            'PLC Output energized': activeTab === 'plc' ? (plcSim.isOutputEnergized ? 'True' : 'False') : 'N/A'
          }}
          chartSelectors={['#embedded-chart']}
        />
      </div>

    </div>
  );
}
