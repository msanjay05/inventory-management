import { useEffect, useRef, useState } from 'react';
import { COUNTRIES, findCountryByDialCode } from '../data/countries';
import './CountryCodeSelect.css';

export default function CountryCodeSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  const selected = findCountryByDialCode(value) || COUNTRIES.find((c) => c.code === 'US');

  const query = search.trim().toLowerCase();
  const filtered = query
    ? COUNTRIES.filter(
        (country) =>
          country.name.toLowerCase().includes(query) ||
          country.dialCode.includes(query) ||
          country.code.toLowerCase().includes(query)
      )
    : COUNTRIES;

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    searchRef.current?.focus();

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSelect = (country) => {
    onChange(country.dialCode);
    setOpen(false);
    setSearch('');
  };

  return (
    <div className="country-select" ref={containerRef}>
      <button
        type="button"
        className="country-select-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="country-select-code">{selected.dialCode}</span>
        <span className="country-select-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="country-select-dropdown">
          <input
            ref={searchRef}
            type="text"
            className="country-select-search"
            placeholder="Search country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <ul className="country-select-list" role="listbox">
            {filtered.length === 0 ? (
              <li className="country-select-empty">No countries found</li>
            ) : (
              filtered.map((country) => (
                <li key={`${country.code}-${country.name}`}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={country.dialCode === value}
                    className={`country-select-option ${country.dialCode === value ? 'selected' : ''}`}
                    onClick={() => handleSelect(country)}
                  >
                    <span className="country-select-option-code">{country.dialCode}</span>
                    <span className="country-select-option-name">{country.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
