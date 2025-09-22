import React, { useState, useEffect, useCallback } from 'react';
import { fetchAuditReport, fetchAllStudents, generateNextSemester } from '../../api/api'; // Changed generatePlan to generateNextSemester
import StyledSelect from '../../components/StyledSelect';

const PlannerPage = () => {
  const [auditReport, setAuditReport] = useState(null);
  // --- NEW STATE for Incremental Planning ---
  const [lockedSemesters, setLockedSemesters] = useState([]);
  const [suggestedNextSemester, setSuggestedNextSemester] = useState(null);
  // ---
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [pinnedCourses, setPinnedCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [showCompletedCourses, setShowCompletedCourses] = useState(false);

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
      // --- RESET plan state when student changes ---
      setLockedSemesters([]);
      setSuggestedNextSemester(null);
      setPinnedCourses([]);
      setShowCompletedCourses(false);
      const report = await fetchAuditReport(selectedStudentId);
      setAuditReport(report);
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

  // --- REFACTORED: Generate Next Semester Handler ---
  const handleGenerateNextSemester = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      // Combine completed courses with courses from all locked semesters
      const allPreviouslyCompleted = [
        ...(auditReport.studentCompletedCourses || []),
        ...lockedSemesters.flatMap(sem => sem.courses)
      ];

      const nextSemester = await generateNextSemester(selectedStudentId, pinnedCourses, allPreviouslyCompleted);
      
      // We only get one semester back now
      if (nextSemester) {
        setSuggestedNextSemester({
            ...nextSemester,
            // Assign the correct semester number
            semester: `Semester ${lockedSemesters.length + 1}`
        });
      } else {
        setSuggestedNextSemester(null); // Handle case where no more courses can be scheduled
      }

    } catch (err) {
      setError(`Failed to generate next semester: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // --- NEW: Handler to Lock a Semester ---
  const handleLockSemester = () => {
    if (suggestedNextSemester) {
        setLockedSemesters([...lockedSemesters, suggestedNextSemester]);
        setSuggestedNextSemester(null);
        setPinnedCourses([]); // Clear pins for the next generation
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

  return (
    <div style={styles.container}>
      {/* ... (Student selection remains the same) ... */}
      <div style={styles.selectionContainer}>
        <label htmlFor="student-select" style={styles.label}>Select Student:</label>
        <StyledSelect
          id="student-select"
          value={selectedStudentId}
          onChange={(e) => setSelectedStudentId(e.target.value)}
          style={styles.select}
        >
          <option value="" disabled>-- Select a Student --</option>
          {students.map((student) => (
            <option key={student.StudentId} value={student.StudentId}>
              {student.LastName}, {student.FirstName} ({student.StudentId})
            </option>
          ))}
        </StyledSelect>
      </div>

      {isLoading && <p>Loading...</p>}
      {error && <p style={styles.errorText}>{error}</p>}
      
      <div style={styles.mainContent}>
        {/* ... (Audit container remains the same) ... */}
        <div style={styles.auditContainer}>
          <h2>Degree Progress Report</h2>

          {auditReport && (
            <button onClick={() => setShowCompletedCourses(!showCompletedCourses)} style={{...styles.button, ...styles.toggleButton}}>
              {showCompletedCourses ? 'Hide' : 'Show'} Completed Courses
            </button>
          )}

          {showCompletedCourses && auditReport?.studentCompletedCourses && (
            <div style={{...styles.card, margin: '1rem 0'}}>
              <div style={styles.cardHeader}><h3>Completed Courses</h3></div>
              <ul style={{listStyle: 'none', padding: '0 1.5rem'}}>
                {auditReport.studentCompletedCourses.map((course, index) => (
                  <li key={index} style={{padding: '0.5rem 0', borderBottom: '1px solid #eee'}}>
                    {course.Subject} {course.CourseNumber} (Grade: {course.Grade})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {auditReport && !isLoading ? (
            auditReport.results.map((result) => (
              <div key={result.requirementType} style={{...styles.card, marginTop: '1rem'}}>
                <div style={styles.cardHeader}>
                  <h3>{result.requirementType}</h3>
                  <span style={result.isSatisfied ? styles.statusMet : styles.statusNotMet}>
                    {result.isSatisfied ? '✔ Satisfied' : '✖ Not Satisfied'}
                  </span>
                </div>
                <div style={styles.cardBody}>
                  <p>{result.notes}</p>
                  {result.coursesStillNeeded && result.coursesStillNeeded.length > 0 && (
                    <div>
                      <strong>Courses Needed:</strong>
                      <ul>
                        {result.coursesStillNeeded.map((course, index) => (
                          <li key={index}>{course.Subject} {course.CourseNumber}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : !isLoading && <p>No audit report available.</p>}
        </div>

        <div style={styles.plannerContainer}>
          <h2>Graduation Plan Generator</h2>
          
          {/* --- UPDATED: Display Locked Semesters --- */}
          {lockedSemesters.length > 0 && (
            <div style={styles.planResults}>
                <h3>Locked-In Plan</h3>
                {lockedSemesters.map((semester) => (
                    <div key={semester.semester} style={{...styles.card, marginBottom: '1rem'}}>
                        <div style={styles.cardHeader}>
                            <h4>{semester.semester} ({semester.totalCredits} Credits)</h4>
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

          {auditReport?.eligibleNextCourses && auditReport.eligibleNextCourses.length > 0 && (
            <div style={styles.pinningSection}>
              <h4>Pin Courses for Next Semester</h4>
              {auditReport.eligibleNextCourses.map(course => {
                const isChecked = pinnedCourses.some(p => p.Subject === course.Subject && p.CourseNumber === course.CourseNumber);
                return (
                  <div key={`${course.Subject}${course.CourseNumber}`}>
                    <label>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handlePinToggle(course)}
                      />
                      {course.Subject} {course.CourseNumber}
                    </label>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* --- UPDATED: Generate and Lock Buttons --- */}
          <div style={styles.buttonGroup}>
            <button onClick={handleGenerateNextSemester} disabled={!auditReport || isGenerating} style={styles.button}>
                {isGenerating ? 'Generating...' : 'Generate Next Semester'}
            </button>
            <button onClick={() => { setLockedSemesters([]); setSuggestedNextSemester(null); }} style={{...styles.button, ...styles.resetButton}}>
                Reset Plan
            </button>
          </div>

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
      </div>
    </div>
  );
};

// Add new styles
const styles = {
  container: { padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1200px', margin: 'auto' },
  selectionContainer: { marginBottom: '2rem' },
  label: { fontWeight: 'bold', marginRight: '10px', fontSize: '1.1rem' },
  select: { padding: '10px', fontSize: '1rem', minWidth: '300px' },
  errorText: { color: 'red', backgroundColor: '#fbe9e7', padding: '10px', borderRadius: '5px' },
  mainContent: { display: 'flex', gap: '2rem', alignItems: 'flex-start' },
  auditContainer: { flex: 1 },
  plannerContainer: { flex: 1 },
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
    padding: '1rem 1.5rem',
  },
  statusMet: {
    color: '#005826', fontWeight: 'bold', backgroundColor: '#e5fde3',
    padding: '5px 10px', borderRadius: '15px',
  },
  statusNotMet: {
    color: '#721c24', fontWeight: 'bold', backgroundColor: '#f8d7da',
    padding: '5px 10px', borderRadius: '15px',
  },
  button: {
    padding: '12px 24px', fontSize: '1.1rem', cursor: 'pointer', border: 'none',
    borderRadius: '5px', backgroundColor: '#005826', color: 'white', flex: 1
  },
  toggleButton: {
    width: 'auto',
    backgroundColor: '#555',
    fontSize: '0.9rem',
    padding: '8px 16px',
    marginBottom: '1rem'
  },
  planResults: { marginTop: '1.5rem' },
  pinningSection: {
    marginBottom: '1.5rem',
    padding: '1rem',
    border: '1px solid #eee',
    borderRadius: '8px',
  },
  buttonGroup: { display: 'flex', gap: '1rem' },
  resetButton: { backgroundColor: '#6c757d' },
  lockButton: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' },
};

export default PlannerPage;