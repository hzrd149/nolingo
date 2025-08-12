import { useState } from "react";
import {
  validatePassword,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from "@/lib/password-validation";

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  helperText?: string;
  showStrengthIndicator?: boolean;
  currentPassword?: string; // For validation against current password
}

export default function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  helperText,
  showStrengthIndicator = false,
  currentPassword,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Validate password if strength indicator is shown
  const validation =
    showStrengthIndicator && value
      ? validatePassword(value, currentPassword)
      : null;

  const inputClasses = `
    w-full min-h-[44px] px-4 py-3 pr-12 rounded-lg border transition-colors
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
    <div className="space-y-2">
      <label className="block text-sm font-medium text-base-content">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClasses}
          disabled={disabled}
          required={required}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {/* Password visibility toggle */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-base-200 transition-colors"
          disabled={disabled}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <svg
              className="w-5 h-5 text-base-content/70"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-base-content/70"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Password strength indicator */}
      {showStrengthIndicator && value && validation && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-base-content/70">Strength:</span>
            <span
              className={`text-xs font-medium text-${getPasswordStrengthColor(validation.score)}`}
            >
              {getPasswordStrengthLabel(validation.score)}
            </span>
          </div>

          {/* Strength bar */}
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-1 flex-1 rounded-full ${
                  level < validation.score
                    ? `bg-${getPasswordStrengthColor(validation.score)}`
                    : "bg-base-300"
                }`}
              />
            ))}
          </div>

          {/* Validation errors */}
          {validation.errors.length > 0 && (
            <ul className="text-xs text-error space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index} className="flex items-center gap-2">
                  <svg
                    className="w-3 h-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Error message */}
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

      {/* Helper text */}
      {helperText && !error && (
        <p className="text-base-content/70 text-xs">{helperText}</p>
      )}
    </div>
  );
}
