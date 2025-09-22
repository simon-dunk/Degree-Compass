import React from 'react';

const TimePicker24Hour = ({ value, onChange }) => {
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  
  // --- UPDATED: Generate minutes in 5-minute increments ---
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')); // 00, 05, 10...55

  const [currentHour, currentMinute] = (value || '00:00').split(':');

  const handleHourChange = (e) => {
    onChange({ target: { value: `${e.target.value}:${currentMinute}` } });
  };

  const handleMinuteChange = (e) => {
    onChange({ target: { value: `${currentHour}:${e.target.value}` } });
  };

  return (
    <div style={styles.container}>
      <select className="styled-select" value={currentHour} onChange={handleHourChange}>
        {hours.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <span style={styles.separator}>:</span>
      <select className="styled-select" value={currentMinute} onChange={handleMinuteChange}>
        {minutes.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>
  );
};

const styles = {
    container: { display: 'flex', alignItems: 'center', gap: '5px', flexGrow: 1 },
    separator: { fontSize: '1.5rem', fontWeight: 'bold' }
};

export default TimePicker24Hour;