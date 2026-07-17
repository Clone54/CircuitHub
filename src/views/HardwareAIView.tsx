import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu,
  Terminal,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  Info,
  ChevronRight,
  RefreshCw,
  Zap,
  HelpCircle,
  Code,
  ArrowLeft
} from 'lucide-react';

interface LanguageOption {
  id: string;
  name: string;
  fileExt: string;
  fileName: string;
  icon: any;
  syllabusCode: string;
  syllabusName: string;
  starterPrompt: string;
}

const LANGUAGES: LanguageOption[] = [
  {
    id: 'Verilog',
    name: 'Verilog HDL',
    fileExt: 'v',
    fileName: 'cla_8bit.v',
    icon: Terminal,
    syllabusCode: 'EEE 2213',
    syllabusName: 'VLSI Design',
    starterPrompt: 'Design a highly optimized 8-bit Carry Lookahead Adder (CLA) module with propogate/generate wires, full structural equations, and performance analysis metrics.',
  },
  {
    id: 'Arduino',
    name: 'Arduino C++',
    fileExt: 'ino',
    fileName: 'adc_logger.ino',
    icon: Cpu,
    syllabusCode: 'EEE 4109',
    syllabusName: 'Microprocessors',
    starterPrompt: 'Create an Arduino program to sample raw analog signals from an LM358 op-amp photodiode pre-amplifier on pin A0. Compute running voltage averages, log the calibrated data over UART Serial, and toggle an alert on digital Pin 13 if the values cross a 65% threshold.',
  },
  {
    id: 'STM32',
    name: 'STM32 Register C',
    fileExt: 'c',
    fileName: 'timer_led_register.c',
    icon: Cpu,
    syllabusCode: 'EEE 4109',
    syllabusName: 'Microprocessors & Embedded',
    starterPrompt: 'Write bare-metal STM32 register-level C code to initialize Timer 2 (TIM2) in standard count-up mode. Setup an interrupt service routine (ISR) to toggle GPIO Pin PA5 (Green LED) at precisely 1 Hz frequency. Enable AHB1 peripheral clocks.',
  },
  {
    id: 'ARM',
    name: 'ARM Cortex Assembly',
    fileExt: 's',
    fileName: 'division_by_sub.s',
    icon: Terminal,
    syllabusCode: 'EEE 4109',
    syllabusName: 'Microcomputer Architectures',
    starterPrompt: 'Implement an ARM Cortex-M Assembly subroutine that performs integer division of a 32-bit dividend in R0 by a 32-bit divisor in R1 using the division-by-subtraction algorithm. Return the quotient in R0 and remainder in R1. Include appropriate directives.',
  }
];

