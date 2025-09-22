import React, { useState, useEffect } from 'react';
import {
  fetchStudentById,
  addStudentOverride,
  deleteStudentOverride,
  fetchAllStudents,
  addCompletedCourse,
  fetchAllCourses
} from '../../api/api';
import StyledSelect from '../../components/StyledSelect';
import StyledInput from '../../components/StyledInput';

const OverridesPage = () => {
  const [students, setStudents] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Form State ---
  const [subThisCourse, setSubThisCourse] = useState('');
  const [subForCourses, setSubForCourses] = useState('');
  const [newCompletedCourse, setNewCompletedCourse] = useState('');
  const [newGrade, setNewGrade] = useState('');

  // Fetch students and courses on initial load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [studentList, courseList] = await Promise.all([
          fetchAllStudents(),
          fetchAllCourses()
        ]);
        setStudents(studentList);
        setAllCourses(courseList);
        if (studentList.length > 0) {
          setSelectedStudentId(studentList[0].StudentId);
        }
      } catch (err) {
        setError('Could not load initial page data.');
      }
    };
    loadInitialData();
  }, []);

  // Fetch details for the selected student whenever the selection changes
  useEffect(() => {
    if (!selectedStudentId) return;
    const loadStudentDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchStudentById(selectedStudentId);
        setStudentData(data);
      } catch (err) {
        setError(`Failed to find student with ID ${selectedStudentId}.`);
        setStudentData(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadStudentDetails();
  }, [selectedStudentId]);

  const handleAddOverride = async (e) => {
    e.preventDefault();
    if (!subThisCourse || !subForCourses) {
      setError('All override fields are required.');
      return;
    }

    const parseCourse = (courseString) => {
      const [Subject, Course] = courseString.trim().split(' ');
      return { Subject, Course };
    };

    const subForArray = subForCourses.split(',').map(courseStr => parseCourse(courseStr));

    const newOverride = {
      SubThis: parseCourse(subThisCourse),
      SubFor: subForArray,
      ApprovedBy: 'admin-ui',
      ApprovedDate: new Date().toISOString().split('T')[0],
    };

    try {
      const response = await addStudentOverride(selectedStudentId, newOverride);
      setStudentData(response.student);
      setError(null);
      setSubThisCourse('');
      setSubForCourses('');
    } catch (err) {
      setError(`Failed to add override: ${err.message}`);
    }
  };

  const handleDeleteOverride = async (index) => {
    if (window.confirm('Are you sure you want to delete this override?')) {
      try {
        const response = await deleteStudentOverride(selectedStudentId, index);
        setStudentData(response.student);
      } catch (err) {
        setError(`Failed to delete override: ${err.message}`);
      }
    }
  };

  const handleAddCompletedCourse = async (e) => {
    e.preventDefault();
    if (!newCompletedCourse || !newGrade) {
      setError('Please select a course and enter a grade.');
      return;
    }
    
    const [Subject, CourseNumber] = newCompletedCourse.split('-');
    const courseData = {
      Subject,
      CourseNumber: parseInt(CourseNumber, 10),
      Grade: parseFloat(newGrade)
    };

    try {
      const response = await addCompletedCourse(selectedStudentId, courseData);
      setStudentData(response.student);
      setError(null);
      setNewCompletedCourse('');
      setNewGrade('');
    } catch (err) {
      setError(`Failed to add course: ${err.message}`);
    }
  };

  return (
    <div style={styles.container}>
      <h1>Student Record Management</h1>

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

      {isLoading && <p>Loading student data...</p>}
      {error && <p style={styles.errorText}>{error}</p>}

      {studentData && (
        <div style={styles.card}>
          <h2>Student: {studentData.FirstName || ''} {studentData.LastName || ''} ({studentData.StudentId})</h2>
          
          <div style={styles.formSection}>
            <h3>Add Completed Course</h3>
            <form onSubmit={handleAddCompletedCourse} style={styles.addCourseForm}>
              <StyledSelect value={newCompletedCourse} onChange={(e) => setNewCompletedCourse(e.target.value)}>
                <option value="">-- Select a Course --</option>
                {allCourses.map(c => (
                  <option key={`${c.Subject}-${c.CourseNumber}`} value={`${c.Subject}-${c.CourseNumber}`}>
                    {c.Subject} {c.CourseNumber} - {c.Name}
                  </option>
                ))}
              </StyledSelect>
              <StyledInput type="number" step="0.1" max="4.0" min="0.0" value={newGrade} onChange={(e) => setNewGrade(e.target.value)} placeholder="Grade (e.g., 4.0)" />
              <button type="submit" style={styles.button}>Add Course</button>
            </form>
          </div>

          <div style={styles.formSection}>
            <h3>Existing Overrides</h3>
            {studentData.Overrides && studentData.Overrides.length > 0 ? (
              <ul style={styles.overrideList}>
                {studentData.Overrides.map((override, index) => (
                  <li key={index} style={styles.overrideItem}>
                    <span>
                      <strong>Substitute {override.SubThis.Subject} {override.SubThis.Course}</strong> for {override.SubFor.map(c => `${c.Subject} ${c.Course}`).join(' OR ')}
                    </span>
                    <button onClick={() => handleDeleteOverride(index)} style={{...styles.button, ...styles.deleteButton}}>Delete</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No overrides found for this student.</p>
            )}
          </div>
          
          <div style={styles.formSection}>
            <h3>Add New Override</h3>
            <form onSubmit={handleAddOverride}>
              <div style={styles.formRow}>
                <label>Substitute This Course:</label>
                <StyledInput
                  type="text"
                  value={subThisCourse}
                  onChange={(e) => setSubThisCourse(e.target.value)}
                  placeholder="Ex: CIS 2723"
                />
              </div>
              <div style={styles.formRow}>
                <label>For This Course (or courses, comma-separated):</label>
                <StyledInput
                  type="text"
                  value={subForCourses}
                  onChange={(e) => setSubForCourses(e.target.value)}
                  placeholder="Ex: CIS 2143, MATH 1513"
                />
              </div>
              <button type="submit" style={{...styles.button, marginTop: '1rem'}}>Add Override</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- STYLES ---
const styles = {
    container: { padding: '2rem', fontFamily: 'sans-serif', maxWidth: '900px', margin: 'auto' },
    card: { border: '1px solid #ccc', borderRadius: '8px', padding: '1rem 2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    button: {
      padding: '10px 20px', fontSize: '1rem', cursor: 'pointer', border: 'none',
      borderRadius: '5px', backgroundColor: '#005826', color: 'white'
    },
    deleteButton: { backgroundColor: '#721c24', padding: '5px 10px', fontSize: '0.9rem' },
    errorText: { color: 'red', backgroundColor: '#fbe9e7', padding: '10px', borderRadius: '5px' },
    formRow: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '1rem' },
    overrideList: { listStyle: 'none', padding: 0 },
    overrideItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' },
    selectionContainer: { marginBottom: '2rem' },
    label: { fontWeight: 'bold', marginRight: '10px', fontSize: '1.1rem' },
    formSection: {
        marginTop: '2rem',
        paddingTop: '2rem',
        borderTop: '2px solid #eee'
    },
    addCourseForm: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr auto',
        gap: '1rem',
        alignItems: 'center',
    }
  };

export default OverridesPage;