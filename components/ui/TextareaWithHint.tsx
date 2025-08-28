import { useState } from "react";
import HintModal from "./HintModal";

interface TextareaWithHintProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
  rows?: number;
  required?: boolean;
}

interface CorrectionResponse {
  originalText: string;
  correctedText: string;
  explanation: string;
  learningLanguage?: string;
}

export default function TextareaWithHint({
  value,
  onChange,
  placeholder,
  disabled,
  maxLength,
  className = "textarea textarea-bordered w-full min-h-24 resize-none rounded-lg",
  rows,
  required,
}: TextareaWithHintProps) {
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [correctionData, setCorrectionData] =
    useState<CorrectionResponse | null>(null);

  const handleGetHint = async () => {
    if (!value.trim()) {
      setHintError("Please enter some text first");
      return;
    }

    setIsLoadingHint(true);
    setHintError(null);

    try {
      const response = await fetch("/api/corrections/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: value }),
      });

      // Always try to parse the response as JSON to get the error message
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If we can't parse JSON, use a generic error message
        throw new Error(
          `Server error (${response.status}): Unable to get hint`,
        );
      }

      if (!response.ok) {
        // Use the error message from the API response
        const errorMessage = data.error || `Server error (${response.status})`;
        throw new Error(errorMessage);
      }

      setCorrectionData(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Hint error:", error);

      // Handle different types of errors with user-friendly messages
      let errorMessage = "Failed to get hint";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      // Handle network errors specifically
      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage =
          "Unable to connect to the hint service. Please check your internet connection.";
      }

      setHintError(errorMessage);
    } finally {
      setIsLoadingHint(false);
    }
  };

  const handleAcceptCorrection = (correctedText: string) => {
    onChange(correctedText);
    setIsModalOpen(false);
    setCorrectionData(null);
  };

  const handleRejectCorrection = () => {
    setIsModalOpen(false);
    setCorrectionData(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCorrectionData(null);
  };

  const clearError = () => {
    setHintError(null);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          className={className}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || isLoadingHint}
          maxLength={maxLength}
          rows={rows}
          required={required}
          onClick={clearError}
          onFocus={clearError}
        />

        {/* Hint Button */}
        <button
          type="button"
          className={`btn btn-secondary btn-sm absolute bottom-2 right-2 ${isLoadingHint ? "loading" : ""}`}
          onClick={handleGetHint}
          disabled={disabled || isLoadingHint || !value.trim()}
          title="Get writing hints"
        >
          {isLoadingHint ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              Getting hint...
            </>
          ) : (
            <>✨ Hint</>
          )}
        </button>
      </div>

      {/* Error Message */}
      {hintError && (
        <div className="alert alert-error alert-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm">{hintError}</span>
          <button
            type="button"
            className="btn btn-xs btn-ghost"
            onClick={clearError}
          >
            ✕
          </button>
        </div>
      )}

      {/* Hint Modal */}
      {correctionData && (
        <HintModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          originalText={correctionData.originalText}
          correctedText={correctionData.correctedText}
          explanation={correctionData.explanation}
          onAccept={handleAcceptCorrection}
          onReject={handleRejectCorrection}
        />
      )}
    </div>
  );
}
