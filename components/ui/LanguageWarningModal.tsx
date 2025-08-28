import { getLanguageName } from "../../lib/utils/language";

interface LanguageWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostAnyway: () => void;
  detectedLanguage: string;
  learningLanguage: string;
  content: string;
}

export default function LanguageWarningModal({
  isOpen,
  onClose,
  onPostAnyway,
  detectedLanguage,
  learningLanguage,
  content,
}: LanguageWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg text-warning mb-4">
          ⚠️ Language Mismatch Detected
        </h3>

        <div className="space-y-3">
          <p className="text-base-content">
            Your content appears to be in{" "}
            <strong>{getLanguageName(detectedLanguage)}</strong>, but you're
            learning <strong>{getLanguageName(learningLanguage)}</strong>.
          </p>

          <div className="bg-base-200 p-3 rounded-lg">
            <p className="text-sm text-base-content/70 mb-2">
              Content preview:
            </p>
            <p className="text-sm font-mono bg-base-100 p-2 rounded border">
              {content.length > 100
                ? `${content.substring(0, 100)}...`
                : content}
            </p>
          </div>

          <p className="text-sm text-base-content/60">
            For the best learning experience, try writing in{" "}
            {getLanguageName(learningLanguage)}. You can still post this content
            if you prefer.
          </p>
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-warning" onClick={onPostAnyway}>
            Post Anyway
          </button>
        </div>
      </div>

      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}
