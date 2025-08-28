import { useState } from "react";
import { CloseIcon } from "../Icons";

interface HintModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  correctedText: string;
  explanation: string;
  onAccept: (correctedText: string) => void;
  onReject: () => void;
}

export default function HintModal({
  isOpen,
  onClose,
  originalText,
  correctedText,
  explanation,
  onAccept,
  onReject,
}: HintModalProps) {
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  const handleAccept = async () => {
    setIsApplying(true);
    try {
      onAccept(correctedText);
    } finally {
      setIsApplying(false);
      onClose();
    }
  };

  const handleReject = () => {
    onReject();
    onClose();
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-semibold text-lg mb-6 text-base-content">
          ✨ Writing hint
        </h3>

        {/* Original Text */}
        <div className="mb-6">
          <p className="font-semibold">Your original text:</p>
          <div className="bg-base-200 p-4 rounded-lg border border-base-300">
            <p className="text-base-content">{originalText}</p>
          </div>
        </div>

        {/* Corrected Text */}
        <div className="mb-6 space-y-1">
          <p className="font-semibold">Correction:</p>
          <div className="bg-base-100 p-4 rounded-lg border-2 border-success border-opacity-60">
            <p className="text-base-content">{correctedText}</p>
          </div>
        </div>

        {/* Explanation */}
        <div className="mb-8">
          <p className="font-semibold">Suggestion:</p>
          <div className="bg-base-200 p-4 rounded-lg border border-base-300">
            <p className="text-base-content leading-relaxed">{explanation}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="modal-action">
          <button
            type="button"
            className="btn btn-outline btn-neutral"
            onClick={handleReject}
            disabled={isApplying}
          >
            Keep Original
          </button>
          <button
            type="button"
            className={`btn btn-primary ${isApplying ? "loading" : ""}`}
            onClick={handleAccept}
            disabled={isApplying}
          >
            {isApplying ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Applying...
              </>
            ) : (
              "Use Correction"
            )}
          </button>
        </div>

        {/* Close button (X) */}
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-base-content hover:text-base-content"
          onClick={onClose}
          disabled={isApplying}
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
