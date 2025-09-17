import React from 'react';

const StyledStudentTable = ({ data, onViewDetails, onDelete, onSelectItem }) => {
  if (!data || data.length === 0) return <p>No student data to display.</p>;

  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Student ID</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Major(s)</th>
            <th style={styles.th}>Completed</th>
            <th style={styles.th}>Overrides</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((student) => (
            <tr key={student.StudentId} style={styles.tr} onClick={() => onSelectItem(student)}>
              <td style={styles.td}>{student.StudentId}</td>
              <td style={styles.td}>{student.FirstName} {student.LastName}</td>
              <td style={styles.td}>{Array.isArray(student.Major) ? student.Major.join(', ') : student.Major}</td>
              <td style={styles.td}>
                <button onClick={() => onViewDetails('Completed Courses', student.CompletedCourses)} style={styles.actionButton}>
                  View ({(student.CompletedCourses || []).length})
                </button>
              </td>
              <td style={styles.td}>
                <button onClick={() => onViewDetails('Overrides', student.Overrides)} style={styles.actionButton}>
                  View ({(student.Overrides || []).length})
                </button>
              </td>
              <td style={styles.td}>
                <button onClick={() => onDelete(student)} style={{...styles.actionButton, ...styles.deleteButton}}>
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

// Styles
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
    },
    deleteButton: {
        borderColor: '#721c24',
        color: '#721c24'
    }
};

export default StyledStudentTable;