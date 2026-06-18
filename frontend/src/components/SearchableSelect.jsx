import { useCallback, useEffect, useRef, useState } from 'react';
import './SearchableSelect.css';

const DEFAULT_DEBOUNCE_MS = 300;

export default function SearchableSelect({
  value,
  onChange,
  onSearch,
  resolveOption,
  placeholder = 'Search...',
  emptyMessage = 'No results found',
  hintMessage = 'Start typing to search...',
  debounceMs = DEFAULT_DEBOUNCE_MS,
  minSearchLength = 1,
  getLabel,
  getValue,
  renderOption,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const requestIdRef = useRef(0);

  const loadSelectedOption = useCallback(async () => {
    if (!value || !resolveOption) {
      setSelectedOption(null);
      return;
    }
    try {
      const option = await resolveOption(value);
      setSelectedOption(option);
    } catch {
      setSelectedOption(null);
    }
  }, [value, resolveOption]);

  useEffect(() => {
    loadSelectedOption();
  }, [loadSelectedOption]);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
        setSearch('');
        setOptions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    searchRef.current?.focus();

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const query = search.trim();
    if (query.length < minSearchLength) {
      setOptions([]);
      setLoading(false);
      return undefined;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const results = await onSearch(query);
        if (requestId === requestIdRef.current) {
          setOptions(results);
        }
      } catch {
        if (requestId === requestIdRef.current) {
          setOptions([]);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [search, open, onSearch, debounceMs, minSearchLength]);

  const handleSelect = (option) => {
    onChange(String(getValue(option)));
    setSelectedOption(option);
    setOpen(false);
    setSearch('');
    setOptions([]);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSelectedOption(null);
    setSearch('');
    setOptions([]);
  };

  const showHint = open && search.trim().length < minSearchLength;
  const showEmpty = open && !loading && !showHint && options.length === 0;

  return (
    <div className="searchable-select" ref={containerRef}>
      <button
        type="button"
        className={`searchable-select-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={selectedOption ? 'searchable-select-value' : 'searchable-select-placeholder'}>
          {selectedOption ? getLabel(selectedOption) : placeholder}
        </span>
        <span className="searchable-select-actions">
          {selectedOption && (
            <span className="searchable-select-clear" onClick={handleClear} role="presentation">
              ×
            </span>
          )}
          <span className="searchable-select-chevron">{open ? '▲' : '▼'}</span>
        </span>
      </button>

      {open && (
        <div className="searchable-select-dropdown">
          <input
            ref={searchRef}
            type="text"
            className="searchable-select-search"
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ul className="searchable-select-list" role="listbox">
            {loading && <li className="searchable-select-empty">Searching...</li>}
            {showHint && !loading && (
              <li className="searchable-select-empty">{hintMessage}</li>
            )}
            {showEmpty && <li className="searchable-select-empty">{emptyMessage}</li>}
            {!loading &&
              options.map((option) => (
                <li key={getValue(option)}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={String(getValue(option)) === String(value)}
                    className={`searchable-select-option ${
                      String(getValue(option)) === String(value) ? 'selected' : ''
                    }`}
                    onClick={() => handleSelect(option)}
                  >
                    {renderOption ? renderOption(option) : getLabel(option)}
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
