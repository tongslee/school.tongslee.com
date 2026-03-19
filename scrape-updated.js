/**
 * Google Classroom Scraper - Updated for current Classroom UI
 */

const { chromium } = require('playwright');

async function scrapeGoogleClassroom() {
  console.log('Starting Google Classroom scraper...');
  
  // Use the existing Daniel's browser context
  const context = await chromium.launchPersistentContext('/tmp/playwright-daniel-gclassroom', { 
    headless: true
  });
  
  const page = context.pages()[0] || await context.newPage();
  
  // Navigate to Google Classroom main page first to get courses
  console.log('Navigating to Google Classroom...');
  await page.goto('https://classroom.google.com', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);
  
  // Get all courses from the page
  const courses = await page.evaluate(() => {
    const courses = [];
    
    // Get courses from the main list
    const courseLinks = document.querySelectorAll('a[href*="/c/"]');
    courseLinks.forEach(link => {
      const href = link.getAttribute('href');
      const text = link.textContent?.trim() || '';
      
      // Extract course ID from URL
      const match = href.match(/\/c\/([^/?]+)/);
      
      // Filter for valid course links (not Google Drive links, etc.)
      if (match && text && !text.includes('Google') && !text.includes('classroom') && 
          !text.includes('Drive') && href.includes('/c/')) {
        const courseId = match[1];
        // Use only the first part of the course name (before any subtitle)
        const courseName = text.split('\n')[0].trim();
        
        if (!courses.find(c => c.id === courseId)) {
          courses.push({ id: courseId, name: courseName, url: href });
        }
      }
    });
    
    return courses;
  });
  
  console.log(`Found ${courses.length} courses from main page`);
  
  // If that didn't work, get from sidebar
  if (courses.length === 0) {
    console.log('Trying sidebar...');
    const sidebarCourses = await page.evaluate(() => {
      const courses = [];
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      menuItems.forEach(el => {
        const text = el.textContent?.trim() || '';
        const link = el.querySelector('a');
        const href = link?.getAttribute('href') || '';
        
        if (href.includes('/c/')) {
          const match = href.match(/\/c\/([^/?]+)/);
          if (match && text && !text.includes('Home') && !text.includes('Calendar') && 
              !text.includes('To-do') && !text.includes('Settings') && !text.includes('Archived')) {
            const courseName = text.split('\n')[0].trim();
            if (!courses.find(c => c.id === match[1])) {
              courses.push({ id: match[1], name: courseName, url: href });
            }
          }
        }
      });
      return courses;
    });
    console.log(`Found ${sidebarCourses.length} courses from sidebar`);
    return sidebarCourses;
  }
  
  console.log('Courses:', courses.map(c => c.name).join(', '));
  return courses;
}

scrapeGoogleClassroom().then(courses => {
  console.log('\n=== COURSES ===');
  console.log(JSON.stringify(courses, null, 2));
}).catch(console.error);
