import request from 'supertest';
import app from '../app.js'; // Import your express app

// The base URL for our rules API
const apiBaseUrl = '/api/rules';

// Test data that we will use for our tests
const testRule = {
  MajorCode: 'TEST',
  RequirementType: 'CORE',
  Courses: [{ Subject: 'TEST', CourseNumber: '101', Credits: 3 }],
  TotalCreditsRequired: 3,
};

describe('Degree Rules API', () => {

  // Test Case 1: Create a new degree rule
  it('should create a new degree rule via POST', async () => {
    const response = await request(app)
      .post(apiBaseUrl)
      .send(testRule);

    // Assertions
    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe('Rule created/updated successfully');
    expect(response.body.rule).toEqual(testRule);
  });

  // Test Case 2: Retrieve the newly created rule
  it('should retrieve the rules for the TEST major via GET', async () => {
    const response = await request(app).get(`${apiBaseUrl}/${testRule.MajorCode}`);

    // Assertions
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toEqual(testRule);
  });

  // Test Case 3: Clean up by deleting the test rule
  it('should delete the test degree rule via DELETE', async () => {
    const response = await request(app)
      .delete(`${apiBaseUrl}/${testRule.MajorCode}/${testRule.RequirementType}`);

    // Assertions
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe(`Rule ${testRule.RequirementType} for ${testRule.MajorCode} deleted successfully.`);
  });

  // Test Case 4: Verify the rule is gone
  it('should return 404 after a rule has been deleted', async () => {
    const response = await request(app).get(`${apiBaseUrl}/${testRule.MajorCode}`);

    // Assertions
    expect(response.statusCode).toBe(404);
  });
});