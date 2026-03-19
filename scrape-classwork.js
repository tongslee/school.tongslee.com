const puppeteer = require('puppeteer-core');

async function scrape() {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:18800'
  });
  
  const pages = await browser.pages();
  const page = pages[0];
  
  // Course IDs and names from the sidebar
  const courses = [
    { id: 'ODI0ODU1Njk4Mjc1', name: '7th Media and Film' },
    { id: 'ODQxMjk4ODI2NTU5', name: 'F7 Design' },
    { id: 'ODIzMDIzODMwNTkx', name: 'Field Trip' },
    { id: 'Nzc5NzcyNzk1Nzcw', name: 'GR6-8 Middle School Band' },
    { id: 'Nzg1MjA1ODM5MDc0', name: 'A7 Science' },
    { id: 'Nzk4ODY5NDczNjc4', name: 'Theatre' },
    { id: 'NzkxODg1NDgxMzU2', name: 'F7 Product Design' },
    { id: 'NzkxMzEzODg4Njgw', name: '7D I&S' },
    { id: 'Nzk4ODU4NDk3MzM5', name: 'CLA Inter Mid B' },
    { id: 'NzkxNjkyMjg4Mjc2', name: 'C7 English' },
    { id: 'NzAwNTk3OTY0NTY3', name: '7th Grade' },
    { id: 'NzkxNzEzMzY5OTgx', name: 'E 7th Math' },
    { id: 'NzkxNjg2NTU4NDY5', name: '7G PE' },
    { id: 'NzYxNTg2NzM3MDE2', name: 'GR6 Beginning Band' }
  ];
  
  const allData = [];
  
  for (const course of courses) {
    console.log('\n=== Processing:', course.name, '===');
    
    // Navigate to classwork page
    await page.goto(`https://classroom.google.com/w/${course.id}/t/all`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    await new Promise(r => setTimeout(r, 3000));
    
    // Get page content for debugging
    const content = await page.content();
    console.log('Page length:', content.length);
    
    // Extract assignments using a different approach
    const assignments = await page.evaluate(() => {
      const results = [];
      
      // Look for buttons that are assignment titles
      const buttons = document.querySelectorAll('button');
      
      buttons.forEach(button => {
        const text = button.textContent.trim();
        const parent = button.parentElement;
        const grandparent = parent?.parentElement;
        
        // Check if this looks like an assignment button
        // Assignments typically have sibling elements with due date info
        let dueDate = '';
        let status = 'pending';
        
        // Look for due date in nearby elements
        if (parent) {
          const siblings = parent.querySelectorAll('span, generic');
          siblings.forEach(sib => {
            const sibText = sib.textContent.trim();
            if (sibText.includes('Due ')) {
              dueDate = sibText.replace('Due ', '').trim();
            }
            if (sibText.includes('Completed')) {
              status = 'submitted';
            }
          });
        }
        
        // Filter for assignment buttons - they often have specific patterns
        if (text && text.length > 3 && text.length < 100 && 
            !text.includes('Topic') && !text.includes('options') && 
            !text.includes('Assignment') && !text.includes('More')) {
          // This might be an assignment
          if (!results.find(a => a.title === text)) {
            results.push({ title: text, dueDate, status });
          }
        }
      });
      
      return results;
    });
    
    console.log('Found', assignments.length, 'assignments');
    assignments.forEach(a => console.log(' -', a.title, '| Due:', a.dueDate));
    
    allData.push({
      course: course.name,
      courseId: course.id,
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
