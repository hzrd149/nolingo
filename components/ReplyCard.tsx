import { useState } from "react";
import { formatDate } from "../lib/utils/date";
import { getLanguageName } from "../lib/utils/language";

interface Reply {
  id: number;
  post_id: number;
  content: string;
  language: string;
  created_at: string;
  author: {
    id: number;
    username: string;
    display_name?: string;
    picture_id?: number;
  };
  translation?: {
    id: number;
    content: string;
    language: string;
  };
}

interface ReplyCardProps {
  reply: Reply;
}

export default function ReplyCard({ reply }: ReplyCardProps) {
  const [showOriginalLanguage, setShowOriginalLanguage] = useState(false);

  return (
    <div className="py-3 px-1 border-b border-base-300 last:border-b-0">
      {/* User Info */}
      <div className="flex items-center gap-2 mb-2">
        <div className="avatar">
          <div className="w-7 h-7 rounded-full bg-secondary text-secondary-content flex items-center justify-center text-xs font-semibold">
            {reply.author.display_name?.[0]?.toUpperCase() ||
              reply.author.username[0]?.toUpperCase() ||
              "?"}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm text-base-content  block truncate">
            {reply.author.display_name || reply.author.username}
          </span>
          <div className="text-xs text-base-content/60">
            {formatDate(reply.created_at)}
          </div>
        </div>
        {/* Language Badge */}
        {reply.translation && (
          <button
            className="btn btn-sm btn-link shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setShowOriginalLanguage(!showOriginalLanguage);
            }}
          >
            Show{" "}
            {showOriginalLanguage
              ? getLanguageName(reply.translation.language)
              : getLanguageName(reply.language)}
          </button>
        )}
      </div>

      {/* Reply Content */}
      <div className="space-y-2">
        {reply.translation && showOriginalLanguage ? (
          <div className="border-l-4 border-secondary pl-3 bg-base-200/30 p-2">
            <p>{reply.content}</p>
          </div>
        ) : (
          <p>{reply.translation?.content || reply.content}</p>
        )}
      </div>
    </div>
  );
}
