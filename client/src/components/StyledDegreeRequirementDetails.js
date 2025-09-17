import React from 'react';

const StyledDegreeRequirementDetails = ({ rule }) => {
  if (!rule) return null;

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <h4 style={styles.h4}>Summary</h4>
        <p><strong>Major:</strong> {rule.MajorCode}</p>
        <p><strong>Requirement Type:</strong> {rule.RequirementType}</p>
      </div>

      {rule.Courses && (
        <div style={styles.section}>
          <h4 style={styles.h4}>Required Courses ({rule.Courses.length})</h4>
          <ul style={styles.courseList}>
            {rule.Courses.map((course, i) => (
              <li key={i}>{course.Subject} {course.CourseNumber}</li>
            ))}
          </ul>
        </div>
      )}
      
      {rule.MinCredits && (
        <div style={styles.section}>
          <h4 style={styles.h4}>Elective Details</h4>
          <p><strong>Minimum Credits:</strong> {rule.MinCredits}</p>
          {rule.AllowedSubjects && <p><strong>Allowed Subjects:</strong> {rule.AllowedSubjects.join(', ')}</p>}
          {rule.Restrictions && <p><strong>Restrictions:</strong> {rule.Restrictions.join(', ')}</p>}
        </div>
      )}
    </div>
  );
};

// --- STYLES ---
const styles = {
    container: { fontFamily: 'sans-serif', color: '#333' },
    section: { marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' },
    h4: { marginTop: 0, marginBottom: '0.5rem', color: '#005826' },
    courseList: {
        listStyle: 'none', padding: 0, columnCount: 2,
        '@media (maxWidth: 600px)': { columnCount: 1 }
    }
};

export default StyledDegreeRequirementDetails;