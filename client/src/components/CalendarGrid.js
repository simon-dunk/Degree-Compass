import React from 'react';
import { formatTime12Hour, formatTimeSimple12Hour } from '../utils/formatters';

const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

const generateTimeSlots = (startHour, endHour, interval) => {
  const slots = [];
  if (startHour >= endHour) {
    return [];
  }
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
};

// --- THIS IS THE FIX (Part 1) ---
// Define a constant for the height of each minute in pixels.
const MINUTE_HEIGHT = 1; // 1px per minute

const CalendarGrid = ({ events = [], onRemoveEvent }) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  let startHour = 8;
  let endHour = 18;

  if (events.length > 0) {
    let minMinutes = timeToMinutes(`${startHour}:00`);
    let maxMinutes = timeToMinutes(`${endHour}:00`);

    events.forEach(event => {
      if (event.Schedule?.StartTime) {
        minMinutes = Math.min(minMinutes, timeToMinutes(event.Schedule.StartTime));
      }
      if (event.Schedule?.EndTime) {
        maxMinutes = Math.max(maxMinutes, timeToMinutes(event.Schedule.EndTime));
      }
    });

    const earliestHour = Math.floor(minMinutes / 60);
    const latestHour = Math.ceil(maxMinutes / 60);
    
    startHour = Math.max(0, earliestHour - 1);
    endHour = Math.min(24, latestHour + 1);
  }

  const timeSlots = generateTimeSlots(startHour, endHour, 30);
  const gridStartMinutes = timeToMinutes(`${String(startHour).padStart(2, '0')}:00`);

  return (
    <div style={styles.gridContainer}>
      <div style={styles.timeGutter}>
        {timeSlots.map(time => (
            <div key={time} style={styles.timeSlotLabel}>
                {formatTimeSimple12Hour(time)}
            </div>
        ))}
      </div>

      <div style={styles.daysContainer}>
        {days.map(day => (
          <div key={day} style={styles.dayColumn}>
            <div style={styles.dayHeader}>{day.substring(0, 3)}</div>
            {timeSlots.map(time => {
                const isHalfHour = time.endsWith(':30');
                return <div key={time} style={{...styles.hourLine, ...(isHalfHour ? styles.halfHourLine : {})}}></div>
            })}
            
            {/* --- THIS IS THE FIX (Part 2) --- */}
            {/* Calculate top and height in pixels based on MINUTE_HEIGHT */}
            {events.map((event, index) => {
              const dayAbbreviation = { 'Sunday': 'U', 'Monday': 'M', 'Tuesday': 'T', 'Wednesday': 'W', 'Thursday': 'R', 'Friday': 'F', 'Saturday': 'S' }[day];
              if (!event.Schedule || !event.Schedule.Days || typeof event.Schedule.Days !== 'string' || !event.Schedule.Days.includes(dayAbbreviation)) {
                return null;
              }
              
              const startMinutes = timeToMinutes(event.Schedule.StartTime);
              const endMinutes = timeToMinutes(event.Schedule.EndTime);
              const top = (startMinutes - gridStartMinutes) * MINUTE_HEIGHT;
              const height = (endMinutes - startMinutes) * MINUTE_HEIGHT;

              return (
                <div key={event.id || index} style={{...styles.event, top: `${top}px`, height: `${height}px`, backgroundColor: event.color || '#005826'}}>
                  <button onClick={(e) => { e.stopPropagation(); onRemoveEvent(event); }} style={styles.removeButton}>&times;</button>
                  <strong>{event.Subject} {event.CourseNumber}</strong>
                  <div>{event.Name}</div>
                  <small>{formatTime12Hour(event.Schedule.StartTime)} - {formatTime12Hour(event.Schedule.EndTime)}</small>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- THIS IS THE FIX (Part 3) ---
const styles = {
    gridContainer: { display: 'flex', border: '1px solid #e0e0e0', backgroundColor: '#ffffff', fontFamily: 'sans-serif' },
    timeGutter: { paddingTop: '30px', borderRight: '1px solid #e0e0e0' },
    timeSlotLabel: {
        height: `${30 * MINUTE_HEIGHT}px`, // 30 minutes * height per minute
        textAlign: 'right', padding: '0 10px',
        fontSize: '12px', color: '#777', position: 'relative', top: '-8px',
        boxSizing: 'border-box',
    },
    daysContainer: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flexGrow: 1 },
    dayColumn: { position: 'relative', borderRight: '1px solid #e0e0e0', },
    dayHeader: {
        textAlign: 'center', padding: '5px 0', fontSize: '14px',
        fontWeight: 'bold', borderBottom: '1px solid #e0e0e0', height: '20px',
    },
    hourLine: {
        height: `${30 * MINUTE_HEIGHT}px`, // 30 minutes * height per minute
        borderBottom: '1px solid #eee',
        boxSizing: 'border-box',
    },
    halfHourLine: {
        borderBottom: '1px dotted #f8f8f8',
    },
    event: {
        position: 'absolute',
        left: '5px',
        right: '5px',
        borderRadius: '5px',
        padding: '5px',
        color: 'white',
        fontSize: '12px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
    },
    removeButton: {
        position: 'absolute',
        top: '2px',
        right: '5px',
        background: 'transparent',
        border: 'none',
        color: 'white',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        opacity: 0.6,
        lineHeight: 1,
    }
};

export default CalendarGrid;