import ISO6391 from "iso-639-1";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";

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

interface PostPageProps {
  post: Post;
}

export default function PostPage({ post }: PostPageProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLanguageName = (code: string) => {
    const languageName = ISO6391.getName(code);
    return languageName || code.toUpperCase();
  };

  if (router.isFallback) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-base-content mb-4">
            Post not found
          </h1>
          <button onClick={() => router.push("/")} className="btn btn-primary">
            Go back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="btn btn-ghost btn-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
        </div>

        {/* Post content */}
        <div className="card bg-base-100 shadow-lg">
          {/* Post Image */}
          <div className="relative">
            <img
              src={post.picture.original_url}
              alt="Post image"
              className="w-full h-auto max-h-[70vh] object-contain bg-base-200"
            />
            {/* Language Badge */}
            <div className="absolute top-4 right-4">
              <div className="badge badge-primary badge-lg">
                {getLanguageName(post.language)}
              </div>
            </div>
          </div>

          <div className="card-body p-6">
            {/* User Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="avatar">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-content flex items-center justify-center text-xl font-semibold">
                  {post.author.display_name?.[0]?.toUpperCase() ||
                    post.author.username[0]?.toUpperCase() ||
                    "?"}
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-base-content">
                  {post.author.display_name || post.author.username}
                </h2>
                <p className="text-sm text-base-content/60">
                  @{post.author.username}
                </p>
                <p className="text-sm text-base-content/60">
                  {formatDate(post.created_at)}
                </p>
              </div>
            </div>

            {/* Post Content */}
            <div className="mb-6 space-y-4">
              <p className="text-lg text-base-content leading-relaxed">
                {post.translation?.content || post.content}
              </p>

              {post.translation && (
                <div className="border-l-4 border-primary pl-4 bg-base-200/50 p-4 rounded">
                  <p className="text-base-content leading-relaxed">
                    {post.content}
                  </p>
                  {post.translation && (
                    <p className="text-xs text-base-content/60 mt-2">
                      Original {getLanguageName(post.language)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Post Actions */}
            <div className="card-actions justify-end">
              <button className="btn btn-ghost btn-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
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
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };

  try {
    const postId = parseInt(id);

    if (isNaN(postId)) {
      return {
        notFound: true,
      };
    }

    // Import the posts utility function
    const { getPostWithTranslation } = await import("@/lib/posts");
    const { getServerSession } = await import("next-auth/next");
    const { authOptions } = await import("../api/auth/[...nextauth]");

    const session = await getServerSession(
      context.req,
      context.res,
      authOptions,
    );
    const post = await getPostWithTranslation(
      postId,
      session?.user?.learning_language || "en",
    );

    if (!post) {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        post,
      },
    };
  } catch (error) {
    console.error("Error fetching post:", error);
    return {
      notFound: true,
    };
  }
};
