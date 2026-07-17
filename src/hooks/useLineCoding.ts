import { useState, useMemo } from 'react';

export function useLineCoding(initialData: string) {
  const [dataStr, setDataStr] = useState(initialData);

  const outputs = useMemo(() => {
    let unipolarNRZ: { t: number, val: number }[] = [];
    let polarNRZ: { t: number, val: number }[] = [];
    let polarRZ: { t: number, val: number }[] = [];
    let manchester: { t: number, val: number }[] = [];
    let ami: { t: number, val: number }[] = [];

    const bits = dataStr.split('').filter(b => b === '0' || b === '1').map(Number);
    
    let amiLastPolarity = -1;

    bits.forEach((b, i) => {
      // Unipolar NRZ
      unipolarNRZ.push({ t: i, val: b });
      
      // Polar NRZ
      polarNRZ.push({ t: i, val: b === 1 ? 1 : -1 });
      
      // Polar RZ
      polarRZ.push({ t: i, val: b === 1 ? 1 : -1 });
      polarRZ.push({ t: i + 0.5, val: 0 });
      
      // Manchester (0 -> 1 to -1, 1 -> -1 to 1)
      const man1 = b === 1 ? -1 : 1;
      const man2 = b === 1 ? 1 : -1;
      manchester.push({ t: i, val: man1 });
      manchester.push({ t: i + 0.5, val: man2 });
      
      // AMI
      if (b === 0) {
        ami.push({ t: i, val: 0 });
      } else {
        amiLastPolarity = -amiLastPolarity;
        ami.push({ t: i, val: amiLastPolarity });
      }
    });

    const endT = bits.length;
    if (endT > 0) {
      unipolarNRZ.push({ t: endT, val: unipolarNRZ[unipolarNRZ.length - 1].val });
      polarNRZ.push({ t: endT, val: polarNRZ[polarNRZ.length - 1].val });
      polarRZ.push({ t: endT, val: 0 }); // Returns to 0 at the end
      manchester.push({ t: endT, val: manchester[manchester.length - 1].val });
      ami.push({ t: endT, val: ami[ami.length - 1].val });
    }

    return { bits, unipolarNRZ, polarNRZ, polarRZ, manchester, ami, endT };
  }, [dataStr]);

  return { dataStr, setDataStr, outputs };
}
