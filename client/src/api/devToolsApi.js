import { apiRequest } from './api.js';

const DEV_API_URL = 'http://localhost:5050/api/dev';

export const fetchTableContents = (tableName) => {
  return apiRequest(`${DEV_API_URL}/table/${tableName}`);
};

export const upsertItem = (tableName, item) => {
  return apiRequest(`${DEV_API_URL}/item`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tableName, item }),
  });
};

export const deleteItem = (tableName, key) => {
  return apiRequest(`${DEV_API_URL}/item`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tableName, key }),
  });
};

export const generateMassData = () => {
  return apiRequest(`${DEV_API_URL}/generate-mass-data`, {
    method: 'POST',
  });
};

/**
 * Uploads an array of course objects to be batch-inserted into the database.
 * @param {Array<object>} courses - The array of courses to upload.
 * @returns {Promise<object>} The server's confirmation response.
 */
export const uploadCourses = (courses) => {
  return apiRequest(`${DEV_API_URL}/courses/bulk-upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courses }),
  });
};