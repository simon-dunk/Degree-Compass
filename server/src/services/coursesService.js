import { ScanCommand, GetCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb'; // Import BatchGetCommand
import { docClient } from '../config/db.js';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'src/config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const tableName = config.db_tables.courses;

/**
 * --- NEW FUNCTION ---
 * Fetches details for multiple courses using a more efficient BatchGetCommand.
 * @param {Array<object>} courseKeys - An array of key objects (e.g., [{ Subject: 'CS', CourseNumber: 101 }]).
 * @returns {Promise<Array<object>>} A promise that resolves to an array of course items.
 */
export const getCoursesByKeys = async (courseKeys) => {
  if (!courseKeys || courseKeys.length === 0) {
    return [];
  }
  const params = {
    RequestItems: {
      [tableName]: {
        Keys: courseKeys,
      },
    },
  };
  try {
    const command = new BatchGetCommand(params);
    const { Responses } = await docClient.send(command);
    return Responses[tableName] || [];
  } catch (error) {
    console.error(`DynamoDB Error getting courses by keys:`, error);
    throw new Error('Could not fetch courses from database.');
  }
};


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

/**
 * Scans the CourseDatabase table to get a list of all courses.
 * @param {object} filters - An object containing filter criteria.
 * @returns {Promise<object[]>} A promise that resolves to an array of course items.
 */
export const getAllCourses = async (filters = {}) => {
  const params = { TableName: tableName };
  try {
    const command = new ScanCommand(params);
    let { Items } = await docClient.send(command);

    if (filters.subject) {
      Items = Items.filter(course => course.Subject.includes(filters.subject));
    }
    if (filters.courseNumber) {
      Items = Items.filter(course => String(course.CourseNumber).includes(filters.courseNumber));
    }
    if (filters.title) {
        Items = Items.filter(course => course.Name.toLowerCase().includes(filters.title.toLowerCase()));
    }
    if (filters.credits) {
      Items = Items.filter(course => String(course.Credits) === filters.credits);
    }
    if (filters.days) {
        Items = Items.filter(course => course.Schedule && filters.days.split('').every(day => course.Schedule.Days.includes(day)));
    }
    if (filters.startTime) {
        Items = Items.filter(course => course.Schedule && course.Schedule.StartTime >= filters.startTime);
    }
    if (filters.endTime) {
        Items = Items.filter(course => course.Schedule && course.Schedule.EndTime <= filters.endTime);
    }
    if (filters.instructor) {
        Items = Items.filter(course => course.Instructor && course.Instructor.toLowerCase().includes(filters.instructor.toLowerCase()));
    }


    return (Items || []).sort((a, b) => a.CourseNumber - b.CourseNumber);
  } catch (error) {
    console.error('DynamoDB Error getting all courses:', error);
    throw new Error('Could not fetch list of courses from database.');
  }
};