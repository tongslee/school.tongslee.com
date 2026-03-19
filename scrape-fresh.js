const puppeteer = require('puppeteer-core');

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

async function scrape() {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:18800'
  });
  
  const pages = await browser.pages();
  const page = pages[0];
  
  const allData = [];
  
  for (const course of courses) {
    console.log('\n=== Scraping:', course.name, '===');
    
    await page.goto(`https://classroom.google.com/w/${course.id}/t/all`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Get text content
    const text = await page.evaluate(() => document.body.innerText);
    
    // Parse assignments from text
    const lines = text.split('\n');
    const assignments = [];
    let currentTitle = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this is an assignment title (has "Due" or "No due date" following)
      if (line && !line.includes('Due') && !line.includes('due date') && 
          !line.includes('Assignment') && !line.includes('Completed') &&
          !line.includes('Topic') && !line.includes('More options') &&
          line.length > 3 && line.length < 80) {
        
        // Look ahead for due date info
        let dueDate = '';
        let status = 'pending';
        
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j].trim();
          if (nextLine.includes('Due ')) {
            dueDate = nextLine.replace('Due ', '').trim();
          } else if (nextLine.includes('No due date')) {
            dueDate = '';
          } else if (nextLine.includes('Completed')) {
            status = 'submitted';
          }
        }
        
        // Avoid duplicates
        if (!assignments.find(a => a.title === line) && !currentTitle.includes(line)) {
          currentTitle = line;
          assignments.push({ title: line, dueDate, status });
        }
      }
    }
    
    console.log('Found', assignments.length, 'assignments');
    assignments.forEach(a => console.log(' -', a.title, '| Due:', a.dueDate, '| Status:', a.status));
    
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
