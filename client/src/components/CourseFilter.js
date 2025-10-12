import React, { useState } from 'react';
import StyledInput from './StyledInput';

const CourseFilter = ({ onApply, onClose, initialFilters = {} }) => {
  const [subject, setSubject] = useState(initialFilters.subject || '');
  const [courseNumber, setCourseNumber] = useState(initialFilters.courseNumber || '');
  const [credits, setCredits] = useState(initialFilters.credits || '');

  const handleApply = () => {
    onApply({
      subject: subject.toUpperCase().trim(),
      courseNumber: courseNumber.trim(),
      credits: credits.trim(),
    });
    onClose();
  };

  const handleClear = () => {
    setSubject('');
    setCourseNumber('');
    setCredits('');
    onApply({
      subject: '',
      courseNumber: '',
      credits: '',
    });
    onClose();
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
      <div style={styles.buttonGroup}>
        <button type="button" onClick={handleClear} style={styles.clearButton}>Clear Filters</button>
        <button type="button" onClick={handleApply} style={styles.button}>Apply Filters</button>
      </div>
    </div>
  );
};

const styles = {
  filterContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '1rem',
    marginTop: '1rem',
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