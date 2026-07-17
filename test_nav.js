import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.evaluateOnNewDocument(() => {
    window.addEventListener('error', (event) => {
      console.log('UNCAUGHT ERROR:', event.error ? event.error.stack : event.message);
    });
  });
  page.on('console', msg => console.log('LOG:', msg.text()));

  await page.goto('http://localhost:3000/#/communication-tools/advanced', { waitUntil: 'networkidle0' });
  
  const html = await page.content();
  console.log('HTML Length:', html.length);
  if (html.includes('Advanced Comm Suite')) {
    console.log('Found: Advanced Comm Suite');
  } else {
    console.log('Not Found: Advanced Comm Suite');
  }
  
  await browser.close();
})();
