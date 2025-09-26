import React, { useState, useEffect } from 'react';
import CalendarGrid from '../../components/CalendarGrid';
import CustomEventForm from '../../components/CustomEventForm';
import TimeTracker from '../../components/TimeTracker';
import { formatTime12Hour } from '../../utils/formatters';
import { fetchAllCourses } from '../../api/api';

const PRESET_COLORS = [
  '#005826', '#007bff', '#6f42c1', '#d9534f', '#f0ad4e', '#5cb85c',
];

const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

const doSchedulesOverlap = (scheduleA, scheduleB) => {
    const daysA = scheduleA.Days.split('');
    const daysB = scheduleB.Days.split('');
    const hasCommonDay = daysA.some(day => daysB.includes(day));

    if (!hasCommonDay) return false;

    const startA = timeToMinutes(scheduleA.StartTime);
    const endA = timeToMinutes(scheduleA.EndTime);
    const startB = timeToMinutes(scheduleB.StartTime);
    const endB = timeToMinutes(scheduleB.EndTime);
    
    return startA < endB && endA > startB;
};


const ScheduleBuilderPage = ({ semesters = [] }) => {
  const [allSchedules, setAllSchedules] = useState([[]]);
  const [scheduleInfo, setScheduleInfo] = useState([{ name: 'New Schedule', isImported: false }]);
  const [activeScheduleIndex, setActiveScheduleIndex] = useState(0);
  const [isEditing, setIsEditing] = useState([true]);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [editingTab, setEditingTab] = useState({ index: -1, name: '' });
  
  const [coursePool, setCoursePool] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredEditIndex, setHoveredEditIndex] = useState(null);

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
  
  useEffect(() => {
    if (semesters && semesters.length > 0) {
      const importedSchedules = semesters.map(sem => 
        sem.courses.map(course => ({...course, id: `${course.Subject}-${course.CourseNumber}`, color: PRESET_COLORS[0]}))
      );
      const importedInfo = semesters.map(sem => ({ name: sem.semester, isImported: true }));
      setAllSchedules(importedSchedules);
      setScheduleInfo(importedInfo);
      setIsEditing(new Array(semesters.length).fill(false));
    } else {
      setAllSchedules([[]]);
      setScheduleInfo([{ name: 'New Schedule', isImported: false }]);
      setIsEditing([true]);
    }
  }, [semesters]);
  
  const handleColorClick = (color) => {
    if (selectedEventId) {
      setAllSchedules(prev => prev.map((schedule, index) => {
        if (index === activeScheduleIndex) {
          return schedule.map(event => event.id === selectedEventId ? { ...event, color } : event);
        }
        return schedule;
      }));
    } else {
      setSelectedColor(color);
    }
  };

  const handleAddEvent = (eventToAdd) => {
    setAllSchedules(prevSchedules => {
      const newSchedules = [...prevSchedules];
      const currentSchedule = newSchedules[activeScheduleIndex] || [];

      const eventId = eventToAdd.id || `${eventToAdd.Subject}-${eventToAdd.CourseNumber}`;
      const isAlreadyScheduled = currentSchedule.some(e => (e.id || `${e.Subject}-${e.CourseNumber}`) === eventId);
      
      if (isAlreadyScheduled) {
        alert("This event is already on the schedule.");
        return prevSchedules;
      }

      for (const existingEvent of currentSchedule) {
        if (doSchedulesOverlap(eventToAdd.Schedule, existingEvent.Schedule)) {
          alert(`Error: This event overlaps with ${existingEvent.Name || `${existingEvent.Subject} ${existingEvent.CourseNumber}`}.`);
          return prevSchedules;
        }
      }

      const newEvent = { ...eventToAdd, color: selectedColor, id: eventId };
      newSchedules[activeScheduleIndex] = [...currentSchedule, newEvent];
      return newSchedules;
    });
  };

  const handleRemoveEvent = (eventToRemove) => {
    setAllSchedules(prevSchedules => {
      const newSchedules = [...prevSchedules];
      const currentSchedule = newSchedules[activeScheduleIndex] || [];
      newSchedules[activeScheduleIndex] = currentSchedule.filter(event => event.id !== eventToRemove.id);
      return newSchedules;
    });
  };

  const handleAddScheduleTab = () => {
    const newTabName = `New Schedule ${allSchedules.length + 1}`;
    setAllSchedules(prev => [...prev, []]);
    setScheduleInfo(prev => [...prev, { name: newTabName, isImported: false }]);
    setIsEditing(prev => [...prev, true]);
    setActiveScheduleIndex(allSchedules.length);
  };

  const handleToggleEdit = (index) => {
    setIsEditing(prev => {
        const newEditing = [...prev];
        newEditing[index] = !newEditing[index];
        return newEditing;
    });
  };

  const handleTabNameDoubleClick = (index, name) => {
    setEditingTab({ index, name });
  };
  
  const handleTabNameChange = (e) => {
    setEditingTab(prev => ({...prev, name: e.target.value }));
  };

  const handleTabNameSave = (index) => {
    setScheduleInfo(prev => prev.map((info, i) => i === index ? {...info, name: editingTab.name} : info));
    setEditingTab({ index: -1, name: '' });
  };

  const handleSelectEvent = (eventId) => {
    setSelectedEventId(prevId => (prevId === eventId ? null : eventId));
  };
  
  const currentEvents = allSchedules[activeScheduleIndex] || [];
  const isCurrentTabEditable = isEditing[activeScheduleIndex];

  return (
    <div style={styles.container}>
        <div style={styles.sidebar}>
          {isCurrentTabEditable ? (
            <>
              <h2>Course Pool</h2>
              <p>Select a color, then click a course to add it to the schedule.</p>
              <div style={styles.colorPickerWrapper}>
                  <span style={{fontWeight: 'bold'}}>Event Color:</span>
                  <div style={styles.colorPalette}>
                      {PRESET_COLORS.map(color => (
                          <button key={color} style={{...styles.colorSwatch, backgroundColor: color, ...(selectedColor === color ? styles.activeColorSwatch : {})}} onClick={() => handleColorClick(color)} title={`Select color ${color}`} />
                      ))}
                  </div>
              </div>
              <div style={styles.poolList}>
                  {isLoading ? <p>Loading courses...</p> : error ? <p style={{color: 'red'}}>{error}</p> : (
                      coursePool.map(course => (
                          <div key={`${course.Subject}${course.CourseNumber}`} className="courseItem" style={styles.courseItem} onClick={() => handleAddEvent(course)} title={`Add ${course.Subject} ${course.CourseNumber} to schedule`}>
                              <div style={styles.courseTitle}><strong>{course.Subject} {course.CourseNumber}</strong><span style={styles.courseCredits}>{course.Credits} Credits</span></div>
                              <div style={styles.courseName}>{course.Name}</div>
                              {course.Schedule?.Days && course.Schedule?.StartTime ? (<small style={styles.courseSchedule}>{course.Schedule.Days} {formatTime12Hour(course.Schedule.StartTime)}-{formatTime12Hour(course.Schedule.EndTime)}</small>) : (<small style={styles.courseSchedule}>Schedule not available</small>)}
                          </div>
                      ))
                  )}
              </div>
              <CustomEventForm onAddEvent={handleAddEvent} />
            </>
          ) : (
            <>
              <h2>Add Custom Events</h2>
              <p>This is a read-only view. Click the edit icon to make changes or add custom events.</p>
              <CustomEventForm onAddEvent={handleAddEvent} />
            </>
          )}
          <TimeTracker events={currentEvents} />
        </div>
        <div style={styles.mainContent}>
            <h1>Schedule Builder</h1>
            <div style={styles.tabsContainer}>
                <div style={styles.tabs}>
                    {scheduleInfo.map((info, index) => {
                        const isCurrentlyEditing = isEditing[index];
                        const isHovered = hoveredEditIndex === index;
                        let buttonStyle = isCurrentlyEditing ? styles.lockButton : styles.editButton;
                        if (isHovered) {
                            buttonStyle = {...buttonStyle, ...styles.editButtonHover};
                        }

                        return (
                            <div key={index} onDoubleClick={() => handleTabNameDoubleClick(index, info.name)} style={activeScheduleIndex === index ? {...styles.tab, ...styles.activeTab} : styles.tab} onClick={() => setActiveScheduleIndex(index)}>
                              {editingTab.index === index ? (
                                <input 
                                  type="text" 
                                  value={editingTab.name} 
                                  onChange={handleTabNameChange} 
                                  onBlur={() => handleTabNameSave(index)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleTabNameSave(index)}
                                  autoFocus
                                  style={styles.tabInput}
                                />
                              ) : (
                                <span>{info.name}</span>
                              )}
                              
                              {info.isImported && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleToggleEdit(index); }} 
                                  style={buttonStyle}
                                  onMouseEnter={() => setHoveredEditIndex(index)}
                                  onMouseLeave={() => setHoveredEditIndex(null)}
                                  title={isCurrentlyEditing ? "Lock Schedule" : "Edit Schedule"}
                                >
                                  {isCurrentlyEditing ? 'Lock' : 'Edit'}
                                </button>
                              )}
                            </div>
                        )
                    })}
                </div>
                <button onClick={handleAddScheduleTab} style={styles.addTabButton} title="Add New Schedule Tab">+</button>
            </div>
            
            <CalendarGrid events={currentEvents} onRemoveEvent={handleRemoveEvent} selectedEventId={selectedEventId} onSelectEvent={handleSelectEvent} />
        </div>
        <style>{`.courseItem:hover { background-color: #f0f0f0; border-color: #005826; }`}</style>
    </div>
  );
};

