import React from 'react';

const DataTable = ({ data, onSelectItem }) => { // Accept onSelectItem
  if (!data || data.length === 0) {
    return <p>No data to display.</p>;
  }
  const headers = Object.keys(data[0]);

  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            {headers.map(header => <th key={header} style={styles.th}>{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} style={styles.tr} onClick={() => onSelectItem(row)}> {/* Add onClick */}
              {headers.map(header => (
                <td key={header} style={styles.td}>
                  <pre style={styles.pre}>{JSON.stringify(row[header], null, 2)}</pre>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Styles based on your StyleGuide.md
const styles = {
    tableContainer: { maxHeight: '500px', overflowY: 'auto', border: '1px solid #ccc' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
        backgroundColor: '#005826', // --primary-color
        color: 'white',
        padding: '12px 15px',
        textAlign: 'left',
        position: 'sticky',
        top: 0,
    },
    tr: { borderBottom: '1px solid #eee', cursor: 'pointer' },
    td: { padding: '12px 15px', verticalAlign: 'top' },
    pre: { margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace' }
};

export default DataTable;