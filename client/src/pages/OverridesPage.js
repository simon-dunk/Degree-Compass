import React, { useState, useEffect } from 'react';
import { fetchStudentById, addStudentOverride, deleteStudentOverride, fetchAllStudents } from '../api/api';
import StyledSelect from '../components/StyledSelect';

const OverridesPage = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [subThisCourse, setSubThisCourse] = useState('');
  const [subForCourses, setSubForCourses] = useState('');

  // Fetch all students for the dropdown
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const studentList = await fetchAllStudents();
        setStudents(studentList);
        if (studentList.length > 0) {
          setSelectedStudentId(studentList[0].StudentId); // Select the first student by default
        }
      } catch (err) {
        setError('Could not load student list.');
      }
    };
    loadStudents();
  }, []);
  
  // Fetch details for the selected student
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
      setError('All fields are required.');
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
        setStudentData(response.student); // Update UI with the new student data
      } catch (err) {
        setError(`Failed to delete override: ${err.message}`);
      }
    }
  };

  return (
    <div style={styles.container}>
      <h1>Student Override Management</h1>

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
          <h2>Student: {studentData.FirstName || 'N/A'} {studentData.LastName || 'N/A'} ({studentData.StudentId})</h2>

          <h3>Existing Overrides:</h3>
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

          <hr style={styles.hr} />
          <h3>Add New Override</h3>
          <form onSubmit={handleAddOverride}>
            <div style={styles.formRow}>
              <label>Substitute This Course:</label>
              <input
                type="text"
                value={subThisCourse}
                onChange={(e) => setSubThisCourse(e.target.value)}
                placeholder="Ex: CIS 2723"
                style={styles.input}
              />
            </div>
            <div style={styles.formRow}>
              <label>For This Course (or courses, comma-separated):</label>
              <input
                type="text"
                value={subForCourses}
                onChange={(e) => setSubForCourses(e.target.value)}
                placeholder="Ex: CIS 2143, MATH 1513"
                style={styles.input}
              />
            </div>
            <button type="submit" style={{...styles.button, marginTop: '1rem'}}>Add Override</button>
          </form>
        </div>
      )}
    </div>
  );
};

// --- STYLES ---
const styles = {
    container: { padding: '2rem', fontFamily: 'sans-serif', maxWidth: '900px', margin: 'auto' },
    searchForm: { marginBottom: '2rem', display: 'flex', gap: '10px' },
    input: { padding: '10px', fontSize: '1rem', flexGrow: 1, border: '1px solid #ccc', borderRadius: '5px' },
    button: {
      padding: '10px 20px', fontSize: '1rem', cursor: 'pointer', border: 'none',
      borderRadius: '5px', backgroundColor: '#005826', color: 'white'
    },
    deleteButton: { backgroundColor: '#721c24', padding: '5px 10px', fontSize: '0.9rem' },
    errorText: { color: 'red', backgroundColor: '#fbe9e7', padding: '10px', borderRadius: '5px' },
    card: { border: '1px solid #ccc', borderRadius: '8px', padding: '1rem 2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    hr: { border: 'none', borderTop: '1px solid #eee', margin: '2rem 0' },
    formRow: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '1rem' },
    overrideList: { listStyle: 'none', padding: 0 },
    overrideItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' },
    selectionContainer: { marginBottom: '2rem' },
    label: { fontWeight: 'bold', marginRight: '10px', fontSize: '1.1rem' },
  };

export default OverridesPage;