const { Pool } = require('pg');

const pool = new Pool({
  user: 'openclaw',
  host: 'localhost',
  database: 'openclaw',
  port: 5432,
});

// Filter out noise and keep only real assignments
const scrapedData = [
  { course: '7th Media and Film', id: 'ODI0ODU1Njk4Mjc1', assignments: [
    { title: 'Summative 2 - Criterion A', dueDate: 'Mar 26', status: 'pending' },
    { title: 'Studio Mark', dueDate: '', status: 'submitted' },
    { title: 'Criterion B', dueDate: 'Feb 20', status: 'submitted' },
    { title: 'Cut out', dueDate: 'Feb 11', status: 'submitted' },
    { title: 'Paper Animation', dueDate: '', status: 'submitted' },
    { title: 'Formative - Walking Man', dueDate: '', status: 'submitted' }
  ]},
  { course: 'F7 Design', id: 'ODQxMjk4ODI2NTU5', assignments: [
    { title: 'Longboard Graphics (Semester 2)', dueDate: '', status: 'pending' },
    { title: 'Criterion B', dueDate: 'Apr 3', status: 'submitted' },
    { title: 'Criterion A - Inquiring & Analyzing', dueDate: 'Feb 16', status: 'pending' }
  ]},
  { course: 'Field Trip', id: 'ODIzMDIzODMwNTkx', assignments: [
    { title: 'Information form', dueDate: 'Nov 5, 2025', status: 'pending' }
  ]},
  { course: 'GR6-8 Middle School Band', id: 'Nzc5NzcyNzk1Nzcw', assignments: [
    { title: '2.0 Vote for your FAVORITES for the Spring Concert', dueDate: 'Jan 26', status: 'pending' },
    { title: '1.9 SUMMATIVE: Island of Reflection', dueDate: 'Jan 20', status: 'submitted' },
    { title: '1.8 Sound Check Reflections (Criterion D) OVERALL SCORE', dueDate: '', status: 'submitted' },
    { title: '1.7 Soundcheck #3 (G7 SUMMATIVE)', dueDate: 'Dec 5, 2025', status: 'submitted' },
    { title: '1.7 Soundcheck #3: Express Yourself (SUMMATIVE)', dueDate: 'Nov 7, 2025', status: 'submitted' },
    { title: '1.6 Soundcheck #2 Reflection (G7 SUMMATIVE)', dueDate: 'Oct 24, 2025', status: 'submitted' },
    { title: '1.6 Soundcheck #2, Together in Time (SUMMATIVE)', dueDate: 'Oct 22, 2025', status: 'pending' },
    { title: '1.5 Progress Report Survey', dueDate: '', status: 'submitted' },
    { title: '1.4 Soundcheck #1, Finding Your Voice (SUMMATIVE)', dueDate: 'Oct 1, 2025', status: 'submitted' },
    { title: '1.4 Soundcheck #1 Reflection (SUMMATIVE)', dueDate: 'Oct 15, 2025', status: 'submitted' },
    { title: '1.3 FORMATIVE: Finding Success in Structure', dueDate: 'Sep 19, 2025', status: 'pending' }
  ]},
  { course: 'A7 Science', id: 'Nzg1MjA1ODM5MDc0', assignments: [
    { title: 'Criteria D: Who owns the elements in the space?', dueDate: 'Feb 6', status: 'pending' },
    { title: 'Choose 3-G7 MYTH or FACT?', dueDate: 'Feb 2', status: 'pending' },
    { title: 'Mini Quiz- Periodic Table', dueDate: '', status: 'pending' },
    { title: '01/26/2026- Asynchronous Learning Activity', dueDate: '', status: 'pending' },
    { title: 'Lesson 13: Law of Conservation of Matter', dueDate: '', status: 'pending' },
    { title: 'Lesson 12: Counting Atoms', dueDate: '', status: 'submitted' },
    { title: 'Lesson 11: Periodic Families', dueDate: '', status: 'pending' },
    { title: 'Lesson 9-10: Writing Procedures', dueDate: '', status: 'pending' },
    { title: 'Lesson 8: Properties of Nonmetals Lab', dueDate: '', status: 'pending' },
    { title: 'Lesson 7: Properties of Metals', dueDate: '', status: 'pending' },
    { title: 'Lesson 6: Review', dueDate: '', status: 'pending' },
    { title: 'Criteria C: Ohm\'s Law', dueDate: 'Dec 1, 2025', status: 'pending' },
    { title: 'NEW Test Review', dueDate: 'Nov 10, 2025', status: 'pending' },
    { title: 'Test Review', dueDate: 'Nov 7, 2025', status: 'submitted' },
    { title: 'Criterion B: Resistance in a Wire', dueDate: 'Oct 20, 2025', status: 'submitted' },
    { title: 'Criterion D: Evaluating Series and Parallel Circuits', dueDate: 'Sep 17, 2025', status: 'pending' },
    { title: 'Flint-Test Review Formative Practice', dueDate: '', status: 'pending' },
    { title: 'Putting All the formulas together', dueDate: '', status: 'pending' },
    { title: 'Lesson 14: Calculating Resistance in a Wire', dueDate: '', status: 'pending' },
    { title: 'Calculating Power', dueDate: '', status: 'pending' },
    { title: 'Lesson 12: Calculating Power', dueDate: '', status: 'submitted' },
    { title: 'Electricity Formative Quiz-1', dueDate: 'Oct 22, 2025', status: 'pending' },
    { title: 'Lesson 11: Fruit Battery', dueDate: '', status: 'pending' },
    { title: 'Lesson 10: Ohm\'s Law-2', dueDate: '', status: 'pending' },
    { title: 'Lesson 9: Ohm\'s Law', dueDate: '', status: 'pending' },
    { title: 'Lesson 8: Resistance', dueDate: '', status: 'pending' },
    { title: 'Investigating Variables', dueDate: '', status: 'pending' },
    { title: 'Lab Safety contract', dueDate: '', status: 'pending' },
    { title: 'Lab Safety Worksheet', dueDate: '', status: 'pending' },
    { title: 'Classroom Expectations', dueDate: '', status: 'pending' }
  ]},
  { course: 'Theatre', id: 'Nzk4ODY5NDczNjc4', assignments: [
    { title: 'Foley Grail Slides', dueDate: '', status: 'submitted' },
    { title: 'Final Fairy Tale Remix Summative', dueDate: '', status: 'pending' },
    { title: 'Character Spotify Playlist 11/5', dueDate: '', status: 'pending' },
    { title: 'Foley Reflection', dueDate: '', status: 'pending' },
    { title: 'Greek Theatre-Festival of Dionysus', dueDate: '', status: 'pending' },
    { title: 'Daily Rituals', dueDate: '', status: 'pending' },
    { title: 'What is Theatre?', dueDate: '', status: 'pending' },
    { title: 'Amazing Lighting Designs', dueDate: '', status: 'pending' }
  ]},
  { course: 'F7 Product Design', id: 'NzkxODg1NDgxMzU2', assignments: [
    { title: 'Criterion C', dueDate: 'Jan 21', status: 'submitted' },
    { title: 'Add and use Photos to/from Longboard Photo Album', dueDate: '', status: 'submitted' },
    { title: 'Watch This Tutorial', dueDate: '', status: 'pending' },
    { title: 'Adobe Illustrator Tutorials', dueDate: '', status: 'submitted' },
    { title: 'Final Grip tape design for stencil', dueDate: '', status: 'submitted' },
    { title: 'Grip Tape Design Figure Ground Stencil', dueDate: 'Dec 11, 2025', status: 'submitted' },
    { title: 'Download & Install Adobe Illustrator', dueDate: 'Dec 10, 2025', status: 'submitted' },
    { title: 'Mad libs style - My Longboard Design Specs', dueDate: '', status: 'submitted' },
    { title: 'SAFETY QUIZ', dueDate: '', status: 'pending' },
    { title: 'Adobe Illustrator Tools', dueDate: '', status: 'pending' },
    { title: 'SMART STATEMENT SLIDE', dueDate: '', status: 'pending' },
    { title: 'ACCESSFM Quizlet', dueDate: '', status: 'pending' },
    { title: 'DESIGN BRIEF REVISION DIRECTIONS', dueDate: '', status: 'pending' }
  ]},
  { course: '7D I&S', id: 'NzkxMzEzODg4Njgw', assignments: [
    { title: 'Study Guide for Summative', dueDate: '', status: 'submitted' },
    { title: 'Concept Map', dueDate: 'Feb 26', status: 'submitted' },
    { title: 'Writing Practice - Key Concepts', dueDate: 'Feb 23', status: 'submitted' },
    { title: 'Video: Zheng He', dueDate: 'Feb 17', status: 'submitted' },
    { title: 'Timeline Activity - Part 2', dueDate: 'Feb 10', status: 'pending' },
    { title: 'Timeline Activity: Part 1', dueDate: 'Feb 9', status: 'submitted' },
    { title: 'Worksheet Part 2 - Age of Exploration Video', dueDate: 'Jan 29', status: 'submitted' },
    { title: 'If you could go explore anywhere in the world, where would it be, and why?', dueDate: '', status: 'submitted' },
    { title: 'Worksheet Part 1 - Age of Exploration Video', dueDate: '', status: 'pending' },
    { title: 'Summative - Unit 2', dueDate: 'Jan 20', status: 'pending' },
    { title: 'Formative - Flint and Canva Video Practice', dueDate: 'Dec 19, 2025', status: 'pending' },
    { title: 'Task #5: China in the Middle Ages', dueDate: 'Dec 9, 2025', status: 'pending' },
    { title: 'Task Sheet #4: Life in England and the Golden Age of Islam', dueDate: 'Dec 2, 2025', status: 'submitted' },
    { title: 'Task #3: Feudalism, Britain', dueDate: 'Nov 13, 2025', status: 'submitted' },
    { title: 'Formative #2: Infographic - Middle Ages Myths', dueDate: 'Nov 11, 2025', status: 'pending' },
    { title: 'Task #1: End of Roman Empire, Beginning of Byzantine', dueDate: 'Nov 7, 2025', status: 'pending' },
    { title: 'World Religions - Presentations', dueDate: 'Oct 16, 2025', status: 'pending' },
    { title: 'Formative - Worksheet - Early Evidence of Religion', dueDate: 'Oct 2, 2025', status: 'submitted' },
    { title: 'Is the "Flying Spaghetti Monster" a religion? Why or why not?', dueDate: '', status: 'submitted' },
    { title: 'Video - What is Religion? - Q&A', dueDate: 'Sep 25, 2025', status: 'pending' },
    { title: 'Formative - "What is Religion?" Video & Questions', dueDate: 'Sep 25, 2025', status: 'submitted' },
    { title: 'Summative #1: Origin Stories Test', dueDate: 'Sep 23, 2025', status: 'submitted' },
    { title: 'Timed Writing - Practice Test', dueDate: '', status: 'pending' }
  ]},
  { course: 'CLA Inter Mid B', id: 'Nzk4ODU4NDk3MzM5', assignments: [
    { title: '生活中最快乐的事情。', dueDate: 'Feb 27', status: 'submitted' },
    { title: 'Tianji\'s Horse Race', dueDate: '', status: 'submitted' },
    { title: 'Write a nice note for everyone', dueDate: 'Jan 26', status: 'submitted' },
    { title: 'Write a Stack of Sentences', dueDate: 'Jan 12', status: 'submitted' },
    { title: 'HW Please complete a Chairman\'s Bao Lesson Level 3 or 4.', dueDate: 'Nov 14, 2025', status: 'submitted' },
    { title: 'My favorite food Oral Summative', dueDate: 'Sep 22, 2025', status: 'submitted' },
    { title: 'HW Pinyin (60 or under) (oral)', dueDate: 'Aug 25, 2025', status: 'pending' }
  ]},
  { course: 'C7 English', id: 'NzkxNjkyMjg4Mjc2', assignments: [
    { title: '3.10 SUMMATIVE ESSAY', dueDate: 'Mar 12', status: 'submitted' },
    { title: '3.9 Intro and Conclusion Planning', dueDate: 'Feb 24', status: 'pending' },
    { title: '3.8 Chapter 5 Homeland', dueDate: '', status: 'submitted' },
    { title: '3.7 Chapter 2 Formative Paragraph', dueDate: 'Feb 17', status: 'pending' },
    { title: '3.6 Reading Chapter 2- Stand', dueDate: 'Feb 12', status: 'submitted' },
    { title: '3.5 Formative Paragraph 2-Analysis of Chapter 1', dueDate: 'Feb 10', status: 'pending' },
    { title: '3.4 Formative Paragraph- Analysis of introduction', dueDate: 'Jan 5, 2027', status: 'pending' },
    { title: '3.3 Ted Talk', dueDate: 'Jan 27', status: 'pending' },
    { title: '3.0 SUMMATIVE- Graphic novel translation', dueDate: 'Jan 15', status: 'submitted' },
    { title: '2.9 SUMMATIVE - final essay', dueDate: 'Dec 5, 2025', status: 'submitted' },
    { title: '2.8 Full Essay Draft with Paragraph 3', dueDate: 'Nov 14, 2025', status: 'pending' },
    { title: '2.7 Quotes from Act 2 Scene 1 and 2', dueDate: '', status: 'submitted' },
    { title: '2.6 Second Formative Paragraph for Macbeth', dueDate: 'Nov 6, 2025', status: 'pending' },
    { title: '2.5 Act 1 Scene 5-7 Presentation', dueDate: '', status: 'pending' },
    { title: '2.4 Act 1 Scene 4 Class Presentation', dueDate: '', status: 'submitted' },
    { title: '2.3 First Formative Paragraph- Macbeth as the play begins', dueDate: 'Oct 28, 2025', status: 'pending' },
    { title: '2.2 Act 1 Scene 2 and 3 Quotes', dueDate: '', status: 'pending' },
    { title: '2.1 Macbeth Script', dueDate: '', status: 'pending' },
    { title: '1.13 SUMMATIVE poetry collection', dueDate: 'Oct 3, 2025', status: 'submitted' },
    { title: '1.12 SUMMATIVE COMPARATIVE PARAGRAPH', dueDate: 'Sep 26, 2025', status: 'submitted' },
    { title: '1.11 Formative #3 Comparative Paragraph Chen and Young Li', dueDate: 'Sep 15, 2025', status: 'pending' },
    { title: '1.9 I Invite my Parents and Eating Together', dueDate: 'Sep 9, 2025', status: 'submitted' },
    { title: '1.8 Poem #3 Extended Metaphor and Mother to Son', dueDate: 'Sep 9, 2025', status: 'submitted' },
    { title: '1.7 Formative Paragraph #2 Mother to Son', dueDate: 'Sep 2, 2025', status: 'pending' },
    { title: '1.6 Mother To Son Langston Hughes', dueDate: '', status: 'submitted' },
    { title: '1.5 Poem #2: Based on Search for My Tongue', dueDate: 'Aug 28, 2025', status: 'pending' },
    { title: '1.4 Paragraph #1 Search for my Tongue', dueDate: 'Aug 26, 2025', status: 'pending' }
  ]},
  { course: '7th Grade', id: 'NzAwNTk3OTY0NTY3', assignments: [
    { title: 'Conference Prep', dueDate: 'Feb 5', status: 'pending' },
    { title: 'Focused Organization', dueDate: '', status: 'submitted' },
    { title: 'Focused Org Oct 13', dueDate: '', status: 'submitted' },
    { title: 'Focused Organization Sept. 29', dueDate: '', status: 'submitted' },
    { title: 'Focused Organization Sept 22', dueDate: '', status: 'submitted' },
    { title: 'Focused Organization for Sept 15', dueDate: '', status: 'submitted' },
    { title: 'Focused Organization for Aug 25th', dueDate: '', status: 'pending' },
    { title: 'Focused Organization Sheet', dueDate: '', status: 'pending' },
    { title: 'Be Well', dueDate: '', status: 'submitted' },
    { title: 'AI Literacy', dueDate: 'Oct 31, 2025', status: 'pending' },
    { title: 'Be Well-Understanding One\'s Emotions', dueDate: '', status: 'pending' },
    { title: 'Sunnybrook park clean up - March 14th', dueDate: '', status: 'pending' },
    { title: 'Community Engagement Portfolio', dueDate: 'May 15', status: 'pending' },
    { title: 'Volunteer for the Lunar New Year Fair - Feb 19th', dueDate: '', status: 'submitted' },
    { title: 'CE portfolio - 2 engagement reflections', dueDate: 'Jan 23', status: 'pending' },
    { title: 'MLK day - Jan 19th', dueDate: '', status: 'submitted' },
    { title: 'CE portfolio: slides #8, 9, 10', dueDate: 'Oct 31, 2025', status: 'pending' },
    { title: 'German Christmas Market - December 6th', dueDate: '', status: 'pending' },
    { title: 'AIS Spirit service', dueDate: '', status: 'pending' },
    { title: 'Worldfest volunteer sign up', dueDate: '', status: 'pending' },
    { title: 'Campus steward program', dueDate: '', status: 'pending' }
  ]},
  { course: 'E 7th Math', id: 'NzkxNzEzMzY5OTgx', assignments: [
    { title: 'Pi Day Project - Criteria C/D Summative', dueDate: 'Mar 13', status: 'pending' },
    { title: '7B.18 Homework', dueDate: 'Feb 15', status: 'pending' },
    { title: '7B.16 and 7B.17 Homework', dueDate: 'Feb 15', status: 'pending' },
    { title: 'Criteria A Summative', dueDate: 'Feb 19', status: 'pending' },
    { title: '7B.16 Homework', dueDate: 'Feb 8', status: 'pending' },
    { title: '7B.15 Homework', dueDate: 'Feb 8', status: 'pending' },
    { title: '7A.20 Homework', dueDate: 'Nov 2, 2025', status: 'submitted' },
    { title: 'Criteria A/C Summative', dueDate: 'Nov 4, 2025', status: 'pending' },
    { title: '7A.19 Homework', dueDate: 'Oct 26, 2025', status: 'pending' },
    { title: '7A.18 Homework', dueDate: 'Oct 26, 2025', status: 'submitted' },
    { title: '7A.17 Homework', dueDate: 'Oct 26, 2025', status: 'pending' }
  ]},
  { course: '7G PE', id: 'NzkxNjg2NTU4NDY5', assignments: [
    { title: 'Afro Beats dance reflection', dueDate: 'Mar 9', status: 'submitted' },
    { title: 'Add your music here (create a google doc then provide a link)', dueDate: 'Feb 20', status: 'submitted' },
    { title: 'Summative Performance on this day!', dueDate: 'Feb 25', status: 'pending' },
    { title: 'Complete this group/partners request form by next class', dueDate: 'Feb 2', status: 'pending' },
    { title: 'Formative Dance #2', dueDate: '', status: 'submitted' },
    { title: 'Formative task: Discovering different types of African dances', dueDate: 'Jan 28', status: 'pending' },
    { title: 'Nutritional analysis of a recipe', dueDate: 'Dec 18, 2025', status: 'submitted' },
    { title: 'Fitness day- you need to change out', dueDate: 'Dec 1, 2025', status: 'submitted' },
    { title: 'Bring in a recipe to use for the summative', dueDate: 'Dec 10, 2025', status: 'pending' },
    { title: 'I wonder....', dueDate: 'Dec 8, 2025', status: 'pending' },
    { title: 'Daily Journal for nutrition unit', dueDate: '', status: 'submitted' },
    { title: 'Food label- formative task', dueDate: 'Nov 5, 2025', status: 'pending' },
    { title: 'Basketball coaching plan', dueDate: 'Oct 15, 2025', status: 'submitted' },
    { title: 'Formative practice: creating a basketball coaching plan', dueDate: 'Sep 17, 2025', status: 'pending' },
    { title: 'Checklist to use when submitting your coaching plan', dueDate: 'Oct 15, 2025', status: 'pending' },
    { title: 'Fall Progress reports- how are you doing? (from your perspective)', dueDate: 'Oct 3, 2025', status: 'pending' }
  ]},
  { course: 'GR6 Beginning Band', id: 'NzYxNTg2NzM3MDE2', assignments: [
    { title: 'From Practice to Performance: Reflecting on My Musical Journey', dueDate: 'May 22, 2025', status: 'submitted' },
    { title: 'Teach a Lesson!', dueDate: 'May 6, 2025', status: 'submitted' },
    { title: 'Showcase Your Skills - Instructions here!', dueDate: 'Mar 28, 2025', status: 'pending' }
  ]}
];

