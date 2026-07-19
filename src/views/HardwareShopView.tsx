import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Wrench,
  Microchip,
  Cpu,
  CircuitBoard,
  FileText,
  Copy,
  Download
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Markdown from 'react-markdown';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';

import { useIPC2221 } from '../hooks/useIPC2221';

type TabId = 'iot' | 'emc' | 'pitch';

const MCU_PIN_MAPS: Record<string, Record<string, Record<string, string>>> = {
  'Arduino Uno': {
    'IR': { OUT: 'D2' },
    'PIR': { OUT: 'D3' },
    'Ultrasonic': { TRIG: 'D4', ECHO: 'D5' },
    'DHT11': { DATA: 'D6' },
    'LDR': { OUT: 'A0' },
    'LCD Display': { SDA: 'A4', SCL: 'A5' }
  },
  'ESP32': {
    'IR': { OUT: 'GPIO 13' },
    'PIR': { OUT: 'GPIO 14' },
    'Ultrasonic': { TRIG: 'GPIO 5', ECHO: 'GPIO 18' },
    'DHT11': { DATA: 'GPIO 19' },
    'LDR': { OUT: 'ADC1_CH0 (GPIO 36)' },
    'LCD Display': { SDA: 'GPIO 21', SCL: 'GPIO 22' }
  },
  'STM32': {
    'IR': { OUT: 'PA1' },
    'PIR': { OUT: 'PA2' },
    'Ultrasonic': { TRIG: 'PA3', ECHO: 'PA4' },
    'DHT11': { DATA: 'PA5' },
    'LDR': { OUT: 'PA0 (ADC1_IN0)' },
    'LCD Display': { SDA: 'PB7', SCL: 'PB6' }
  }
};

const pdfStyles = StyleSheet.create({
  page: { flexDirection: 'column', backgroundColor: '#FFFFFF', padding: 30, fontFamily: 'Helvetica' },
  section: { margin: 10, padding: 10, flexGrow: 1 },
  title: { fontSize: 18, marginBottom: 10, fontWeight: 'bold' },
  text: { fontSize: 12, lineHeight: 1.5 }
});

