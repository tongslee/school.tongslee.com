const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Read cookies from Chrome's SQLite database
function getChromeCookies() {
  const dbPath = path.join(os.homedir(), 'Library/Application Support/Google/Chrome/Default/Cookies');
  const { execSync } = require('child_process');
  
  try {
    // Try to read cookies using sqlite3 command line if available
    const result = execSync(`sqlite3 "${dbPath}" "SELECT host_key, name, value, path, expires_utc, is_secure FROM cookies WHERE host_key LIKE '%google%'"`, { encoding: 'utf8' });
    
    const cookies = [];
    const lines = result.split('\n').filter(l => l.trim());
    
    for (const line of lines) {
      const parts = line.split('|');
      if (parts.length >= 6) {
        cookies.push({
          domain: parts[0],
          name: parts[1],
          value: parts[2],
          path: parts[3],
          expires: parseInt(parts[4]) || -1,
          secure: parts[5] === '1'
        });
      }
    }
    
    return cookies;
  } catch (e) {
    console.error('Error reading cookies:', e.message);
    return [];
  }
}

async function scrape() {
  const cookies = getChromeCookies();
  console.log('Found', cookies.length, 'Google cookies');
  
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox']
  });
  
  const context = await browser.newContext();
  
  // Add cookies to the context
  for (const cookie of cookies) {
    try {
      await context.addCookies([{
        domain: cookie.domain,
        name: cookie.name,
        value: cookie.value,
        path: cookie.path,
        expires: cookie.expires > 0 ? cookie.expires / 1000000 - 11644473600 : -1, // Convert Chrome timestamp
        secure: cookie.secure,
        httpOnly: false
      }]);
    } catch (e) {
      // Skip invalid cookies
    }
  }
  
  const page = await context.newPage();
  
  console.log('Navigating to classroom...');
  await page.goto('https://classroom.google.com', { timeout: 60000 });
  await page.waitForTimeout(5000);
  
  console.log('Current URL:', page.url());
  console.log('Page title:', await page.title());
  
  // Check if we're logged in
  if (page.url().includes('accounts.google.com') || page.url().includes('signin')) {
    console.log('NOT LOGGED IN - cookies may be expired');
    await browser.close();
    process.exit(1);
  }
  
  console.log('Logged in, scraping courses...');
  
  // Get courses from sidebar
  const courses = await page.evaluate(() => {
    const results = [];
    const menuItems = document.querySelectorAll('[role="menuitem"]');
    menuItems.forEach(el => {
      const text = el.textContent.trim();
      const link = el.querySelector('a');
      const href = link?.getAttribute('href') || '';
      
      if (href.includes('/c/')) {
        const match = href.match(/\/c\/([^/?]+)/);
        if (match) {
          const name = text.split('\n')[0].trim();
          if (name && !name.includes('Home') && !name.includes('Calendar') && 
              !name.includes('To-do') && !name.includes('Settings') && 
              !name.includes('Archived') && !name.includes('Enrolled')) {
            results.push({ id: match[1], name });
          }
        }
      }
    });
    return results;
  });
  
  console.log('Found courses:', courses.length);
  courses.forEach(c => console.log(' -', c.name));
  
  await browser.close();
}

scrape().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
