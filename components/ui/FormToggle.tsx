interface FormToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
}

export default function FormToggle({
  label,
  value,
  onChange,
  description,
  disabled = false,
  error,
  helperText,
}: FormToggleProps) {
  const toggleClasses = `
    toggle toggle-primary
    ${disabled ? "toggle-disabled" : ""}
    ${error ? "toggle-error" : ""}
  `.trim();

  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-base-content cursor-pointer">
            {label}
          </label>
          {description && (
            <p className="text-sm text-base-content/70 mt-1">{description}</p>
          )}
        </div>

        <div className="flex-shrink-0">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            className={toggleClasses}
            disabled={disabled}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-error text-xs">
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {helperText && !error && (
        <p className="text-base-content/70 text-xs">{helperText}</p>
      )}
    </div>
  );
}
