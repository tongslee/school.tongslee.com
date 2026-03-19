const { chromium } = require('playwright');

async function scrape() {
  const browser = await chromium.connect({
    wsEndpoint: 'ws://127.0.0.1:18800/devtools/page/CF6A8B576F7D28AD47EB07FD67A3B733'
  });
  
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  
  console.log('Current URL:', page.url());
  
  // Ensure we're on classroom.google.com
  if (!page.url().includes('classroom.google.com')) {
    await page.goto('https://classroom.google.com', { timeout: 60000 });
    await page.waitForTimeout(3000);
  }
  
  console.log('Now at:', page.url());
  
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
  
  const allData = [];
  
  for (const course of courses) {
    console.log('\nProcessing:', course.name);
    await page.goto(`https://classroom.google.com/c/${course.id}`, { timeout: 60000 });
    await page.waitForTimeout(2500);
    
    const assignments = await page.evaluate(() => {
      const results = [];
      const headings = document.querySelectorAll('h2');
      headings.forEach(el => {
        const text = el.textContent.trim();
        if (text.includes('Assignment:')) {
          const title = text.replace('Assignment:', '').replace(/"/g, '').trim();
          if (title && !results.find(t => t.title === title)) {
            results.push({ title });
          }
        }
      });
      return results;
    });
    
    allData.push({ course: course.name, id: course.id, assignments });
    console.log('  Found', assignments.length, 'assignments');
    assignments.forEach(a => console.log('   -', a.title));
  }
  
  console.log('\n=== FINAL DATA ===');
  console.log(JSON.stringify(allData, null, 2));
  
  await browser.close();
}

scrape().catch(console.error);
