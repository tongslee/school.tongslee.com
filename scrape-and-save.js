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

// UI noise to filter out
const UI_NOISE = [
  'Skip to main content', 'Main Menu', 'Classroom', 'Stream', 'Classwork', 'People',
  'All topics', 'assignment_ind', 'View your work', 'Collapse all', 'Collapse all sections',
  'Collapse topic', 'more_vert', 'Material', 'Posted', 'Edited', 'View more', 'comment',
  'comments', 'Help and Feedback', 'No topic', 'Resources', 'Objectives', 'DeltaMath',
  'Syllabus', ' criterion ', 'Criterion '
];

// Check if title is likely a real assignment
function isRealAssignment(title) {
  if (!title || title.length < 3 || title.length > 100) return false;
  if (title.includes('Classwork for')) return false;
  
  const lower = title.toLowerCase();
  for (const noise of UI_NOISE) {
    if (lower === noise.toLowerCase() || lower.includes(noise.toLowerCase())) {
      return false;
    }
  }
  // Must have some letters
  if (!/[a-zA-Z]/.test(title)) return false;
  return true;
}

async function scrape() {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:18800'
  });
  
  const pages = await browser.pages();
  const page = pages[0];
  
  const allData = [];
  
  for (const course of courses) {
    console.log('\n=== Scraping:', course.name, '===');
    
    try {
      await page.goto(`https://classroom.google.com/w/${course.id}/t/all`, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      await new Promise(r => setTimeout(r, 2000));
      
      const text = await page.evaluate(() => document.body.innerText);
      const lines = text.split('\n');
      
      const assignments = [];
      let currentTitle = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line && !line.includes('Due') && !line.includes('due date') && 
            !line.includes('Assignment') && !line.includes('Completed') &&
            !line.includes('Topic') && !line.includes('More options') &&
            line.length > 3 && line.length < 80) {
          
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
          
          if (isRealAssignment(line) && !assignments.find(a => a.title === line)) {
            currentTitle = line;
            assignments.push({ title: line, dueDate, status });
          }
        }
      }
      
      console.log('Found', assignments.length, 'real assignments');
      
      allData.push({
        course: course.name,
        courseId: course.id,
        assignments
      });
    } catch (e) {
      console.error('Error scraping', course.name, ':', e.message);
      allData.push({
        course: course.name,
        courseId: course.id,
        assignments: []
      });
    }
  }
  
  console.log('\n=== FINAL FILTERED DATA ===');
  console.log(JSON.stringify(allData, null, 2));
  
  await browser.disconnect();
  
  // Save to database
  const { Client } = require('pg');
  const client = new Client({
    user: 'openclaw',
    host: 'localhost',
    database: 'openclaw',
    port: 5432
  });
  
  await client.connect();
  
  // Get subject ID mapping
  const subjectResult = await client.query('SELECT id, name FROM school_subjects');
  const subjectMap = {};
  subjectResult.rows.forEach(row => {
    subjectMap[row.name] = row.id;
  });
  
  // Clear old assignments and insert new ones
  await client.query('DELETE FROM school_assignments');
  
  let totalInserted = 0;
  for (const courseData of allData) {
    const subjectId = subjectMap[courseData.course];
    if (!subjectId) {
      console.log('Unknown subject:', courseData.course);
      continue;
    }
    
    for (const assignment of courseData.assignments) {
      // Parse due date
      let dueDate = null;
      if (assignment.dueDate) {
        try {
          // Handle various date formats
          const dateStr = assignment.dueDate.replace(/PM$/, ' PM').replace(/AM$/, ' AM');
          dueDate = new Date(dateStr);
          if (isNaN(dueDate.getTime())) {
            // Try parsing just the month/day
            const currentYear = new Date().getFullYear();
            dueDate = new Date(`${assignment.dueDate} ${currentYear}`);
          }
        } catch (e) {
          console.log('Could not parse date:', assignment.dueDate);
        }
      }
      
      await client.query(
        `INSERT INTO school_assignments (subject_id, title, due_date, status, source_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [subjectId, assignment.title, dueDate, assignment.status, `https://classroom.google.com/w/${courseData.courseId}/t/all`]
      );
      totalInserted++;
    }
  }
  
  console.log(`\n✅ Saved ${totalInserted} assignments to database`);
  
  await client.end();
}

scrape().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
