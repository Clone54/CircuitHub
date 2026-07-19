import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/#/communication-tools/advanced', { waitUntil: 'networkidle0' });
  const html = await page.content();
  if (html.includes('vite-error-overlay')) {
    console.log('Vite Error Overlay Found!');
  } else {
    console.log('No Error Overlay');
  }
  await browser.close();
})();
