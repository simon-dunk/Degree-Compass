import React, { useState } from 'react';
import StyledInput from './StyledInput';
import DaySelector from './DaySelector';
import TimePicker24Hour from './TimePicker24Hour'; // 1. Import the new component

const CustomEventForm = ({ onAddEvent }) => {
  const [title, setTitle] = useState('');
  const [days, setDays] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [trackTime, setTrackTime] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !days || !startTime || !endTime) {
      alert('Please fill out all fields for the custom event.');
      return;
    }
    
    const newEvent = {
      id: `custom-${Date.now()}`,
      Name: title,
      type: 'custom',
      trackTime: trackTime,
      Schedule: { Days: days, StartTime: startTime, EndTime: endTime },
      Subject: 'Custom',
      CourseNumber: '',
    };
    
    onAddEvent(newEvent);
    // Reset form
    setTitle(''); setDays(''); setStartTime('08:00'); setEndTime('09:00'); setTrackTime(false);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h4>Add Custom Event</h4>
      <StyledInput type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event Title (e.g., Work)" />
      
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Days</label>
        <DaySelector selectedDays={days} onDayChange={setDays} />
      </div>

      {/* 2. Use the new 24-hour time picker */}
      <div style={styles.timeRangeContainer}>
        <div style={styles.timePickerGroup}>
            <label style={styles.label}>Start Time</label>
            <TimePicker24Hour value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div style={styles.timePickerGroup}>
            <label style={styles.label}>End Time</label>
            <TimePicker24Hour value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>
      
      <label style={styles.checkboxLabel}>
        <input type="checkbox" checked={trackTime} onChange={(e) => setTrackTime(e.target.checked)} />
        Track hours for this event
      </label>
      <button type="submit" style={styles.button}>Add Event</button>
    </form>
  );
};

// --- STYLES ---
const styles = {
    form: { display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #eee' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    timeRangeContainer: { display: 'flex', gap: '1rem', alignItems: 'flex-end' },
    timePickerGroup: { display: 'flex', flexDirection: 'column', gap: '5px', flexGrow: 1 },
    label: { fontSize: '0.9rem', color: '#555', fontWeight: 'bold' },
    checkboxLabel: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' },
    button: {
        backgroundColor: '#005826', color: 'white', padding: '10px 20px', border: 'none',
        borderRadius: '5px', cursor: 'pointer', fontSize: '1rem'
    },
};

export default CustomEventForm;