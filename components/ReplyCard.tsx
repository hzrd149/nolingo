import Link from "next/link";
import ISO6391 from "iso-639-1";

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
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    }
  };

  const getLanguageName = (code: string) => {
    const languageName = ISO6391.getName(code);
    return languageName || code.toUpperCase();
  };

  return (
    <div className="card bg-base-100 border border-base-300 ml-8">
      <div className="card-body p-4">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar">
            <div className="w-8 h-8 rounded-full bg-secondary text-secondary-content flex items-center justify-center text-xs font-semibold">
              {reply.author.display_name?.[0]?.toUpperCase() ||
                reply.author.username[0]?.toUpperCase() ||
                "?"}
            </div>
          </div>
          <div className="flex-1">
            <Link
              href={`/profile/${reply.author.username}`}
              className="font-semibold text-sm text-base-content hover:text-primary transition-colors"
            >
              {reply.author.display_name || reply.author.username}
            </Link>
            <div className="text-xs text-base-content/60">
              {formatDate(reply.created_at)}
            </div>
          </div>
          {/* Language Badge */}
          <div className="badge badge-outline badge-sm">
            {getLanguageName(reply.language)}
          </div>
        </div>

        {/* Reply Content */}
        <div className="space-y-3">
          <p className="text-base-content/90 leading-relaxed">
            {reply.translation?.content || reply.content}
          </p>

          {reply.translation && (
            <div className="border-l-4 border-secondary pl-3 bg-base-200/30 p-3 rounded-r">
              <p className="text-sm text-base-content/80 leading-relaxed">
                {reply.content}
              </p>
              <p className="text-xs text-base-content/60 mt-2">
                Original {getLanguageName(reply.language)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
