import { useState, useMemo } from 'react';

export interface FaultTestingInputs {
  circuit: 'NAND2' | 'AND_OR3';
  node: string;
  fault: 'SA0' | 'SA1';
}

export interface FaultTestingOutputs {
  testVector: string;
  sensitizedPath: string[];
  explanation: string;
}

export function useFaultTesting(initialInputs: FaultTestingInputs) {
  const [inputs, setInputs] = useState<FaultTestingInputs>(initialInputs);

  const outputs = useMemo<FaultTestingOutputs>(() => {
    const { circuit, node, fault } = inputs;
    
    let testVector = '';
    let sensitizedPath: string[] = [];
    let explanation = '';

    if (circuit === 'NAND2') {
      // Y = ~(A * B)
      if (node === 'A') {
        if (fault === 'SA0') {
          testVector = 'A=1, B=1';
          sensitizedPath = ['A', 'Y'];
          explanation = 'To detect A stuck-at-0, we must apply A=1. To propagate the fault to the output Y, B must be non-controlling (B=1). In fault-free: Y=0. In faulty: Y=1.';
        } else {
          testVector = 'A=0, B=1';
          sensitizedPath = ['A', 'Y'];
          explanation = 'To detect A stuck-at-1, we must apply A=0. To propagate, B must be 1. In fault-free: Y=1. In faulty: Y=0.';
        }
      } else if (node === 'B') {
        if (fault === 'SA0') {
          testVector = 'A=1, B=1';
          sensitizedPath = ['B', 'Y'];
          explanation = 'To detect B stuck-at-0, apply B=1. To propagate, A must be 1. Fault-free Y=0, faulty Y=1.';
        } else {
          testVector = 'A=1, B=0';
          sensitizedPath = ['B', 'Y'];
          explanation = 'To detect B stuck-at-1, apply B=0. To propagate, A must be 1. Fault-free Y=1, faulty Y=0.';
        }
      } else if (node === 'Y') {
        if (fault === 'SA0') {
          testVector = 'A=0, B=0 (or 01, 10)';
          sensitizedPath = ['Y'];
          explanation = 'To detect Y stuck-at-0, we need the fault-free output to be 1. This happens for inputs 00, 01, or 10.';
        } else {
          testVector = 'A=1, B=1';
          sensitizedPath = ['Y'];
          explanation = 'To detect Y stuck-at-1, we need the fault-free output to be 0. This requires A=1, B=1.';
        }
      }
    } else if (circuit === 'AND_OR3') {
      // Y = (A * B) + C
      if (node === 'A') {
        if (fault === 'SA0') {
          testVector = 'A=1, B=1, C=0';
          sensitizedPath = ['A', 'AB', 'Y'];
          explanation = 'Detect A SA0: A=1. Propagate through AND: B=1. Propagate through OR: C=0. Fault-free Y=1, faulty Y=0.';
        } else {
          testVector = 'A=0, B=1, C=0';
          sensitizedPath = ['A', 'AB', 'Y'];
          explanation = 'Detect A SA1: A=0. Propagate through AND: B=1. Propagate through OR: C=0. Fault-free Y=0, faulty Y=1.';
        }
      } else if (node === 'B') {
        if (fault === 'SA0') {
          testVector = 'A=1, B=1, C=0';
          sensitizedPath = ['B', 'AB', 'Y'];
          explanation = 'Detect B SA0: B=1. Propagate through AND: A=1. Propagate through OR: C=0. Fault-free Y=1, faulty Y=0.';
        } else {
          testVector = 'A=1, B=0, C=0';
          sensitizedPath = ['B', 'AB', 'Y'];
          explanation = 'Detect B SA1: B=0. Propagate through AND: A=1. Propagate through OR: C=0. Fault-free Y=0, faulty Y=1.';
        }
      } else if (node === 'C') {
        if (fault === 'SA0') {
          testVector = 'A=0, B=0, C=1';
          sensitizedPath = ['C', 'Y'];
          explanation = 'Detect C SA0: C=1. Propagate through OR: other input must be 0, so A=0 or B=0. Fault-free Y=1, faulty Y=0.';
        } else {
          testVector = 'A=0, B=0, C=0';
          sensitizedPath = ['C', 'Y'];
          explanation = 'Detect C SA1: C=0. Propagate through OR: other input must be 0. Fault-free Y=0, faulty Y=1.';
        }
      } else if (node === 'Y') {
        if (fault === 'SA0') {
          testVector = 'A=1, B=1, C=0 (or C=1)';
          sensitizedPath = ['Y'];
          explanation = 'Detect Y SA0: Need fault-free Y=1.';
        } else {
          testVector = 'A=0, B=0, C=0';
          sensitizedPath = ['Y'];
          explanation = 'Detect Y SA1: Need fault-free Y=0.';
        }
      }
    }

    return { testVector, sensitizedPath, explanation };
  }, [inputs]);

  return { inputs, setInputs, outputs };
}
