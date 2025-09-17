import { BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../src/config/db.js';
import fs from 'fs';
import path from 'path';

// --- Load Configuration ---
const configPath = path.resolve(process.cwd(), 'src/config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// --- Sample Data ---

const courses = [
  { Subject: 'CIS', CourseNumber: 1103, Name: 'Intro to Programming', Credits: 3 },
  { Subject: 'CIS', CourseNumber: 2143, Name: 'Data Structures', Credits: 3, Prerequisites: [{ Subject: 'CIS', CourseNumber: 1103 }] },
  { Subject: 'CIS', CourseNumber: 2703, Name: 'Web Development I', Credits: 3 },
  { Subject: 'CIS', CourseNumber: 3023, Name: 'Advanced Java', Credits: 3 },
  { Subject: 'MATH', CourseNumber: 1003, Name: 'College Algebra', Credits: 3 },
  { Subject: 'MATH', CourseNumber: 2703, Name: 'Calculus I', Credits: 4, Prerequisites: [{ Subject: 'MATH', CourseNumber: 1003 }] },
  { Subject: 'ENGL', CourseNumber: 1113, Name: 'Composition I', Credits: 3 },
];

const degreeRequirements = [
  {
    MajorCode: 'CIS',
    RequirementType: 'CORE',
    Courses: [
      { Subject: 'CIS', CourseNumber: 1103 },
      { Subject: 'CIS', CourseNumber: 2143 },
      { Subject: 'CIS', CourseNumber: 2703 },
    ],
    TotalCreditsRequired: 42,
  },
  {
    MajorCode: 'PSYC',
    RequirementType: 'CORE',
    Courses: [
      { Subject: 'PSYC', CourseNumber: 1001 },
      { Subject: 'PSYC', CourseNumber: 2053 },
    ],
  },
  {
    MajorCode: 'CIS',
    RequirementType: 'ELECTIVES',
    MinCredits: 9,
    AllowedSubjects: ['CIS'],
    Restrictions: ['Must be 3000+ level'],
  },
  {
    MajorCode: 'MATH',
    RequirementType: 'CORE',
    Courses: [
      { Subject: 'MATH', CourseNumber: 1003 },
      { Subject: 'MATH', CourseNumber: 2703 },
    ],
  },
];

const students = [
  {
    StudentId: 1001,
    FirstName: 'Alice',
    LastName: 'Smith',
    Major: ['CIS'],
    CompletedCourses: [
      { Subject: 'CIS', CourseNumber: 1103, Grade: 4.0 },
      { Subject: 'ENGL', CourseNumber: 1113, Grade: 3.0 },
    ],
  },
  {
    StudentId: 1002,
    FirstName: 'Bob',
    LastName: 'Johnson',
    Major: ['CIS'],
    CompletedCourses: [
      { Subject: 'CIS', CourseNumber: 1103, Grade: 3.0 },
      { Subject: 'CIS', CourseNumber: 2143, Grade: 4.0 },
      { Subject: 'CIS', CourseNumber: 3023, Grade: 3.0 },
      { Subject: 'MATH', CourseNumber: 1003, Grade: 2.0 },
    ],
    Overrides: [
        {
            SubThis: { Subject: 'CIS', Course: 2703 },
            SubFor: [{ Subject: 'ART', Course: 1013 }],
        }
    ]
  },
];

// --- Seeding Logic ---

/**
 * Formats data for the BatchWriteCommand by wrapping each item
 * with a PutRequest.
 * @param {Array<object>} items - The array of items to format.
 * @returns {Array<object>} The formatted request items.
 */
const formatBatchWriteItems = (items) => {
  return items.map(item => ({
    PutRequest: {
      Item: item,
    },
  }));
};

/**
 * Main function to seed the database.
 */
const seedDatabase = async () => {
  console.log('Starting database seeding...');

  const params = {
    RequestItems: {
      [config.db_tables.courses]: formatBatchWriteItems(courses),
      [config.db_tables.degree_reqs]: formatBatchWriteItems(degreeRequirements),
      [config.db_tables.students]: formatBatchWriteItems(students),
    },
  };

  try {
    await docClient.send(new BatchWriteCommand(params));
    console.log('Success! All tables have been seeded with dummy data.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

// Run the seed script
seedDatabase();