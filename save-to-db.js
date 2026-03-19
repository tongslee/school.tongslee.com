const { Pool } = require('pg');

const pool = new Pool({
  user: 'openclaw',
  host: 'localhost',
  database: 'openclaw',
  port: 5432,
});

// Map scraped course names to database subject names
const nameMapping = {
  "7th Media and Film H block-Ms. Umi-sem2": "7th Media and Film",
  "F7 Design Mr Smith": "F7 Design",
  "Field Trip": "Field Trip",
  "GR6-8 Middle School Band": "GR6-8 Middle School Band",
  "A7 Science": "A7 Science",
  "Theatre": "Theatre",
  "F7 Product Design": "F7 Product Design",
  "7D I&S": "7D I&S",
  "CLA Inter Mid B": "CLA Inter Mid B",
  "C7 English": "C7 English",
  "7th Grade": "7th Grade",
  "E 7th Math": "E 7th Math",
  "7G PE": "7G PE",
  "GR6 Beginning Band": "GR6 Beginning Band"
};

const scrapedData = [
  {
    course: "7th Media and Film H block-Ms. Umi-sem2",
    id: "ODI0ODU1Njk4Mjc1",
    assignments: [
      { title: "Summative 2 - Criterion A", status: "pending" },
      { title: "Criterion B", status: "pending" },
      { title: "Studio Mark", status: "pending" },
      { title: "Cut out", status: "pending" },
      { title: "Paper Animation", status: "pending" },
      { title: "Formative - Walking Man", status: "pending" }
    ]
  },
  {
    course: "F7 Design Mr Smith",
    id: "ODQxMjk4ODI2NTU5",
    assignments: [
      { title: "Criterion B", status: "pending" },
      { title: "Criterion A - Inquiring & Analyzing", status: "pending" }
    ]
  },
  {
    course: "Field Trip",
    id: "ODIzMDIzODMwNTkx",
    assignments: [
      { title: "Information form", status: "pending" }
    ]
  },
  {
    course: "GR6-8 Middle School Band",
    id: "Nzc5NzcyNzk1Nzcw",
    assignments: []
  },
  {
    course: "A7 Science",
    id: "Nzg1MjA1ODM5MDc0",
    assignments: [
      { title: "Choose 3-G7 MYTH or FACT?", status: "pending" },
      { title: "Criteria D: Who owns the elements in the space?", status: "pending" }
    ]
  },
  {
    course: "Theatre",
    id: "Nzk4ODY5NDczNjc4",
    assignments: [
      { title: "Foley Reflection", status: "pending" },
      { title: "Foley Grail Slides", status: "pending" },
      { title: "Prop Monologue", status: "pending" },
      { title: "Alice in Wonderland Prop Hunt", status: "pending" },
      { title: "Prop Design", status: "pending" },
      { title: "Costume Challenge Reflection", status: "pending" },
      { title: "Character Spotify Playlist 11/5", status: "pending" },
      { title: "Alice in Wonderland Character/ Costume Summative", status: "pending" }
    ]
  },
  {
    course: "F7 Product Design",
    id: "NzkxODg1NDgxMzU2",
    assignments: [
      { title: "Criterion C", status: "pending" },
      { title: "Add and use Photos to/from Longboard Photo Album", status: "pending" },
      { title: "Watch This Tutorial", status: "pending" },
      { title: "Adobe Illustrator Tutorials", status: "pending" },
      { title: "Final Grip tape design for stencil", status: "pending" },
      { title: "Grip Tape Design Figure Ground Stencil", status: "pending" },
      { title: "Adobe Illustrator Tools", status: "pending" }
    ]
  },
  {
    course: "7D I&S",
    id: "NzkxMzEzODg4Njgw",
    assignments: [
      { title: "Concept Map", status: "pending" },
      { title: "Writing Practice - Key Concepts", status: "pending" },
      { title: "Video: Zheng He", status: "pending" },
      { title: "Timeline Activity - Part 2", status: "pending" },
      { title: "Timeline Activity: Part 1", status: "pending" },
      { title: "Worksheet Part 2 - Age of Exploration Video", status: "pending" }
    ]
  },
  {
    course: "CLA Inter Mid B",
    id: "Nzk4ODU4NDk3MzM5",
    assignments: [
      { title: "生活中最快乐的事情。", status: "pending" },
      { title: "Tianji's Horse Race", status: "pending" },
      { title: "Write a nice note for everyone", status: "pending" },
      { title: "Write a Stack of Sentences", status: "pending" },
      { title: "HW Please complete a Chairman's Bao Lesson Level 3 or 4.", status: "pending" },
      { title: "HW Chairman's Bao Assignment Level 4 or above.", status: "pending" }
    ]
  },
  {
    course: "C7 English",
    id: "NzkxNjkyMjg4Mjc2",
    assignments: []
  },
  {
    course: "7th Grade",
    id: "NzAwNTk3OTY0NTY3",
    assignments: []
  },
  {
    course: "E 7th Math",
    id: "NzkxNzEzMzY5OTgx",
    assignments: [
      { title: "Pi Day Project - Criteria C/D Summative", status: "pending" },
      { title: "7B.18 Homework", status: "pending" },
      { title: "7B.16 and 7B.17 Homework", status: "pending" },
      { title: "Criteria A Summative", status: "pending" },
      { title: "7B.16 Homework", status: "pending" },
      { title: "7B.15 Homework", status: "pending" }
    ]
  },
  {
    course: "7G PE",
    id: "NzkxNjg2NTU4NDY5",
    assignments: [
      { title: "Add your music here (create a google doc then provide a link)", status: "pending" },
      { title: "Afro Beats dance reflection", status: "pending" },
      { title: "Movement plan- Attach or copy and paste your work into this document and submit here", status: "pending" },
      { title: "Summative Performance on this day!", status: "pending" },
      { title: "Complete this group/partners request form by next class", status: "pending" }
    ]
  },
  {
    course: "GR6 Beginning Band",
    id: "NzYxNTg2NzM3MDE2",
    assignments: []
  }
];

