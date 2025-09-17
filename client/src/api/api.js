const API_BASE_URL = 'http://localhost:5050/api';

/**
 * A helper function for handling API requests and errors.
 * @param {string} url - The URL to fetch.
 * @param {object} options - The options for the fetch request.
 * @returns {Promise<any>} The JSON response from the API.
 */
export const apiRequest = async (url, options = {}) => {
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

/**
 * Fetches a single student by their ID.
 * @param {string} studentId - The ID of the student to fetch.
 * @returns {Promise<object>} A promise that resolves to the student object.
 */
export const fetchStudentById = (studentId) => {
  return apiRequest(`${API_BASE_URL}/students/${studentId}`);
};

/**
 * Adds a new override to a student's record.
 * @param {string} studentId - The ID of the student.
 * @param {object} overrideData - The override object to add.
 * @returns {Promise<object>} The server's confirmation response.
 */
export const addStudentOverride = (studentId, overrideData) => {
  return apiRequest(`${API_BASE_URL}/students/${studentId}/overrides`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(overrideData),
  });
};

/**
 * Deletes a specific override from a student's record.
 * @param {string} studentId - The ID of the student.
 * @param {number} overrideIndex - The index of the override to delete.
 * @returns {Promise<object>} The server's confirmation response.
 */
export const deleteStudentOverride = (studentId, overrideIndex) => {
  return apiRequest(`${API_BASE_URL}/students/${studentId}/overrides/${overrideIndex}`, {
    method: 'DELETE',
  });
};

/**
 * Fetches a degree audit report for a specific student.
 * @param {string} studentId - The ID of the student to audit.
 * @returns {Promise<object>} A promise that resolves to the audit report.
 */
export const fetchAuditReport = (studentId) => {
  return apiRequest(`${API_BASE_URL}/audit/${studentId}`);
};

/**
 * Fetches a list of all students.
 * @returns {Promise<object[]>} A promise that resolves to an array of student objects.
 */
export const fetchAllStudents = () => {
  return apiRequest(`${API_BASE_URL}/students`);
};

/**
 * Requests a generated degree plan for a specific student.
 * @param {string} studentId - The ID of the student.
 * @param {Array<object>} [pinnedCourses=[]] - Optional list of courses to prioritize.
 * @returns {Promise<object>} A promise that resolves to the generated plan.
 */
export const generatePlan = (studentId, pinnedCourses = []) => {
  return apiRequest(`${API_BASE_URL}/planner/generate/${studentId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pinnedCourses }),
  });
};

export const fetchAllCourses = () => {
  return apiRequest(`${API_BASE_URL}/courses`);
};