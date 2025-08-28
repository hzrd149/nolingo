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
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
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
