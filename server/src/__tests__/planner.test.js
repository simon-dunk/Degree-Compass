import request from 'supertest';
import app from '../app.js';
import { docClient } from '../config/db.js';
import { BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

// --- Test Data ---
const apiBaseUrl = '/api/planner';

const testCourses = [
  { Subject: 'CS', CourseNumber: 101, Name: 'Intro to CS', Credits: 3 },
  { Subject: 'CS', CourseNumber: 201, Name: 'Data Structures', Credits: 3, Prerequisites: [{ Subject: 'CS', CourseNumber: 101 }] },
];

const testStudent = {
  StudentId: 3001,
  Major: ['CS'],
  CompletedCourses: [], // This student has completed no courses yet
};

const testRule = { MajorCode: 'CS', RequirementType: 'CORE', Courses: [ { Subject: 'CS', CourseNumber: 101 }, { Subject: 'CS', CourseNumber: 201 }]};

// --- Test Suite ---
describe('Plan Generator API', () => {

  // Before all tests, seed the DB with our specific test data
  beforeAll(async () => {
    const params = {
      RequestItems: {
        'StudentDatabase': [{ PutRequest: { Item: testStudent } }],
        'DegreeRequirements': [{ PutRequest: { Item: testRule } }],
        'CourseDatabase': testCourses.map(Item => ({ PutRequest: { Item } })),
      },
    };
    await docClient.send(new BatchWriteCommand(params));
  });

  // After all tests, clean up the data we created
  afterAll(async () => {
    const params = {
        RequestItems: {
          'StudentDatabase': [{ DeleteRequest: { Key: { StudentId: testStudent.StudentId } } }],
          'DegreeRequirements': [{ DeleteRequest: { Key: { MajorCode: testRule.MajorCode, RequirementType: testRule.RequirementType } } }],
          'CourseDatabase': testCourses.map(c => ({ DeleteRequest: { Key: { Subject: c.Subject, CourseNumber: c.CourseNumber } } })),
        },
      };
    await docClient.send(new BatchWriteCommand(params));
  });

  // Main Test Case
  it('should generate a valid, multi-semester plan respecting prerequisites', async () => {
    const response = await request(app)
      .post(`${apiBaseUrl}/generate/${testStudent.StudentId}`)
      .send({}); // Send empty body

    expect(response.statusCode).toBe(200);

    const plan = response.body;
    expect(plan.length).toBe(2); // Should take 2 semesters

    // VERIFY: The first semester should contain the course with no prerequisites
    const semester1Courses = plan[0].courses.map(c => c.CourseNumber);
    expect(semester1Courses).toContain(101);
    expect(semester1Courses).not.toContain(201);
    
    // VERIFY: The second semester should contain the course that depends on the first
    const semester2Courses = plan[1].courses.map(c => c.CourseNumber);
    expect(semester2Courses).toContain(201);
  });
});