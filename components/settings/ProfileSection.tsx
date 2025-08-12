import { useSettings } from "@/contexts/SettingsContext";
import FormField from "@/components/ui/FormField";
import FormTextarea from "@/components/ui/FormTextarea";
import FormSelect from "@/components/ui/FormSelect";
import LoadingButton from "@/components/ui/LoadingButton";
import SettingsSection from "./SettingsSection";
import ISO6391 from "iso-639-1";

const LANGUAGE_OPTIONS = ISO6391.getAllNames()
  .map((name) => ({
    value: ISO6391.getCode(name),
    label: name,
  }))
  .filter((lang) => lang.value) // Filter out any undefined codes
  .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically by name

export default function ProfileSection() {
  const { settings, updateSetting, saveSettings, isLoading } = useSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSettings();
  };

  return (
    <SettingsSection
      title="Profile Information"
      description="Update your personal information and preferences. This information helps us personalize your learning experience."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FormField
          label="Display Name"
          value={settings.display_name}
          onChange={(value) => updateSetting("display_name", value)}
          placeholder="Enter your full name"
          helperText="This is how your name will appear to other users"
        />

        <FormField
          label="Location"
          value={settings.location}
          onChange={(value) => updateSetting("location", value)}
          placeholder="City, Country"
          helperText="Optional - helps connect you with local learners"
        />

        <FormField
          label="Website"
          value={settings.website}
          onChange={(value) => updateSetting("website", value)}
          placeholder="https://yourwebsite.com"
          type="url"
          helperText="Share your personal website or portfolio"
        />

        <FormSelect
          label="Learning Language"
          value={settings.learning_language}
          onChange={(value) => updateSetting("learning_language", value)}
          options={LANGUAGE_OPTIONS}
          placeholder="Select a language"
          searchable={true}
          helperText="Choose the primary language you're learning"
        />
      </div>

      <FormTextarea
        label="About"
        value={settings.about}
        onChange={(value) => updateSetting("about", value)}
        placeholder="Tell us about yourself, your learning goals, interests..."
        maxLength={500}
        rows={4}
        helperText="Share a bit about yourself and your language learning journey"
      />

      {/* Save Button */}
      <form onSubmit={handleSubmit}>
        <div className="flex justify-end pt-4">
          <LoadingButton
            type="submit"
            variant="primary"
            loading={isLoading}
            disabled={isLoading}
          >
            Save Profile Settings
          </LoadingButton>
        </div>
      </form>
    </SettingsSection>
  );
}
