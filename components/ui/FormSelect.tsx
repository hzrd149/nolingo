import { useState } from "react";

interface FormSelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FormSelectOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  helperText?: string;
  searchable?: boolean;
}

export default function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  required = false,
  error,
  disabled = false,
  helperText,
  searchable = false,
}: FormSelectProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = searchable
    ? options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : options;

  const selectedOption = options.find((option) => option.value === value);

  const selectClasses = `
    w-full min-h-[44px] px-4 py-3 rounded-lg border transition-colors appearance-none
    bg-base-100 text-base-content cursor-pointer
    ${
      error
        ? "border-error focus:border-error focus:ring-2 focus:ring-error/20"
        : "border-base-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
    }
    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
    ${isFocused ? "ring-2" : ""}
  `.trim();

  if (searchable) {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-base-content">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>

        <div className="relative">
          <input
            type="text"
            value={searchTerm || selectedOption?.label || ""}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className={selectClasses}
            disabled={disabled}
            required={required}
            onFocus={() => {
              setIsFocused(true);
              setIsOpen(true);
            }}
            onBlur={() => {
              setIsFocused(false);
              setTimeout(() => setIsOpen(false), 200);
            }}
          />

          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-base-content/70 text-sm">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="w-full px-4 py-3 text-left hover:bg-base-200 focus:bg-base-200 focus:outline-none text-sm"
                    onClick={() => {
                      onChange(option.value);
                      setSearchTerm("");
                      setIsOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                ))
              )}
            </div>
          )}

          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-base-content/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
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

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-base-content">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={selectClasses}
          disabled={disabled}
          required={required}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className="w-5 h-5 text-base-content/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
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
