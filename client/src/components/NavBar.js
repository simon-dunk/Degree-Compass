import React from 'react';

const NavBar = ({ currentPage, setCurrentPage }) => {
  const studentPages = { planner: 'Student Planner', schedule: 'Schedule Builder' };
  const adminPages = { rules: 'Rules Admin', 'student-manager': 'Student Manager' };
  const devPages = { dev: 'Developer Tools' };

  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>Degree Compass</div>
      <div style={styles.navSections}>
        {/* Student Section */}
        <div>
          {Object.entries(studentPages).map(([id, name]) => (
            <button key={id} onClick={() => setCurrentPage(id)} style={currentPage === id ? {...styles.button, ...styles.activeButton} : styles.button}>
              {name}
            </button>
          ))}
        </div>
        {/* Admin Section */}
        <div style={styles.sectionDivider}></div>
        <div>
          <span style={styles.sectionTitle}>Admin</span>
          {Object.entries(adminPages).map(([id, name]) => (
            <button key={id} onClick={() => setCurrentPage(id)} style={currentPage === id ? {...styles.button, ...styles.activeButton} : styles.button}>
              {name}
            </button>
          ))}
        </div>
        {/* Dev Section */}
        <div style={styles.sectionDivider}></div>
        <div>
           <span style={styles.sectionTitle}>Dev</span>
           {Object.entries(devPages).map(([id, name]) => (
            <button key={id} onClick={() => setCurrentPage(id)} style={currentPage === id ? {...styles.button, ...styles.activeButton} : styles.button}>
              {name}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

// Styles based on your StyleGuide.md
const styles = {
    nav: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 2rem',
        backgroundColor: '#ffffff', // --background-color
        borderBottom: '1px solid #eee',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    logo: {
        fontWeight: 'bold',
        fontSize: '1.5rem',
        color: '#005826', // --primary-color
    },
    button: {
        padding: '1.5rem 1rem',
        border: 'none',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        fontSize: '1rem',
        color: '#555555', // --secondary-light-color
        borderBottom: '4px solid transparent',
    },
    activeButton: {
        color: '#005826', // --primary-color
        borderBottom: '4px solid #005826',
    },
    navSections: { display: 'flex', alignItems: 'center' },
    sectionDivider: {
        height: '20px',
        width: '1px',
        backgroundColor: '#ccc',
        margin: '0 1rem'
    },
    sectionTitle: {
        marginRight: '1rem',
        color: '#888',
        fontSize: '0.9rem',
        fontWeight: 'bold',
    },
};

export default NavBar;