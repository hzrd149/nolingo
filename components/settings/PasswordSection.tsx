import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import PasswordField from "@/components/ui/PasswordField";
import LoadingButton from "@/components/ui/LoadingButton";
import SettingsSection from "./SettingsSection";
import { validatePassword } from "@/lib/password-validation";

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function PasswordSection() {
  const { setMessage } = useSettings();

  const [passwords, setPasswords] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<PasswordFormData>>({});

  const updatePassword = (field: keyof PasswordFormData, value: string) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PasswordFormData> = {};
    let isValid = true;

    // Validate required fields
    if (!passwords.currentPassword) {
      newErrors.currentPassword = "Current password is required";
      isValid = false;
    }

    if (!passwords.newPassword) {
      newErrors.newPassword = "New password is required";
      isValid = false;
    }

    if (!passwords.confirmPassword) {
      newErrors.confirmPassword = "Password confirmation is required";
      isValid = false;
    }

    // Validate password match
    if (passwords.newPassword && passwords.confirmPassword) {
      if (passwords.newPassword !== passwords.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
        isValid = false;
      }
    }

    // Validate new password strength (if provided)
    if (passwords.newPassword) {
      const validation = validatePassword(
        passwords.newPassword,
        passwords.currentPassword,
      );
      if (!validation.isValid) {
        newErrors.newPassword = validation.errors.join(", ");
        isValid = false;
      }
    }

    // Check if new password is same as current
    if (
      passwords.currentPassword &&
      passwords.newPassword &&
      passwords.currentPassword === passwords.newPassword
    ) {
      newErrors.newPassword =
        "New password must be different from current password";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwords),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Password changed successfully! Please use your new password for future logins.",
        });

        // Clear form
        setPasswords({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setErrors({});
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to change password. Please try again.",
        });

        // Show field-specific errors if available
        if (data.errors && Array.isArray(data.errors)) {
          setErrors({ newPassword: data.errors.join(", ") });
        }
      }
    } catch (error) {
      console.error("Password change error:", error);
      setMessage({
        type: "error",
        text: "An error occurred while changing your password. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SettingsSection
      title="Change Password"
      description="Update your account password. Make sure to use a strong, unique password that you haven't used elsewhere."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <PasswordField
            label="Current Password"
            value={passwords.currentPassword}
            onChange={(value) => updatePassword("currentPassword", value)}
            placeholder="Enter your current password"
            required
            error={errors.currentPassword}
            disabled={isLoading}
            helperText="We need your current password to verify it's really you"
          />

          <PasswordField
            label="New Password"
            value={passwords.newPassword}
            onChange={(value) => updatePassword("newPassword", value)}
            placeholder="Enter your new password"
            required
            error={errors.newPassword}
            disabled={isLoading}
            showStrengthIndicator={true}
            currentPassword={passwords.currentPassword}
            helperText="Choose a strong password with at least 8 characters"
          />

          <PasswordField
            label="Confirm New Password"
            value={passwords.confirmPassword}
            onChange={(value) => updatePassword("confirmPassword", value)}
            placeholder="Confirm your new password"
            required
            error={errors.confirmPassword}
            disabled={isLoading}
            helperText="Re-enter your new password to confirm"
          />
        </div>

        {/* Security Notice */}
        <div className="bg-info/10 border border-info/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-info flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm">
              <p className="font-medium text-info mb-1">Security Tips</p>
              <ul className="text-base-content/70 space-y-1">
                <li>• Use a unique password that you don't use elsewhere</li>
                <li>
                  • Include a mix of uppercase, lowercase, numbers, and symbols
                </li>
                <li>
                  • Consider using a password manager to generate and store
                  strong passwords
                </li>
                <li>• Avoid using personal information or common words</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <LoadingButton
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={
              isLoading ||
              !passwords.currentPassword ||
              !passwords.newPassword ||
              !passwords.confirmPassword
            }
          >
            Change Password
          </LoadingButton>
        </div>
      </form>
    </SettingsSection>
  );
}
