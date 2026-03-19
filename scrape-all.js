/**
 * Google Classroom Scraper - Updated for current Classroom UI
 * Scrapes all courses and assignments and saves to Postgres
 */

const { chromium } = require('playwright');
const path = require('path');

// Database configuration
const DB_CONFIG = {
  host: 'localhost',
  port: 5432,
  user: 'openclaw',
  database: 'openclaw'
};

function exec(cmd) {
  return new Promise((resolve, reject) => {
    const { exec: execSync } = require('child_process');
    execSync(cmd, { encoding: 'utf-8' }, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve(stdout.trim());
    });
  });
}

async function queryDB(sql, params = []) {
  // Escape single quotes in params
  const escapedParams = params.map(p => p.replace(/'/g, "''"));
  const paramsStr = escapedParams.map(p => `'${p}'`).join(', ');
  
  let fullSql = sql;
  if (params.length > 0) {
    let paramIndex = 0;
    fullSql = sql.replace(/\?/g, () => {
      return paramsStr.split(', ')[paramIndex++];
    });
  }
  
  // Use parameterized query via temp file
  const tempFile = `/tmp/query_${Date.now()}.sql`;
  const paramList = escapedParams.map((p, i) => `\\set p${i + 1} '${p}'\n`).join('');
  
  // Simple approach - just use psql with -c and proper escaping
  const safeSql = sql.replace(/'/g, "''");
  const cmd = `export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH" && psql -U openclaw -d openclaw -c "${safeSql}"`;
  return exec(cmd);
}

async function scrapeGoogleClassroom() {
  console.log('Starting Google Classroom scraper...');
  
  // Use persistent context to keep login session - headless for cron
  const context = await chromium.launchPersistentContext('/tmp/playwright-daniel-gclassroom', { 
    headless: true
  });
  
  const page = context.pages()[0] || await context.newPage();
  
  // Navigate to Google Classroom
  console.log('Navigating to Google Classroom...');
  await page.goto('https://classroom.google.com', { waitUntil: 'networkidle', timeout: 60000 });
  
  // Wait for page to fully load
  await page.waitForTimeout(3000);
  
  // Get all courses from the sidebar
  console.log('Fetching courses from sidebar...');
  const courses = await page.evaluate(() => {
    const courseItems = document.querySelectorAll('[role="menuitem"]:not([aria-label])');
    const courses = [];
    
    // Look for course items in the enrolled section
    const menuItems = document.querySelectorAll('div[role="menu"] menuitem');
    menuItems.forEach(el => {
      const text = el.textContent.trim();
      const href = el.querySelector('a')?.getAttribute('href') || '';
      if (href.includes('/course/') && text) {
        const match = href.match(/\/course\/([^/]+)/);
        if (match && !courses.find(c => c.name === text)) {
          courses.push({ id: match[1], name: text, url: href });
        }
      }
    });
    
    return courses;
  });
  
  console.log(`Found ${courses.length} courses`);
  
  // Also get courses from main page
  const mainPageCourses = await page.evaluate(() => {
    const courses = [];
    const links = document.querySelectorAll('a[href*="/c/"]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      const text = link.textContent.trim();
      if (href && href.includes('/c/') && text && !text.includes('Google') && !text.includes('classroom')) {
        const match = href.match(/\/c\/([^/?]+)/);
        if (match && !courses.find(c => c.name === text)) {
          courses.push({ id: match[1], name: text, url: href });
        }
      }
    });
    return courses;
  });
  
  // Merge courses
  const allCourses = [...courses];
  mainPageCourses.forEach(c => {
    if (!allCourses.find(existing => existing.id === c.id)) {
      allCourses.push(c);
    }
  });
  
  console.log(`Total unique courses: ${allCourses.length}`);
  
  const allAssignments = [];
  
  // Process each course
  for (const course of allCourses) {
    console.log(`\nProcessing course: ${course.name}`);
    
    try {
      // Navigate to course classwork
      const classworkUrl = `https://classroom.google.com/c/${course.id}/w/all`;
      await page.goto(classworkUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      // Get assignments from this course
      const assignments = await page.evaluate(() => {
        const assignmentList = [];
        
        // Look for assignment items - they typically have headings and due dates
        const listItems = document.querySelectorAll('[role="listitem"]');
        
        listItems.forEach(item => {
          const titleEl = item.querySelector('button, [role="button"]');
          const title = titleEl?.textContent?.trim() || '';
          
          // Check if it's an assignment (has "Assignment" text or specific styling)
          const typeEl = item.querySelector('span, div');
          const typeText = typeEl?.textContent?.trim() || '';
          
          // Look for due date
          const dueDateEl = item.querySelector('[datetime], [data-date]');
          let dueDate = dueDateEl?.getAttribute('datetime') || dueDateEl?.getAttribute('data-date') || '';
          
          // Also look for text containing due date patterns
          const itemText = item.textContent || '';
          const dueMatch = itemText.match(/Due\s+([A-Za-z]+,?\s*[A-Za-z]+\s*\d+)/i);
          if (!dueDate && dueMatch) {
            dueDate = dueMatch[1];
          }
          
          // Check for no due date
          const noDueDate = itemText.toLowerCase().includes('no due date');
          
          if (title && (typeText.toLowerCase().includes('assignment') || typeText.toLowerCase().includes('task') || item.querySelector('img'))) {
            assignmentList.push({
              title: title,
              dueDate: noDueDate ? null : dueDate,
              type: 'assignment'
            });
          }
        });
        
        return assignmentList;
      });
      
      console.log(`  Found ${assignments.length} assignments`);
      
      assignments.forEach(a => {
        allAssignments.push({
          courseId: course.id,
          courseName: course.name,
          title: a.title,
          dueDate: a.dueDate,
          type: a.type
        });
      });
      
    } catch (err) {
      console.error(`  Error processing course ${course.name}:`, err.message);
    }
  }
  
  console.log(`\nTotal assignments collected: ${allAssignments.length}`);
  
  // Save to database
  console.log('\nSaving to database...');
  
  // First, ensure we have a contact for Daniel
  await queryDB(`
    INSERT INTO contacts (identifier, display_name)
    VALUES ('daniel.lee@aischool.org', 'Daniel Lee')
    ON CONFLICT (identifier) DO NOTHING
  `);
  
  // Clear existing school data for Daniel
  await queryDB(`
    DELETE FROM tasks WHERE person = 'Daniel'
  `);
  
  // Insert courses as task categories
  for (const course of allCourses) {
    console.log(`  Inserting course: ${course.name}`);
    await queryDB(`
      INSERT INTO tasks (person, title, category, status, priority)
      VALUES ('Daniel', 'Course: ${course.name.replace(/'/g, "''")}', 'school-course', 'active', 0)
    `);
  }
  
  // Insert assignments
  for (const assignment of allAssignments) {
    const status = assignment.dueDate ? 'pending' : 'no-date';
    console.log(`  Inserting assignment: ${assignment.title} (${assignment.courseName})`);
    await queryDB(`
      INSERT INTO tasks (person, title, category, status, priority, due_date)
      VALUES ('Daniel', '${assignment.title.replace(/'/g, "''")}', 'school-assignment', '${status}', 1, ${assignment.dueDate ? `'${assignment.dueDate}'` : 'NULL'})
    `);
  }
  
  console.log('\nScraping complete!');
  console.log(`Courses: ${allCourses.length}`);
  console.log(`Assignments: ${allAssignments.length}`);
  
  await context.close();
  
  return { courses: allCourses, assignments: allAssignments };
}

scrapeGoogleClassroom().catch(console.error);
