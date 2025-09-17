import { ScanCommand, PutCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../config/db.js';

/**
 * Fetches all items from a specified DynamoDB table.
 * @param {string} tableName - The name of the table to scan.
 * @returns {Promise<Array<object>>} A promise that resolves to the array of items.
 */
export const getTableContents = async (tableName) => {
  const params = { TableName: tableName };
  try {
    const command = new ScanCommand(params);
    const { Items } = await docClient.send(command);
    return Items || [];
  } catch (error) {
    console.error(`DynamoDB Error scanning table ${tableName}:`, error);
    throw new Error(`Could not fetch items from table ${tableName}.`);
  }
};

/**
 * Adds or updates a single item in a specified DynamoDB table.
 * @param {string} tableName - The name of the table.
 * @param {object} item - The item to add or update.
 * @returns {Promise<object>} The item that was saved.
 */
export const putItem = async (tableName, item) => {
  const params = { TableName: tableName, Item: item };
  try {
    const command = new PutCommand(params);
    await docClient.send(command);
    return item;
  } catch (error) {
    console.error(`DynamoDB Error putting item in ${tableName}:`, error);
    throw new Error(`Could not save item in table ${tableName}.`);
  }
};

/**
 * Deletes a single item from a specified DynamoDB table.
 * @param {string} tableName - The name of the table.
 * @param {object} key - The primary key of the item to delete.
 * @returns {Promise<object>} A confirmation message.
 */
export const deleteItem = async (tableName, key) => {
  const params = { TableName: tableName, Key: key };
  try {
    const command = new DeleteCommand(params);
    await docClient.send(command);
    return { message: `Successfully deleted item from ${tableName}.` };
  } catch (error) {
    console.error(`DynamoDB Error deleting item from ${tableName}:`, error);
    throw new Error(`Could not delete item from table ${tableName}.`);
  }
};

/**
 * Generates and seeds a large, realistic dataset for a full CIS degree program.
 * NOTE: This is a placeholder. A real implementation would be much more complex.
 * @returns {Promise<object>} A confirmation message.
 */
export const generateMassiveData = async () => {
    // This is a simplified example. A real one would generate ~40 courses.
    const massCourses = [
        { Subject: 'CS', CourseNumber: 1013, Name: 'Programming I', Credits: 3},
        { Subject: 'CS', CourseNumber: 1023, Name: 'Programming II', Credits: 3, Prerequisites: [{Subject: 'CS', CourseNumber: 1013}]},
        // ... add many more courses
    ];
    const massRules = [
        { MajorCode: 'CS', RequirementType: 'CORE', TotalCreditsRequired: 60, Courses: massCourses.map(c => ({Subject: c.Subject, CourseNumber: c.CourseNumber}))},
        // ... add elective, general ed rules etc.
    ];

    const params = {
        RequestItems: {
            'CourseDatabase': massCourses.map(Item => ({ PutRequest: { Item } })),
            'DegreeRequirements': massRules.map(Item => ({ PutRequest: { Item } })),
        }
    };
    await docClient.send(new BatchWriteCommand(params));
    return { message: `Successfully generated and seeded a full degree program.` };
};