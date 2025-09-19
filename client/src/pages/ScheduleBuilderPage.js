import React from 'react';

const ScheduleBuilderPage = () => {
  return (
    <div style={styles.container}>
      <h1>Schedule Builder</h1>
      <p>This is where the user will be able to create, view, and edit their semester schedules.</p>
      <div style={styles.placeholder}>
        <p><i>(Feature implementation will begin here in the next steps.)</i></p>
      </div>
    </div>
  );
};

// --- STYLES ---
const styles = {
    container: { padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1200px', margin: 'auto' },
    placeholder: {
        border: '2px dashed #ccc',
        padding: '2rem',
        marginTop: '2rem',
        borderRadius: '8px',
        textAlign: 'center',
        backgroundColor: '#f9f9f9',
    }
};

export default ScheduleBuilderPage;