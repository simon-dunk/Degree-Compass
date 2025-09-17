import request from 'supertest';
import app from '../app.js';
import { docClient } from '../config/db.js';
import { PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

// --- Test Setup ---
const apiBaseUrl = '/api/students';

const testStudent = {
  StudentId: 9999, // Using a number to match our schema
  FirstName: 'Test',
  LastName: 'User',
  Major: ['TEST'],
};

const testOverride = {
  SubThis: { Subject: 'TEST', Course: '101' },
  SubFor: [{ Subject: 'TEST', Course: '102' }],
  ApprovedBy: 'jest-test',
};

// --- Test Suite ---
describe('Student Overrides API', () => {
  // Before all tests run, create a temporary student in the database
  beforeAll(async () => {
    const params = {
      TableName: 'StudentDatabase',
      Item: testStudent,
    };
    await docClient.send(new PutCommand(params));
  });

  // After all tests run, delete the temporary student
  afterAll(async () => {
    const params = {
      TableName: 'StudentDatabase',
      Key: { StudentId: testStudent.StudentId },
    };
    await docClient.send(new DeleteCommand(params));
  });

  // Test Case 1: Fetch the student to ensure they exist
  it('should get a student by their ID', async () => {
    const response = await request(app).get(`${apiBaseUrl}/${testStudent.StudentId}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.FirstName).toBe('Test');
  });

  // Test Case 2: Add an override to the student's record
  it('should add an override to a student', async () => {
    const response = await request(app)
      .post(`${apiBaseUrl}/${testStudent.StudentId}/overrides`)
      .send(testOverride);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Override added successfully.');
    
    // Check that the returned student object now contains the override
    const updatedStudent = response.body.student;
    expect(updatedStudent.Overrides).toBeDefined();
    expect(updatedStudent.Overrides.length).toBe(1);
    expect(updatedStudent.Overrides[0].ApprovedBy).toBe('jest-test');
  });
  
  // Test Case 3: Fetch the student again to verify the override was saved
  it('should reflect the new override when fetching the student again', async () => {
    const response = await request(app).get(`${apiBaseUrl}/${testStudent.StudentId}`);

    expect(response.statusCode).toBe(200);
    const student = response.body;
    expect(student.Overrides).toBeDefined();
    expect(student.Overrides.length).toBe(1);
    expect(student.Overrides[0].SubThis.Course).toBe('101');
  });
});