const PitchDocument = ({ content }: { content: string }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.title}>Hardware Project Pitch</Text>
        <Text style={pdfStyles.text}>{content.replace(/[#*]/g, '')}</Text>
      </View>
    </Page>
  </Document>
);

export default function HardwareShopView() {
  const [activeTab, setActiveTab] = useState<TabId>('iot');

  // Tab 1: IoT
  const [mcu, setMcu] = useState('ESP32');
  const [selectedSensors, setSelectedSensors] = useState<string[]>(['Ultrasonic']);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const availableSensors = ['IR', 'PIR', 'Ultrasonic', 'DHT11', 'LDR', 'LCD Display'];

  const toggleSensor = (sensor: string) => {
    if (selectedSensors.includes(sensor)) {
      setSelectedSensors(selectedSensors.filter(s => s !== sensor));
    } else {
      setSelectedSensors([...selectedSensors, sensor]);
    }
  };

  const activePinMap = selectedSensors.reduce((acc, sensor) => {
    acc[sensor] = MCU_PIN_MAPS[mcu][sensor];
    return acc;
  }, {} as any);

  const generateIoTCode = async () => {
    setIsGeneratingCode(true);
    try {
      const res = await fetch('/api/iot-code-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mcu, sensors: selectedSensors, pinMap: activePinMap })
      });
      const data = await res.json();
      setGeneratedCode(data.code.replace(/\`\`\`(c|cpp)?/g, '').replace(/\`\`\`/g, '').trim());
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // Tab 2: EMC
  const { inputs: ipcInputs, setInputs: setIpcInputs, outputs: ipcOutputs } = useIPC2221({
    current: 1.5,
    thickness: 1.0,
    deltaT: 10
  });
  const [signalType, setSignalType] = useState('Mixed-Signal');
  const [emcAdvice, setEmcAdvice] = useState('');
  const [isGeneratingEmc, setIsGeneratingEmc] = useState(false);

  const generateEmcAdvice = async () => {
    setIsGeneratingEmc(true);
    try {
      const res = await fetch('/api/pcb-emc-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signalType,
          current: ipcInputs.current,
          extWidth: ipcOutputs.widthOuter.toFixed(2),
          intWidth: ipcOutputs.widthInner.toFixed(2)
        })
      });
      const data = await res.json();
      setEmcAdvice(data.advice);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingEmc(false);
    }
  };

  // Tab 3: Pitch
  const [pitchIdea, setPitchIdea] = useState('Smart Plant Monitoring System with automated watering');
  const [pitchMarket, setPitchMarket] = useState('Urban Gardeners');
  const [pitchCost, setPitchCost] = useState('15');
  const [generatedPitch, setGeneratedPitch] = useState('');
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false);

  const generatePitch = async () => {
    setIsGeneratingPitch(true);
    try {
      const res = await fetch('/api/hardware-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: pitchIdea, market: pitchMarket, cost: pitchCost })
      });
      const data = await res.json();
      setGeneratedPitch(data.pitch);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPitch(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-dark text-slate-100 pb-12 font-sans selection:bg-amber-500/30 selection:text-white">
      {/* Top Navigation */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono tracking-wide transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> BACK TO HOME
        </Link>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Header Billboard */}
        <div className="relative rounded-2xl border border-navy-light/60 bg-navy-light/20 p-6 md:p-8 overflow-hidden">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase mb-2">
              <Wrench className="h-4 w-4 animate-pulse" /> EEE 3100 Electronics Shop Practice
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
              Hardware Design <span className="text-amber-400">&</span> Practice Suite
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
              MCU sensor interfacing, PCB trace calculations with EMC guidelines, and hardware business pitch generation.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-navy-light/60 pb-px">
          <button onClick={() => setActiveTab('iot')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'iot' ? 'border-amber-400 text-amber-400 bg-amber-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><Cpu className="h-4 w-4" /> IoT Interfacing</div>
          </button>
          <button onClick={() => setActiveTab('emc')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'emc' ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><CircuitBoard className="h-4 w-4" /> PCB EMC Advisor</div>
          </button>
          <button onClick={() => setActiveTab('pitch')} className={`px-4 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === 'pitch' ? 'border-blue-400 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-navy-light/40'}`}>
            <div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Hardware Pitch</div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          
          {/* TAB 1: IOT INTERFACING */}
          {activeTab === 'iot' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <Microchip className="h-5 w-5 text-amber-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Architecture Config</h3>
                </div>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">MCU Platform</label>
                    <select value={mcu} onChange={e => setMcu(e.target.value)} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white">
                      {Object.keys(MCU_PIN_MAPS).map(board => (
                        <option key={board} value={board}>{board}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-slate-400 block">Select Sensors & Modules</label>
                    <div className="flex flex-wrap gap-2">
                      {availableSensors.map(sensor => (
                        <button
                          key={sensor}
                          onClick={() => toggleSensor(sensor)}
                          className={`px-3 py-1.5 rounded border transition-all ${selectedSensors.includes(sensor) ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-navy-dark border-navy-light text-slate-400 hover:border-slate-500'}`}
                        >
                          {sensor}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedSensors.length > 0 && (
                    <div className="mt-4 border border-navy-light/40 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-navy-dark border-b border-navy-light/40">
                          <tr>
                            <th className="px-3 py-2 text-slate-400 font-mono">Module</th>
                            <th className="px-3 py-2 text-slate-400 font-mono">Pins</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-navy-light/40">
                          {selectedSensors.map(sensor => (
                            <tr key={sensor}>
                              <td className="px-3 py-2 text-white">{sensor}</td>
                              <td className="px-3 py-2 text-slate-300 font-mono">
                                {Object.entries(activePinMap[sensor]).map(([pin, mapping]) => (
                                  <div key={pin}><span className="text-amber-400">{pin}:</span> {mapping as React.ReactNode}</div>
                                ))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <button onClick={generateIoTCode} disabled={isGeneratingCode || selectedSensors.length === 0} className="w-full bg-amber-500 hover:bg-amber-400 text-navy-dark font-bold py-2 rounded transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2 mt-4">
                    {isGeneratingCode ? 'Synthesizing Firmware...' : 'Generate Boilerplate Code'}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-7 bg-navy-card border border-navy-light/60 p-6 rounded-2xl flex flex-col min-h-[400px]">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">Generated Firmware (C/C++)</h4>
                  {generatedCode && (
                    <button onClick={() => navigator.clipboard.writeText(generatedCode)} className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-mono uppercase bg-navy-dark px-2 py-1 rounded border border-navy-light">
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                  )}
                </div>
                
                <div className="flex-1 bg-navy-dark border border-navy-light rounded-xl overflow-hidden text-sm">
                  {generatedCode ? (
                    <SyntaxHighlighter
                      language="cpp"
                      style={vscDarkPlus}
                      customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: '0.8rem' }}
                    >
                      {generatedCode}
                    </SyntaxHighlighter>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 font-mono text-sm p-4 text-center">
                      Select sensors and click Generate to create the firmware initialization and read loops.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PCB EMC ADVISOR */}
          {activeTab === 'emc' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <CircuitBoard className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Trace Parameters</h3>
                </div>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Max Current I (Amps)</label>
                    <input type="number" step="0.1" value={ipcInputs.current} onChange={e => setIpcInputs({...ipcInputs, current: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Thickness (oz/ft²)</label>
                      <input type="number" step="0.5" value={ipcInputs.thickness} onChange={e => setIpcInputs({...ipcInputs, thickness: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 block">Temp Rise ΔT (°C)</label>
                      <input type="number" value={ipcInputs.deltaT} onChange={e => setIpcInputs({...ipcInputs, deltaT: parseFloat(e.target.value)||0})} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                    </div>
                  </div>
                  <div className="space-y-1.5 border-t border-navy-light/40 pt-4">
                    <label className="text-slate-400 block">Signal Type</label>
                    <select value={signalType} onChange={e => setSignalType(e.target.value)} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white">
                      <option value="Low Frequency">Low Frequency (&lt; 1 MHz)</option>
                      <option value="High-Speed Digital">High-Speed Digital</option>
                      <option value="Mixed-Signal">Mixed-Signal (Analog + Digital)</option>
                      <option value="RF">RF / Microwave</option>
                    </select>
                  </div>
                </div>

                <div className="bg-navy-dark border border-emerald-500/30 rounded-xl p-4 mt-6 space-y-3">
                  <h4 className="text-[10px] font-mono font-bold uppercase text-slate-500 mb-2">IPC-2221 Calculated Widths</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 text-xs font-mono">External Trace</span>
                    <span className="text-lg font-bold text-emerald-400 font-mono">{ipcOutputs.widthOuter.toFixed(2)} mils</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-navy-light/40 pt-2">
                    <span className="text-slate-300 text-xs font-mono">Internal Trace</span>
                    <span className="text-lg font-bold text-emerald-400 font-mono">{ipcOutputs.widthInner.toFixed(2)} mils</span>
                  </div>
                </div>

                <button onClick={generateEmcAdvice} disabled={isGeneratingEmc} className="w-full bg-emerald-500 hover:bg-emerald-400 text-navy-dark font-bold py-2 rounded transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2 mt-4">
                  {isGeneratingEmc ? 'Analyzing EMC...' : 'Generate AI EMC Review'}
                </button>
              </div>

              <div className="lg:col-span-8 bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[400px]">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-navy-light/40 pb-2">Senior Engineer Design Review</h4>
                
                {emcAdvice ? (
                  <div className="prose prose-invert prose-emerald max-w-none prose-sm font-sans markdown-body bg-navy-dark/50 p-6 rounded-xl border border-navy-light/50 max-h-[500px] overflow-y-auto">
                    <Markdown>{emcAdvice}</Markdown>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-slate-500 font-mono text-sm border border-dashed border-navy-light/50 rounded-xl">
                    Run the AI EMC Review to get actionable grounding and signal integrity advice.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: HARDWARE PITCH */}
          {activeTab === 'pitch' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 bg-navy-card border border-navy-light/60 p-6 rounded-2xl space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-navy-light/60">
                  <FileText className="h-5 w-5 text-blue-400" />
                  <h3 className="font-bold text-white text-sm tracking-tight uppercase font-mono">Project Pitch Brief</h3>
                </div>
                
                <div className="space-y-4 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Project Idea / Problem</label>
                    <textarea 
                      value={pitchIdea} 
                      onChange={e => setPitchIdea(e.target.value)} 
                      className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white h-24 resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Target Audience / Market</label>
                    <input type="text" value={pitchMarket} onChange={e => setPitchMarket(e.target.value)} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-400 block">Estimated Prototype Cost ($)</label>
                    <input type="number" value={pitchCost} onChange={e => setPitchCost(e.target.value)} className="w-full bg-navy-dark border border-navy-light rounded px-3 py-2 text-white" />
                  </div>
                </div>

                <button onClick={generatePitch} disabled={isGeneratingPitch || !pitchIdea} className="w-full bg-blue-500 hover:bg-blue-400 text-navy-dark font-bold py-2 rounded transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2 mt-4">
                  {isGeneratingPitch ? 'Drafting Business Plan...' : 'Generate Project Pitch'}
                </button>
              </div>

              <div className="lg:col-span-8 bg-navy-card border border-navy-light/60 p-6 rounded-2xl min-h-[500px] max-h-[700px] flex flex-col">
                <div className="flex justify-between items-center mb-4 border-b border-navy-light/40 pb-2">
                  <h4 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">Formal Business Plan</h4>
                  {generatedPitch && (
                    <PDFDownloadLink 
                      document={<PitchDocument content={generatedPitch} />} 
                      fileName="Hardware_Pitch.pdf"
                      className="text-white hover:text-white transition-colors flex items-center gap-1 text-[10px] font-mono uppercase bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded"
                    >
                      {({ loading }) => (
                        <>
                          <Download className="h-3 w-3" /> {loading ? 'Preparing...' : 'Download PDF'}
                        </>
                      )}
                    </PDFDownloadLink>
                  )}
                </div>
                
                {generatedPitch ? (
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="prose prose-invert prose-blue max-w-none prose-sm font-sans markdown-body bg-navy-dark/30 p-6 rounded-xl">
                      <Markdown>{generatedPitch}</Markdown>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-sm border border-dashed border-navy-light/50 rounded-xl p-8 text-center">
                    Provide your project details and click Generate to draft a formal technical and business pitch for your hardware product.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
