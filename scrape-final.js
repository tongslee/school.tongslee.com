const puppeteer = require('puppeteer-core');

async function scrape() {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:18800'
  });
  
  const pages = await browser.pages();
  const page = pages[0];
  
  console.log('Current URL:', page.url());
  
  await page.goto('https://classroom.google.com', {waitUntil: 'domcontentloaded', timeout: 60000});
  await new Promise(r => setTimeout(r, 3000));
  
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
  
  const allData = [];
  
  for (const course of courses) {
    console.log('Processing:', course.name);
    await page.goto(`https://classroom.google.com/c/${course.id}`, {waitUntil: 'domcontentloaded', timeout: 60000});
    await new Promise(r => setTimeout(r, 2000));
    
    const assignments = await page.evaluate(() => {
      const results = [];
      const items = document.querySelectorAll('a[href*="/a/"], a[href*="/assignment"]');
      items.forEach(el => {
        const text = el.textContent.trim();
        if (text.includes('Assignment:')) {
          const title = text.replace('Assignment:', '').replace(/"/g, '').trim();
          const href = el.getAttribute('href');
          const idMatch = href.match(/\/a\/([^/]+)/);
          if (title && !results.find(t => t.title === title)) {
            results.push({ title, id: idMatch ? idMatch[1] : null });
          }
        }
      });
      return results;
    });
    
    allData.push({ course: course.name, id: course.id, assignments });
    console.log('  Found', assignments.length, 'assignments');
  }
  
  console.log('\n=== FINAL DATA ===');
  console.log(JSON.stringify(allData, null, 2));
  
  await browser.disconnect();
}

scrape().catch(console.error);
