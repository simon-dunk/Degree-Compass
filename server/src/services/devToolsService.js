import { ScanCommand, PutCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../config/db.js';

const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};

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
 * Inserts or updates a batch of courses into the CourseDatabase.
 * @param {Array<object>} courses - An array of course objects.
 * @returns {Promise<object>} A confirmation message.
 */
export const bulkInsertCourses = async (courses) => {
  const putRequests = courses.map(course => ({
    PutRequest: {
      Item: course,
    },
  }));

  const chunks = chunkArray(putRequests, 25); // DynamoDB BatchWrite limit is 25 items per request
  
  try {
    for (const chunk of chunks) {
      const params = {
        RequestItems: {
          'CourseDatabase': chunk,
        },
      };
      await docClient.send(new BatchWriteCommand(params));
    }
    return { message: `Successfully uploaded ${courses.length} courses.` };
  } catch (error) {
    console.error('DynamoDB Error during bulk course insert:', error);
    throw new Error('Could not insert courses into database.');
  }
};