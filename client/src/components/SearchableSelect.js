import React, { useState, useMemo } from 'react';
import StyledSelect from './StyledSelect';
import StyledInput from './StyledInput';

const SearchableSelect = ({ options, value, onChange, placeholder }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchTerm) {
      return options;
    }
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  return (
    <div>
      <StyledInput
        type="text"
        placeholder={placeholder || "Search..."}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: '10px' }}
      />
      <StyledSelect value={value} onChange={onChange}>
        <option value="">-- Select an option --</option>
        {filteredOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </StyledSelect>
    </div>
  );
};

export default SearchableSelect;