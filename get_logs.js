import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', error => console.log('ERROR:', error.message));
  page.on('requestfailed', request => console.log('FAILED:', request.url(), request.failure().errorText));

  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
})();
