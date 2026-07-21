const puppeteer = require('puppeteer');

(async () => {
  const url = process.env.URL || 'http://127.0.0.1:5000/';
  const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  const externalRequests = [];
  page.on('request', req => {
    const u = req.url();
    if (/^https?:\/\//.test(u) && !(u.startsWith(url) || u.startsWith('http://127.0.0.1') || u.startsWith('http://localhost'))) {
      externalRequests.push(u);
    }
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    // give a moment for lazy loads
    await new Promise(r => setTimeout(r, 1000));
    const title = await page.title();
    console.log('PAGE_TITLE:', title);
    if (externalRequests.length === 0) {
      console.log('NO_EXTERNAL_REQUESTS');
      process.exit(0);
    } else {
      console.error('EXTERNAL_REQUESTS_DETECTED');
      externalRequests.forEach(u => console.error(u));
      process.exit(2);
    }
  } catch (err) {
    console.error('E2E_ERROR', err && err.message);
    process.exit(3);
  } finally {
    await browser.close();
  }
})();
