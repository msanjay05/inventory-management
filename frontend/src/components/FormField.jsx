import './FormField.css';

export default function FormField({ label, error, required, children }) {
  return (
    <div className="form-field">
      {label && (
        <label className="form-label">
          {required && <span className="form-required">*</span>}
          {label}
        </label>
      )}
      {children}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