export default function HardwareAIView() {
  const [selectedLang, setSelectedLang] = useState<LanguageOption>(LANGUAGES[0]);
  const [customPrompt, setCustomPrompt] = useState<string>(LANGUAGES[0].starterPrompt);
  const [loading, setLoading] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [replyText, setReplyText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Auto-update prompt when switching languages
  const handleLangSelect = (lang: LanguageOption) => {
    setSelectedLang(lang);
    setCustomPrompt(lang.starterPrompt);
  };

  // Helper to trigger sequential loading stages
  const runGenerationSteps = () => {
    return new Promise<void>((resolve) => {
      const steps = [
        'INITIALIZING CIRCUIT ARCHITECTURE...',
        'TUNING PROPAGATION AND DELAY BOUNDS...',
        'DETERMINING ACCURATE GPIO REGISTERS...',
        'COMPILED SUCCESSFUL! FORMATTING ANNOTATED BLOCK...'
      ];
      let i = 0;
      setGenerationStep(steps[0]);
      
      const interval = setInterval(() => {
        i++;
        if (i < steps.length) {
          setGenerationStep(steps[i]);
        } else {
          clearInterval(interval);
          resolve();
        }
      }, 700);
    });
  };

  const handleGenerate = async () => {
    if (!customPrompt.trim()) return;
    setLoading(true);
    setReplyText('');
    
    // Start step animation
    const stepsPromise = runGenerationSteps();

    try {
      const response = await fetch('/api/hardware', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: customPrompt,
          language: selectedLang.id,
        }),
      });

      await stepsPromise; // Wait for steps animation to finish

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setReplyText(data.reply || '');
        } else {
          const text = await response.text();
          setReplyText(`// ERROR: Expected JSON but received plain text.\n// Response: ${text.slice(0, 300)}`);
        }
      } else {
        let errMsg = 'Server did not reply.';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errData = await response.json();
            errMsg = errData.message || errMsg;
          } else {
            const errText = await response.text();
            errMsg = errText.slice(0, 150) || `HTTP error ${response.status}`;
          }
        } catch (_) {}
        setReplyText(`// ERROR: generation failed.\n// ${errMsg}`);
      }
    } catch (err: any) {
      await stepsPromise;
      setReplyText(`// CONNECTIVITY ERROR: Failed to fetch backend.\n// ${err.message || err}`);
    } finally {
      setLoading(false);
      setGenerationStep('');
    }
  };

  // Extract raw code block and explanation notes separate for IDE display
  const parsedOutput = useMemo(() => {
    if (!replyText) return { code: '', notes: '' };
    
    // Look for standard markdown code blocks
    const codeBlockRegex = /```(?:[a-zA-Z0-9]*)\n([\s\S]*?)```/;
    const match = replyText.match(codeBlockRegex);

    if (match) {
      const code = match[1].trim();
      // Extract notes by removing code block
      const notes = replyText.replace(codeBlockRegex, '').trim();
      return { code, notes };
    }

    return { code: replyText, notes: '' };
  }, [replyText]);

  const handleCopyCode = () => {
    const textToCopy = parsedOutput.code || replyText;
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Back button */}
      <div>
        <Link
          to="/advanced-tools"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO ADVANCED CORES
        </Link>
      </div>

      {/* Page Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-indigo-400 uppercase tracking-wider">
          <Cpu className="h-4 w-4 animate-pulse" /> Generative Firmware & Silicon design
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
          Agentic Hardware & Embedded Code Assistant
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-3xl leading-relaxed">
          Generative agent specialized in undergraduate microcontrollers and VLSI engineering tracks. Creates highly documented modules and explains hardware pins.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Controls and prompt */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Target Architecture Selection */}
          <div className="bg-navy-card border border-navy-light p-5 rounded-2xl space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-navy-light/60 pb-2">
              Select Target Architecture
            </h2>
            
            <div className="grid grid-cols-1 gap-2.5">
              {LANGUAGES.map((lang) => {
                const Icon = lang.icon;
                const isSelected = selectedLang.id === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => handleLangSelect(lang)}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-md shadow-indigo-500/5'
                        : 'bg-navy-dark/40 border-navy-light/40 text-slate-400 hover:bg-navy-light/20 hover:text-white'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-navy-dark border border-navy-light text-slate-400'} shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-xs space-y-1.5 flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-bold font-display text-white">{lang.name}</span>
                        <span className="text-[9px] font-mono font-semibold bg-navy-light/50 text-slate-400 px-1.5 py-0.5 rounded">
                          {lang.syllabusCode}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate leading-relaxed">
                        Course: {lang.syllabusName}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt builder */}
          <div className="bg-navy-card border border-navy-light p-5 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-navy-light/60 pb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Functional Requirements Prompt
              </h2>
              <button
                type="button"
                onClick={() => setCustomPrompt(selectedLang.starterPrompt)}
                className="text-[10px] font-semibold text-indigo-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Reset Starter Template
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={6}
                className="w-full bg-navy-dark border border-navy-light rounded-xl p-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400 leading-relaxed font-mono resize-none"
                placeholder="Describe your pin inputs, clocks, modules, registers, or variables..."
              />

              <button
                onClick={handleGenerate}
                disabled={loading || !customPrompt.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                    <span>{generationStep || 'GENERATING FIRMWARE MODEL...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-white" />
                    <span>Generate Engineering Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Right column: Interactive Code Editor View & Explanations */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Virtual Code Editor */}
          <div className="bg-slate-950 border border-navy-light rounded-2xl overflow-hidden flex flex-col h-[520px] shadow-2xl">
            {/* Editor Window Title Bar */}
            <div className="bg-[#0b0f19] border-b border-navy-light/60 px-5 py-3.5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                {/* Visual Mac Traffic Lights */}
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/30" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/30" />
                  <div className="h-3 w-3 rounded-full bg-green-500/30" />
                </div>
                {/* File Tab */}
                <span className="text-xs font-mono font-medium text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-3 py-1 rounded-md flex items-center gap-1.5 select-none">
                  <Code className="h-3.5 w-3.5 text-indigo-400" /> {selectedLang.fileName}
                </span>
              </div>

              {/* Copy action */}
              {(parsedOutput.code || replyText) && (
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Editor Textarea */}
            <div className="flex-1 overflow-auto p-5 font-mono text-[11px] sm:text-xs leading-relaxed text-slate-300 bg-slate-950/90 relative">
              {loading && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 animate-spin">
                    <Cpu className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div className="text-xs text-indigo-400 tracking-widest uppercase animate-pulse font-bold">
                    {generationStep}
                  </div>
                </div>
              )}

              {parsedOutput.code ? (
                <pre className="whitespace-pre-wrap select-text h-full selection:bg-indigo-500/30">
                  {parsedOutput.code}
                </pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 max-w-sm mx-auto space-y-4">
                  <Terminal className="h-10 w-10 text-indigo-500/25" />
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-400">Workspace Empty</h4>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      Click the "Generate Engineering Code" button to feed variables and timing sequences into the AI model.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pin Connections / Module explanations */}
          {parsedOutput.notes && (
            <div className="bg-navy-card border border-navy-light p-6 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 border-b border-navy-light/60 pb-2">
                <BookOpen className="h-4 w-4" /> Hardware Connections & Architecture Guide
              </h3>
              <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-text selection:bg-indigo-500/25 max-h-[500px] overflow-y-auto">
                {parsedOutput.notes}
              </div>
            </div>
          )}

          {/* Floating static tip */}
          {!parsedOutput.notes && (
            <div className="bg-navy-dark/40 border border-navy-light p-4 rounded-xl flex gap-3 text-xs text-slate-400">
              <Info className="h-5 w-5 text-indigo-400 shrink-0" />
              <div className="space-y-1">
                <span className="font-bold text-white block">Undergrad Course Syllabi (Sourcing)</span>
                <p>
                  All models utilize standard microchip registers (Cortex ARM System Control Block, NVIC vectors, TIM prescaling registers) or strict synthesizable ANSI Verilog designs conformant to top university laboratory manuals.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
