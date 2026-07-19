import { useState, useCallback, useMemo } from 'react';

export type ContactType = 'NO' | 'NC'; // Normally Open / Normally Closed

export interface PLCContact {
  id: string;
  type: ContactType;
  variable: string; // e.g. 'X1', 'X2'
}

export interface PLCBranch {
  id: string;
  contacts: PLCContact[];
}

export function usePLCSimulator() {
  // Rung layout: List of parallel branches. Each branch has contacts in series.
  // The rung evaluates as: Branch1 OR Branch2 OR Branch3...
  // Each Branch evaluates as: Contact1 AND Contact2 AND Contact3...
  const [branches, setBranches] = useState<PLCBranch[]>([
    {
      id: 'branch-1',
      contacts: [
        { id: 'c-1', type: 'NO', variable: 'X1' },
        { id: 'c-2', type: 'NC', variable: 'X2' }
      ]
    },
    {
      id: 'branch-2',
      contacts: [
        { id: 'c-3', type: 'NO', variable: 'X3' }
      ]
    }
  ]);

  // Output coil config
  const [outputVariable, setOutputVariable] = useState<string>('Y1');

  // Global variable states (inputs X1, X2, X3, X4, etc.)
  const [variables, setVariables] = useState<Record<string, boolean>>({
    X1: false,
    X2: false,
    X3: false,
    X4: false
  });

  // Toggle variable state
  const toggleVariable = useCallback((varName: string) => {
    setVariables(prev => ({
      ...prev,
      [varName]: !prev[varName]
    }));
  }, []);

  // Update a contact's variable or type
  const updateContact = useCallback((branchId: string, contactId: string, updates: Partial<PLCContact>) => {
    setBranches(prev => prev.map(branch => {
      if (branch.id !== branchId) return branch;
      return {
        ...branch,
        contacts: branch.contacts.map(c => {
          if (c.id !== contactId) return c;
          const updated = { ...c, ...updates };
          // If we introduce a new variable name, ensure it exists in the global map
          if (updates.variable) {
            setVariables(v => {
              if (v[updates.variable!] === undefined) {
                return { ...v, [updates.variable!]: false };
              }
              return v;
            });
          }
          return updated;
        })
      };
    }));
  }, []);

  // Add a contact to a branch
  const addContact = useCallback((branchId: string) => {
    const contactId = `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setBranches(prev => prev.map(branch => {
      if (branch.id !== branchId) return branch;
      
      // Default to picking an unused variable or a standard one
      const count = branch.contacts.length + 1;
      const defaultVar = `X${count}`;

      setVariables(v => {
        if (v[defaultVar] === undefined) {
          return { ...v, [defaultVar]: false };
        }
        return v;
      });

      return {
        ...branch,
        contacts: [...branch.contacts, { id: contactId, type: 'NO', variable: defaultVar }]
      };
    }));
  }, []);

  // Remove a contact from a branch
  const removeContact = useCallback((branchId: string, contactId: string) => {
    setBranches(prev => {
      const updated = prev.map(branch => {
        if (branch.id !== branchId) return branch;
        return {
          ...branch,
          contacts: branch.contacts.filter(c => c.id !== contactId)
        };
      });
      // Filter out empty branches
      return updated.filter(b => b.contacts.length > 0);
    });
  }, []);

  // Add a new parallel branch
  const addBranch = useCallback(() => {
    const branchId = `branch-${Date.now()}`;
    const contactId = `c-${Date.now()}`;
    setBranches(prev => [
      ...prev,
      {
        id: branchId,
        contacts: [{ id: contactId, type: 'NO', variable: 'X1' }]
      }
    ]);
  }, []);

  // Helper to determine if a specific contact is conducting
  const isContactConducting = useCallback((contact: PLCContact) => {
    const value = !!variables[contact.variable];
    return contact.type === 'NO' ? value : !value;
  }, [variables]);

  // Evaluate the branches and see if the output is energized
  const evaluationResult = useMemo(() => {
    // Check conduction state of each contact and branch
    const branchStates = branches.map(branch => {
      // All contacts in the series branch must conduct
      const contactStates = branch.contacts.map(c => ({
        id: c.id,
        conducting: isContactConducting(c)
      }));
      
      const isBranchConducting = contactStates.length > 0 && contactStates.every(c => c.conducting);
      
      return {
        branchId: branch.id,
        contacts: contactStates,
        conducting: isBranchConducting
      };
    });

    // Output coil is energized if ANY branch is conducting
    const isOutputEnergized = branchStates.some(b => b.conducting);

    return {
      branchStates,
      isOutputEnergized
    };
  }, [branches, isContactConducting]);

  const resetPLC = useCallback(() => {
    setVariables({
      X1: false,
      X2: false,
      X3: false,
      X4: false
    });
    setBranches([
      {
        id: 'branch-1',
        contacts: [
          { id: 'c-1', type: 'NO', variable: 'X1' },
          { id: 'c-2', type: 'NC', variable: 'X2' }
        ]
      },
      {
        id: 'branch-2',
        contacts: [
          { id: 'c-3', type: 'NO', variable: 'X3' }
        ]
      }
    ]);
    setOutputVariable('Y1');
  }, []);

  return {
    branches,
    variables,
    outputVariable,
    setOutputVariable,
    toggleVariable,
    updateContact,
    addContact,
    removeContact,
    addBranch,
    isContactConducting,
    branchStates: evaluationResult.branchStates,
    isOutputEnergized: evaluationResult.isOutputEnergized,
    resetPLC
  };
}
