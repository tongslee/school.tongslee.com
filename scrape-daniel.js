const puppeteer = require('puppeteer-core');

async function scrape() {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:18800'
  });
  
  const pages = await browser.pages();
  const page = pages[0];
  
  console.log('Connected to browser, current URL:', page.url());
  
  // Go to home page
  await page.goto('https://classroom.google.com/h', {waitUntil: 'networkidle2', timeout: 60000});
  await new Promise(r => setTimeout(r, 3000));
  
  // Get all courses from the sidebar
  const courses = await page.evaluate(() => {
    const results = [];
    const menuItems = document.querySelectorAll('div[role="menuitem"], a[href*="/c/"]');
    
    // Get enrolled courses
    const links = document.querySelectorAll('a[href*="/c/"]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      const text = link.textContent.trim();
      
      if (href && href.includes('/c/') && text) {
        const match = href.match(/\/c\/([^/?]+)/);
        if (match) {
          // Clean up name
          let name = text.split('\n')[0].trim();
          // Skip non-course items
          if (name && !name.includes('Home') && !name.includes('Calendar') && 
              !name.includes('To-do') && !name.includes('Settings') && 
              !name.includes('Archived') && !name.includes('Enrolled') &&
              !name.includes('Join') && !name.includes('Google')) {
            // Deduplicate
            if (!results.find(c => c.id === match[1])) {
              results.push({ id: match[1], name });
            }
          }
        }
      }
    });
    return results;
  });
  
  console.log('Found courses:', courses.length);
  courses.forEach(c => console.log(' -', c.name, '(' + c.id + ')'));
  
  const allData = [];
  
  // Process each course - get assignments from the stream page
  for (const course of courses) {
    console.log('\n=== Processing:', course.name, '===');
    
    // Navigate to course page
    await page.goto(`https://classroom.google.com/c/${course.id}`, {waitUntil: 'networkidle2', timeout: 60000});
    await new Promise(r => setTimeout(r, 2000));
    
    // Get assignments from page
    const assignments = await page.evaluate(() => {
      const results = [];
      
      // Look for assignment headings
      const headings = document.querySelectorAll('h2, [role="heading"]');
      headings.forEach(heading => {
        const text = heading.textContent.trim();
        
        // Match assignment headings
        if (text.includes('Assignment:')) {
          const title = text.replace('Assignment:', '').replace(/"/g, '').trim();
          
          // Get the parent element to find more info
          const parent = heading.closest('div[role="listitem"]') || heading.parentElement;
          let createdDate = '';
          let dueDate = '';
          let status = 'pending';
          
          if (parent) {
            // Look for date info in sibling or child elements
            const spans = parent.querySelectorAll('span, generic, div');
            spans.forEach(span => {
              const spanText = span.textContent.trim();
              if (spanText.includes('Created')) {
                const match = spanText.match(/Created ([A-Za-z]+ \d+)/);
                if (match) createdDate = match[1];
              }
              if (spanText.includes('Due')) {
                const match = spanText.match(/Due ([A-Za-z]+ \d+)/);
                if (match) dueDate = match[1];
              }
              if (spanText.includes('Turned in') || spanText.includes('Submitted')) {
                status = 'submitted';
              }
              if (spanText.includes('Missing')) {
                status = 'missing';
              }
            });
          }
          
          if (title && !results.find(t => t.title === title)) {
            results.push({ title, createdDate, dueDate, status });
          }
        }
      });
      
      return results;
    });
    
    console.log('Found', assignments.length, 'assignments');
    assignments.forEach(a => console.log(' -', a.title, '| Due:', a.dueDate || 'none', '| Status:', a.status));
    
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
