interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export default function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <section className="border-b border-base-300 pb-8 mb-8 last:border-b-0 last:pb-0 last:mb-0">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-base-content mb-2">
          {title}
        </h2>
        {description && (
          <p className="text-base-content/70 text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <div className="space-y-6">{children}</div>
    </section>
  );
}
