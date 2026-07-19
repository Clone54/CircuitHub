const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');
const cmosEndpoint = `
  app.post('/api/generate-cmos-schematic', async (req, res) => {
    const { expression } = req.body;
    if (!expression) {
      return res.status(400).json({ message: 'Boolean expression is required.' });
    }
    try {
      const prompt = \`Generate a highly detailed, clean, and strictly structured SVG schematic for the CMOS implementation of the boolean expression: \${expression}.
      
      Requirements:
      1. Use <svg width="500" height="600" viewBox="0 0 500 600" xmlns="http://www.w3.org/2000/svg">.
      2. The Pull-Up Network (PUN) must use PMOS transistors connected to VDD (top).
      3. The Pull-Down Network (PDN) must use NMOS transistors connected to GND (bottom).
      4. Clearly draw PMOS transistors with a small empty circle at the gate.
      5. Draw NMOS transistors normally without a circle at the gate.
      6. Label the inputs (A, B, C...) clearly on the gates of the transistors.
      7. Draw the VDD line in Green (#10B981) and label it VDD.
      8. Draw the GND line in Red (#EF4444) and label it GND.
      9. Draw the output Y line connecting the PUN and PDN and label it Y.
      10. All lines and text should use white or light grey (#94A3B8) unless specified.
      11. ONLY output the raw SVG code. Do not include markdown formatting or backticks around the output.\`;

      const ai = getGeminiClient();
      const response = await generateContentWithFallback({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      let svgCode = response.text || '';
      // Strip markdown code blocks if any
      svgCode = svgCode.replace(/\`\`\`xml/g, '').replace(/\`\`\`svg/g, '').replace(/\`\`\`/g, '').trim();

      res.json({ svg: svgCode });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to generate CMOS schematic' });
    }
  });
`;
content = content.replace(
  "  app.post('/api/generate-stick-diagram'",
  cmosEndpoint + "\n  app.post('/api/generate-stick-diagram'"
);
fs.writeFileSync('server.ts', content);
