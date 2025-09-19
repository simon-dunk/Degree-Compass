import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable';
import StyledStudentTable from '../components/StyledStudentTable';
import StyledDegreeRequirementsTable from '../components/StyledDegreeRequirementsTable';
import Modal from '../components/Modal';
import StyledDegreeRequirementDetails from '../components/StyledDegreeRequirementDetails';
import StyledStudentDetails from '../components/StyledStudentDetails';
import ItemEditorForm from '../components/ItemEditorForm';
import { fetchTableContents, deleteItem, generateMassData } from '../api/devToolsApi';

const TABLE_NAMES = ['CourseDatabase', 'StudentDatabase', 'DegreeRequirements'];

const DevToolsPage = () => {
  const [activeTab, setActiveTab] = useState(TABLE_NAMES[0]);
  const [tableData, setTableData] = useState([]);
  const [viewMode, setViewMode] = useState('styled');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalViewMode, setModalViewMode] = useState('styled');

  const loadTableData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTableContents(activeTab);
      setTableData(data);
    } catch (err) {
      setError(`Failed to load data for ${activeTab}: ${err.message}`);
      setTableData([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadTableData();
  }, [loadTableData]);

  useEffect(() => {
      setSelectedItem(null);
  }, [activeTab]);

  const handleGenerateData = async () => {
      if (window.confirm('This will overwrite existing data in the Course and Degree Requirements tables. Are you sure?')) {
          try {
            const result = await generateMassData();
            alert(result.message);
            loadTableData(); // Refresh the current tab
          } catch (err) {
              alert(`Error generating data: ${err.message}`);
          }
      }
  };
  
  const handleViewDetails = (title, content) => {
    setModalTitle(title);
    setModalContent(content);
    setModalViewMode('styled');
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (item) => {
    let key;
    // Construct the primary key based on the active table
    if (activeTab === 'StudentDatabase') {
        key = { StudentId: item.StudentId };
    } else if (activeTab === 'CourseDatabase') {
        key = { Subject: item.Subject, CourseNumber: item.CourseNumber };
    } else if (activeTab === 'DegreeRequirements') {
        key = { MajorCode: item.MajorCode, RequirementType: item.RequirementType };
    } else {
        alert("Deletion is not configured for this table.");
        return;
    }

    if (window.confirm(`Are you sure you want to delete this item?\n${JSON.stringify(key)}`)) {
        try {
            await deleteItem(activeTab, key);
            alert('Item deleted successfully!');
            loadTableData(); // Refresh the view
        } catch(err) {
            alert(`Delete failed: ${err.message}`);
        }
    }
  };

  const renderTable = () => {
    if (viewMode === 'json') {
      return <DataTable data={tableData} onSelectItem={setSelectedItem} />;
    }
    
    // Conditionally render the correct styled table component
    switch (activeTab) {
        case 'StudentDatabase':
            return <StyledStudentTable data={tableData} onViewDetails={handleViewDetails} onDelete={handleDeleteItem} onSelectItem={setSelectedItem} />;
        case 'DegreeRequirements':
            return <StyledDegreeRequirementsTable data={tableData} onViewDetails={(rule) => handleViewDetails('Degree Details', rule)} onDelete={handleDeleteItem} onSelectItem={setSelectedItem} />; 
        default: // This will now apply to CourseDatabase
            return <DataTable data={tableData} onSelectItem={setSelectedItem} />;
    }
  };

  const renderModalContent = () => {
    if (modalViewMode === 'json') {
      return <pre>{JSON.stringify(modalContent, null, 2)}</pre>;
    }
    
    // --- UPDATED STYLED VIEW LOGIC ---
    if (activeTab === 'DegreeRequirements') {
      return <StyledDegreeRequirementDetails rule={modalContent} />;
    }
    
    if (activeTab === 'StudentDatabase' && (modalTitle === 'Completed Courses' || modalTitle === 'Overrides')) {
      return <StyledStudentDetails title={modalTitle} data={modalContent} />;
    }
    // --- END UPDATE ---
    
    // Fallback for anything else that doesn't have a custom styled view
    if (Array.isArray(modalContent)) {
      return <p>This data does not have a custom styled view yet.</p>;
    }
    
    return <p>No details to display.</p>;
  };


  return (
    <div style={styles.container}>
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={modalTitle}
        viewMode={modalViewMode}
        onToggleView={setModalViewMode}
      >
        {renderModalContent()}
      </Modal>

      <h1>Developer Dashboard</h1>
      <p>A tool for direct database manipulation and data simulation.</p>

      {/* --- THIS IS THE MISSING SECTION --- */}
      <div style={styles.card}>
          <h2>Data Simulation</h2>
          <p>Generate a large, realistic set of courses and degree requirements for a full CS program.</p>
          <button onClick={handleGenerateData} style={styles.button}>Generate Full CS Program Data</button>
      </div>
      {/* --- END OF MISSING SECTION --- */}

      <div style={styles.card}>
          <div style={styles.header}>
            <h2>Database Viewer & Editor</h2>
            <div style={styles.toggleContainer}>
                <button onClick={() => setViewMode('styled')} style={viewMode === 'styled' ? styles.toggleActive : styles.toggle}>Styled</button>
                <button onClick={() => setViewMode('json')} style={viewMode === 'json' ? styles.toggleActive : styles.toggle}>JSON</button>
            </div>
          </div>

          <div style={styles.tabs}>
              {TABLE_NAMES.map(name => (
                  <button key={name} onClick={() => setActiveTab(name)} style={activeTab === name ? {...styles.tab, ...styles.activeTab} : styles.tab}>
                      {name}
                  </button>
              ))}
          </div>
          <div style={styles.content}>
              {isLoading ? <p>Loading...</p> : error ? <p style={{color: 'red'}}>{error}</p> : renderTable()}
          </div>
      </div>
      
      <div style={styles.card}>
          <h2>Add / Edit Item</h2>
          <p>Click a row in the 'Styled' view to load it for editing. Clear the form to add a new item.</p>
          <ItemEditorForm 
            activeTable={activeTab}
            selectedItem={selectedItem}
            onClear={() => setSelectedItem(null)}
            onActionComplete={() => {
                setSelectedItem(null);
                loadTableData();
            }}
          />
      </div>
    </div>
  );
};

// --- STYLES ---
const styles = {
    container: { padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1200px', margin: 'auto', backgroundColor: '#f9f9f9' },
    card: {
        backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', marginBottom: '2rem'
    },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
    toggleContainer: { display: 'flex', border: '1px solid #ccc', borderRadius: '5px' },
    toggle: { padding: '8px 16px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555' },
    toggleActive: { padding: '8px 16px', border: 'none', backgroundColor: '#005826', color: 'white', cursor: 'pointer', borderRadius: '4px' },
    tabs: { display: 'flex', borderBottom: '2px solid #eee' },
    tab: {
        padding: '10px 20px', cursor: 'pointer', border: 'none', backgroundColor: 'transparent',
        fontSize: '1rem', color: '#555', borderBottom: '3px solid transparent'
    },
    activeTab: {
        borderBottom: '3px solid #005826', fontWeight: 'bold', color: '#000'
    },
    content: { paddingTop: '1.5rem' }
};

export default DevToolsPage;