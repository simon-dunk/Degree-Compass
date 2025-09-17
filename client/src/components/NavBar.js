import React from 'react';

const NavBar = ({ currentPage, setCurrentPage }) => {
  const pages = ['planner', 'rules', 'overrides', 'dev'];

  const getPageName = (pageId) => {
    switch (pageId) {
      case 'planner': return 'Student Planner';
      case 'rules': return 'Rules Admin';
      case 'overrides': return 'Overrides Admin';
      case 'dev': return 'Developer Tools';
      default: return '';
    }
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>Degree Compass</div>
      <div>
        {pages.map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            style={currentPage === page ? { ...styles.button, ...styles.activeButton } : styles.button}
          >
            {getPageName(page)}
          </button>
        ))}
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
    }
};

export default NavBar;