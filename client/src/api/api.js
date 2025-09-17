const API_BASE_URL = 'http://localhost:5050/api';

/**
 * A helper function for handling API requests and errors.
 * @param {string} url - The URL to fetch.
 * @param {object} options - The options for the fetch request.
 * @returns {Promise<any>} The JSON response from the API.
 */
const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(errorBody.message || `HTTP error! status: ${response.status}`);
    }
    // Return an empty object for 204 No Content responses from DELETE
    if (response.status === 204) return {};
    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error.message);
    throw error; // Re-throw the error to be caught by the component
  }
};

/**
 * Fetches all degree requirement rules for a specific major.
 * @param {string} majorCode - The code for the major (e.g., 'CIS').
 * @returns {Promise<Object[]>} A promise that resolves to the array of rules.
 */
export const fetchDegreeRules = (majorCode) => {
  return apiRequest(`${API_BASE_URL}/rules/${majorCode}`);
};

/**
 * Creates or updates a degree rule.
 * @param {object} ruleData - The rule object to be saved.
 * @returns {Promise<object>} The server's confirmation response.
 */
export const createOrUpdateRule = (ruleData) => {
  return apiRequest(`${API_BASE_URL}/rules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(ruleData),
  });
};

/**
 * Deletes a specific degree rule.
 * @param {string} majorCode - The MajorCode of the rule to delete.
 * @param {string} requirementType - The RequirementType of the rule to delete.
 * @returns {Promise<object>} The server's confirmation response.
 */
export const deleteRule = (majorCode, requirementType) => {
  return apiRequest(`${API_BASE_URL}/rules/${majorCode}/${requirementType}`, {
    method: 'DELETE',
  });
};

/**
 * Fetches a list of all unique major codes that have defined rules.
 * @returns {Promise<string[]>} A promise that resolves to an array of major codes.
 */
export const fetchAllMajorCodes = () => {
  return apiRequest(`${API_BASE_URL}/rules/majors/all`);
};