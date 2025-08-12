export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-4 strength score
  errors: string[];
  suggestions: string[];
}

export interface PasswordRequirement {
  test: (password: string) => boolean;
  message: string;
  weight: number; // For scoring
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    test: (password) => password.length >= 8,
    message: "At least 8 characters long",
    weight: 1,
  },
  {
    test: (password) => /[a-z]/.test(password),
    message: "At least one lowercase letter",
    weight: 1,
  },
  {
    test: (password) => /[A-Z]/.test(password),
    message: "At least one uppercase letter",
    weight: 1,
  },
  {
    test: (password) => /\d/.test(password),
    message: "At least one number",
    weight: 1,
  },
  {
    test: (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    message: "At least one special character (!@#$%^&*)",
    weight: 1,
  },
];

// Common weak passwords to avoid
const COMMON_PASSWORDS = [
  "password",
  "123456",
  "password123",
  "admin",
  "qwerty",
  "letmein",
  "welcome",
  "monkey",
  "dragon",
  "master",
];

/**
 * Validate password strength and requirements
 * @param password - Password to validate
 * @param currentPassword - Current password (to ensure new password is different)
 * @returns Validation result with score, errors, and suggestions
 */
export function validatePassword(
  password: string,
  currentPassword?: string,
): PasswordValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Check basic requirements
  for (const requirement of PASSWORD_REQUIREMENTS) {
    if (!requirement.test(password)) {
      errors.push(requirement.message);
    } else {
      score += requirement.weight;
    }
  }

  // Check if password is too common
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push("Password is too common");
    suggestions.push("Choose a more unique password");
  }

  // Check if password is same as current password
  if (currentPassword && password === currentPassword) {
    errors.push("New password must be different from current password");
    suggestions.push("Choose a password you haven't used before");
  }

  // Additional scoring based on complexity
  if (password.length >= 12) score += 0.5;
  if (password.length >= 16) score += 0.5;
  if (/[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\/'~`]/.test(password)) score += 0.5;

  // Normalize score to 0-4 range
  const normalizedScore = Math.min(4, Math.max(0, Math.floor(score)));

  // Add suggestions based on score
  if (normalizedScore < 2) {
    suggestions.push("Consider using a longer password");
    suggestions.push("Mix uppercase, lowercase, numbers, and symbols");
  } else if (normalizedScore < 3) {
    suggestions.push("Add more character variety for better security");
  }

  return {
    isValid: errors.length === 0,
    score: normalizedScore,
    errors,
    suggestions,
  };
}

/**
 * Get password strength label based on score
 * @param score - Password strength score (0-4)
 * @returns Human-readable strength label
 */
export function getPasswordStrengthLabel(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return "Very Weak";
    case 2:
      return "Weak";
    case 3:
      return "Good";
    case 4:
      return "Strong";
    default:
      return "Unknown";
  }
}

/**
 * Get password strength color for UI display
 * @param score - Password strength score (0-4)
 * @returns CSS class or color value
 */
export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0:
    case 1:
      return "error";
    case 2:
      return "warning";
    case 3:
      return "info";
    case 4:
      return "success";
    default:
      return "base-300";
  }
}
