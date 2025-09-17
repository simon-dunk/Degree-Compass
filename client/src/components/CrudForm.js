import React, { useState } from 'react';
import { upsertItem, deleteItem } from '../api/devToolsApi';

const CrudForm = ({ activeTable, onActionComplete }) => {
  const [itemJson, setItemJson] = useState('');
  const [keyJson, setKeyJson] = useState('');
  const [error, setError] = useState(null);

  const handleUpsert = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const item = JSON.parse(itemJson);
      await upsertItem(activeTable, item);
      alert('Item saved successfully!');
      setItemJson('');
      onActionComplete(); // Refresh the table view
    } catch (err) {
      setError(`Save failed. Make sure JSON is valid. Error: ${err.message}`);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setError(null);
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      const key = JSON.parse(keyJson);
      await deleteItem(activeTable, key);
      alert('Item deleted successfully!');
      setKeyJson('');
      onActionComplete(); // Refresh the table view
    } catch (err) {
      setError(`Delete failed. Make sure key JSON is valid. Error: ${err.message}`);
    }
  };

  return (
    <div style={styles.container}>
      {error && <p style={{color: 'red'}}>{error}</p>}
      
      {/* --- Upsert Form --- */}
      <form onSubmit={handleUpsert}>
        <h4>Add / Update Item</h4>
        <p>To update, provide the full item including the primary key. To add, provide the item without the key if it's auto-generated.</p>
        <textarea
          style={styles.textarea}
          rows={10}
          value={itemJson}
          onChange={(e) => setItemJson(e.target.value)}
          placeholder={`Enter the full JSON for the item in ${activeTable}...`}
        />
        <button type="submit" style={styles.button}>Save Item</button>
      </form>

      {/* --- Delete Form --- */}
      <form onSubmit={handleDelete} style={{marginTop: '2rem'}}>
        <h4>Delete Item</h4>
        <p>Provide the primary key of the item to delete.</p>
        <textarea
          style={styles.textarea}
          rows={4}
          value={keyJson}
          onChange={(e) => setKeyJson(e.target.value)}
          placeholder={`Example Key:\n{\n  "StudentId": 1234\n}`}
        />
        <button type="submit" style={{...styles.button, ...styles.deleteButton}}>Delete Item</button>
      </form>
    </div>
  );
};

// Styles
const styles = {
    container: { borderTop: '1px solid #eee', paddingTop: '1.5rem' },
    textarea: {
        width: '100%', padding: '10px', fontSize: '1rem',
        fontFamily: 'monospace', marginBottom: '10px', boxSizing: 'border-box',
        border: '1px solid #ccc', borderRadius: '5px'
    },
    button: {
        backgroundColor: '#005826', color: 'white', padding: '1rem 2rem', border: 'none',
        borderRadius: '5px', cursor: 'pointer', fontSize: '1rem'
    },
    deleteButton: { backgroundColor: '#721c24' }
};

export default CrudForm;