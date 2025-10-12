import React, { useState } from 'react';
import StyledInput from './StyledInput';

const CourseFilter = ({ onApplyFilter }) => {
  const [subject, setSubject] = useState('');
  const [courseNumber, setCourseNumber] = useState('');
  const [credits, setCredits] = useState('');

  const handleApply = () => {
    onApplyFilter({
      subject: subject.toUpperCase(),
      courseNumber,
      credits,
    });
  };

  const handleClear = () => {
    setSubject('');
    setCourseNumber('');
    setCredits('');
    onApplyFilter({
      subject: '',
      courseNumber: '',
      credits: '',
    });
  };

  return (
    <div style={styles.filterContainer}>
      <StyledInput
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Filter by subject (e.g., CS)"
      />
      <StyledInput
        type="text"
        value={courseNumber}
        onChange={(e) => setCourseNumber(e.target.value)}
        placeholder="Filter by course number (e.g., 101)"
      />
      <StyledInput
        type="text"
        value={credits}
        onChange={(e) => setCredits(e.target.value)}
        placeholder="Filter by credits (e.g., 3)"
      />
      <button type="button" onClick={handleApply} style={styles.button}>Apply</button>
      <button type="button" onClick={handleClear} style={styles.clearButton}>Clear</button>
    </div>
  );
};

const styles = {
  filterContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
  },
  button: {
    backgroundColor: '#005826',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  clearButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
};

export default CourseFilter;