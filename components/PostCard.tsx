import Link from "next/link";
import { PostWithReplyCount } from "../lib/posts";
import { formatDate } from "../lib/utils/date";
import { getLanguageName } from "../lib/utils/language";
import UserAvatar from "./UserAvatar";

interface PostCardProps {
  post: PostWithReplyCount;
  showReplyCount?: boolean;
}

export default function PostCard({
  post,
  showReplyCount = true,
}: PostCardProps) {
  return (
    <Link
      href={`/post/${post.id}`}
      className="block bg-base-100 hover:bg-base-200 transition-colors  border-b border-base-300 pb-4 mb-4"
    >
      {/* Post Image - Full width */}
      <div className="relative mb-3">
        <img
          src={post.picture.thumbnail_url}
          alt="Post image"
          className="w-full h-auto max-h-96 object-contain bg-base-200 rounded-lg"
        />
        {/* Language Badge */}
        <div className="absolute top-2 right-2">
          <div className="badge badge-primary text-xs">
            {getLanguageName(post.language)}
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3 mb-3 px-2">
        <UserAvatar user={post.author} size="size-8" />
        <div className="flex-1">
          <span
            className="font-medium text-base-content text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {post.author.display_name || post.author.username}
          </span>
          <div className="text-xs text-base-content/60">
            {formatDate(post.created_at)}
          </div>
        </div>
      </div>

      {/* Post Content */}
      <p className="text-base-content/90 leading-relaxed mb-3 px-2 text-2xl">
        {post.translation?.content || post.content}
      </p>

      {/* Post Actions */}
      <div className="flex justify-between items-center px-2">
        {showReplyCount && post.replyCount !== undefined && (
          <span className="text-sm text-base-content/60">
            {post.replyCount} {post.replyCount === 1 ? "reply" : "replies"}
          </span>
        )}
      </div>
    </Link>
  );
}
