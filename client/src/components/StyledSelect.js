import React from 'react';

const StyledSelect = ({ children, ...props }) => {
  return (
    <div className="styled-select-wrapper">
      <select className="styled-select" {...props}>
        {children}
      </select>
    </div>
  );
};

export default StyledSelect;