import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace(
  /Your expertise covers:.*?\n7\..*?dissipation\./s,
  "Your expertise covers all subjects within the entire Electrical and Electronic Engineering (EEE) curriculum, including but not limited to Circuit Theory, Analog and Digital Electronics, Electromagnetics, Power Systems, Machines, Control Systems, Telecommunications, Signal Processing, and VLSI. Answer dynamically based on whatever the user needs within the EEE domain."
);
fs.writeFileSync('server.ts', content);
