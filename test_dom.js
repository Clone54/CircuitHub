import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  const html = await page.content();
  console.log('HTML Length:', html.length);
  if (html.includes('Advanced Comm Suite')) {
    console.log('Found: Advanced Comm Suite');
  } else {
    console.log('Not Found: Advanced Comm Suite');
  }
  if (html.includes('INITIALIZING')) {
    console.log('Stuck on loading screen');
  }
  await browser.close();
})();
