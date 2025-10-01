import React from 'react';

const ProgressBar = ({ value, max, height = '20px', color = '#005826' }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  const containerStyles = {
    height: height,
    width: '100%',
    backgroundColor: '#e0e0de',
    borderRadius: '50px',
    margin: '10px 0',
    overflow: 'hidden',
  };

  const fillerStyles = {
    height: '100%',
    width: `${percentage}%`,
    backgroundColor: color,
    borderRadius: 'inherit',
    textAlign: 'right',
    transition: 'width .2s ease-in',
  };

  const labelStyles = {
    padding: '5px',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '0.8rem',
  };

  return (
    <div style={containerStyles}>
      <div style={fillerStyles}>
        <span style={labelStyles}>{`${Math.round(percentage)}%`}</span>
      </div>
    </div>
  );
};

export default ProgressBar;