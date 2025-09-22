import React, { useState, useEffect, useCallback } from 'react';
import { fetchAuditReport, fetchAllStudents, generatePlan } from '../../api/api';
import StyledSelect from '../../components/StyledSelect';

const PlannerPage = () => {
  const [auditReport, setAuditReport] = useState(null);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [pinnedCourses, setPinnedCourses] = useState([]);
  const [numSemesters, setNumSemesters] = useState(8);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

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
      setGeneratedPlan(null);
      setPinnedCourses([]);
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

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const plan = await generatePlan(selectedStudentId, pinnedCourses, numSemesters);
      setGeneratedPlan(plan);
    } catch (err) {
      setError(`Failed to generate plan: ${err.message}`);
    } finally {
      setIsGenerating(false);
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
      <h1>Degree Planner</h1>

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

      {isLoading && <p>Loading...</p>}
      {error && <p style={styles.errorText}>{error}</p>}

      <div style={styles.mainContent}>
        <div style={styles.auditContainer}>
            <h2>Degree Progress Report</h2>
            {auditReport && !isLoading ? (
              auditReport.results.map((result) => (
                <div key={result.requirementType} style={{...styles.card, marginBottom: '1rem'}}>
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
            
            <div style={styles.generatorOptions}>
                <label htmlFor="semester-select" style={styles.label}>Plan Length:</label>
                <StyledSelect 
                    id="semester-select"
                    value={numSemesters} 
                    onChange={(e) => setNumSemesters(parseInt(e.target.value, 10))}
                >
                    {[...Array(8)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1} Semesters</option>
                    ))}
                </StyledSelect>
            </div>

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

            <button onClick={handleGeneratePlan} disabled={!auditReport || isGenerating} style={styles.button}>
                {isGenerating ? 'Generating...' : 'Generate Plan'}
            </button>

            {generatedPlan && (
                <div style={styles.planResults}>
                    <h3>Suggested Plan:</h3>
                    {generatedPlan.map((semester) => (
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
        </div>
      </div>
    </div>
  );
};

// --- STYLES ---
const styles = {
    container: { padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1200px', margin: 'auto' },
    selectionContainer: { marginBottom: '2rem' },
    label: { fontWeight: 'bold', marginRight: '10px', fontSize: '1.1rem' },
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
      borderRadius: '5px', backgroundColor: '#005826', color: 'white', width: '100%', marginTop: '1rem'
    },
    planResults: { marginTop: '1.5rem' },
    pinningSection: {
      marginBottom: '1.5rem',
      padding: '1rem',
      border: '1px solid #eee',
      borderRadius: '8px',
    },
    generatorOptions: {
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    }
  };
  
export default PlannerPage;