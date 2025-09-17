import React, { useState, useEffect } from 'react';
import { upsertItem } from '../api/devToolsApi';
import CourseSelector from './CourseSelector';

const ItemEditorForm = ({ activeTable, selectedItem, onActionComplete, onClear }) => { // 1. Accept onClear prop
  const [formData, setFormData] = useState({});
  const [formMode, setFormMode] = useState('add');

  useEffect(() => {
    if (selectedItem) {
      const stringifiedData = { ...selectedItem };
      if (stringifiedData.Courses) stringifiedData.Courses = JSON.stringify(stringifiedData.Courses, null, 2);
      if (stringifiedData.Restrictions) stringifiedData.Restrictions = JSON.stringify(stringifiedData.Restrictions, null, 2);
      
      setFormData(stringifiedData);
      setFormMode('edit');
    } else {
      setFormData({});
      setFormMode('add');
    }
  }, [selectedItem]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCoursesChange = (newCourses) => {
    setFormData(prev => ({ ...prev, Courses: newCourses }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const itemToSave = { ...formData };

      // --- FIX: Convert all relevant fields to numbers ---
      if (itemToSave.StudentId) itemToSave.StudentId = parseInt(itemToSave.StudentId, 10);
      if (itemToSave.CourseNumber) itemToSave.CourseNumber = parseInt(itemToSave.CourseNumber, 10);
      if (itemToSave.Credits) itemToSave.Credits = parseInt(itemToSave.Credits, 10);
      if (itemToSave.MinCredits) itemToSave.MinCredits = parseInt(itemToSave.MinCredits, 10);
      // --- END FIX ---
      
      if (itemToSave.Major && typeof itemToSave.Major === 'string') {
        itemToSave.Major = itemToSave.Major.split(',').map(s => s.trim());
      }
      if (itemToSave.Courses && typeof itemToSave.Courses === 'string') {
        itemToSave.Courses = JSON.parse(itemToSave.Courses);
      }
      if (itemToSave.Restrictions && typeof itemToSave.Restrictions === 'string') {
        itemToSave.Restrictions = JSON.parse(itemToSave.Restrictions);
      }

      await upsertItem(activeTable, itemToSave);
      alert(`Item successfully ${formMode === 'add' ? 'added' : 'updated'}!`);
      onActionComplete();
      setFormData({});
    } catch (err) {
      alert(`Error saving item: ${err.message}`);
    }
  };

  const renderFormFields = () => {
    switch (activeTable) {
      case 'StudentDatabase':
        return (
          <>
            <input name="StudentId" style={styles.input} value={formData.StudentId || ''} onChange={handleInputChange} placeholder="Student ID" disabled={formMode === 'edit'} />
            <input name="FirstName" style={styles.input} value={formData.FirstName || ''} onChange={handleInputChange} placeholder="First Name" />
            <input name="LastName" style={styles.input} value={formData.LastName || ''} onChange={handleInputChange} placeholder="Last Name" />
            <input name="Major" style={styles.input} value={formData.Major || ''} onChange={handleInputChange} placeholder="Major (e.g., CIS)" />
          </>
        );
      case 'CourseDatabase':
        return (
          <>
            <input name="Subject" style={styles.input} value={formData.Subject || ''} onChange={handleInputChange} placeholder="Subject" />
            <input name="CourseNumber" style={styles.input} value={formData.CourseNumber || ''} onChange={handleInputChange} placeholder="Course Number" />
            <input name="Name" style={styles.input} value={formData.Name || ''} onChange={handleInputChange} placeholder="Course Name" />
            <input name="Credits" style={styles.input} value={formData.Credits || ''} onChange={handleInputChange} placeholder="Credits" />
          </>
        );
      case 'DegreeRequirements':
        return (
            <>
                <input name="MajorCode" style={styles.input} value={formData.MajorCode || ''} onChange={handleInputChange} placeholder="Major Code" />
                <input name="RequirementType" style={styles.input} value={formData.RequirementType || ''} onChange={handleInputChange} placeholder="Requirement Type" />
                {/* 2. Replace textarea with CourseSelector */}
                <CourseSelector selectedCourses={formData.Courses || []} onChange={handleCoursesChange} />
                <input name="MinCredits" style={styles.input} value={formData.MinCredits || ''} onChange={handleInputChange} placeholder="Minimum Credits" />
            </>
        );
      default:
        return <p>This table does not have a dedicated form yet.</p>;
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.fieldGrid}>
        {renderFormFields()}
      </div>
      <div style={styles.buttonContainer}>
          {/* 2. Use the onClear prop here */}
          <button type="button" onClick={onClear} style={styles.clearButton}>Clear / New Item</button>
          <button type="submit" style={styles.button}>{formMode === 'add' ? 'Add New Item' : 'Update Item'}</button>
      </div>
    </form>
  );
};

// --- STYLES ---
const styles = {
    form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    fieldGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' },
    input: {
        padding: '1rem', border: '1px solid #cccccc',
        borderRadius: '5px', fontSize: '1rem',
    },
    textarea: {
        padding: '1rem', border: '1px solid #cccccc',
        borderRadius: '5px', fontSize: '1rem', fontFamily: 'monospace',
        gridColumn: '1 / -1' // Span full width
    },
    buttonContainer: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' },
    button: {
        backgroundColor: '#005826', color: 'white', padding: '10px 20px', border: 'none',
        borderRadius: '5px', cursor: 'pointer', fontSize: '1rem'
    },
    clearButton: {
        backgroundColor: '#6c757d', color: 'white', padding: '10px 20px', border: 'none',
        borderRadius: '5px', cursor: 'pointer', fontSize: '1rem'
    },
};

export default ItemEditorForm;