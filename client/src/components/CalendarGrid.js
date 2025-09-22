import React from 'react';
import { formatTime12Hour, formatTimeSimple12Hour } from '../utils/formatters';

// --- Helper Functions (Defined outside and before the component) ---
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
// --- End Helper Functions ---


const CalendarGrid = ({ events = [], onRemoveEvent }) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // --- Dynamic Time Range Logic ---
  let startHour = 8;
  let endHour = 18;

  events.forEach(event => {
    if (event.Schedule?.StartTime) {
      const eventStartHour = parseInt(event.Schedule.StartTime.split(':')[0], 10);
      if (eventStartHour < startHour) {
        startHour = eventStartHour;
      }
    }
    if (event.Schedule?.EndTime) {
      const eventEndHour = Math.ceil(parseInt(event.Schedule.EndTime.split(':')[0], 10));
      if (eventEndHour >= endHour) {
        endHour = eventEndHour + 1;
      }
    }
  });

  const timeSlots = generateTimeSlots(startHour, endHour, 60);
  const gridStartMinutes = timeToMinutes(`${String(startHour).padStart(2, '0')}:00`);
  const totalMinutes = timeToMinutes(`${String(endHour).padStart(2, '0')}:00`) - gridStartMinutes;

  return (
    <div style={styles.gridContainer}>
      <div style={styles.timeGutter}>
        {/* --- THIS IS THE FIX --- */}
        {/* It now correctly uses the simple formatter for the side labels */}
        {timeSlots.map(time => <div key={time} style={styles.timeSlotLabel}>{formatTimeSimple12Hour(time)}</div>)}
      </div>

      <div style={styles.daysContainer}>
        {days.map(day => (
          <div key={day} style={styles.dayColumn}>
            <div style={styles.dayHeader}>{day.substring(0, 3)}</div>
            {timeSlots.map(time => <div key={time} style={styles.hourLine}></div>)}
            
            {events.map((event, index) => {
              const dayAbbreviation = { 'Sunday': 'U', 'Monday': 'M', 'Tuesday': 'T', 'Wednesday': 'W', 'Thursday': 'R', 'Friday': 'F', 'Saturday': 'S' }[day];
              if (!event.Schedule || !event.Schedule.Days || typeof event.Schedule.Days !== 'string' || !event.Schedule.Days.includes(dayAbbreviation)) {
                return null;
              }
              
              const startMinutes = timeToMinutes(event.Schedule.StartTime);
              const endMinutes = timeToMinutes(event.Schedule.EndTime);
              const top = totalMinutes > 0 ? ((startMinutes - gridStartMinutes) / totalMinutes) * 100 : 0;
              const height = totalMinutes > 0 ? ((endMinutes - startMinutes) / totalMinutes) * 100 : 0;

              if (top < 0 || top >= 100) return null;

              return (
                <div key={event.id || index} style={{...styles.event, top: `${top}%`, height: `${height}%`, backgroundColor: event.color || '#005826'}}>
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

// --- STYLES ---
const styles = {
    gridContainer: { display: 'flex', border: '1px solid #e0e0e0', backgroundColor: '#ffffff', fontFamily: 'sans-serif' },
    timeGutter: { paddingTop: '30px', borderRight: '1px solid #e0e0e0' },
    timeSlotLabel: {
        height: '60px', textAlign: 'right', padding: '0 10px',
        fontSize: '12px', color: '#777', position: 'relative', top: '-8px',
    },
    daysContainer: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flexGrow: 1 },
    dayColumn: { position: 'relative', borderRight: '1px solid #e0e0e0', },
    dayHeader: {
        textAlign: 'center', padding: '5px 0', fontSize: '14px',
        fontWeight: 'bold', borderBottom: '1px solid #e0e0e0', height: '20px',
    },
    hourLine: {
        height: '60px',
        borderBottom: '1px solid #eee',
        boxSizing: 'border-box',
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