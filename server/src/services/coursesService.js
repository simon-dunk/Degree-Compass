import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../config/db.js';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'src/config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const tableName = config.db_tables.courses;

/**
 * Fetches a single course's details from DynamoDB.
 * @param {string} subject - The subject of the course (e.g., 'CIS').
 * @param {number} courseNumber - The course number.
 * @returns {Promise<object|null>} The course item, or null if not found.
 */
export const getCourseByKey = async (subject, courseNumber) => {
  const params = {
    TableName: tableName,
    Key: {
      Subject: subject,
      CourseNumber: courseNumber,
    },
  };
  try {
    const command = new GetCommand(params);
    const { Item } = await docClient.send(command);
    return Item || null;
  } catch (error) {
    console.error(`DynamoDB Error getting course ${subject} ${courseNumber}:`, error);
    throw new Error('Could not fetch course from database.');
  }
};