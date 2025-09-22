import React, { useState, useEffect, useCallback } from 'react';
import { fetchAuditReport, fetchAllStudents, generateNextSemester } from '../../api/api';
import StyledSelect from '../../components/StyledSelect';

// --- NEW: Client-side helper to check prerequisites ---
const arePrerequisitesMet = (prerequisites, allCompletedCourses) => {
    if (!prerequisites || prerequisites.length === 0) return true;
    const completedIds = new Set(
        allCompletedCourses.map(c => `${c.Subject}-${c.CourseNumber}`)
    );
    return prerequisites.every(prereq => {
        const prereqId = `${prereq.Subject}-${prereq.CourseNumber}`;
        return completedIds.has(prereqId);
    });
};


const PlannerPage = () => {
  const [auditReport, setAuditReport] = useState(null);
  const [lockedSemesters, setLockedSemesters] = useState([]);
  const [suggestedNextSemester, setSuggestedNextSemester] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [pinnedCourses, setPinnedCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [remainingRequirements, setRemainingRequirements] = useState([]);
  
  // --- NEW: State for dynamically updated eligible courses ---
  const [liveEligibleCourseIds, setLiveEligibleCourseIds] = useState(new Set());
  
  const [editingSemesterIndex, setEditingSemesterIndex] = useState(null);
  const [editingSemesterName, setEditingSemesterName] = useState('');

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const studentList = await fetchAllStudents();
        setStudents(studentList);
        if (studentList.length > 0) {
          setSelectedStudentId(studentList[0].StudentId);
        }
      } catch (err) {
        setError('Could not load the list of students.');
      }
    };
    loadStudents();
  }, []);

  const loadAuditReport = useCallback(async () => {
    if (!selectedStudentId) {
      setAuditReport(null);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      setLockedSemesters([]);
      setSuggestedNextSemester(null);
      setPinnedCourses([]);
      const report = await fetchAuditReport(selectedStudentId);
      setAuditReport(report);
      setRemainingRequirements(report.results || []);
    } catch (err) {
      setError(`Failed to load degree audit: ${err.message}`);
      setAuditReport(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    loadAuditReport();
  }, [loadAuditReport]);

  // --- REFACTORED: Combined useEffect for all plan-dependent calculations ---
  useEffect(() => {
    if (!auditReport) return;

    const allCompletedAndPlannedCourses = [
        ...(auditReport.studentCompletedCourses || []),
        ...lockedSemesters.flatMap(sem => sem.courses)
    ];

    const plannedCourseIds = new Set(
      lockedSemesters.flatMap(sem => sem.courses.map(c => `${c.Subject}-${c.CourseNumber}`))
    );

    // 1. Recalculate Remaining Requirements
    const updatedRequirements = auditReport.results.map(req => {
        const stillNeeded = req.coursesStillNeeded.filter(course => {
            const courseId = `${course.Subject}-${course.CourseNumber}`;
            return !plannedCourseIds.has(courseId);
        });
        return { ...req, coursesStillNeeded: stillNeeded, isSatisfied: stillNeeded.length === 0 };
    });
    setRemainingRequirements(updatedRequirements);

    // 2. Recalculate Eligibility for Pinning
    const newEligibleIds = new Set();
    (auditReport.allRemainingCourses || []).forEach(course => {
        if (arePrerequisitesMet(course.Prerequisites, allCompletedAndPlannedCourses)) {
            newEligibleIds.add(`${course.Subject}-${course.CourseNumber}`);
        }
    });
    setLiveEligibleCourseIds(newEligibleIds);

  }, [lockedSemesters, auditReport]);


  const handleGenerateNextSemester = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const allPreviouslyCompleted = [
        ...(auditReport.studentCompletedCourses || []),
        ...lockedSemesters.flatMap(sem => sem.courses)
      ];
      const nextSemester = await generateNextSemester(selectedStudentId, pinnedCourses, allPreviouslyCompleted);
      
      if (nextSemester && nextSemester.courses.length > 0) {
        setSuggestedNextSemester({
            ...nextSemester,
            semester: `Semester ${lockedSemesters.length + 1}`
        });
      } else {
        setSuggestedNextSemester(null);
        alert("Congratulations! All required courses have been planned.");
      }

    } catch (err) {
      setError(`Failed to generate next semester: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleLockSemester = () => {
    if (suggestedNextSemester) {
        setLockedSemesters([...lockedSemesters, suggestedNextSemester]);
        setSuggestedNextSemester(null);
        setPinnedCourses([]);
    }
  };
  
  const handleDeleteSemester = (indexToDelete) => {
    const updatedPlan = lockedSemesters
      .filter((_, index) => index !== indexToDelete)
      .map((semester, index) => ({
          ...semester,
          semester: semester.semester.startsWith("Semester ") ? `Semester ${index + 1}` : semester.semester,
      }));
    setLockedSemesters(updatedPlan);
  };

  const handleSemesterNameClick = (index, currentName) => {
    setEditingSemesterIndex(index);
    setEditingSemesterName(currentName);
  };

  const handleSemesterNameChange = (e) => {
    setEditingSemesterName(e.target.value);
  };
  
  const handleSemesterNameBlur = (index) => {
    const updatedPlan = [...lockedSemesters];
    updatedPlan[index].semester = editingSemesterName;
    setLockedSemesters(updatedPlan);
    setEditingSemesterIndex(null);
  };
  
  const handleSemesterNameKeyDown = (e, index) => {
    if (e.key === 'Enter') {
        handleSemesterNameBlur(index);
    }
  };

  const handlePinToggle = (course) => {
    setPinnedCourses(prevPinned => {
      const isPinned = prevPinned.some(p => p.Subject === course.Subject && p.CourseNumber === course.CourseNumber);
      if (isPinned) {
        return prevPinned.filter(p => !(p.Subject === course.Subject && p.CourseNumber === course.CourseNumber));
      } else {
        return [...prevPinned, { Subject: course.Subject, CourseNumber: course.CourseNumber }];
      }
    });
  };

  const plannedCourseIds = new Set(
    lockedSemesters.flatMap(sem => sem.courses.map(c => `${c.Subject}-${c.CourseNumber}`))
  );
  
  const pinnableCourses = auditReport?.allRemainingCourses.filter(course => {
      const courseId = `${course.Subject}-${course.CourseNumber}`;
      return !plannedCourseIds.has(courseId);
  }) || [];

  return (
    <div style={styles.container}>
      {error && <p style={styles.errorText}>{error}</p>}
      {isLoading ? <p>Loading...</p> : (
        <div style={styles.mainGrid}>
            
            <div style={styles.column}>
                <h2>Remaining Requirements</h2>
                {remainingRequirements.map((result) => (
                    <div key={result.requirementType} style={{...styles.card, marginBottom: '1rem'}}>
                        <div style={styles.cardHeader}>
                            <h3>{result.requirementType}</h3>
                            <span style={result.isSatisfied ? styles.statusMet : styles.statusNotMet}>
                                {result.isSatisfied ? '✔ Satisfied' : '✖ Not Satisfied'}
                            </span>
                        </div>
                        {result.coursesStillNeeded.length > 0 && (
                            <div style={styles.cardBody}>
                                <ul>
                                    {result.coursesStillNeeded.map((course, index) => (
                                    <li key={index}>{course.Subject} {course.CourseNumber}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div style={styles.column}>
                <h2>Graduation Plan</h2>
                {lockedSemesters.length > 0 && (
                    <div style={styles.planResults}>
                        {lockedSemesters.map((semester, index) => (
                            <div key={semester.semester + index} style={{...styles.card, marginBottom: '1rem'}}>
                                <div style={styles.cardHeader}>
                                    {editingSemesterIndex === index ? (
                                        <input
                                            type="text"
                                            value={editingSemesterName}
                                            onChange={handleSemesterNameChange}
                                            onBlur={() => handleSemesterNameBlur(index)}
                                            onKeyDown={(e) => handleSemesterNameKeyDown(e, index)}
                                            autoFocus
                                            style={styles.titleInput}
                                        />
                                    ) : (
                                        <h4 onClick={() => handleSemesterNameClick(index, semester.semester)} style={styles.editableTitle}>
                                            {semester.semester} ({semester.totalCredits} Credits)
                                        </h4>
                                    )}
                                    <button onClick={() => handleDeleteSemester(index)} style={styles.deleteButton}>Delete</button>
                                </div>
                                <ul style={{listStyle: 'none', padding: '0 1.5rem'}}>
                                    {semester.courses.map(course => (
                                        <li key={`${course.Subject}${course.CourseNumber}`} style={{padding: '0.5rem 0', borderBottom: '1px solid #eee'}}>
                                            {course.Subject} {course.CourseNumber} - {course.Name} ({course.Credits} credits)
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}

                {suggestedNextSemester && (
                    <div style={styles.planResults}>
                    <h3>Suggested Next Semester:</h3>
                    <div style={{...styles.card, marginBottom: '1rem'}}>
                        <div style={styles.cardHeader}>
                            <h4>{suggestedNextSemester.semester} ({suggestedNextSemester.totalCredits} Credits)</h4>
                            <button onClick={handleLockSemester} style={styles.lockButton}>✔ Lock In</button>
                        </div>
                        <ul style={{listStyle: 'none', padding: '0 1.5rem'}}>
                        {suggestedNextSemester.courses.map(course => (
                            <li key={`${course.Subject}${course.CourseNumber}`} style={{padding: '0.5rem 0', borderBottom: '1px solid #eee'}}>
                            {course.Subject} {course.CourseNumber} - {course.Name} ({course.Credits} credits)
                            </li>
                        ))}
                        </ul>
                    </div>
                    </div>
                )}
            </div>

            <div style={styles.column}>
                <h2>Planning Tools</h2>
                <div style={styles.selectionContainer}>
                    <label htmlFor="student-select" style={styles.label}>Select Student:</label>
                    <StyledSelect
                    id="student-select"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    >
                    <option value="" disabled>-- Select a Student --</option>
                    {students.map((student) => (
                        <option key={student.StudentId} value={student.StudentId}>
                        {student.LastName}, {student.FirstName} ({student.StudentId})
                        </option>
                    ))}
                    </StyledSelect>
                </div>
                
                {/* --- UPDATED PINNING SECTION --- */}
                {pinnableCourses.length > 0 && (
                    <div style={styles.pinningSection}>
                        <h4>Pin Courses for Next Semester</h4>
                        {pinnableCourses.map(course => {
                            const courseId = `${course.Subject}-${course.CourseNumber}`;
                            const isChecked = pinnedCourses.some(p => `${p.Subject}-${p.CourseNumber}` === courseId);
                            // --- THIS IS THE FIX ---
                            // Use the live, dynamically updated eligibility state
                            const isEligible = liveEligibleCourseIds.has(courseId);
                            
                            const prereqText = (course.Prerequisites && course.Prerequisites.length > 0)
                                ? `Prerequisites: ${course.Prerequisites.map(p => `${p.Subject} ${p.CourseNumber}`).join(', ')}`
                                : 'No Prerequisites';

                            return (
                                <div key={courseId} style={{...styles.pinItem, opacity: isEligible ? 1 : 0.6 }}>
                                    <label title={isEligible ? 'Eligible to take next semester' : prereqText}>
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => handlePinToggle(course)}
                                            disabled={!isEligible}
                                        />
                                        {course.Subject} {course.CourseNumber} - {course.Name}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                )}
                
                <div style={styles.buttonGroup}>
                    <button onClick={handleGenerateNextSemester} disabled={!auditReport || isGenerating} style={styles.button}>
                        {isGenerating ? 'Generating...' : 'Generate Next Semester'}
                    </button>
                    <button onClick={() => { setLockedSemesters([]); setSuggestedNextSemester(null); }} style={{...styles.button, ...styles.resetButton}}>
                        Reset Plan
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// ... (styles remain the same)
const styles = {
    container: { padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1600px', margin: 'auto' },
    errorText: { color: 'red', backgroundColor: '#fbe9e7', padding: '10px', borderRadius: '5px' },
    mainGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1.5fr 1fr',
        gap: '2rem',
        alignItems: 'flex-start'
    },
    column: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
    },
    selectionContainer: { marginBottom: '1rem', width: '100%' },
    label: { fontWeight: 'bold', marginRight: '10px', fontSize: '1.1rem' },
    card: {
      border: '1px solid #ccc',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      overflow: 'hidden',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#f7f7f7',
      padding: '0.5rem 1.5rem',
      borderBottom: '1px solid #ccc',
    },
    cardBody: {
      padding: '0 1rem',
    },
    statusMet: {
      color: '#005826', fontWeight: 'bold', backgroundColor: '#e5fde3',
      padding: '5px 10px', borderRadius: '15px', fontSize: '0.8rem'
    },
    statusNotMet: {
      color: '#721c24', fontWeight: 'bold', backgroundColor: '#f8d7da',
      padding: '5px 10px', borderRadius: '15px', fontSize: '0.8rem'
    },
    button: {
      padding: '12px 24px', fontSize: '1.1rem', cursor: 'pointer', border: 'none',
      borderRadius: '5px', backgroundColor: '#005826', color: 'white', flex: 1
    },
    planResults: { width: '100%' },
    pinningSection: {
      padding: '1rem',
      border: '1px solid #eee',
      borderRadius: '8px',
    },
    pinItem: {
        padding: '4px 0',
    },
    buttonGroup: { display: 'flex', gap: '1rem', width: '100%' },
    resetButton: { backgroundColor: '#6c757d' },
    lockButton: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' },
    deleteButton: { backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' },
    editableTitle: { cursor: 'pointer', margin: 0, padding: '5px', borderRadius: '3px', flexGrow: 1, fontSize: '1.1rem' },
    titleInput: {
        border: '1px solid #005826',
        padding: '4px',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        flexGrow: 1
    }
};

export default PlannerPage;