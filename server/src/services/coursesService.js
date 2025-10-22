import { ScanCommand, GetCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../config/db.js';
import fs from 'fs';
import path from 'path';

// --- Helper function to chunk arrays ---
const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

// --- Configuration Loading (remains the same) ---
const configPath = path.resolve(process.cwd(), 'src/config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const tableName = config.db_tables.courses;

/**
 * --- UPDATED FUNCTION ---
 * Fetches details for multiple courses using BatchGetCommand, handling the 100-item limit.
 * @param {Array<object>} courseKeys - An array of key objects (e.g., [{ Subject: 'CS', CourseNumber: 101 }]).
 * @returns {Promise<Array<object>>} A promise that resolves to an array of course items.
 */
export const getCoursesByKeys = async (courseKeys) => {
  if (!courseKeys || courseKeys.length === 0) {
    return [];
  }

  // --- START FIX: Chunking Logic ---
  const keyChunks = chunkArray(courseKeys, 100); // Split keys into chunks of 100
  let allResponses = [];

  for (const chunk of keyChunks) {
    const params = {
      RequestItems: {
        [tableName]: {
          Keys: chunk, // Use the current chunk of keys
        },
      },
    };
    try {
      const command = new BatchGetCommand(params);
      const { Responses, UnprocessedKeys } = await docClient.send(command);

      if (Responses && Responses[tableName]) {
        allResponses = allResponses.concat(Responses[tableName]);
      }

      // Basic handling for unprocessed keys (optional, but good practice)
      if (UnprocessedKeys && UnprocessedKeys[tableName] && UnprocessedKeys[tableName].Keys.length > 0) {
        console.warn(`DynamoDB BatchGet left ${UnprocessedKeys[tableName].Keys.length} unprocessed keys for table ${tableName}. Consider implementing retry logic.`);
        // You could potentially retry fetching the UnprocessedKeys here
      }

    } catch (error) {
      console.error(`DynamoDB Error getting courses chunk:`, error);
      // Decide if you want to throw immediately or try other chunks
      // For simplicity, we'll throw here. A more robust solution might collect all errors.
      throw new Error(`Could not fetch courses chunk from database. Error: ${error.message}`);
    }
  }
  // --- END FIX ---

  return allResponses; // Return combined results from all chunks
};


/**
 * Fetches a single course's details from DynamoDB. (remains the same)
 * @param {string} subject - The subject of the course (e.g., 'CIS').
 * @param {number} courseNumber - The course number.
 * @returns {Promise<object|null>} The course item, or null if not found.
 */
export const getCourseByKey = async (subject, courseNumber) => {
  // Ensure CourseNumber is a number if your table uses Number type
  const numCourseNumber = typeof courseNumber === 'string' ? parseInt(courseNumber, 10) : courseNumber;
  if (isNaN(numCourseNumber)) {
      console.error(`Invalid CourseNumber provided to getCourseByKey: ${courseNumber}`);
      return null; // Or throw an error
  }

  const params = {
    TableName: tableName,
    Key: {
      Subject: subject,
      CourseNumber: numCourseNumber,
    },
  };
  try {
    const command = new GetCommand(params);
    const { Item } = await docClient.send(command);
    return Item || null;
  } catch (error) {
    console.error(`DynamoDB Error getting course ${subject} ${numCourseNumber}:`, error);
    throw new Error(`Could not fetch course ${subject} ${numCourseNumber} from database.`);
  }
};

/**
 * Scans the CourseDatabase table to get a list of all courses. (remains the same)
 * @param {object} filters - An object containing filter criteria.
 * @returns {Promise<object[]>} A promise that resolves to an array of course items.
 */
export const getAllCourses = async (filters = {}) => {
  const params = { TableName: tableName };
  let allItems = [];
  let ExclusiveStartKey;

  try {
    do {
        params.ExclusiveStartKey = ExclusiveStartKey;
        const command = new ScanCommand(params);
        const { Items, LastEvaluatedKey } = await docClient.send(command);
        if (Items) {
            allItems = allItems.concat(Items);
        }
        ExclusiveStartKey = LastEvaluatedKey;
    } while (ExclusiveStartKey);

    let filteredItems = allItems;

    // Apply filters
    if (filters.subject) {
      filteredItems = filteredItems.filter(course => course.Subject?.toUpperCase().includes(filters.subject.toUpperCase()));
    }
    if (filters.courseNumber) {
      filteredItems = filteredItems.filter(course => String(course.CourseNumber).includes(filters.courseNumber));
    }
    if (filters.title) {
        filteredItems = filteredItems.filter(course => course.Name?.toLowerCase().includes(filters.title.toLowerCase()));
    }
    if (filters.credits) {
      filteredItems = filteredItems.filter(course => String(course.Credits) === filters.credits);
    }
    if (filters.days) {
        filteredItems = filteredItems.filter(course => course.Schedule?.Days && filters.days.split('').every(day => course.Schedule.Days.includes(day)));
    }
    if (filters.startTime) {
        // Ensure times are comparable strings "HH:MM"
        filteredItems = filteredItems.filter(course => course.Schedule?.StartTime && course.Schedule.StartTime >= filters.startTime);
    }
    if (filters.endTime) {
        filteredItems = filteredItems.filter(course => course.Schedule?.EndTime && course.Schedule.EndTime <= filters.endTime);
    }
    if (filters.instructor) {
        filteredItems = filteredItems.filter(course => course.Instructor?.toLowerCase().includes(filters.instructor.toLowerCase()));
    }

    return filteredItems.sort((a, b) => {
        if (a.Subject < b.Subject) return -1;
        if (a.Subject > b.Subject) return 1;
        return (a.CourseNumber || 0) - (b.CourseNumber || 0); // Handle potential missing CourseNumber
    });
  } catch (error) {
    console.error('DynamoDB Error getting all courses:', error);
    throw new Error('Could not fetch list of courses from database.');
  }
};