import { useState } from "react";

interface FormTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  helperText?: string;
  maxLength?: number;
  rows?: number;
}

export default function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  helperText,
  maxLength,
  rows = 4,
}: FormTextareaProps) {
  const [isFocused, setIsFocused] = useState(false);

  const textareaClasses = `
    w-full px-4 py-3 rounded-lg border transition-colors resize-none
    bg-base-100 text-base-content placeholder:text-base-content/50
    ${
      error
        ? "border-error focus:border-error focus:ring-2 focus:ring-error/20"
        : "border-base-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
    }
    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
    ${isFocused ? "ring-2" : ""}
  `.trim();

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-base-content">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={textareaClasses}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        rows={rows}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
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

        {maxLength && (
          <div className="text-xs text-base-content/50 flex-shrink-0">
            {value.length}/{maxLength}
          </div>
        )}
      </div>
    </div>
  );
}
