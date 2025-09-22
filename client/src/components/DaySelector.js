import React from 'react';

const DaySelector = ({ selectedDays, onDayChange }) => {
  // --- UPDATED: Add Sunday and Saturday ---
  const days = [
    { label: 'S', value: 'U' }, // Sunday
    { label: 'M', value: 'M' },
    { label: 'T', value: 'T' },
    { label: 'W', value: 'W' },
    { label: 'R', value: 'R' },
    { label: 'F', value: 'F' },
    { label: 'S', value: 'S' }, // Saturday
  ];

  const handleDayClick = (dayValue) => {
    const isSelected = selectedDays.includes(dayValue);
    let newDays;
    if (isSelected) {
      newDays = selectedDays.replace(dayValue, '');
    } else {
      // Re-sort the days to keep them in a standard order (U, M, T, W, R, F, S)
      newDays = [...selectedDays.split(''), dayValue]
        .sort((a, b) => days.findIndex(d => d.value === a) - days.findIndex(d => d.value === b))
        .join('');
    }
    onDayChange(newDays);
  };

  return (
    <div>
      {days.map((day, index) => (
        <button
          key={`${day.value}-${index}`} // Use index for unique key
          type="button"
          onClick={() => handleDayClick(day.value)}
          style={selectedDays.includes(day.value) ? styles.activeButton : styles.button}
        >
          {day.label}
        </button>
      ))}
    </div>
  );
};

// --- STYLES (no changes) ---
const styles = {
    button: {
        width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #ccc',
        backgroundColor: 'white', cursor: 'pointer', marginRight: '5px',
        fontSize: '1rem',
    },
    activeButton: {
        width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #005826',
        backgroundColor: '#005826', color: 'white', cursor: 'pointer', marginRight: '5px',
        fontSize: '1rem',
    }
};

export default DaySelector;