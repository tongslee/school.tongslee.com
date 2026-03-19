/**
 * Scrape Google Classroom using existing browser session via CDP
 */

const chromium = require('playwright');
const http = require('http');

async function getCDPJson(port, target) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/json${target ? '/' + target : ''}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } 
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function scrapeGoogleClassroom() {
  const port = 18800; // CDP port from browser start
  
  console.log('Connecting to browser...');
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  
  // Get existing context
  const contexts = browser.contexts();
  const context = contexts[0];
  const page = context.pages()[0];
  
  console.log('Current URL:', page.url());
  
  // Navigate to classroom if not there
  if (!page.url().includes('classroom.google.com')) {
    console.log('Navigating to Classroom...');
    await page.goto('https://classroom.google.com', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
  }
  
  console.log('Page title:', await page.title());
  console.log('Current URL:', page.url());
  
  // Get courses
  const courses = await page.evaluate(() => {
    const courses = [];
    
    // From sidebar menu
    const menuItems = document.querySelectorAll('[role="menuitem"]');
    menuItems.forEach(el => {
      const text = el.textContent?.trim() || '';
      const link = el.querySelector('a');
      const href = link?.getAttribute('href') || '';
      
      if (href && href.includes('/c/')) {
        const match = href.match(/\/c\/([^/?]+)/);
        const nameParts = text.split('\n');
        const courseName = nameParts[0].trim();
        
        if (match && courseName && !courseName.includes('Home') && 
            !courseName.includes('Calendar') && !courseName.includes('To-do') && 
            !courseName.includes('Settings') && !courseName.includes('Archived') &&
            !courseName.includes('Enrolled') && !courseName.includes('classroom')) {
          if (!courses.find(c => c.id === match[1])) {
            courses.push({ id: match[1], name: courseName });
          }
        }
      }
    });
    
    // Also from main content area
    const contentLinks = document.querySelectorAll('a[href*="/c/"]');
    contentLinks.forEach(link => {
      const href = link.getAttribute('href');
      const text = link.textContent?.trim() || '';
      const match = href.match(/\/c\/([^/?]+)/);
      
      if (match && text && !text.includes('Google') && !text.includes('classroom')) {
        const nameParts = text.split('\n');
        const courseName = nameParts[0].trim();
        if (!courses.find(c => c.id === match[1]) && courseName.length > 3) {
          courses.push({ id: match[1], name: courseName });
        }
      }
    });
    
    return courses;
  });
  
  console.log(`Found ${courses.length} courses`);
  console.log('Courses:', courses.map(c => c.name).join('\n'));
  
  // Now get assignments from each course
  const allAssignments = [];
  
  for (const course of courses.slice(0, 3)) { // Limit to first 3 for now
    console.log(`\nFetching assignments for: ${course.name}`);
    
    try {
      await page.goto(`https://classroom.google.com/c/${course.id}/w/all`, { 
        waitUntil: 'networkidle', timeout: 30000 
      });
      await page.waitForTimeout(2000);
      
      const assignments = await page.evaluate(() => {
        const assignments = [];
        
        // Look for assignment items
        const items = document.querySelectorAll('[role="listitem"], div[role="button"], a[href*="/assignment"]');
        
        items.forEach(item => {
          const text = item.textContent?.trim() || '';
          const titleMatch = text.match(/^([^\n]+)/);
          const title = titleMatch ? titleMatch[1].trim() : '';
          
          // Look for due date
          const dueDateMatch = text.match(/Due\s+([A-Za-z]+,?\s*[A-Za-z]+\s*\d+,?\s*\d*)/i);
          const dueDate = dueDateMatch ? dueDateMatch[1] : null;
          
          // Skip generic items
          if (title && title.length > 3 && !title.includes('Class') && 
              !title.includes('Google') && !title.includes('People') &&
              !title.includes('Grade') && !title.includes('Stream')) {
            assignments.push({ title, dueDate });
          }
        });
        
        return assignments;
      });
      
      console.log(`  Found ${assignments.length} assignments`);
      
      assignments.forEach(a => {
        allAssignments.push({
          courseId: course.id,
          courseName: course.name,
          title: a.title,
          dueDate: a.dueDate
        });
      });
      
    } catch (err) {
      console.error(`  Error: ${err.message}`);
    }
  }
  
  console.log('\n=== RESULTS ===');
  console.log('Courses:', JSON.stringify(courses, null, 2));
  console.log('Assignments:', JSON.stringify(allAssignments, null, 2));
  
  await browser.close();
  
  return { courses, assignments: allAssignments };
}

scrapeGoogleClassroom().catch(console.error);
