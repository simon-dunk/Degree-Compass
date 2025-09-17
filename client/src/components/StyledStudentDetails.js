import React from 'react';

const StyledStudentDetails = ({ title, data }) => {
  if (!data || data.length === 0) {
    return <p>No items to display.</p>;
  }

  // Render a specific view for Completed Courses
  if (title === 'Completed Courses') {
    return (
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Course</th>
            <th style={styles.th}>Grade</th>
          </tr>
        </thead>
        <tbody>
          {data.map((course, index) => (
            <tr key={index} style={styles.tr}>
              <td style={styles.td}>{course.Subject} {course.CourseNumber}</td>
              <td style={styles.td}>{course.Grade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // Render a specific view for Overrides
  if (title === 'Overrides') {
    return (
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {data.map((override, index) => (
          <li key={index} style={styles.overrideItem}>
            <strong>Substitute {override.SubThis.Subject} {override.SubThis.Course}</strong>
            <div style={{ marginLeft: '1rem' }}>
              For: {override.SubFor.map(c => `${c.Subject} ${c.Course}`).join(' OR ')}
            </div>
            <small style={{ color: '#6c757d' }}>
              (Approved: {override.ApprovedDate} by {override.ApprovedBy})
            </small>
          </li>
        ))}
      </ul>
    );
  }

  // Fallback for any other data type
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
};

// --- STYLES ---
const styles = {
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
        backgroundColor: '#f7f7f7',
        padding: '10px',
        textAlign: 'left',
        borderBottom: '2px solid #ccc',
    },
    tr: { borderBottom: '1px solid #eee' },
    td: { padding: '10px' },
    overrideItem: {
        padding: '1rem',
        border: '1px solid #eee',
        borderRadius: '5px',
        marginBottom: '1rem',
    }
};

export default StyledStudentDetails;