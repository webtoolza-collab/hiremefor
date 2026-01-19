import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Autocomplete.css';

// Helper function to check if input matches the start of any word in the option name
function matchesStartOfWord(optionName, searchText) {
  const search = searchText.toLowerCase();
  const words = optionName.toLowerCase().split(/\s+/);
  return words.some(word => word.startsWith(search));
}

// Helper function to highlight matching text at the start of words
function highlightMatch(text, search) {
  if (!search) return text;

  const searchLower = search.toLowerCase();
  const words = text.split(/(\s+)/); // Split but keep spaces

  return words.map((word, idx) => {
    if (word.match(/^\s+$/)) return word; // Return spaces as-is

    if (word.toLowerCase().startsWith(searchLower)) {
      const matchLength = search.length;
      return (
        <span key={idx}>
          <span className="autocomplete-highlight">{word.substring(0, matchLength)}</span>
          {word.substring(matchLength)}
        </span>
      );
    }
    return word;
  });
}

function Autocomplete({
  label,
  options,
  value,
  onChange,
  placeholder = 'Search...',
  allLabel = 'All',
  minChars = 1
}) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Find the selected option's name
  useEffect(() => {
    if (value) {
      const selected = options.find(opt => opt.id.toString() === value.toString());
      setInputValue(selected ? selected.name : '');
    } else {
      setInputValue('');
    }
  }, [value, options]);

  // Filter options based on input - match from start of words
  useEffect(() => {
    if (inputValue && !value) {
      const filtered = options.filter(opt =>
        matchesStartOfWord(opt.name, inputValue)
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
    // Reset highlighted index when options change
    setHighlightedIndex(-1);
  }, [inputValue, options, value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('.autocomplete-option');
      // Account for the "All" option at index 0
      const targetIndex = highlightedIndex + 1;
      if (items[targetIndex]) {
        items[targetIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Only show dropdown after minimum characters typed
    if (newValue.length >= minChars) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }

    // Clear selection when typing
    if (value) {
      onChange('');
    }
    setHighlightedIndex(-1);
  };

  const handleSelect = useCallback((option) => {
    if (option === null) {
      // "All" selected
      onChange('');
      setInputValue('');
    } else {
      onChange(option.id.toString());
      setInputValue(option.name);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, [onChange]);

  const handleFocus = () => {
    // Only show dropdown on focus if there's enough text
    if (inputValue.length >= minChars) {
      setIsOpen(true);
    }
  };

  const handleClear = () => {
    onChange('');
    setInputValue('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      // If dropdown is closed, open it on arrow down
      if (e.key === 'ArrowDown' && inputValue.length >= minChars) {
        setIsOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    const totalOptions = filteredOptions.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < totalOptions - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : -1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex === -1) {
          // Select "All" option
          handleSelect(null);
        } else if (highlightedIndex >= 0 && highlightedIndex < totalOptions) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        // Close dropdown on tab but allow default behavior
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Determine if we should show the dropdown
  const shouldShowDropdown = isOpen && inputValue.length >= minChars;

  return (
    <div className="autocomplete-wrapper" ref={wrapperRef}>
      {label && <label className="autocomplete-label">{label}</label>}
      <div className="autocomplete-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="autocomplete-input"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={label}
          aria-expanded={shouldShowDropdown}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          role="combobox"
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
      {shouldShowDropdown && (
        <ul className="autocomplete-dropdown" ref={listRef} role="listbox">
          <li
            className={`autocomplete-option ${highlightedIndex === -1 ? 'highlighted' : ''} ${!value ? 'selected' : ''}`}
            onClick={() => handleSelect(null)}
            role="option"
            aria-selected={!value}
          >
            {allLabel}
          </li>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <li
                key={option.id}
                className={`autocomplete-option ${highlightedIndex === index ? 'highlighted' : ''} ${value === option.id.toString() ? 'selected' : ''}`}
                onClick={() => handleSelect(option)}
                role="option"
                aria-selected={value === option.id.toString()}
              >
                {highlightMatch(option.name, inputValue)}
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
