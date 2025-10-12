import React, { useState, useEffect } from 'react';
import { fetchAllCourses } from '../api/api';
import StyledSelect from './StyledSelect';
import CourseFilter from './CourseFilter';

const CourseSelector = ({ selectedCourses, onChange, singleSelection = false }) => {
  const [allCourses, setAllCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const currentCourses = Array.isArray(selectedCourses) ? selectedCourses : [];

  useEffect(() => {
    const loadCourses = async () => {
      const courses = await fetchAllCourses();
      setAllCourses(courses);
      setFilteredCourses(courses);
    };
    loadCourses();
  }, []);

  const handleApplyFilter = (filters) => {
    let filtered = allCourses;

    if (filters.subject) {
      filtered = filtered.filter(course => course.Subject.includes(filters.subject));
    }
    if (filters.courseNumber) {
      filtered = filtered.filter(course => String(course.CourseNumber).includes(filters.courseNumber));
    }
    if (filters.credits) {
      filtered = filtered.filter(course => String(course.Credits) === filters.credits);
    }

    setFilteredCourses(filtered);
  };


  const handleAddCourse = () => {
    if (!selectedCourseId) return;
    const courseToAdd = allCourses.find(c => `${c.Subject}-${c.CourseNumber}` === selectedCourseId);
    if (courseToAdd) {
        if (singleSelection) {
            onChange([ { Subject: courseToAdd.Subject, CourseNumber: courseToAdd.CourseNumber }]);
        } else if (!currentCourses.some(sc => sc.Subject === courseToAdd.Subject && sc.CourseNumber === courseToAdd.CourseNumber)) {
            onChange([...currentCourses, { Subject: courseToAdd.Subject, CourseNumber: courseToAdd.CourseNumber }]);
        }
    }
  };

  const handleRemoveCourse = (courseToRemove) => {
    onChange(currentCourses.filter(c => !(c.Subject === courseToRemove.Subject && c.CourseNumber === courseToRemove.CourseNumber)));
  };

  return (
    <div style={styles.container}>
        <div style={styles.selectorRow}>
            <button type="button" onClick={() => setShowFilters(!showFilters)} style={styles.filterButton}>
                {showFilters ? 'Hide' : 'Show'} Filters
            </button>
        </div>
        {showFilters && <CourseFilter onApplyFilter={handleApplyFilter} />}
      <div style={styles.selectorRow}>
        <StyledSelect value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} style={styles.select}>
          <option value="">-- Select a course to add --</option>
          {filteredCourses.map(c => (
            <option key={`${c.Subject}-${c.CourseNumber}`} value={`${c.Subject}-${c.CourseNumber}`}>
              {c.Subject} {c.CourseNumber} - {c.Name}
            </option>
          ))}
        </StyledSelect>
        <button type="button" onClick={handleAddCourse} style={styles.button}>Add</button>
      </div>
      <div style={styles.selectedList}>
        {currentCourses.map((course, index) => (
          <div key={index} style={styles.chip}>
            {course.Subject} {course.CourseNumber}
            <button type="button" onClick={() => handleRemoveCourse(course)} style={styles.removeButton}>&times;</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- STYLES ---
const styles = {
    container: { gridColumn: '1 / -1' },
    selectorRow: { display: 'flex', gap: '10px', marginBottom: '10px' },
    select: { flexGrow: 1, padding: '10px', fontSize: '1rem', border: '1px solid #ccc', borderRadius: '5px' },
    button: {
        backgroundColor: '#005826', color: 'white', padding: '10px 20px', border: 'none',
        borderRadius: '5px', cursor: 'pointer', fontSize: '1rem'
    },
    filterButton: {
        backgroundColor: '#6c757d',
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '1rem',
    },
    selectedList: { display: 'flex', flexWrap: 'wrap', gap: '10px', minHeight: '40px' },
    chip: {
        display: 'flex', alignItems: 'center', backgroundColor: '#e9ecef',
        padding: '5px 10px', borderRadius: '15px'
    },
    removeButton: {
        marginLeft: '10px', background: 'transparent', border: 'none',
        cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem'
    }
};

export default CourseSelector;