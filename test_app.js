import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.evaluateOnNewDocument(() => {
    window.addEventListener('error', (event) => {
      console.log('UNCAUGHT ERROR:', event.error ? event.error.stack : event.message);
    });
    window.addEventListener('unhandledrejection', (event) => {
      console.log('UNHANDLED REJECTION:', event.reason);
    });
  });

  page.on('console', msg => console.log('LOG:', msg.text()));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  console.log("Navigating to Advanced Comm Suite...");
  await page.goto('http://localhost:3000/#/communication-tools/advanced', { waitUntil: 'networkidle0' });
  const html = await page.content();
  console.log("HTML length:", html.length);
  await browser.close();
})();
