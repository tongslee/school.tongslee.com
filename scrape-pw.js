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
  await page.waitForTimeout(3000);
  
  console.log('Current URL:', page.url());
  
  // Check if logged in
  if (page.url().includes('accounts.google.com')) {
    console.log('NOT LOGGED IN - Need to log in as Daniel');
    console.log('Please log in manually, then run this script again');
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
  
  const allData = [];
  
  for (const course of courses) {
    console.log('\nProcessing:', course.name);
    await page.goto(`https://classroom.google.com/c/${course.id}`, { timeout: 60000 });
    await page.waitForTimeout(2000);
    
    const assignments = await page.evaluate(() => {
      const results = [];
      const headings = document.querySelectorAll('h2, h3, [role="heading"]');
      headings.forEach(el => {
        const text = el.textContent.trim();
        if (text.includes('Assignment:') || text.includes('Assignment -')) {
          const title = text.replace('Assignment:', '').replace('Assignment -', '').replace(/"/g, '').trim();
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

scrape().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
