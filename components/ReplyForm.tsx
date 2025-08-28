import { useSession } from "next-auth/react";
import { useState } from "react";
import { ErrorIcon } from "./Icons";
import LanguageWarningModal from "./ui/LanguageWarningModal";
import TextareaWithHint from "./ui/TextareaWithHint";
import { getLanguageName } from "../lib/utils/language";

interface ReplyFormProps {
  postId: number;
  onReplyCreated: () => void;
}

export default function ReplyForm({ postId, onReplyCreated }: ReplyFormProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLanguageWarning, setShowLanguageWarning] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState("");
  const [pendingSubmission, setPendingSubmission] = useState<
    (() => void) | null
  >(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError("Reply content is required");
      return;
    }

    if (content.length > 256) {
      setError("Reply must be 256 characters or less");
      return;
    }

    // Check if content is in the learning language
    if (content.trim() && session?.user?.learning_language) {
      try {
        const response = await fetch("/api/translation/detect", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: content.trim() }),
        });

        if (response.ok) {
          const result = await response.json();
          const detectedLang = result.language.toLowerCase();
          const learningLang = session.user.learning_language.toLowerCase();

          // Check if detected language matches learning language
          if (detectedLang !== learningLang) {
            setDetectedLanguage(result.language);
            setShowLanguageWarning(true);
            setPendingSubmission(() => () => submitReply());
            return;
          }
        }
      } catch (error) {
        console.error("Language detection failed:", error);
        // Continue with submission if language detection fails
      }
    }

    // If no language warning needed, submit directly
    await submitReply();
  };

  const submitReply = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/post/${postId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to create reply");

      setContent("");
      onReplyCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) {
    return (
      <div className="mt-6 px-1 py-4 text-center border-t border-base-300">
        <p className="text-base-content/60 text-sm">
          <a href="/login" className="link link-primary">
            Sign in
          </a>{" "}
          to reply to this post
        </p>
      </div>
    );
  }

  return (
    <div className="px-1 py-2">
      <h3 className="font-medium text-base-content mb-3">Write a reply</h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="form-control">
          <TextareaWithHint
            value={content}
            onChange={setContent}
            placeholder={`Write your reply in ${getLanguageName(session.user?.learning_language)}...`}
            disabled={isSubmitting}
            maxLength={256}
          />
          <div className="label">{content.length}/256 characters</div>
        </div>

        {error && (
          <div className="alert alert-error">
            <ErrorIcon />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className={`btn btn-primary ${isSubmitting ? "loading" : ""}`}
            disabled={isSubmitting || !content.trim()}
          >
            {isSubmitting ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Posting...
              </>
            ) : (
              "Post Reply"
            )}
          </button>
        </div>
      </form>

      <LanguageWarningModal
        isOpen={showLanguageWarning}
        onClose={() => {
          setShowLanguageWarning(false);
          setPendingSubmission(null);
        }}
        onPostAnyway={() => {
          setShowLanguageWarning(false);
          if (pendingSubmission) {
            pendingSubmission();
          }
        }}
        detectedLanguage={detectedLanguage}
        learningLanguage={session?.user?.learning_language || ""}
        content={content}
      />
    </div>
  );
}
