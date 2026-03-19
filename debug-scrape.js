const { chromium } = require('playwright');

(async () => {
  const context = await chromium.launchPersistentContext('/tmp/playwright-daniel-gclassroom', { 
    headless: true
  });
  const page = context.pages()[0] || await context.newPage();
  
  await page.goto('https://classroom.google.com', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);
  
  // Get page title and URL
  console.log('Page title:', await page.title());
  console.log('Page URL:', page.url());
  
  // Get all links
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).slice(0, 20).map(a => ({
      href: a.getAttribute('href'),
      text: a.textContent?.trim().slice(0, 50)
    }));
  });
  console.log('Links:', JSON.stringify(links, null, 2));
  
  await context.close();
})();
