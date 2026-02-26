/**
 * Google Classroom Scraper - Manual Browser Version
 * Uses the already-open browser to scrape assignments
 */

const COURSE_IDS = [
  'ODI0ODU1Njk4Mjc1', // 7th Media and Film
  'ODQxMjk4ODI2NTU5', // F7 Design
  'ODIzMDIzODMwNTkx', // Field Trip
  'Nzc5NzcyNzk1Nzcw', // GR6-8 Middle School Band
  'Nzg1MjA1ODM5MDc0', // A7 Science
  'Nzk4ODY5NDczNjc4', // Theatre
  'NzkxODg1NDgxMzU2', // F7 Product Design
  'NzkxMzEzODg4Njgw', // 7D I&S
  'Nzk4ODU4NDk3MzM5', // CLA Inter Mid B
  'NzkxNjkyMjg4Mjc2', // C7 English
  'NzAwNTk3OTY0NTY3', // 7th Grade
  'NzkxNzEzMzY5OTgx', // E 7th Math
  'NzkxNjg2NTU4NDY5', // 7G PE
  'NzYxNTg2NzM3MDE2', // GR6 Beginning Band
];

async function scrapeAllCourses() {
  console.log('Starting to scrape all courses...');
  
  const allData = [];
  
  for (const courseId of COURSE_IDS) {
    console.log(`\nScraping course: ${courseId}`);
    
    // Navigate to course
    await page.goto(`https://classroom.google.com/c/${courseId}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Get course name
    const courseName = await page.evaluate(() => {
      const heading = document.querySelector('h1');
      return heading ? heading.textContent.trim() : 'Unknown';
    });
    
    console.log(`  Course: ${courseName}`);
    
    // Get assignments from the page
    const assignments = await page.evaluate(() => {
      const results = [];
      
      // Look for assignment headings
      document.querySelectorAll('[role="heading"]').forEach(heading => {
        const text = heading.textContent.trim();
        if (text.startsWith('Assignment:') || text.startsWith('Question:')) {
          const title = text.replace(/^(Assignment:|Question:)\s*/, '').replace(/"/g, '');
          
          // Try to find due date nearby
          let dueDate = null;
          let parent = heading.parentElement;
          
          // Look in the same container for due date info
          while (parent && !parent.className?.includes('listitem')) {
            parent = parent.parentElement;
          }
          
          if (parent) {
            // Look for date patterns
            const datePatterns = parent.textContent.match(/Due (Today|Tomorrow|Friday|Monday|Tuesday|Wednesday|Thursday|Saturday|Sunday|\d{1,2}\/\d{1,2}|\w+ \d{1,2})/gi);
            if (datePatterns) {
              dueDate = datePatterns[0];
            }
          }
          
          // Get the URL
          const link = heading.closest('a') || heading.parentElement?.closest('a');
          const url = link ? link.href : '';
          
          results.push({ title, dueDate, url });
        }
      });
      
      return results;
    });
    
    console.log(`  Found ${assignments.length} assignments`);
    
    allData.push({
      courseId,
      courseName,
      assignments
    });
  }
  
  return allData;
}

// Export for use in main session
module.exports = { scrapeAllCourses, COURSE_IDS };
