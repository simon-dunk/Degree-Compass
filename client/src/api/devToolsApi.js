// client/src/api/devToolsApi.js

import { apiRequest } from './api.js'; // <-- CORRECTED IMPORT

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