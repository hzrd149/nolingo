import Link from "next/link";
import ISO6391 from "iso-639-1";

interface Post {
  id: number;
  content: string;
  language: string;
  created_at: string;
  author: {
    id: number;
    username: string;
    display_name?: string;
    picture_id?: number;
  };
  picture: {
    id: number;
    thumbnail_url: string;
    original_url: string;
  };
  translation?: {
    id: number;
    content: string;
    language: string;
  };
}

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
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
    <Link href={`/post/${post.id}`} className="block">
      <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
        {/* Post Image */}
        <div className="relative">
          <img
            src={post.picture.original_url}
            alt="Post image"
            className="w-full h-auto max-h-96 object-contain bg-base-200"
          />
          {/* Language Badge */}
          <div className="absolute top-3 right-3">
            <div className="badge badge-primary">
              {getLanguageName(post.language)}
            </div>
          </div>
        </div>

        <div className="card-body p-4">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-3">
            <div className="avatar">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-semibold">
                {post.author.display_name?.[0]?.toUpperCase() ||
                  post.author.username[0]?.toUpperCase() ||
                  "?"}
              </div>
            </div>
            <div className="flex-1">
              <Link
                href={`/profile/${post.author.username}`}
                className="font-semibold text-base-content hover:text-primary transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {post.author.display_name || post.author.username}
              </Link>
              <div className="text-xs text-base-content/60">
                {formatDate(post.created_at)}
              </div>
            </div>
          </div>

          {/* Post Content */}
          <p className="text-base-content/80 leading-relaxed text-lg">
            {post.translation?.content || post.content}
          </p>

          {/* Post Actions */}
          <div className="card-actions justify-end">
            <button
              className="btn btn-ghost btn-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Reply
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
