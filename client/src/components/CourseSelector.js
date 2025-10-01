import React, { useState, useEffect } from 'react';
import { fetchAllCourses } from '../api/api';
import SearchableSelect from './SearchableSelect';

const CourseSelector = ({ selectedCourses, onChange, singleSelection = false }) => {
  const [allCourses, setAllCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  const currentCourses = Array.isArray(selectedCourses) ? selectedCourses : [];

  useEffect(() => {
    const loadCourses = async () => {
      const courses = await fetchAllCourses();
      setAllCourses(courses);
    };
    loadCourses();
  }, []);

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

  const courseOptions = allCourses.map(c => ({
    value: `${c.Subject}-${c.CourseNumber}`,
    label: `${c.Subject} ${c.CourseNumber} - ${c.Name}`
  }));

  return (
    <div style={styles.container}>
      <div style={styles.selectorRow}>
        <SearchableSelect
          options={courseOptions}
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          placeholder="Search courses..."
        />
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

const styles = {
    container: { gridColumn: '1 / -1' },
    selectorRow: { display: 'flex', gap: '10px', marginBottom: '10px' },
    button: {
        backgroundColor: '#005826', color: 'white', padding: '10px 20px', border: 'none',
        borderRadius: '5px', cursor: 'pointer', fontSize: '1rem', alignSelf: 'flex-end'
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