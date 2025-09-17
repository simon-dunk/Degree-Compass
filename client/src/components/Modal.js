import React from 'react';

const Modal = ({ isOpen, onClose, title, viewMode, onToggleView, children }) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2>{title}</h2>
          {/* --- New View Mode Toggle --- */}
          {onToggleView && (
            <div style={styles.toggleContainer}>
              <button onClick={() => onToggleView('styled')} style={viewMode === 'styled' ? styles.toggleActive : styles.toggle}>Styled</button>
              <button onClick={() => onToggleView('json')} style={viewMode === 'json' ? styles.toggleActive : styles.toggle}>JSON</button>
            </div>
          )}
          <button onClick={onClose} style={styles.closeButton}>&times;</button>
        </div>
        <div style={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    },
    modal: {
        backgroundColor: 'white', padding: '2rem', borderRadius: '8px',
        width: '80%', maxWidth: '700px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #ccc', paddingBottom: '1rem',
    },
    closeButton: {
        background: 'transparent', border: 'none', fontSize: '2rem', cursor: 'pointer', padding: '0 1rem'
    },
    content: {
        paddingTop: '1rem', maxHeight: '60vh', overflowY: 'auto'
    },
    toggleContainer: { display: 'flex', border: '1px solid #ccc', borderRadius: '5px' },
    toggle: { padding: '5px 10px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#555' },
    toggleActive: { padding: '5px 10px', border: 'none', backgroundColor: '#005826', color: 'white', cursor: 'pointer', borderRadius: '4px' },
};

export default Modal;