async function saveToDatabase() {
  const client = await pool.connect();
  
  try {
    // Clear existing assignments
    await client.query('DELETE FROM school_assignments');
    console.log('Cleared existing assignments');
    
    let totalAssignments = 0;
    
    for (const courseData of scrapedData) {
      // Map to database name
      const dbName = nameMapping[courseData.course] || courseData.course;
      
      // Find subject by name
      const subjectResult = await client.query(
        'SELECT id FROM school_subjects WHERE name = $1',
        [dbName]
      );
      
      if (subjectResult.rows.length === 0) {
        console.log(`Subject not found: ${dbName} (original: ${courseData.course})`);
        continue;
      }
      
      const subjectId = subjectResult.rows[0].id;
      
      // Insert assignments
      for (const assignment of courseData.assignments) {
        await client.query(
          `INSERT INTO school_assignments (subject_id, title, status, assignment_type, created_at, updated_at)
           VALUES ($1, $2, $3, 'other', NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [subjectId, assignment.title, assignment.status]
        );
        totalAssignments++;
      }
      
      console.log(`Inserted ${courseData.assignments.length} assignments for ${dbName}`);
    }
    
    console.log(`\nTotal assignments saved: ${totalAssignments}`);
    
    // Show summary
    const summary = await client.query(`
      SELECT s.display_name, COUNT(a.id) as assignment_count
      FROM school_subjects s
      LEFT JOIN school_assignments a ON s.id = a.subject_id
      GROUP BY s.id, s.display_name
      ORDER BY s.display_name
    `);
    
    console.log('\n=== Summary by Subject ===');
    summary.rows.forEach(row => {
      console.log(`${row.display_name}: ${row.assignment_count} assignments`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

saveToDatabase();
