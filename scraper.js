/**
 * Google Classroom Scraper
 * Scrapes assignments from Google Classroom and stores them in Postgres
 */

const { chromium } = require('playwright');
const { exec: execSync } = require('child_process');
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
    execSync(cmd, { encoding: 'utf-8' }, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve(stdout.trim());
    });
  });
}

async function queryDB(sql, params = []) {
  const paramsStr = params.map(p => `'${p}'`).join(', ');
  const fullSql = params.length > 0 
    ? sql.replace(/\?/g, () => paramsStr.split(',').shift())
    : sql;
  // Use parameterized query properly
  const psqlCmd = `export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH" && psql -U openclaw -d openclaw -c "${sql.replace(/"/g, '\\"')}"`;
  return exec(psqlCmd);
}

async function queryDBParameterized(sql, params) {
  // Create temp file to avoid shell escaping issues
  const tempFile = `/tmp/query_${Date.now()}.sql`;
  let paramIndex = 1;
  const formattedSql = sql.replace(/\$/g, (match) => {
    if (match === '$') return `$${paramIndex++}`;
    return match;
  });
  
  let paramList = '';
  params.forEach((p, i) => {
    paramList += `\\set p${i + 1} '${p.replace(/'/g, "''")}'\n`;
  });
  
  const fullSql = `${paramList}\n${formattedSql}`;
  await require('fs').promises.writeFile(tempFile, fullSql);
  
  const result = await exec(`export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH" && psql -U openclaw -d openclaw -f ${tempFile}`);
  await require('fs').promises.unlink(tempFile);
  return result;
}

