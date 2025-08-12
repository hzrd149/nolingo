import { useState } from "react";
import { useSession } from "next-auth/react";

interface ReplyFormProps {
  postId: number;
  onReplyCreated: () => void;
}

export default function ReplyForm({ postId, onReplyCreated }: ReplyFormProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      if (!response.ok) {
        throw new Error(data.error || "Failed to create reply");
      }

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
      <div className="card bg-base-100 border border-base-300 mt-6">
        <div className="card-body p-4 text-center">
          <p className="text-base-content/60">
            <a href="/login" className="link link-primary">
              Sign in
            </a>{" "}
            to reply to this post
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 border border-base-300 mt-6">
      <div className="card-body p-4">
        <h3 className="font-semibold text-base-content mb-3">Write a reply</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <textarea
              className="textarea textarea-bordered w-full min-h-24 resize-none"
              placeholder={`Write your reply in ${session.user?.learning_language?.toUpperCase() || "your learning language"}...`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
              maxLength={256}
            />
            <div className="label">
              <span className="label-text-alt text-base-content/60">
                {content.length}/256 characters
              </span>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
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
              <span>{error}</span>
            </div>
          )}

          <div className="card-actions justify-end">
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
      </div>
    </div>
  );
}
