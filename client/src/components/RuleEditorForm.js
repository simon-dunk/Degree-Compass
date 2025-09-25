import React, { useState, useEffect } from 'react';
import StyledInput from './StyledInput';
import CourseSelector from './CourseSelector';

const RuleEditorForm = ({ selectedRule, onSave, onClear }) => {
  const [formData, setFormData] = useState({});
  const [ruleType, setRuleType] = useState('core'); // 'core' or 'electives'

  useEffect(() => {
    if (selectedRule) {
      setFormData(selectedRule);
      if (selectedRule.MinCredits) {
        setRuleType('electives');
      } else {
        setRuleType('core');
      }
    } else {
      setFormData({
        MajorCode: '',
        RequirementType: '',
        Courses: [],
        MinCredits: '',
        AllowedSubjects: '',
        Restrictions: '',
      });
      setRuleType('core');
    }
  }, [selectedRule]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCourseChange = (courses) => {
    setFormData(prev => ({ ...prev, Courses: courses }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.fieldGrid}>
        <StyledInput name="MajorCode" value={formData.MajorCode || ''} onChange={handleChange} placeholder="Major Code (e.g., CIS)" />
        <StyledInput name="RequirementType" value={formData.RequirementType || ''} onChange={handleChange} placeholder="Requirement Type (e.g., CORE)" />
      </div>

      <div style={styles.ruleTypeToggle}>
        <button type="button" onClick={() => setRuleType('core')} style={ruleType === 'core' ? styles.toggleActive : styles.toggle}>Core Courses</button>
        <button type="button" onClick={() => setRuleType('electives')} style={ruleType === 'electives' ? styles.toggleActive : styles.toggle}>Electives</button>
      </div>

      {ruleType === 'core' ? (
        <CourseSelector selectedCourses={formData.Courses || []} onChange={handleCourseChange} />
      ) : (
        <div style={styles.fieldGrid}>
          <StyledInput name="MinCredits" type="number" value={formData.MinCredits || ''} onChange={handleChange} placeholder="Minimum Credits" />
          <StyledInput name="AllowedSubjects" value={formData.AllowedSubjects || ''} onChange={handleChange} placeholder="Allowed Subjects (comma-separated)" />
          <StyledInput name="Restrictions" value={formData.Restrictions || ''} onChange={handleChange} placeholder="Restrictions (e.g., 3000+ level)" />
        </div>
      )}

      <div style={styles.buttonContainer}>
        <button type="button" onClick={onClear} style={styles.clearButton}>Clear / New</button>
        <button type="submit" style={styles.button}>Save Rule</button>
      </div>
    </form>
  );
};

const styles = {
    form: { display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' },
    fieldGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
    ruleTypeToggle: { display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' },
    toggle: { padding: '8px 16px', border: '1px solid #ccc', backgroundColor: 'white', cursor: 'pointer', borderRadius: '5px' },
    toggleActive: { padding: '8px 16px', border: '1px solid #005826', backgroundColor: '#e5fde3', cursor: 'pointer', borderRadius: '5px' },
    buttonContainer: { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' },
    button: { backgroundColor: '#005826', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    clearButton: { backgroundColor: '#6c757d', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' },
};

export default RuleEditorForm;