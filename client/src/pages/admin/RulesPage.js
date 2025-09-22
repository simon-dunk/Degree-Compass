import React, { useState, useEffect, useCallback } from 'react';
import { fetchDegreeRules, deleteRule, createOrUpdateRule, fetchAllMajorCodes } from '../../api/api';

const RulesPage = () => {
  const [rules, setRules] = useState([]);
  const [availableMajors, setAvailableMajors] = useState([]);
  const [selectedMajor, setSelectedMajor] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newRuleJson, setNewRuleJson] = useState('');

  // Fetch the list of all available majors on initial component load
  useEffect(() => {
    const loadMajors = async () => {
      try {
        const majors = await fetchAllMajorCodes();
        setAvailableMajors(majors);
        // If majors are found, automatically select the first one
        if (majors.length > 0) {
          setSelectedMajor(majors[0]);
        }
      } catch (err) {
        setError('Could not load the list of majors.');
      }
    };
    loadMajors();
  }, []);

  // Fetch rules for the currently selected major
  const loadRules = useCallback(async () => {
    if (!selectedMajor) {
      setRules([]);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const fetchedRules = await fetchDegreeRules(selectedMajor);
      setRules(fetchedRules);
    } catch (err) {
      setError(`Failed to load rules for ${selectedMajor}.`);
      setRules([]); // Clear rules on error
    } finally {
      setIsLoading(false);
    }
  }, [selectedMajor]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleDelete = async (requirementType) => {
    if (window.confirm(`Are you sure you want to delete the ${requirementType} rule for ${selectedMajor}?`)) {
      try {
        await deleteRule(selectedMajor, requirementType);
        loadRules();
      } catch (err) {
        setError(`Failed to delete rule: ${err.message}`);
      }
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    try {
      const ruleData = JSON.parse(newRuleJson);
      await createOrUpdateRule(ruleData);
      setNewRuleJson('');
      // If the new/updated rule is for the currently viewed major, refresh the list
      if (ruleData.MajorCode === selectedMajor) {
        loadRules();
      }
      // If the major is new, add it to our dropdown list and select it
      if (!availableMajors.includes(ruleData.MajorCode)) {
        const updatedMajors = [...availableMajors, ruleData.MajorCode].sort();
        setAvailableMajors(updatedMajors);
        setSelectedMajor(ruleData.MajorCode);
      }
      alert('Rule saved successfully!');
    } catch (err) {
      setError(`Failed to create rule. Make sure the JSON is valid. Error: ${err.message}`);
    }
  };

  return (
    <div style={styles.container}>
      <h1>Degree Rules Management</h1>

      <div style={styles.majorSelectionContainer}>
        <label htmlFor="major-select" style={styles.label}>Select Major:</label>
        <select
          id="major-select"
          value={selectedMajor}
          onChange={(e) => setSelectedMajor(e.target.value)}
          style={styles.select}
        >
          {availableMajors.length === 0 ? (
            <option>Loading majors...</option>
          ) : (
            availableMajors.map((major) => (
              <option key={major} value={major}>
                {major}
              </option>
            ))
          )}
        </select>
      </div>

      {error && <p style={styles.errorText}>{error}</p>}

      <h2>Showing Rules For: {selectedMajor}</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : rules.length === 0 && selectedMajor ? (
        <p>No rules found for this major.</p>
      ) : (
        rules.map((rule) => (
          <div key={rule.RequirementType} style={styles.ruleCard}>
            <div style={styles.cardHeader}>
              <h3>{rule.RequirementType}</h3>
              <button onClick={() => handleDelete(rule.RequirementType)} style={{ ...styles.button, ...styles.deleteButton }}>
                Delete
              </button>
            </div>
            <pre style={styles.codeBlock}>{JSON.stringify(rule, null, 2)}</pre>
          </div>
        ))
      )}

      <div style={styles.formContainer}>
        <h2>Add or Update a Rule</h2>
        <form onSubmit={handleCreateRule}>
          <textarea
            value={newRuleJson}
            onChange={(e) => setNewRuleJson(e.target.value)}
            placeholder='Paste the full JSON for the new rule here. Include "MajorCode" and "RequirementType".'
            style={styles.textarea}
            rows={15}
          />
          <button type="submit" style={styles.button}>
            Save Rule
          </button>
        </form>
      </div>
    </div>
  );
};

// --- STYLES ---
const styles = {
  container: { padding: '2rem', fontFamily: 'sans-serif', maxWidth: '900px', margin: 'auto' },
  majorSelectionContainer: { marginBottom: '2rem' },
  label: { fontWeight: 'bold', marginRight: '10px', fontSize: '1.1rem' },
  select: { padding: '10px', fontSize: '1rem', minWidth: '200px' },
  button: {
    padding: '10px 20px',
    fontSize: '1rem',
    cursor: 'pointer',
    border: 'none',
    borderRadius: '5px',
    backgroundColor: '#005826',
    color: 'white',
  },
  deleteButton: { backgroundColor: '#721c24' },
  errorText: { color: 'red', backgroundColor: '#fbe9e7', padding: '10px', borderRadius: '5px' },
  ruleCard: {
    border: '1px solid #ccc',
    borderRadius: '8px',
    marginBottom: '1rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    padding: '0 1rem',
    borderBottom: '1px solid #ccc',
  },
  codeBlock: {
    background: '#fff',
    padding: '1rem',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  formContainer: { marginTop: '3rem' },
  textarea: {
    width: '100%',
    padding: '10px',
    fontSize: '1rem',
    fontFamily: 'monospace',
    marginBottom: '10px',
    boxSizing: 'border-box',
    border: '1px solid #ccc',
    borderRadius: '5px',
  },
};

export default RulesPage;