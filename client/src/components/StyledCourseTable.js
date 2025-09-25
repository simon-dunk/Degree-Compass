import React from 'react';

const StyledCourseTable = ({ data, onDelete, onSelectItem }) => {
  if (!data || data.length === 0) return <p>No course data to display.</p>;

  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Course</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Credits</th>
            <th style={styles.th}>Prerequisites</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((course) => (
            <tr key={`${course.Subject}-${course.CourseNumber}`} style={styles.tr} onClick={() => onSelectItem(course)}>
              <td style={styles.td}>{course.Subject} {course.CourseNumber}</td>
              <td style={styles.td}>{course.Name}</td>
              <td style={styles.td}>{course.Credits}</td>
              <td style={styles.td}>{(course.Prerequisites || []).map(p => `${p.Subject} ${p.CourseNumber}`).join(', ')}</td>
              <td style={styles.td}>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(course); }} 
                  style={{...styles.actionButton, ...styles.deleteButton}}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- STYLES ---
const styles = {
    tableContainer: { maxHeight: '500px', overflowY: 'auto', border: '1px solid #ccc' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
        backgroundColor: '#005826',
        color: 'white',
        padding: '12px 15px',
        textAlign: 'left',
        position: 'sticky',
        top: 0,
    },
    tr: { borderBottom: '1px solid #eee', cursor: 'pointer' },
    td: { padding: '12px 15px', verticalAlign: 'middle' },
    actionButton: {
        padding: '5px 10px',
        fontSize: '0.9rem',
        cursor: 'pointer',
        border: '1px solid #ccc',
        borderRadius: '5px',
        backgroundColor: '#f4f4f4',
        marginRight: '5px',
    },
    deleteButton: {
        borderColor: '#721c24',
        color: '#721c24'
    }
};

export default StyledCourseTable;