const styles = {
    container: { display: 'flex', height: 'calc(100vh - 80px)' },
    sidebar: { width: '360px', padding: '1rem', borderRight: '2px solid #e0e0e0', backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column' },
    mainContent: { flexGrow: 1, padding: '1rem 2rem', overflowY: 'auto' },
    poolList: { marginTop: '1rem', overflowY: 'auto', flex: 1, border: '1px solid #ddd', borderRadius: '8px', padding: '0.5rem', backgroundColor: '#fff', minHeight: '250px' },
    courseItem: { padding: '12px', border: '1px solid #e0e0e0', borderRadius: '5px', backgroundColor: 'white', marginBottom: '8px', cursor: 'pointer', transition: 'background-color 0.2s, border-color 0.2s' },
    courseTitle: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
    courseName: { fontSize: '0.9rem', color: '#555' },
    courseCredits: { fontSize: '0.8rem', color: 'white', backgroundColor: '#6c757d', padding: '2px 6px', borderRadius: '10px' },
    courseSchedule: { display: 'block', marginTop: '6px', fontSize: '0.8rem', color: '#005826' },
    colorPickerWrapper: { display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '5px', marginBottom: '1rem' },
    colorPalette: { display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '8px' },
    colorSwatch: { width: '32px', height: '32px', borderRadius: '50%', border: '2px solid transparent', cursor: 'pointer', transition: 'transform 0.1s, border-color 0.2s' },
    activeColorSwatch: { borderColor: '#333', transform: 'scale(1.15)' },
    tabsContainer: { display: 'flex', alignItems: 'center', borderBottom: '2px solid #eee', marginBottom: '1rem' },
    tabs: { display: 'flex', flexGrow: 1 },
    tab: { padding: '10px 15px', cursor: 'pointer', border: 'none', backgroundColor: 'transparent', fontSize: '1rem', color: '#555', borderBottom: '3px solid transparent', display: 'flex', alignItems: 'center', gap: '10px' },
    activeTab: { borderBottom: '3px solid #005826', fontWeight: 'bold', color: '#000' },
    tabInput: { border: 'none', background: '#f0f0f0', padding: '4px', borderRadius: '3px', outline: '1px solid #005826'},
    addTabButton: { fontSize: '1.5rem', fontWeight: 'bold', border: 'none', backgroundColor: '#f0f0f0', cursor: 'pointer', padding: '0 15px', borderRadius: '5px', marginLeft: '10px', height: '40px' },
    editButton: { fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', border: '1px solid #6c757d', backgroundColor: 'transparent', color: '#6c757d', cursor: 'pointer', transition: 'background-color 0.2s, color 0.2s' },
    lockButton: { fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', border: '1px solid #005826', backgroundColor: 'transparent', color: '#005826', cursor: 'pointer', transition: 'background-color 0.2s, color 0.2s' },
    editButtonHover: { backgroundColor: '#6c757d', color: 'white' },
};

export default ScheduleBuilderPage;