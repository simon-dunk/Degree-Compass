import React, { useState, useEffect, useCallback } from 'react';
import { fetchDegreeRules, deleteRule, createOrUpdateRule, fetchAllMajorCodes } from '../../api/api';
import RuleEditorForm from '../../components/RuleEditorForm'; // Import the new form
import StyledSelect from '../../components/StyledSelect';

const RulesPage = () => {
  const [rules, setRules] = useState([]);
  const [availableMajors, setAvailableMajors] = useState([]);
  const [selectedMajor, setSelectedMajor] = useState('');
  const [selectedRule, setSelectedRule] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMajors = async () => {
      try {
        const majors = await fetchAllMajorCodes();
        setAvailableMajors(majors);
        if (majors.length > 0) {
          setSelectedMajor(majors[0]);
        }
      } catch (err) {
        setError('Could not load the list of majors.');
      }
    };
    loadMajors();
  }, []);

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
      setRules([]);
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

  const handleSaveRule = async (ruleData) => {
    try {
      const parsedData = { ...ruleData };
      if (typeof parsedData.AllowedSubjects === 'string') {
        parsedData.AllowedSubjects = parsedData.AllowedSubjects.split(',').map(s => s.trim());
      }
      if (typeof parsedData.Restrictions === 'string') {
        parsedData.Restrictions = [parsedData.Restrictions];
      }

      await createOrUpdateRule(parsedData);
      setSelectedRule(null);
      if (parsedData.MajorCode === selectedMajor) {
        loadRules();
      }
      if (!availableMajors.includes(parsedData.MajorCode)) {
        const updatedMajors = [...availableMajors, parsedData.MajorCode].sort();
        setAvailableMajors(updatedMajors);
        setSelectedMajor(parsedData.MajorCode);
      }
      alert('Rule saved successfully!');
    } catch (err) {
      setError(`Failed to save rule: ${err.message}`);
    }
  };

  return (
    <div style={styles.container}>
      <h1>Degree Rules Management</h1>

      <div style={styles.majorSelectionContainer}>
        <label htmlFor="major-select" style={styles.label}>Select Major:</label>
        <StyledSelect
          id="major-select"
          value={selectedMajor}
          onChange={(e) => setSelectedMajor(e.target.value)}
          style={styles.select}
        >
          {availableMajors.map((major) => (
            <option key={major} value={major}>{major}</option>
          ))}
        </StyledSelect>
      </div>

      {error && <p style={styles.errorText}>{error}</p>}

      <div style={styles.mainContent}>
        <div style={styles.rulesList}>
          <h2>Rules For: {selectedMajor}</h2>
          {isLoading ? <p>Loading...</p> : rules.length === 0 && selectedMajor ? (
            <p>No rules found for this major.</p>
          ) : (
            rules.map((rule) => (
              <div key={rule.RequirementType} style={styles.ruleCard}>
                <div style={styles.cardHeader}>
                  <h3>{rule.RequirementType}</h3>
                  <div>
                    <button onClick={() => setSelectedRule(rule)} style={{...styles.button, ...styles.editButton}}>Edit</button>
                    <button onClick={() => handleDelete(rule.RequirementType)} style={{ ...styles.button, ...styles.deleteButton }}>Delete</button>
                  </div>
                </div>
                <pre style={styles.codeBlock}>{JSON.stringify(rule, null, 2)}</pre>
              </div>
            ))
          )}
        </div>

        <div style={styles.formContainer}>
          <h2>{selectedRule ? 'Edit Rule' : 'Add New Rule'}</h2>
          <RuleEditorForm
            selectedRule={selectedRule}
            onSave={handleSaveRule}
            onClear={() => setSelectedRule(null)}
          />
        </div>
      </div>
    </div>
  );
};

const styles = {
    container: { padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1200px', margin: 'auto' },
    majorSelectionContainer: { marginBottom: '2rem' },
    label: { fontWeight: 'bold', marginRight: '10px', fontSize: '1.1rem' },
    select: { padding: '10px', fontSize: '1rem', minWidth: '200px' },
    mainContent: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' },
    rulesList: {},
    formContainer: {},
    button: {
      padding: '8px 16px',
      fontSize: '0.9rem',
      cursor: 'pointer',
      border: 'none',
      borderRadius: '5px',
      color: 'white',
      marginLeft: '10px',
    },
    editButton: { backgroundColor: '#005826' },
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
      padding: '0.5rem 1rem',
      borderBottom: '1px solid #ccc',
    },
    codeBlock: {
      background: '#fff',
      padding: '1rem',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      maxHeight: '300px',
      overflowY: 'auto',
    },
};

export default RulesPage;