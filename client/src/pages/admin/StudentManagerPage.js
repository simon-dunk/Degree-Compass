import React, { useState, useEffect } from 'react';
import {
  fetchStudentById,
  addStudentOverride,
  deleteStudentOverride,
  fetchAllStudents,
  addCompletedCourse,
  fetchAllCourses,
  deleteCompletedCourse,
} from '../../api/api';
import StyledSelect from '../../components/StyledSelect';
import StyledInput from '../../components/StyledInput';
import CourseSelector from '../../components/CourseSelector';

const StudentManagerPage = () => {
  const [students, setStudents] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [subThisCourse, setSubThisCourse] = useState([]);
  const [subForCourses, setSubForCourses] = useState([]);
  const [newCompletedCourse, setNewCompletedCourse] = useState([]);
  const [newGrade, setNewGrade] = useState('');

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
    if (subThisCourse.length === 0 || subForCourses.length === 0) {
      setError('Both "substitute" and "for" fields must have at least one course.');
      return;
    }

    const newOverride = {
      SubThis: subThisCourse[0],
      SubFor: subForCourses,
      ApprovedBy: 'admin-ui',
      ApprovedDate: new Date().toISOString().split('T')[0],
    };

    try {
      const response = await addStudentOverride(selectedStudentId, newOverride);
      setStudentData(response.student);
      setError(null);
      setSubThisCourse([]);
      setSubForCourses([]);
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
    if (newCompletedCourse.length === 0 || !newGrade) {
        setError('Please select a course and enter a grade.');
        return;
    }

    const { Subject, CourseNumber } = newCompletedCourse[0];
    const courseInfo = allCourses.find(c => c.Subject === Subject && c.CourseNumber === CourseNumber);

    const courseData = {
        Subject,
        CourseNumber,
        Grade: parseFloat(newGrade),
        Credits: courseInfo ? courseInfo.Credits : 0
    };

    try {
        const response = await addCompletedCourse(selectedStudentId, courseData);
        setStudentData(response.student);
        setError(null);
        setNewCompletedCourse([]);
        setNewGrade('');
    } catch (err) {
        setError(`Failed to add course: ${err.message}`);
    }
  };

  const handleDeleteCompletedCourse = async (index) => {
    const confirmation = prompt('To confirm deletion, please type "delete" below:');
    if (confirmation === 'delete') {
      try {
        const response = await deleteCompletedCourse(selectedStudentId, index);
        setStudentData(response.student);
      } catch (err) {
        setError(`Failed to delete completed course: ${err.message}`);
      }
    }
  };


  return (
    <div style={styles.container}>
      <h1>Student Manager</h1>

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
              <CourseSelector selectedCourses={newCompletedCourse} onChange={setNewCompletedCourse} singleSelection={true} />
              <StyledInput type="number" step="0.1" max="4.0" min="0.0" value={newGrade} onChange={(e) => setNewGrade(e.target.value)} placeholder="Grade (e.g., 4.0)" />
              <button type="submit" style={styles.button}>Add Course</button>
            </form>
          </div>

          <div style={styles.formSection}>
            <h3>Completed Courses</h3>
            {studentData.CompletedCourses && studentData.CompletedCourses.length > 0 ? (
              <ul style={styles.overrideList}>
                {studentData.CompletedCourses.map((course, index) => (
                  <li key={index} style={styles.overrideItem}>
                    <span>
                      {course.Subject} {course.CourseNumber}&nbsp;&nbsp;|&nbsp;&nbsp;Grade: {course.Grade}&nbsp;&nbsp;|&nbsp;&nbsp;Credits: {course.Credits || 'N/A'}
                    </span>
                    <button onClick={() => handleDeleteCompletedCourse(index)} style={{...styles.button, ...styles.deleteButton}}>Delete</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No completed courses found for this student.</p>
            )}
          </div>

          <div style={styles.formSection}>
            <h3>Existing Overrides</h3>
            {studentData.Overrides && studentData.Overrides.length > 0 ? (
              <ul style={styles.overrideList}>
                {studentData.Overrides.map((override, index) => (
                  <li key={index} style={styles.overrideItem}>
                    <span>
                      <strong>Substitute {override.SubThis.Subject} {override.SubThis.CourseNumber}</strong> for {override.SubFor.map(c => `${c.Subject} ${c.CourseNumber}`).join(' OR ')}
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
                    <CourseSelector selectedCourses={subThisCourse} onChange={setSubThisCourse} singleSelection={true} />
                </div>
                <div style={styles.formRow}>
                    <label>For This Course (or courses):</label>
                    <CourseSelector selectedCourses={subForCourses} onChange={setSubForCourses} />
                </div>
                <button type="submit" style={{...styles.button, marginTop: '1rem'}}>Add Override</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

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

export default StudentManagerPage;