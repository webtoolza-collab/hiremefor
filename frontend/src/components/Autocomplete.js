import React, { useState, useRef, useEffect } from 'react';
import './Autocomplete.css';

function Autocomplete({
  label,
  options,
  value,
  onChange,
  placeholder = 'Search...',
  allLabel = 'All'
}) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const wrapperRef = useRef(null);

  // Find the selected option's name
  useEffect(() => {
    if (value) {
      const selected = options.find(opt => opt.id.toString() === value.toString());
      setInputValue(selected ? selected.name : '');
    } else {
      setInputValue('');
    }
  }, [value, options]);

  // Filter options based on input
  useEffect(() => {
    if (inputValue && !value) {
      const filtered = options.filter(opt =>
        opt.name.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [inputValue, options, value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    // Clear selection when typing
    if (value) {
      onChange('');
    }
  };

  const handleSelect = (option) => {
    if (option === null) {
      // "All" selected
      onChange('');
      setInputValue('');
    } else {
      onChange(option.id.toString());
      setInputValue(option.name);
    }
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleClear = () => {
    onChange('');
    setInputValue('');
    setIsOpen(false);
  };

  return (
    <div className="autocomplete-wrapper" ref={wrapperRef}>
      {label && <label className="autocomplete-label">{label}</label>}
      <div className="autocomplete-input-wrapper">
        <input
          type="text"
          className="autocomplete-input"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          aria-label={label}
        />
        {(inputValue || value) && (
          <button
            type="button"
            className="autocomplete-clear"
            onClick={handleClear}
            aria-label="Clear selection"
          >
            ×
          </button>
        )}
      </div>
      {isOpen && (
        <ul className="autocomplete-dropdown">
          <li
            className={`autocomplete-option ${!value ? 'selected' : ''}`}
            onClick={() => handleSelect(null)}
          >
            {allLabel}
          </li>
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <li
                key={option.id}
                className={`autocomplete-option ${value === option.id.toString() ? 'selected' : ''}`}
                onClick={() => handleSelect(option)}
              >
                {option.name}
              </li>
            ))
          ) : (
            <li className="autocomplete-no-results">No matches found</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default Autocomplete;
