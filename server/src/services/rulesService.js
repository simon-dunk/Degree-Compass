import { QueryCommand, PutCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'; // <-- FIXED: Added ScanCommand
import { docClient } from '../config/db.js';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'src/config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const tableName = config.db_tables.degree_reqs;

/**
 * Fetches all degree requirement rules for a specific major from DynamoDB.
 * @param {string} majorCode - The code for the major (e.g., 'CIS').
 * @returns {Promise<Object[]>} A promise that resolves to the array of rules.
 */
export const getRulesByMajor = async (majorCode) => {
  const params = {
    TableName: tableName,
    KeyConditionExpression: 'MajorCode = :majorCode',
    ExpressionAttributeValues: {
      ':majorCode': majorCode,
    },
  };
  try {
    const command = new QueryCommand(params);
    const { Items } = await docClient.send(command);
    return Items || [];
  } catch (error) {
    console.error('DynamoDB Error getting rules:', error);
    throw new Error('Could not fetch rules from database.');
  }
};

/**
 * Creates or replaces a degree rule in the database.
 * @param {object} ruleData - The complete rule object. Must include MajorCode and RequirementType.
 * @returns {Promise<object>} The rule data that was saved.
 */
export const createOrUpdateRule = async (ruleData) => {
  const params = {
    TableName: tableName,
    Item: ruleData,
  };
  try {
    const command = new PutCommand(params);
    await docClient.send(command);
    return ruleData;
  } catch (error) {
    console.error('DynamoDB Error creating rule:', error);
    throw new Error('Could not create rule in database.');
  }
};

/**
 * Deletes a specific degree rule from the database.
 * @param {string} majorCode - The partition key for the rule.
 * @param {string} requirementType - The sort key for the rule.
 * @returns {Promise<object>} A confirmation object.
 */
export const deleteRule = async (majorCode, requirementType) => {
  const params = {
    TableName: tableName,
    Key: {
      MajorCode: majorCode,
      RequirementType: requirementType,
    },
  };
  try {
    const command = new DeleteCommand(params);
    await docClient.send(command);
    return { message: `Rule ${requirementType} for ${majorCode} deleted successfully.` };
  } catch (error) {
    console.error('DynamoDB Error deleting rule:', error);
    throw new Error('Could not delete rule from database.');
  }
};

/**
 * Scans the DegreeRequirements table to get a list of all unique MajorCodes.
 * @returns {Promise<string[]>} A promise that resolves to an array of unique major codes.
 */
export const getAllMajors = async () => {
  const params = {
    TableName: tableName,
    ProjectionExpression: 'MajorCode',
  };
  try {
    const command = new ScanCommand(params);
    const { Items } = await docClient.send(command);
    const uniqueMajors = [...new Set(Items.map(item => item.MajorCode))];
    return uniqueMajors.sort();
  } catch (error) {
    console.error('DynamoDB Error getting all majors:', error);
    throw new Error('Could not fetch list of majors from database.');
  }
};