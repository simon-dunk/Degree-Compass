import request from 'supertest';
import app from '../app.js';
import { docClient } from '../config/db.js';
import { BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

// --- Test Data ---
const apiBaseUrl = '/api/audit';

const testCourses = [
  { Subject: 'CS', CourseNumber: 101, Name: 'Intro to CS' },
  { Subject: 'CS', CourseNumber: 201, Name: 'Data Structures', Prerequisites: [{ Subject: 'CS', CourseNumber: 101 }] },
  { Subject: 'CS', CourseNumber: 301, Name: 'Algorithms', Prerequisites: [{ Subject: 'CS', CourseNumber: 201 }] },
];

const testStudent = {
  StudentId: 2001,
  Major: ['CS'],
  CompletedCourses: [{ Subject: 'CS', CourseNumber: 101, Grade: 4.0 }], // Has completed the first course
};

const testRules = [
  { MajorCode: 'CS', RequirementType: 'CORE', Courses: [ { Subject: 'CS', CourseNumber: 101 }, { Subject: 'CS', CourseNumber: 201 }, { Subject: 'CS', CourseNumber: 301 } ]},
];

// --- Test Suite ---
describe('Degree Audit API with Prerequisite Logic', () => {

  // Before all tests, seed the DB with our specific test data
  beforeAll(async () => {
    const studentPut = [{ PutRequest: { Item: testStudent } }];
    const rulePut = testRules.map(Item => ({ PutRequest: { Item } }));
    const coursePut = testCourses.map(Item => ({ PutRequest: { Item } }));
    
    const params = {
      RequestItems: {
        'StudentDatabase': studentPut,
        'DegreeRequirements': rulePut,
        'CourseDatabase': coursePut,
      },
    };
    await docClient.send(new BatchWriteCommand(params));
  });

  // After all tests, clean up the data we created
  afterAll(async () => {
    const studentDelete = [{ DeleteRequest: { Key: { StudentId: testStudent.StudentId } } }];
    const ruleDelete = testRules.map(r => ({ DeleteRequest: { Key: { MajorCode: r.MajorCode, RequirementType: r.RequirementType } } }));
    const courseDelete = testCourses.map(c => ({ DeleteRequest: { Key: { Subject: c.Subject, CourseNumber: c.CourseNumber } } }));

    const params = {
        RequestItems: {
          'StudentDatabase': studentDelete,
          'DegreeRequirements': ruleDelete,
          'CourseDatabase': courseDelete,
        },
      };
    await docClient.send(new BatchWriteCommand(params));
  });

  // Main Test Case
  it('should correctly identify eligible next courses based on prerequisites', async () => {
    const response = await request(app).get(`${apiBaseUrl}/${testStudent.StudentId}`);

    expect(response.statusCode).toBe(200);

    const report = response.body;
    expect(report.eligibleNextCourses).toBeDefined();

    const eligibleCourseNumbers = report.eligibleNextCourses.map(c => c.CourseNumber);
    
    // The student has taken CS 101.
    // They still need CS 201 and CS 301.
    // The prerequisite for CS 201 is CS 101 (which they have).
    // The prerequisite for CS 301 is CS 201 (which they do NOT have).
    
    // VERIFY: The student should be eligible for CS 201.
    expect(eligibleCourseNumbers).toContain(201);

    // VERIFY: The student should NOT be eligible for CS 301 yet.
    expect(eligibleCourseNumbers).not.toContain(301);
  });
});