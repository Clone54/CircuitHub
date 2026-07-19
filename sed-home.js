const fs = require('fs');
let content = fs.readFileSync('src/views/HomeView.tsx', 'utf8');
content = content.replace(
  /Accelerate Your Circuit Design <br \/>\s*With <span className="text-emerald-accent bg-emerald-accent\/5 px-2 py-0.5 rounded border border-emerald-accent\/20">Agentic AI<\/span> specifications/s,
  "Master the Entire EEE Curriculum <br />\n            With <span className=\"text-emerald-accent bg-emerald-accent/5 px-2 py-0.5 rounded border border-emerald-accent/20\">Agentic AI</span> & Live Solvers"
);
content = content.replace(
  /The premium workspace for operational amplifiers, 555 precision timing, active filter simulations, and instant PDF datasheet intelligence\./s,
  "The premium workspace featuring comprehensive tools for Control Systems, DSP, Power Systems, Telecommunications, VLSI, and interactive circuit simulations."
);
fs.writeFileSync('src/views/HomeView.tsx', content);
