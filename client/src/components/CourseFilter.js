import React, { useState } from 'react';
import StyledInput from './StyledInput';
import DaySelector from './DaySelector';
import TimePicker24Hour from './TimePicker24Hour';

const CourseFilter = ({ onApply, onClose, initialFilters = {} }) => {
  const [subject, setSubject] = useState(initialFilters.subject || '');
  const [courseNumber, setCourseNumber] = useState(initialFilters.courseNumber || '');
  const [title, setTitle] = useState(initialFilters.title || '');
  const [credits, setCredits] = useState(initialFilters.credits || '');
  const [days, setDays] = useState(initialFilters.days || '');
  const [startTime, setStartTime] = useState(initialFilters.startTime || '');
  const [endTime, setEndTime] = useState(initialFilters.endTime || '');
  const [instructor, setInstructor] = useState(initialFilters.instructor || '');

  const handleApply = () => {
    onApply({
      subject: subject.toUpperCase().trim(),
      courseNumber: courseNumber.trim(),
      title: title.trim(),
      credits: credits.trim(),
      days: days,
      startTime: startTime,
      endTime: endTime,
      instructor: instructor.trim(),
    });
    onClose();
  };

  const handleClear = () => {
    setSubject('');
    setCourseNumber('');
    setTitle('');
    setCredits('');
    setDays('');
    setStartTime('');
    setEndTime('');
    setInstructor('');
    onApply({
      subject: '',
      courseNumber: '',
      title: '',
      credits: '',
      days: '',
      startTime: '',
      endTime: '',
      instructor: '',
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
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Filter by title (e.g., Intro to Programming)"
      />
      <StyledInput
        type="text"
        value={credits}
        onChange={(e) => setCredits(e.target.value)}
        placeholder="Filter by credits (e.g., 3)"
      />
      <StyledInput
        type="text"
        value={instructor}
        onChange={(e) => setInstructor(e.target.value)}
        placeholder="Filter by instructor"
      />
      <DaySelector selectedDays={days} onDayChange={setDays} />
      <div style={styles.timeContainer}>
        <TimePicker24Hour value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <TimePicker24Hour value={endTime} onChange={(e) => setEndTime(e.target.value)} />
      </div>
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
  timeContainer: {
    display: 'flex',
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