import React, { useState, useEffect } from 'react';
import CalendarGrid from '../../components/CalendarGrid';
import CustomEventForm from '../../components/CustomEventForm';
import TimeTracker from '../../components/TimeTracker';
import { formatTime12Hour } from '../../utils/formatters';
import { fetchAllCourses } from '../../api/api';

const PRESET_COLORS = [
  '#005826', '#007bff', '#6f42c1', '#d9534f', '#f0ad4e', '#5cb85c',
];

// --- NEW: Helper function to check for time overlaps ---
const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

const doSchedulesOverlap = (scheduleA, scheduleB) => {
    // 1. Check for common days
    const daysA = scheduleA.Days.split('');
    const daysB = scheduleB.Days.split('');
    const hasCommonDay = daysA.some(day => daysB.includes(day));

    if (!hasCommonDay) {
        return false; // No overlap if they are on different days
    }

    // 2. Convert times to minutes for comparison
    const startA = timeToMinutes(scheduleA.StartTime);
    const endA = timeToMinutes(scheduleA.EndTime);
    const startB = timeToMinutes(scheduleB.StartTime);
    const endB = timeToMinutes(scheduleB.EndTime);
    
    // 3. Check for time overlap on common days
    // Overlap exists if one event starts before the other ends, AND ends after the other starts.
    return startA < endB && endA > startB;
};


const ScheduleBuilderPage = () => {
  const [scheduledEvents, setScheduledEvents] = useState([]);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  
  const [coursePool, setCoursePool] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const courses = await fetchAllCourses();
        const schedulableCourses = courses.filter(c => 
            c.Schedule && c.Schedule.Days && c.Schedule.StartTime && c.Schedule.EndTime
        );

        const sortedCourses = schedulableCourses.sort((a, b) => {
          if (a.Subject < b.Subject) return -1;
          if (a.Subject > b.Subject) return 1;
          return a.CourseNumber - b.CourseNumber;
        });
        setCoursePool(sortedCourses);
      } catch (err) {
        setError('Could not load courses from the database.');
      } finally {
        setIsLoading(false);
      }
    };
    loadCourses();
  }, []);
  
  const handleAddEvent = (eventToAdd) => {
    const eventId = eventToAdd.id || `${eventToAdd.Subject}-${eventToAdd.CourseNumber}`;
    const isAlreadyScheduled = scheduledEvents.some(e => (e.id || `${e.Subject}-${e.CourseNumber}`) === eventId);

    if (isAlreadyScheduled) {
      alert(`${eventToAdd.Subject} ${eventToAdd.CourseNumber} is already on the schedule.`);
      return;
    }

    // --- NEW: Overlap detection logic ---
    for (const existingEvent of scheduledEvents) {
        if (doSchedulesOverlap(eventToAdd.Schedule, existingEvent.Schedule)) {
            const existingEventName = existingEvent.id.startsWith('custom-') 
                ? existingEvent.Name 
                : `${existingEvent.Subject} ${existingEvent.CourseNumber}`;
            alert(`Error: This event overlaps with ${existingEventName}.`);
            return; // Stop the function and don't add the event
        }
    }

    const newEvent = { ...eventToAdd, color: selectedColor, id: eventId };
    setScheduledEvents([...scheduledEvents, newEvent]);
  };

  const handleRemoveEvent = (eventToRemove) => {
    setScheduledEvents(prevEvents => 
      prevEvents.filter(event => event.id !== eventToRemove.id)
    );
  };

  return (
    <div style={styles.container}>
        <div style={styles.sidebar}>
            <h2>Course Pool</h2>
            <p>Select a color, then click a course to add it to the schedule.</p>
            
            <div style={styles.colorPickerWrapper}>
                <span style={{fontWeight: 'bold'}}>Event Color:</span>
                <div style={styles.colorPalette}>
                    {PRESET_COLORS.map(color => (
                        <button 
                            key={color}
                            style={{
                                ...styles.colorSwatch, 
                                backgroundColor: color,
                                ...(selectedColor === color ? styles.activeColorSwatch : {})
                            }}
                            onClick={() => setSelectedColor(color)}
                            title={`Select color ${color}`}
                        />
                    ))}
                </div>
            </div>

            <div style={styles.poolList}>
                {isLoading ? <p>Loading courses...</p> : error ? <p style={{color: 'red'}}>{error}</p> : (
                    coursePool.map(course => (
                        <div 
                            key={`${course.Subject}${course.CourseNumber}`} 
                            className="courseItem"
                            style={styles.courseItem}
                            onClick={() => handleAddEvent(course)}
                            title={`Add ${course.Subject} ${course.CourseNumber} to schedule`}
                        >
                            <div style={styles.courseTitle}>
                                <strong>{course.Subject} {course.CourseNumber}</strong>
                                <span style={styles.courseCredits}>{course.Credits} Credits</span>
                            </div>
                            <div style={styles.courseName}>{course.Name}</div>
                            {course.Schedule?.Days && course.Schedule?.StartTime ? (
                                <small style={styles.courseSchedule}>
                                    {course.Schedule.Days} {formatTime12Hour(course.Schedule.StartTime)}-{formatTime12Hour(course.Schedule.EndTime)}
                                </small>
                            ) : (
                                <small style={styles.courseSchedule}>Schedule not available</small>
                            )}
                        </div>
                    ))
                )}
            </div>
            
            <CustomEventForm onAddEvent={handleAddEvent} />
            <TimeTracker events={scheduledEvents} />
        </div>
        <div style={styles.mainContent}>
            <h1>Schedule Builder</h1>
            <CalendarGrid events={scheduledEvents} onRemoveEvent={handleRemoveEvent} />
        </div>
        <style>{`
          .courseItem:hover {
            background-color: #f0f0f0;
            border-color: #005826;
          }
        `}</style>
    </div>
  );
};

const styles = {
    container: { display: 'flex', height: 'calc(100vh - 80px)' },
    sidebar: {
        width: '360px', 
        padding: '1rem', 
        borderRight: '2px solid #e0e0e0',
        backgroundColor: '#f9f9f9', 
        display: 'flex', 
        flexDirection: 'column',
    },
    mainContent: { flexGrow: 1, padding: '1rem 2rem', overflowY: 'auto' },
    poolList: { 
      marginTop: '1rem', 
      overflowY: 'auto',
      flex: 1,
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '0.5rem',
      backgroundColor: '#fff',
      minHeight: '250px',
    },
    courseItem: {
        padding: '12px',
        border: '1px solid #e0e0e0',
        borderRadius: '5px',
        backgroundColor: 'white',
        marginBottom: '8px',
        cursor: 'pointer',
        transition: 'background-color 0.2s, border-color 0.2s',
    },
    courseTitle: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px'
    },
    courseName: {
        fontSize: '0.9rem',
        color: '#555'
    },
    courseCredits: {
        fontSize: '0.8rem',
        color: 'white',
        backgroundColor: '#6c757d',
        padding: '2px 6px',
        borderRadius: '10px'
    },
    courseSchedule: {
        display: 'block',
        marginTop: '6px',
        fontSize: '0.8rem',
        color: '#005826'
    },
    colorPickerWrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '10px',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '5px',
        marginBottom: '1rem',
    },
    colorPalette: {
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        gap: '8px',
    },
    colorSwatch: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        border: '2px solid transparent',
        cursor: 'pointer',
        transition: 'transform 0.1s, border-color 0.2s'
    },
    activeColorSwatch: {
        borderColor: '#333',
        transform: 'scale(1.15)',
    }
};

export default ScheduleBuilderPage;