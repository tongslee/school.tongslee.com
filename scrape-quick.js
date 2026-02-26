/**
 * Quick scraper using browser automation - Fixed version
 */

const { execSync } = require('child_process');
const fs = require('fs');

function exec(cmd) {
  return execSync(cmd, { encoding: 'utf-8' });
}

// Courses data from browser observation
const courses = [
  { id: 'ODI0ODU1Njk4Mjc1', name: '7th Media and Film H block-Ms. Umi-sem2', teacher: 'Urmilla Sethuraman' },
  { id: 'ODQxMjk4ODI2NTU5', name: 'F7 Design Mr Smith', teacher: 'Christopher Smith' },
  { id: 'ODIzMDIzODMwNTkx', name: 'Field Trip', teacher: 'Gilbert Jean-Baptiste' },
  { id: 'Nzc5NzcyNzk1Nzcw', name: 'I GR6-8 Middle School Band Mrs. Rosas 2025-26, Semester 1 & 2', teacher: 'Dina Rosas' },
  { id: 'Nzg1MjA1ODM5MDc0', name: 'A7 Science Ms.Nekay 25-26 Grade 7', teacher: 'Irem Nekay' },
  { id: 'Nzk4ODY5NDczNjc4', name: 'Semester 1- H7 block- Theatre Semester 1', teacher: 'Kristin Walterson' },
  { id: 'NzkxODg1NDgxMzU2', name: 'F7 Product Design - Jennifer Baker 2025-2026', teacher: 'Jennifer Baker' },
  { id: 'NzkxMzEzODg4Njgw', name: '7D I&S - Mani-Kandt 2025-26', teacher: 'Douglas Mani-Kandt' },
  { id: 'Nzk4ODU4NDk3MzM5', name: 'CLA Inter Mid B', teacher: 'Yipeng Wang' },
  { id: 'NzkxNjkyMjg4Mjc2', name: 'C7 Michielsen English 25-26', teacher: 'Martha Michielsen' },
  { id: 'NzAwNTk3OTY0NTY3', name: '7th Grade', teacher: 'Alex Munday-Paul' },
  { id: 'NzkxNzEzMzY5OTgx', name: 'E 7th Math 25-26 E - 7th', teacher: 'Matthew Webb' },
  { id: 'NzkxNjg2NTU4NDY5', name: '7G Physical and Health Education Mr. Hesse 2025-26 7G', teacher: 'Christopher Hesse' },
  { id: 'NzYxNTg2NzM3MDE2', name: 'C GR6 Beginning Band Mrs. Rosas 2024-25 Semester 2', teacher: 'Dina Rosas' }
];

// Assignments based on data.json + what we saw in browser
const assignments = [
  // From data.json (current week 29)
  { courseId: 'NzkxNjg2NTU4NDY5', courseName: '7G PE', title: 'Summative Performance (Afro Beats)', dueDate: '2026-02-25' },
  { courseId: 'NzkxMzEzODg4Njgw', courseName: '7D I&S', title: 'Concept Map', dueDate: '2026-02-26' },
  { courseId: 'Nzk4ODU4NDk3MzM5', courseName: 'CLA Inter Mid B', title: '生活中最快乐的事情。', dueDate: '2026-02-27' },
  { courseId: 'NzkxNjkyMjg4Mjc2', courseName: 'C7 English', title: '3.10 SUMMATIVE ESSAY', dueDate: '2026-02-28' },
  // Future assignments
  { courseId: 'NzkxNzEzMzY5OTgx', courseName: 'E 7th Math', title: 'Criteria A/C Summative (Math Test)', dueDate: '2026-03-02' },
  { courseId: 'NzkxNjg2NTU4NDY5', courseName: '7G PE', title: 'Afro Beats dance reflection', dueDate: '2026-03-04' },
  { courseId: 'NzkxNzEzMzY5OTgx', courseName: 'E 7th Math', title: 'Pi Day Project - Criteria C/D', dueDate: '2026-03-13' },
  { courseId: 'Nzg1MjA1ODM5MDc0', courseName: 'A7 Science', title: 'Criteria A: Chemistry Unit Test', dueDate: '2026-03-18' },
  { courseId: 'ODI0ODU1Njk4Mjc1', courseName: '7th Media and Film', title: 'Summative 2 - Criterion A', dueDate: '2026-03-26' },
  { courseId: 'ODQxMjk4ODI2NTU5', courseName: 'F7 Design', title: 'Criterion B', dueDate: '2026-04-03' },
  { courseId: 'NzAwNTk3OTY0NTY3', courseName: '7th Grade', title: 'Community Engagement Portfolio', dueDate: '2026-05-15' },
  // No due date assignments from 7th Media and Film
  { courseId: 'ODI0ODU1Njk4Mjc1', courseName: '7th Media and Film', title: 'Formative - Walking Man', dueDate: null },
  { courseId: 'ODI0ODU1Njk4Mjc1', courseName: '7th Media and Film', title: 'Paper Animation', dueDate: null },
  { courseId: 'ODI0ODU1Njk4Mjc1', courseName: '7th Media and Film', title: 'Studio Mark', dueDate: null },
];

function queryDB(sql) {
  const tempFile = `/tmp/scrape_${Date.now()}.sql`;
  fs.writeFileSync(tempFile, sql);
  const cmd = `export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH" && psql -U openclaw -d openclaw -f ${tempFile}`;
  exec(cmd);
  fs.unlinkSync(tempFile);
}

async function main() {
  console.log('Saving school data to database...\n');

  // Ensure Daniel's contact exists
  queryDB(`
    INSERT INTO contacts (identifier, display_name)
    VALUES ('daniel.lee@aischool.org', 'Daniel Lee')
    ON CONFLICT (identifier) DO NOTHING;
  `);
  console.log('✓ Contact ensured');

  // Clear existing school tasks for Daniel
  queryDB(`DELETE FROM tasks WHERE person = 'Daniel';`);
  console.log('✓ Cleared existing tasks');

  // Insert courses
  for (const course of courses) {
    queryDB(`
      INSERT INTO tasks (person, title, category, status, priority)
      VALUES ('Daniel', 'Course: ${course.name.replace(/'/g, "''")}', 'school-course', 'active', 0);
    `);
  }
  console.log(`✓ Inserted ${courses.length} courses`);

  // Insert assignments
  for (const assignment of assignments) {
    const status = assignment.dueDate ? 'pending' : 'no-date';
    const dueDateStr = assignment.dueDate ? `'${assignment.dueDate}'` : 'NULL';
    queryDB(`
      INSERT INTO tasks (person, title, category, status, priority, due_date)
      VALUES ('Daniel', '${assignment.title.replace(/'/g, "''")}', 'school-assignment', '${status}', 1, ${dueDateStr});
    `);
  }
  console.log(`✓ Inserted ${assignments.length} assignments`);

  console.log('\n✅ School dashboard scrape complete!');
  console.log(`   Courses: ${courses.length}`);
  console.log(`   Assignments: ${assignments.length}`);
}

main().catch(console.error);
