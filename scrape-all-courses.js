const puppeteer = require('puppeteer-core');

async function scrape() {
  // Connect to the existing OpenClaw browser
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:18800'
  });
  
  const pages = await browser.pages();
  const page = pages[0];
  
  console.log('Connected to browser, current URL:', page.url());
  
  // Navigate to classroom home
  await page.goto('https://classroom.google.com', {waitUntil: 'networkidle2', timeout: 60000});
  await new Promise(r => setTimeout(r, 3000));
  
  // Get all courses from sidebar
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
          // Extract clean name
          let name = text.split('\n')[0].trim();
          // Skip non-course items
          if (name && !name.includes('Home') && !name.includes('Calendar') && 
              !name.includes('To-do') && !name.includes('Settings') && 
              !name.includes('Archived') && !name.includes('Enrolled') &&
              !name.includes('Join')) {
            results.push({ id: match[1], name });
          }
        }
      }
    });
    return results;
  });
  
  console.log('Found courses:', courses.length);
  
  const allData = [];
  
  // Process each course
  for (const course of courses) {
    console.log('\n=== Processing:', course.name, '===');
    
    // Navigate to course stream page
    await page.goto(`https://classroom.google.com/c/${course.id}`, {waitUntil: 'networkidle2', timeout: 60000});
    await new Promise(r => setTimeout(r, 2000));
    
    // Get assignments from page
    const assignments = await page.evaluate(() => {
      const results = [];
      
      // Look for assignment headings
      const links = document.querySelectorAll('a');
      links.forEach(link => {
        const href = link.getAttribute('href') || '';
        const text = link.textContent.trim();
        
        // Match assignment links
        if (href.includes('/a/') && text.includes('Assignment:')) {
          const title = text.replace('Assignment:', '').replace(/"/g, '').trim();
          
          // Get parent element to find creation date
          const parent = link.closest('div[role="listitem"]') || link.parentElement;
          let createdDate = '';
          if (parent) {
            const dateEl = parent.querySelector('span, generic');
            if (dateEl) {
              const dateText = dateEl.textContent || '';
              const createdMatch = dateText.match(/Created (.*)/);
              if (createdMatch) {
                createdDate = createdMatch[1];
              }
            }
          }
          
          if (title && !results.find(t => t.title === title)) {
            results.push({ title, createdDate, href: 'https://classroom.google.com' + href });
          }
        }
      });
      
      return results;
    });
    
    console.log('Found', assignments.length, 'assignments');
    assignments.forEach(a => console.log(' -', a.title, '(' + a.createdDate + ')'));
    
    allData.push({
      course: course.name,
      id: course.id,
      assignments
    });
  }
  
  console.log('\n=== FINAL DATA ===');
  console.log(JSON.stringify(allData, null, 2));
  
  await browser.disconnect();
}

scrape().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
