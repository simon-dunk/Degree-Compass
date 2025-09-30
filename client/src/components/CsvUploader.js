import React, { useState } from 'react';
// import StyledInput from './StyledInput';

const CsvUploader = ({ onUpload, onShowExample }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('No file chosen');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv') {
        setFile(selectedFile);
        setFileName(selectedFile.name);
        setError('');
      } else {
        setFile(null);
        setFileName('No file chosen');
        setError('Please select a valid .csv file.');
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileName('No file chosen');
    setError('');
    document.getElementById('csv-file-input').value = '';
  };
  
  const parsePrerequisites = (prereqString) => {
    if (!prereqString || prereqString.trim() === '""' || prereqString.trim() === '') {
      return [];
    }
    const cleanedString = prereqString.startsWith('"') && prereqString.endsWith('"')
      ? prereqString.slice(1, -1)
      : prereqString;
      
    return cleanedString.split(';').map(p => {
      const parts = p.trim().split(' ');
      const subject = parts[0];
      const courseNumber = parseInt(parts.slice(1).join(' '), 10);
      if (!subject || isNaN(courseNumber)) {
        throw new Error(`Invalid prerequisite format: "${p}"`);
      }
      return { Subject: subject, CourseNumber: courseNumber };
    });
  };

  const handleUpload = () => {
    if (!file) {
      setError('No file selected.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
          throw new Error('CSV must have a header row and at least one data row.');
        }

        const header = lines[0].split(',').map(h => h.trim());
        // --- THIS IS THE FIX ---
        // Update required headers and parsing logic for schedule
        const requiredHeaders = ['Subject', 'CourseNumber', 'Name', 'Credits', 'Days', 'StartTime', 'EndTime'];
        if (!requiredHeaders.every(h => header.includes(h))) {
          throw new Error(`CSV header must contain: ${requiredHeaders.join(', ')}`);
        }
        
        const courses = lines.slice(1).map(line => {
          const data = line.split(',').map(d => d.trim());
          const courseData = header.reduce((obj, nextKey, index) => {
            obj[nextKey] = data[index];
            return obj;
          }, {});

          const course = {
              Subject: courseData.Subject,
              CourseNumber: parseInt(courseData.CourseNumber, 10),
              Name: courseData.Name,
              Credits: parseInt(courseData.Credits, 10),
              Schedule: {
                  Days: courseData.Days,
                  StartTime: courseData.StartTime,
                  EndTime: courseData.EndTime
              },
              Prerequisites: courseData.Prerequisites ? parsePrerequisites(courseData.Prerequisites) : []
          };
          
          return course;
        });

        onUpload(courses);
        handleRemoveFile();

      } catch (err) {
        setError(`Failed to parse CSV: ${err.message}`);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div style={styles.container}>
      <h4>Upload Courses via CSV</h4>
      
      <div style={styles.controls}>
        <label htmlFor="csv-file-input" style={styles.fileInputLabel}>
          Choose File
        </label>
        <input type="file" id="csv-file-input" accept=".csv" onChange={handleFileChange} style={styles.hiddenInput} />
        <span style={styles.fileName}>{fileName}</span>

        {file && (
          <button onClick={handleRemoveFile} style={styles.removeButton}>&times;</button>
        )}

        <button onClick={handleUpload} disabled={!file} style={styles.button}>Upload</button>
        <button onClick={onShowExample} style={styles.exampleButton}>View Example</button>
      </div>
      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
    </div>
  );
};

// --- STYLES ---
const styles = {
    container: { marginTop: '2rem' },
    controls: { display: 'flex', gap: '1rem', alignItems: 'center' },
    hiddenInput: { display: 'none' },
    fileInputLabel: {
        backgroundColor: '#f8f9fa',
        color: '#343a40',
        padding: '10px 20px',
        border: '1px solid #ced4da',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '1rem'
    },
    removeButton: {
        background: 'transparent',
        border: 'none',
        color: '#721c24',
        fontSize: '1.5rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        padding: '0 10px'
    },
    fileName: {
        fontFamily: 'monospace',
        fontSize: '0.9rem',
        color: '#6c757d',
        flexGrow: 1
    },
    button: {
        backgroundColor: '#005826', color: 'white', padding: '10px 20px', border: 'none',
        borderRadius: '5px', cursor: 'pointer', fontSize: '1rem'
    },
    exampleButton: {
        backgroundColor: 'transparent', color: '#005826', padding: '10px 20px', border: '1px solid #005826',
        borderRadius: '5px', cursor: 'pointer', fontSize: '1rem'
    },
};

export default CsvUploader;