/**
 * Defines the structure, primary keys, and field types for each DynamoDB table.
 * This is used by the DevToolsPage to dynamically render tables and forms.
 */

export const tableSchemas = {
  CourseDatabase: {
    tableName: 'CourseDatabase',
    primaryKey: ['Subject', 'CourseNumber'],
    getKey: (item) => ({ Subject: item.Subject, CourseNumber: item.CourseNumber }),
    fields: [
      { key: 'Subject', label: 'Subject', type: 'text', readOnly: false },
      { key: 'CourseNumber', label: 'Course Number', type: 'number', readOnly: false },
      { key: 'Name', label: 'Course Name', type: 'text', readOnly: false },
      { key: 'Credits', label: 'Credits', type: 'number', readOnly: false },
      { key: 'Prerequisites', label: 'Prerequisites', type: 'textarea', readOnly: true }, // ReadOnly in main form, handled separately
    ],
  },
  StudentDatabase: {
    tableName: 'StudentDatabase',
    primaryKey: ['StudentId'],
    getKey: (item) => ({ StudentId: item.StudentId }),
    fields: [
      { key: 'StudentId', label: 'Student ID', type: 'number', readOnly: false },
      { key: 'FirstName', label: 'First Name', type: 'text', readOnly: false },
      { key: 'LastName', label: 'Last Name', type: 'text', readOnly: false },
      { key: 'Major', label: 'Major(s)', type: 'text', readOnly: false },
    ],
  },
  DegreeRequirements: {
    tableName: 'DegreeRequirements',
    primaryKey: ['MajorCode', 'RequirementType'],
    getKey: (item) => ({ MajorCode: item.MajorCode, RequirementType: item.RequirementType }),
    fields: [
      { key: 'MajorCode', label: 'Major Code', type: 'text', readOnly: false },
      { key: 'RequirementType', label: 'Requirement Type', type: 'text', readOnly: false },
      { key: 'TotalCreditsRequired', label: 'Total Credits', type: 'number', readOnly: false },
      { key: 'MinCredits', label: 'Min Elective Credits', type: 'number', readOnly: false },
    ],
  },
};