async function scrapeGoogleClassroom() {
  console.log('Starting Google Classroom scraper...');
  
  const browser = await chromium.launch({ 
    headless: false,
    userDataDir: '/tmp/playwright-daniel-gclassroom'
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Navigate to Google Classroom
  console.log('Navigating to Google Classroom...');
  await page.goto('https://classroom.google.com', { waitUntil: 'networkidle' });
  
  // Check if login required
  const url = page.url();
  console.log('Current URL:', url);
  
  if (url.includes('accounts.google.com')) {
    console.log('Login required. Please log in manually.');
    console.log('Waiting for login...');
    
    // Wait for user to log in
    await page.waitForURL('**/classroom.google.com/**', { timeout: 300000 });
    console.log('Logged in! Starting to scrape...');
  }
  
  // Get all courses
  console.log('Fetching courses...');
  await page.waitForSelector('//a[contains(@href, "/course/")]', { timeout: 30000 });
  
  const courses = await page.evaluate(() => {
    const courseElements = document.querySelectorAll('a[href*="/course/"]');
    const courses = [];
    courseElements.forEach(el => {
      const name = el.textContent.trim();
      const href = el.getAttribute('href');
      const match = href.match(/\/course\/([^/]+)/);
      if (match && name && !courses.find(c => c.name === name)) {
        courses.push({ id: match[1], name });
      }
    });
    return courses;
  });
  
  console.log(`Found ${courses.length} courses:`, courses.map(c => c.name).join(', '));
  
  const allAssignments = [];
  
  // Visit each course to get assignments
  for (const course of courses) {
    console.log(`\nScraping course: ${course.name}`);
    
    try {
      await page.goto(`https://classroom.google.com/c/${course.id}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      // Get course name (might be different on course page)
      const courseName = await page.evaluate(() => {
        const titleEl = document.querySelector('h1') || document.querySelector('[role="heading"]');
        return titleEl ? titleEl.textContent.trim() : 'Unknown';
      });
      
      // Look for assignments in the course
      const assignments = await page.evaluate(() => {
        const items = [];
        
        // Try multiple selectors for assignments
        const assignmentElements = document.querySelectorAll('[data-assignment-id], .assignment, [role="listitem"]');
        
        assignmentElements.forEach(el => {
          const titleEl = el.querySelector('div[role="heading"], .title, [data-text*="Due"]');
          const dueEl = el.querySelector('[data-text*="Due"], .due-date, .date');
          const typeEl = el.querySelector('.type, [data-text*="Quiz"], [data-text*="Test"]');
          
          if (titleEl) {
            const title = titleEl.textContent.trim();
            const dueText = dueEl ? dueEl.textContent.trim() : null;
            
            if (title && !title.includes('No assignments') && title.length < 200) {
              items.push({
                title,
                dueText,
                element: title
              });
            }
          }
        });
        
        return items;
      });
      
      console.log(`  Found ${assignments.length} assignments`);
      
      // Store in database
      for (const assignment of assignments) {
        allAssignments.push({
          course: courseName,
          ...assignment
        });
      }
      
    } catch (err) {
      console.log(`  Error scraping ${course.name}:`, err.message);
    }
  }
  
  console.log(`\nTotal assignments found: ${allAssignments.length}`);
  
  // Save to database
  console.log('\nSaving to database...');
  
  for (const assignment of allAssignments) {
    // Get or create subject
    let subjectId;
    const subjectCheck = await exec(`export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH" && psql -U openclaw -d openclaw -t -c "SELECT id FROM school_subjects WHERE name = '${assignment.course.replace(/'/g, "''")}' LIMIT 1;"`);
    
    if (subjectCheck.trim()) {
      subjectId = subjectCheck.trim();
    } else {
      await exec(`export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH" && psql -U openclaw -d openclaw -c "INSERT INTO school_subjects (name, display_name) VALUES ('${assignment.course.replace(/'/g, "''")}', '${assignment.course.replace(/'/g, "''")}');"`);
      subjectId = await exec(`export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH" && psql -U openclaw -d openclaw -t -c "SELECT id FROM school_subjects WHERE name = '${assignment.course.replace(/'/g, "''")}' LIMIT 1;"`);
    }
    
    // Determine assignment type
    let assignmentType = 'other';
    const titleLower = assignment.title.toLowerCase();
    if (titleLower.includes('quiz') || titleLower.includes('test') || titleLower.includes('exam')) {
      assignmentType = 'summative';
    } else if (titleLower.includes('project')) {
      assignmentType = 'project';
    } else if (titleLower.includes('homework') || titleLower.includes('worksheet')) {
      assignmentType = 'homework';
    } else if (titleLower.includes('formative')) {
      assignmentType = 'formative';
    }
    
    // Parse due date
    let dueDate = null;
    if (assignment.dueText) {
      try {
        dueDate = new Date(assignment.dueText);
        if (!isNaN(dueDate.getTime())) {
          dueDate = dueDate.toISOString();
        } else {
          dueDate = null;
        }
      } catch (e) {
        dueDate = null;
      }
    }
    
    // Insert assignment (upsert based on title + subject)
    const insertSql = `INSERT INTO school_assignments (subject_id, week_id, title, assignment_type, due_date, status, source_url)
      SELECT ${subjectId}, (SELECT id FROM school_weeks WHERE week_start <= CURRENT_DATE AND week_end >= CURRENT_DATE LIMIT 1), 
             '${assignment.title.replace(/'/g, "''")}', '${assignmentType}', ${dueDate ? `'${dueDate}'` : 'NULL'}, 'pending', ''
      WHERE NOT EXISTS (SELECT 1 FROM school_assignments WHERE title = '${assignment.title.replace(/'/g, "''")}' AND subject_id = ${subjectId});`;
    
    await exec(`export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH" && psql -U openclaw -d openclaw -c "${insertSql}"`);
  }
  
  console.log('Done!');
  await browser.close();
  
  return allAssignments;
}

// Run if called directly
if (require.main === module) {
  scrapeGoogleClassroom()
    .then(results => {
      console.log('\nScraping complete!');
      console.log(JSON.stringify(results, null, 2));
    })
    .catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
}

module.exports = { scrapeGoogleClassroom };
