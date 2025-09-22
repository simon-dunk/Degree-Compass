import React from 'react';

// Helper to calculate the duration of an event in hours
const calculateDuration = (startTime, endTime) => {
  const start = new Date(`1970-01-01T${startTime}:00`);
  const end = new Date(`1970-01-01T${endTime}:00`);
  const diffMilliseconds = end - start;
  return diffMilliseconds / (1000 * 60 * 60);
};

const TimeTracker = ({ events }) => {
  // --- NEW: Grouping and Calculation Logic ---
  const trackedHoursByCategory = events
    .filter(event => event.trackTime)
    .reduce((accumulator, event) => {
      const title = event.Name || 'Unnamed Event';
      const duration = calculateDuration(event.Schedule.StartTime, event.Schedule.EndTime);
      const weeklyDuration = duration * event.Schedule.Days.length;

      // If the category doesn't exist in our accumulator, initialize it
      if (!accumulator[title]) {
        accumulator[title] = 0;
      }
      
      // Add the event's weekly duration to its category total
      accumulator[title] += weeklyDuration;
      
      return accumulator;
    }, {}); // Start with an empty object

  // Get the categories (e.g., ['Work', 'Study']) to map over
  const categories = Object.keys(trackedHoursByCategory);

  if (categories.length === 0) {
    return null; // Don't render if nothing is being tracked
  }

  return (
    <div style={styles.container}>
      <h4>Tracked Weekly Hours</h4>
      {categories.map(category => (
        <div key={category} style={styles.categoryRow}>
          <span style={styles.categoryName}>{category}</span>
          <span style={styles.categoryHours}>
            {trackedHoursByCategory[category].toFixed(2)} hrs
          </span>
        </div>
      ))}
    </div>
  );
};

// --- STYLES ---
const styles = {
    container: {
        marginTop: '2rem',
        padding: '1.5rem',
        border: '1px solid #005826',
        borderRadius: '8px',
        backgroundColor: '#e5fde3',
    },
    categoryRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 0',
        borderBottom: '1px solid rgba(0, 88, 38, 0.1)',
    },
    categoryName: {
        fontSize: '1rem',
        color: '#333',
    },
    categoryHours: {
        fontSize: '1.2rem',
        fontWeight: 'bold',
        color: '#005826',
    }
};

export default TimeTracker;