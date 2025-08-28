import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import PostCard from "../components/PostCard";
import { PostWithReplyCount } from "../lib/posts";
import { PlusIcon } from "../components/Icons";
import NotificationPrompt from "../components/NotificationPrompt";

interface PostsProps {
  posts: PostWithReplyCount[];
  error?: string;
}

export const getServerSideProps: GetServerSideProps<PostsProps> = async (
  context,
) => {
  try {
    // Get user session
    const { getServerSession } = await import("next-auth/next");
    const { authOptions } = await import("./api/auth/[...nextauth]");

    const session = await getServerSession(
      context.req,
      context.res,
      authOptions,
    );

    if (!session?.user?.id) {
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    const userLearningLanguage = session.user.learning_language || "en";

    // Dynamically import the posts function to avoid build-time execution
    const { getPostsWithReplyCounts } = await import("../lib/posts");
    const posts = await getPostsWithReplyCounts(userLearningLanguage);

    return {
      props: {
        posts,
      },
    };
  } catch (error) {
    console.error("Error fetching posts:", error);
    return {
      props: {
        posts: [],
        error: "Failed to load posts",
      },
    };
  }
};

export default function Posts({ posts, error }: PostsProps) {
  return (
    <>
      <Head>
        <title>Nolingo</title>
      </Head>

      <div className="container mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8 max-w-4xl">
        <NotificationPrompt className="mb-4" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 px-2 sm:px-0 gap-4 sm:gap-0">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Link
              href="/post/new"
              className="btn btn-lg btn-primary w-full sm:w-auto"
            >
              <PlusIcon />
              New Post
            </Link>
          </div>
        </div>

        {/* Posts Timeline */}
        {error ? (
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
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-base-content mb-2">
              No posts yet
            </h3>
            <p className="text-base-content/70 mb-6">
              Be the first to share a post and start practicing your language
              skills!
            </p>
            <Link href="/post/new" className="btn btn-primary">
              Create Your First Post
            </Link>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
