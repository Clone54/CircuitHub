import { useState, useMemo } from 'react';

export type LogicGateType = 'NOT' | 'NAND' | 'NOR' | 'AND (CMOS)' | 'OR (CMOS)' | 'XOR' | 'XNOR' | 'Custom Function';
export type ViewMode = 'Schematic' | 'Stick Diagram';

export interface CMOSState {
  gateType: LogicGateType;
  inputs: number[];
  output: number;
}

export function useCMOSGenerator() {
  const [gateType, setGateType] = useState<LogicGateType>('NAND');
  const [viewMode, setViewMode] = useState<ViewMode>('Schematic');
  
  const [inputs, setInputs] = useState<number[]>([0, 0]);
  
  const [customExpression, setCustomExpression] = useState('Y = ~((A*B)+C)');
  const [customSvg, setCustomSvg] = useState<string | null>(null);
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
  const [customError, setCustomError] = useState('');

  const generateCustomCMOS = async () => {
    setIsGeneratingCustom(true);
    setCustomError('');
    setCustomSvg(null);
    try {
      const res = await fetch('/api/generate-cmos-schematic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression: customExpression })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to generate CMOS layout');
      setCustomSvg(data.svg);
    } catch (err: any) {
      setCustomError(err.message);
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  const handleGateTypeChange = (newGate: LogicGateType) => {
    setGateType(newGate);
    if (newGate === 'NOT') {
      setInputs([inputs[0]]);
    } else if (inputs.length === 1) {
      setInputs([inputs[0], 0]);
    }
  };

  const handleInputToggle = (index: number) => {
    const newInputs = [...inputs];
    newInputs[index] = newInputs[index] === 0 ? 1 : 0;
    setInputs(newInputs);
  };

  const output = useMemo(() => {
    const A = inputs[0] === 1;
    const B = inputs[1] === 1;
    switch (gateType) {
      case 'NOT': return !A ? 1 : 0;
      case 'NAND': return !(A && B) ? 1 : 0;
      case 'NOR': return !(A || B) ? 1 : 0;
      case 'AND (CMOS)': return (A && B) ? 1 : 0;
      case 'OR (CMOS)': return (A || B) ? 1 : 0;
      case 'XOR': return (A !== B) ? 1 : 0;
      case 'XNOR': return (A === B) ? 1 : 0;
      default: return 0;
    }
  }, [gateType, inputs]);

  const transistorCount = useMemo(() => {
    switch (gateType) {
      case 'NOT': return 2;
      case 'NAND': 
      case 'NOR': return 4;
      case 'AND (CMOS)': 
      case 'OR (CMOS)': return 6; 
      case 'XOR': 
      case 'XNOR': return 12; // Standard unoptimized CMOS
      default: return 0;
    }
  }, [gateType]);

  return {
    gateType,
    handleGateTypeChange,
    viewMode,
    setViewMode,
    inputs,
    handleInputToggle,
    output,
    transistorCount,
    customExpression,
    setCustomExpression,
    customSvg,
    isGeneratingCustom,
    customError,
    generateCustomCMOS
  };
}
