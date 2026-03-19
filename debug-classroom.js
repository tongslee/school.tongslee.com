const { chromium } = require('playwright');

async function scrape() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Navigating to classroom...');
  await page.goto('https://classroom.google.com', { timeout: 60000 });
  await page.waitForTimeout(5000);
  
  console.log('Current URL:', page.url());
  
  // Get page content for debugging
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check if logged in
  if (page.url().includes('accounts.google.com') || page.url().includes('signin')) {
    console.log('NOT LOGGED IN - Need to log in as Daniel');
    console.log('Please log in manually, then run this script again');
    await browser.close();
    process.exit(1);
  }
  
  // Try different selectors to find courses
  console.log('\nSearching for course elements...');
  
  // Get all links that might be courses
  const courseLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="/c/"]'));
    return links.map(l => ({
      href: l.getAttribute('href'),
      text: l.textContent.trim().substring(0, 50)
    })).filter(l => l.href.includes('/c/') && !l.href.includes('home'));
  });
  
  console.log('Found course links:', courseLinks.length);
  courseLinks.forEach(l => console.log(' -', l.text, l.href));
  
  // Try to find sidebar navigation
  const sidebarText = await page.evaluate(() => {
    const sidebar = document.querySelector('nav') || document.querySelector('[role="navigation"]');
    return sidebar ? sidebar.textContent.substring(0, 500) : 'No sidebar found';
  });
  console.log('\nSidebar content:', sidebarText.substring(0, 200));
  
  await browser.close();
}

scrape().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
