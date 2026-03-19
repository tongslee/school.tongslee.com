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

// Subject ID mapping (from TOOLS.md + data.json)
const SUBJECT_MAP = {
  'E 7th Math': 12,           // Math / Webb
  '7G PE': 13,                 // PE / Hesse
  'A7 Science': 5,             // Science / Nekay
  '7D I&S': 8,                 // I&S / Mani-Kandt
  'C7 English': 10,            // English / Michielsen
  '7th Media and Film': 1,     // Media and Film / Urmilla Sethuraman
  'F7 Design': 2,              // Design / Smith
  'CLA Inter Mid B': 9         // Chinese / Yipeng Wang
};

async function scrape() {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:18800',
    defaultViewport: null
  });
  
  const pages = await browser.pages();
  const page = pages[0];
  
  const allAssignments = [];
  
  for (const course of courses) {
    console.log('\n=== Scraping:', course.name, '===');
    
    try {
      await page.goto(`https://classroom.google.com/w/${course.id}/t/all`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      
      // Wait for content to load
      await new Promise(r => setTimeout(r, 3000));
      
      // Get page content
      const content = await page.evaluate(() => {
        // Find all assignment-like elements
        const items = [];
        
        // Look for typical Classroom assignment patterns
        const headers = document.querySelectorAll('h1, h2, h3');
        headers.forEach(h => {
          const text = h.innerText.trim();
          if (text && text.length > 3 && text.length < 100 && 
              !text.includes('Classwork') && !text.includes('Classroom') &&
              !text.includes('Stream') && !text.includes('Topic')) {
            
            // Look for due date in nearby elements
            let dueDate = '';
            let elem = h.nextElementSibling;
            for (let i = 0; i < 5 && elem; i++) {
              const txt = elem.innerText || '';
              if (txt.includes('Due ')) {
                dueDate = txt.replace('Due ', '').trim();
                break;
              }
              elem = elem.nextElementSibling;
            }
            
            items.push({ title: text, dueDate });
          }
        });
        
        return items;
      });
      
      console.log('Found', content.length, 'potential items');
      
      // Filter and add unique assignments
      for (const item of content) {
        if (item.title && item.title.length > 3 && /[a-zA-Z]/.test(item.title)) {
          allAssignments.push({
            course: course.name,
            title: item.title,
            dueDate: item.dueDate
          });
        }
      }
      
    } catch (e) {
      console.error('Error scraping', course.name, ':', e.message);
    }
  }
  
  console.log('\n=== ALL ASSIGNMENTS ===');
  console.log(JSON.stringify(allAssignments, null, 2));
  
  await browser.disconnect();
}

scrape().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
