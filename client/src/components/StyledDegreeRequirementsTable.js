import React from 'react';

const StyledDegreeRequirementsTable = ({ data, onViewDetails, onDelete, onSelectItem }) => {
  if (!data || data.length === 0) return <p>No degree requirements to display.</p>;

  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Major Code</th>
            <th style={styles.th}>Requirement Type</th>
            <th style={styles.th}>Summary</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((rule) => (
            <tr key={`${rule.MajorCode}-${rule.RequirementType}`} style={styles.tr} onClick={() => onSelectItem(rule)}>
              <td style={styles.td}>{rule.MajorCode}</td>
              <td style={styles.td}>{rule.RequirementType}</td>
              <td style={styles.td}>
                {rule.Courses ? `${rule.Courses.length} courses` : ''}
                {rule.MinCredits ? `${rule.MinCredits} minimum credits` : ''}
              </td>
              <td style={styles.td}>
                {/* --- THIS IS THE FIX --- */}
                {/* It now correctly calls the onViewDetails prop with only the 'rule' object. */}
                <button 
                  onClick={(e) => { e.stopPropagation(); onViewDetails(rule); }} 
                  style={styles.actionButton}
                >
                  View Details
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(rule); }} 
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

export default StyledDegreeRequirementsTable;