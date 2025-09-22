import React, { useState } from 'react';
import CalendarGrid from '../../components/CalendarGrid';
import CustomEventForm from '../../components/CustomEventForm'; // 1. Import new component
import TimeTracker from '../../components/TimeTracker';
import { formatTime12Hour } from '../../utils/formatters';

const ScheduleBuilderPage = () => {
  const [scheduledEvents, setScheduledEvents] = useState([]); // Renamed for clarity
  const [selectedColor] = useState('#005826');

  const coursePool = [
    { Subject: 'CIS', CourseNumber: 4413, Name: 'Systems Analysis', Schedule: { Days: 'MWF', StartTime: '09:00', EndTime: '09:50' }, type: 'course' },
    { Subject: 'BISS', CourseNumber: 4813, Name: 'Strategic Management', Schedule: { Days: 'TR', StartTime: '11:00', EndTime: '12:15' }, type: 'course' },
    { Subject: 'ART', CourseNumber: 3323, Name: 'Painting I', Schedule: { Days: 'MW', StartTime: '13:00', EndTime: '15:30' }, type: 'course' },
    { Subject: 'MATH', CourseNumber: 2614, Name: 'Calculus I', Schedule: { Days: 'F', StartTime: '11:00', EndTime: '12:50' }, type: 'course' },
  ];
  
  // Generic function to add any event (course or custom)
  const handleAddEvent = (eventToAdd) => {
    const eventId = eventToAdd.id || `${eventToAdd.Subject}-${eventToAdd.CourseNumber}`;
    const isAlreadyScheduled = scheduledEvents.some(e => (e.id || `${e.Subject}-${e.CourseNumber}`) === eventId);

    if (!isAlreadyScheduled) {
      const newEvent = { ...eventToAdd, color: selectedColor, id: eventId };
      setScheduledEvents([...scheduledEvents, newEvent]);
    }
  };

  // Generic function to remove any event
  const handleRemoveEvent = (eventToRemove) => {
    setScheduledEvents(prevEvents => 
      prevEvents.filter(event => event.id !== eventToRemove.id)
    );
  };

  return (
    <div style={styles.container}>
        <div style={styles.sidebar}>
            <h2>Course Pool</h2>
            {/* ... (Color picker and intro text) */}
            <div style={styles.poolList}>
                {coursePool.map(course => (
                    <div 
                        key={`${course.Subject}${course.CourseNumber}`} 
                        style={styles.courseItem}
                        onClick={() => handleAddEvent(course)}
                    >
                        <strong>{course.Subject} {course.CourseNumber}</strong>
                        <div>{course.Name}</div>
                        {/* 2. Use the formatter for the time display */}
                        <small>
                            {course.Schedule.Days} {formatTime12Hour(course.Schedule.StartTime)}-{formatTime12Hour(course.Schedule.EndTime)}
                        </small>
                    </div>
                ))}
            </div>
            
            <CustomEventForm onAddEvent={handleAddEvent} />
            <TimeTracker events={scheduledEvents} />
        </div>
        <div style={styles.mainContent}>
            <h1>Schedule Builder</h1>
            <CalendarGrid events={scheduledEvents} onRemoveEvent={handleRemoveEvent} />
        </div>
    </div>
  );
};

// --- STYLES ---
const styles = {
    container: { display: 'flex', height: 'calc(100vh - 80px)' },
    sidebar: {
        width: '280px', padding: '1rem', borderRight: '2px solid #e0e0e0',
        backgroundColor: '#f9f9f9', overflowY: 'auto',
    },
    mainContent: { flexGrow: 1, padding: '1rem 2rem', overflowY: 'auto' },
    poolList: { marginTop: '1rem' },
    courseItem: {
        padding: '10px', border: '1px solid #ccc', borderRadius: '5px',
        backgroundColor: 'white', marginBottom: '10px', cursor: 'pointer',
    },
    colorPickerWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '5px',
        marginBottom: '1rem',
    },
    colorPicker: {
        width: '40px',
        height: '40px',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
    }
};

export default ScheduleBuilderPage;