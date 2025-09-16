// A real application would use a library like Axios, but fetch is fine for this example.
const API_BASE_URL = 'http://localhost:5050/api'; // Adjust port if your server runs elsewhere

/**
 * Fetches all degree requirement rules for a specific major.
 * @param {string} majorCode - The code for the major (e.g., 'CIS').
 * @returns {Promise<Object[]>} A promise that resolves to the array of rules.
 */
export const fetchDegreeRules = async (majorCode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/rules/${majorCode}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch degree rules for ${majorCode}:`, error);
    // In a real app, you'd have more robust error handling.
    return [];
  }
};

// You would add functions for create, update, and delete here as well.
/*
  export const saveDegreeRule = async (majorCode, ruleData) => { ... };
*/