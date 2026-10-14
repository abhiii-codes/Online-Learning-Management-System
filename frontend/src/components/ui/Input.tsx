import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full text-left">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-ink mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`w-full px-3 py-1.5 text-sm bg-surface text-ink border rounded-control transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 placeholder:text-muted/60 disabled:opacity-50 disabled:bg-paper ${
          error ? 'border-status-full' : 'border-line focus-visible:border-accent'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-status-full mt-1">{error}</p>}
      {!error && helperText && <p className="text-xs text-muted mt-1">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';
