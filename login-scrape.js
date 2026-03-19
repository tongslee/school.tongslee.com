const puppeteer = require('puppeteer-core');

const DANIEL_EMAIL = 'daniel.lee@aischool.org';
const DANIEL_PASSWORD = 'ais12345!';

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

async function loginAndScrape() {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:18800'
  });
  
  const pages = await browser.pages();
  const page = pages[0];
  
  // Navigate to Google Classroom directly
  console.log('Navigating to Google Classroom...');
  await page.goto('https://classroom.google.com', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 3000));
  
  let currentUrl = page.url();
  console.log('Current URL:', currentUrl);
  
  // Check if we need to log in
  if (currentUrl.includes('signin') || currentUrl.includes('login') || currentUrl.includes('accounts.google.com')) {
    console.log('Need to log in...');
    
    // Wait for email input
    console.log('Waiting for email input...');
    await page.waitForSelector('input[type="email"], input[name="identifier"]', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));
    
    // Enter email
    await page.click('input[type="email"], input[name="identifier"]');
    await page.keyboard.type(DANIEL_EMAIL, { delay: 50 });
    await new Promise(r => setTimeout(r, 500));
    
    // Click Next
    await Promise.all([
      page.waitForNavigation({ timeout: 15000 }).catch(() => {}),
      page.click('#identifierNext button', { timeout: 5000 }).catch(async () => {
        // Try alternative selector
        await page.click('div#identifierNext button', { timeout: 5000 }).catch(() => {});
        await page.click('button[type="submit"]', { timeout: 5000 }).catch(() => {});
      })
    ]);
    
    await new Promise(r => setTimeout(r, 3000));
    console.log('After email, URL:', page.url());
    
    // Wait for password input
    console.log('Waiting for password input...');
    await page.waitForSelector('input[type="password"], input[name="password"]', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));
    
    // Enter password
    await page.click('input[type="password"], input[name="password"]');
    await page.keyboard.type(DANIEL_PASSWORD, { delay: 50 });
    await new Promise(r => setTimeout(r, 500));
    
    // Click Next
    await Promise.all([
      page.waitForNavigation({ timeout: 20000 }).catch(() => {}),
      page.click('#passwordNext button', { timeout: 5000 }).catch(async () => {
        await page.click('div#passwordNext button', { timeout: 5000 }).catch(() => {});
        await page.click('button[type="submit"]', { timeout: 5000 }).catch(() => {});
      })
    ]);
    
    await new Promise(r => setTimeout(r, 5000));
    console.log('After password, URL:', page.url());
  }
  
  // Wait for Classroom to fully load
  await new Promise(r => setTimeout(r, 3000));
  
  // Verify we're logged in
  currentUrl = page.url();
  console.log('Final URL:', currentUrl);
  
  if (currentUrl.includes('signin') || currentUrl.includes('login')) {
    console.log('WARNING: Still on login page, login may have failed');
  } else {
    console.log('Successfully logged in to Google Classroom!');
  }
  
  // Now scrape courses
  const allData = [];
  
  for (const course of courses) {
    console.log('\n=== Scraping:', course.name, '===');
    
    try {
      await page.goto(`https://classroom.google.com/w/${course.id}/t/all`, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      await new Promise(r => setTimeout(r, 3000));
      
      // Get text content
      const text = await page.evaluate(() => document.body.innerText);
      
      // Parse assignments from text
      const lines = text.split('\n');
      const assignments = [];
      let currentTitle = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip login-related text
        if (line.includes('Sign in') || line.includes('Email or phone') || 
            line.includes('Forgot email') || line.includes('Create account') ||
            line.includes('Privacy') || line.includes('Terms') ||
            line.includes('Help') || line.includes('English') ||
            line.includes('Not your computer') || line.includes('Guest mode') ||
            line.includes('Google Account') || line.includes('Next')) {
          continue;
        }
        
        // Check if this is an assignment title
        if (line && !line.includes('Due') && !line.includes('due date') && 
            !line.includes('Assignment') && !line.includes('Completed') &&
            !line.includes('Topic') && !line.includes('More options') &&
            !line.includes('Class comment') && !line.includes('Private comment') &&
            line.length > 3 && line.length < 100) {
          
          // Look ahead for due date info
          let dueDate = '';
          let status = 'pending';
          
          for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
            const nextLine = lines[j].trim();
            if (nextLine.includes('Due ')) {
              dueDate = nextLine.replace('Due ', '').trim();
            } else if (nextLine.includes('No due date')) {
              dueDate = '';
            } else if (nextLine.includes('Turned in') || nextLine.includes('Submitted')) {
              status = 'submitted';
            } else if (nextLine.includes('Missing')) {
              status = 'missing';
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
      assignments.slice(0, 5).forEach(a => console.log(' -', a.title.substring(0, 50), '| Due:', a.dueDate, '| Status:', a.status));
      
      allData.push({
        course: course.name,
        courseId: course.id,
        assignments
      });
    } catch (err) {
      console.error('Error scraping', course.name, ':', err.message);
      allData.push({
        course: course.name,
        courseId: course.id,
        assignments: []
      });
    }
  }
  
  console.log('\n=== FINAL DATA ===');
  console.log(JSON.stringify(allData, null, 2));
  
  await browser.disconnect();
  
  return allData;
}

loginAndScrape().then(data => {
  console.log('\nScraping complete!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
