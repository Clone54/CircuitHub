export interface StickRect {
  type: string;
  label?: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Transistor {
  id: string;
  type: 'PMOS' | 'NMOS';
  gate: string;
  source: string;
  drain: string;
  x: number;
  y: number;
}

function doIntersect(r1: StickRect, r2: StickRect) {
  return !(
    r2.x > r1.x + r1.width || 
    r2.x + r2.width < r1.x || 
    r2.y > r1.y + r1.height ||
    r2.y + r2.height < r1.y
  );
}

export function extractNetlistFromStick(diagramData: { stick_diagram: StickRect[] }) {
  const rects = diagramData.stick_diagram || [];
  
  const polyRects = rects.filter(r => r.type === 'poly' || r.color === 'red');
  const nDiffRects = rects.filter(r => r.type === 'n-diff' || r.color === 'green');
  const pDiffRects = rects.filter(r => r.type === 'p-diff' || r.color === '#a16207' || r.color === 'yellow');
  
  const transistors: Transistor[] = [];
  
  polyRects.forEach((poly, idx) => {
    // Check intersection with p-diff
    pDiffRects.forEach(pdiff => {
      if (doIntersect(poly, pdiff)) {
        transistors.push({
          id: `PMOS_${idx}`,
          type: 'PMOS',
          gate: poly.label || 'G',
          source: 'VDD', // Simplified: assuming source is VDD for now, real extraction needs layout analysis
          drain: 'Y',
          x: poly.x,
          y: poly.y
        });
      }
    });
    
    // Check intersection with n-diff
    nDiffRects.forEach(ndiff => {
      if (doIntersect(poly, ndiff)) {
        transistors.push({
          id: `NMOS_${idx}`,
          type: 'NMOS',
          gate: poly.label || 'G',
          source: 'GND', // Simplified
          drain: 'Y',
          x: poly.x,
          y: poly.y
        });
      }
    });
  });
  
  return { transistors };
}

// Simplified logic simulator just evaluating the expression directly for timing diagram
export function simulateLogic(expression: string, inputsData: Record<string, number[]>) {
  // expression e.g., "Y = ~((A*B)+C)"
  // Extract inputs
  const timeSteps = 10;
  const results = [];
  
  // Very hacky expression evaluator for basic logic ops
  // Convert ~ to !, * to &&, + to ||
  let safeExpr = expression.split('=')[1] || expression;
  safeExpr = safeExpr.replace(/~/g, '!');
  safeExpr = safeExpr.replace(/\*/g, '&&');
  safeExpr = safeExpr.replace(/\+/g, '||');
  
  for (let t = 0; t < timeSteps; t++) {
    let evalStr = safeExpr;
    const stepData: any = { time: t };
    let hasAllInputs = true;
    for (const [key, values] of Object.entries(inputsData)) {
      if (evalStr.includes(key)) {
        if (values[t] !== undefined) {
           const val = values[t] === 1 ? 'true' : 'false';
           evalStr = evalStr.replace(new RegExp(key, 'g'), val);
           stepData[key] = values[t];
        } else {
           hasAllInputs = false;
        }
      }
    }
    
    try {
      if (hasAllInputs) {
        // eslint-disable-next-line no-eval
        const out = eval(evalStr);
        stepData['Y'] = out ? 1 : 0;
      } else {
        stepData['Y'] = 0;
      }
    } catch(e) {
      stepData['Y'] = 0;
    }
    
    results.push(stepData);
  }
  
  return results;
}
