import { useState, useCallback, useMemo } from 'react';

export interface Registers {
  AX: number;
  BX: number;
  CX: number;
  DX: number;
}

export interface Flags {
  Z: boolean; // Zero Flag
  C: boolean; // Carry Flag
  S: boolean; // Sign Flag
  O: boolean; // Overflow Flag
}

export interface AssemblyLine {
  text: string;
  originalIndex: number;
  error?: string;
}

export function useAssemblySimulator(initialCode: string) {
  const [code, setCode] = useState<string>(initialCode);
  const [registers, setRegisters] = useState<Registers>({ AX: 0, BX: 0, CX: 0, DX: 0 });
  const [flags, setFlags] = useState<Flags>({ Z: false, C: false, S: false, O: false });
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [history, setHistory] = useState<{ registers: Registers; flags: Flags; pc: number }[]>([]);
  const [logs, setLogs] = useState<string[]>(['Simulator initialized.']);

  // Clean and parse lines
  const lines = useMemo<AssemblyLine[]>(() => {
    return code.split('\n').map((line, idx) => {
      const cleanText = line.split(';')[0].trim(); // Strip comments
      return {
        text: cleanText,
        originalIndex: idx
      };
    });
  }, [code]);

  // Executable lines (skipping completely blank lines)
  const executableLines = useMemo(() => {
    return lines.filter(l => l.text.length > 0);
  }, [lines]);

  const reset = useCallback(() => {
    setRegisters({ AX: 0, BX: 0, CX: 0, DX: 0 });
    setFlags({ Z: false, C: false, S: false, O: false });
    setCurrentLineIndex(0);
    setHistory([]);
    setLogs(['State reset. Registers cleared.']);
  }, []);

  // Helper to parse operand (either register name or immediate constant)
  const getVal = (operand: string, currentRegs: Registers): number => {
    const op = operand.toUpperCase().trim();
    if (op === 'AX') return currentRegs.AX;
    if (op === 'BX') return currentRegs.BX;
    if (op === 'CX') return currentRegs.CX;
    if (op === 'DX') return currentRegs.DX;
    
    // Parse immediate integer (decimal or hex e.g. 05H or 5)
    if (op.endsWith('H')) {
      const hexVal = parseInt(op.slice(0, -1), 16);
      return isNaN(hexVal) ? 0 : hexVal;
    }
    const decVal = parseInt(op, 10);
    return isNaN(decVal) ? 0 : decVal;
  };

  // Helper to set register
  const setRegVal = (regName: string, val: number, targetRegs: Registers): Registers => {
    const name = regName.toUpperCase().trim();
    const updated = { ...targetRegs };
    // Force to 16-bit
    const maskedVal = (val + 65536) % 65536;
    if (name === 'AX') updated.AX = maskedVal;
    else if (name === 'BX') updated.BX = maskedVal;
    else if (name === 'CX') updated.CX = maskedVal;
    else if (name === 'DX') updated.DX = maskedVal;
    return updated;
  };

  // Helper to update flags based on result of calculation
  const updateFlags = (result: number, isAddition: boolean, op1: number, op2: number): Flags => {
    const wordResult = (result + 65536) % 65536;
    const Z = wordResult === 0;
    const S = (wordResult & 0x8000) !== 0; // Sign bit (15th bit)
    
    // Carry Flag: did it exceed 16-bit limit?
    const C = result < 0 || result > 65535;

    // Overflow Flag: signed overflow
    // For addition: (op1 and op2 have same sign) and (result has different sign)
    // For subtraction: (op1 and op2 have different signs) and (result has different sign from op1)
    let O = false;
    const sign1 = (op1 & 0x8000) !== 0;
    const sign2 = (op2 & 0x8000) !== 0;
    const signR = (wordResult & 0x8000) !== 0;

    if (isAddition) {
      O = (sign1 === sign2) && (signR !== sign1);
    } else {
      // Subtraction: op1 - op2
      O = (sign1 !== sign2) && (signR !== sign1);
    }

    return { Z, C, S, O };
  };

  const step = useCallback(() => {
    if (currentLineIndex >= executableLines.length) {
      setLogs(prev => [...prev, 'Program reached end. Use Reset to run again.']);
      return;
    }

    const currentLine = executableLines[currentLineIndex];
    const text = currentLine.text;
    const tokens = text.match(/([A-Za-z]+)\s+([^,]+)(?:,\s*(.+))?/);

    if (!tokens) {
      setLogs(prev => [...prev, `[Line ${currentLine.originalIndex + 1}] Unrecognized statement: "${text}"`]);
      setCurrentLineIndex(prev => prev + 1);
      return;
    }

    const cmd = tokens[1].toUpperCase();
    const dest = tokens[2].trim();
    const src = tokens[3] ? tokens[3].trim() : '';

    let nextRegs = { ...registers };
    let nextFlags = { ...flags };
    let logMsg = `[Line ${currentLine.originalIndex + 1}] ${cmd} ${dest}${src ? ', ' + src : ''}`;

    try {
      if (cmd === 'MOV') {
        const val = getVal(src, registers);
        nextRegs = setRegVal(dest, val, registers);
        logMsg += ` -> Loaded ${val} into ${dest}`;
      } else if (cmd === 'ADD') {
        const val1 = getVal(dest, registers);
        const val2 = getVal(src, registers);
        const result = val1 + val2;
        nextRegs = setRegVal(dest, result, registers);
        nextFlags = updateFlags(result, true, val1, val2);
        logMsg += ` -> Result: ${nextRegs[dest as keyof Registers]} (Flags: Z=${nextFlags.Z ? 1 : 0}, C=${nextFlags.C ? 1 : 0}, S=${nextFlags.S ? 1 : 0}, O=${nextFlags.O ? 1 : 0})`;
      } else if (cmd === 'SUB') {
        const val1 = getVal(dest, registers);
        const val2 = getVal(src, registers);
        const result = val1 - val2;
        nextRegs = setRegVal(dest, result, registers);
        nextFlags = updateFlags(result, false, val1, val2);
        logMsg += ` -> Result: ${nextRegs[dest as keyof Registers]} (Flags: Z=${nextFlags.Z ? 1 : 0}, C=${nextFlags.C ? 1 : 0}, S=${nextFlags.S ? 1 : 0}, O=${nextFlags.O ? 1 : 0})`;
      } else if (cmd === 'INC') {
        const val1 = getVal(dest, registers);
        const result = val1 + 1;
        nextRegs = setRegVal(dest, result, registers);
        // INC updates Z, S, O but NOT C (Carry)
        const f = updateFlags(result, true, val1, 1);
        nextFlags = { ...flags, Z: f.Z, S: f.S, O: f.O };
        logMsg += ` -> Incremented ${dest} to ${nextRegs[dest as keyof Registers]}`;
      } else if (cmd === 'DEC') {
        const val1 = getVal(dest, registers);
        const result = val1 - 1;
        nextRegs = setRegVal(dest, result, registers);
        // DEC updates Z, S, O but NOT C (Carry)
        const f = updateFlags(result, false, val1, 1);
        nextFlags = { ...flags, Z: f.Z, S: f.S, O: f.O };
        logMsg += ` -> Decremented ${dest} to ${nextRegs[dest as keyof Registers]}`;
      } else {
        logMsg += ` -> Unknown instruction or unparsed mnemonic. Skipping.`;
      }

      // Save to history before shifting states
      setHistory(prev => [...prev, { registers: { ...registers }, flags: { ...flags }, pc: currentLineIndex }]);
      setRegisters(nextRegs);
      setFlags(nextFlags);
      setLogs(prev => [...prev, logMsg]);
      setCurrentLineIndex(prev => prev + 1);

    } catch (err: any) {
      setLogs(prev => [...prev, `[Line ${currentLine.originalIndex + 1}] Error: ${err.message}`]);
      setCurrentLineIndex(prev => prev + 1);
    }
  }, [registers, flags, currentLineIndex, executableLines]);

  return {
    code,
    setCode,
    registers,
    flags,
    currentLineIndex: executableLines[currentLineIndex]?.originalIndex ?? lines.length,
    stepLineText: executableLines[currentLineIndex]?.text ?? '',
    finished: currentLineIndex >= executableLines.length,
    logs,
    reset,
    step,
    linesCount: lines.length
  };
}