// Name mapping from scraped names to database names
const nameMapping = {
  '7th Media and Film': '7th Media and Film',
  'F7 Design': 'F7 Design',
  'Field Trip': 'Field Trip',
  'GR6-8 Middle School Band': 'GR6-8 Middle School Band',
  'A7 Science': 'A7 Science',
  'Theatre': 'Theatre',
  'F7 Product Design': 'F7 Product Design',
  '7D I&S': '7D I&S',
  'CLA Inter Mid B': 'CLA Inter Mid B',
  'C7 English': 'C7 English',
  '7th Grade': '7th Grade',
  'E 7th Math': 'E 7th Math',
  '7G PE': '7G PE',
  'GR6 Beginning Band': 'GR6 Beginning Band'
};

async function saveToDatabase() {
  const client = await pool.connect();
  
  try {
    // Clear existing assignments
    await client.query('DELETE FROM school_assignments');
    console.log('Cleared existing assignments');
    
    let totalAssignments = 0;
    
    for (const courseData of scrapedData) {
      const dbName = nameMapping[courseData.course] || courseData.course;
      
      // Find subject by name
      const subjectResult = await client.query(
        'SELECT id FROM school_subjects WHERE name = $1 OR display_name = $1',
        [dbName]
      );
      
      if (subjectResult.rows.length === 0) {
        console.log('Subject not found:', dbName);
        continue;
      }
      
      const subjectId = subjectResult.rows[0].id;
      
      // Insert assignments
      for (const assignment of courseData.assignments) {
        await client.query(
          'INSERT INTO school_assignments (subject_id, title, status, assignment_type, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) ON CONFLICT DO NOTHING',
          [subjectId, assignment.title, assignment.status, 'other']
        );
        totalAssignments++;
      }
      
      console.log('Inserted ' + courseData.assignments.length + ' assignments for ' + dbName);
    }
    
    console.log('\nTotal assignments saved: ' + totalAssignments);
    
    // Show summary
    const summary = await client.query(
      "SELECT s.display_name, COUNT(a.id) as assignment_count FROM school_subjects s LEFT JOIN school_assignments a ON s.id = a.subject_id GROUP BY s.id, s.display_name ORDER BY s.display_name"
    );
    
    console.log('\n=== Summary by Subject ===');
    summary.rows.forEach(row => {
      console.log(row.display_name + ': ' + row.assignment_count + ' assignments');
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

saveToDatabase();
