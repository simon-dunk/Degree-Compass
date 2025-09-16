import React, { useState, useEffect } from 'react';
import { fetchDegreeRules } from '../api/api'; // Assuming api.js is in the api folder
// You would also import your reusable components like Button, etc.

const RulesPage = () => {
  const [rules, setRules] = useState([]);
  const [major, setMajor] = useState('CIS'); // Default major for this example
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadRules = async () => {
      try {
        setIsLoading(true);
        const fetchedRules = await fetchDegreeRules(major);
        setRules(fetchedRules);
      } catch (err) {
        setError('Failed to load rules. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadRules();
  }, [major]); // This effect re-runs whenever the 'major' state changes

  if (isLoading) {
    return <div>Loading degree rules...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Degree Rules Management: {major}</h1>
      {/* A button to add a new rule would go here */}

      {rules.length === 0 ? (
        <p>No rules found for this major.</p>
      ) : (
        rules.map((rule) => (
          <div key={rule.RequirementType} style={ruleCardStyle}>
            <h3>{rule.RequirementType}</h3>
            <pre style={codeBlockStyle}>
              {JSON.stringify(rule, null, 2)}
            </pre>
            {/* Edit and Delete buttons would go here */}
          </div>
        ))
      )}
    </div>
  );
};

// Basic styling for the example
const ruleCardStyle = {
  border: '1px solid #ccc',
  borderRadius: '8px',
  padding: '1rem',
  marginBottom: '1rem',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const codeBlockStyle = {
  background: '#f4f4f4',
  border: '1px solid #ddd',
  padding: '1rem',
  borderRadius: '4px',
  whiteSpace: 'pre-wrap', // Ensures long lines wrap
};

export default RulesPage;