import { GetCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'; 
import { docClient } from '../config/db.js';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'src/config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const tableName = config.db_tables.students;

/**
 * Fetches a single student's record from DynamoDB.
 * @param {string} studentId - The ID of the student to fetch (will be converted to a number).
 * @returns {Promise<object|null>} The student item, or null if not found.
 */
export const getStudentById = async (studentId) => {
  const params = {
    TableName: tableName,
    Key: { StudentId: parseInt(studentId, 10) }, // <-- FIXED: Convert string to number
  };
  try {
    const command = new GetCommand(params);
    const { Item } = await docClient.send(command);
    return Item || null;
  } catch (error) {
    console.error(`DynamoDB Error getting student ${studentId}:`, error);
    throw new Error('Could not fetch student from database.');
  }
};

/**
 * Adds a new override object to a student's Overrides list.
 * @param {string} studentId - The ID of the student to update (will be converted to a number).
 * @param {object} overrideData - The override object to add.
 * @returns {Promise<object>} The updated student item attributes.
 */
export const addOverrideToStudent = async (studentId, overrideData) => {
  const params = {
    TableName: tableName,
    Key: { StudentId: parseInt(studentId, 10) }, // <-- FIXED: Convert string to number
    UpdateExpression: 'SET #overrides = list_append(if_not_exists(#overrides, :empty_list), :new_override)',
    ExpressionAttributeNames: {
      '#overrides': 'Overrides',
    },
    ExpressionAttributeValues: {
      ':new_override': [overrideData],
      ':empty_list': [],
    },
    ReturnValues: 'ALL_NEW',
  };
  try {
    const command = new UpdateCommand(params);
    const { Attributes } = await docClient.send(command);
    return Attributes;
  } catch (error) {
    console.error(`DynamoDB Error adding override to student ${studentId}:`, error);
    throw new Error('Could not add override to student.');
  }
};

/**
 * Removes an override from a student's Overrides list by its index.
 * @param {string} studentId - The ID of the student.
 * @param {number} overrideIndex - The index of the override to remove.
 * @returns {Promise<object>} The updated student item attributes.
 */
export const removeOverrideFromStudent = async (studentId, overrideIndex) => {
  const params = {
    TableName: tableName,
    Key: { StudentId: parseInt(studentId, 10) },
    UpdateExpression: `REMOVE #overrides[${overrideIndex}]`,
    ExpressionAttributeNames: {
      '#overrides': 'Overrides',
    },
    ReturnValues: 'ALL_NEW',
  };
  try {
    const command = new UpdateCommand(params);
    const { Attributes } = await docClient.send(command);
    return Attributes;
  } catch (error) {
    console.error(`DynamoDB Error removing override from student ${studentId}:`, error);
    throw new Error('Could not remove override from student.');
  }
};

/**
 * Scans the StudentDatabase table to get a list of all students.
 * @returns {Promise<object[]>} A promise that resolves to an array of student items.
 */
export const getAllStudents = async () => {
  const params = {
    TableName: tableName,
    // ProjectionExpression can be used to only return specific attributes
    // For now, we get the whole item to display name and ID
    ProjectionExpression: 'StudentId, FirstName, LastName',
  };
  try {
    const command = new ScanCommand(params);
    const { Items } = await docClient.send(command);
    // Sort students by ID
    return (Items || []).sort((a, b) => a.StudentId - b.StudentId);
  } catch (error) {
    console.error('DynamoDB Error getting all students:', error);
    throw new Error('Could not fetch list of students from database.');
  }
};