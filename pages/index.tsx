import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import PostCard from "../components/PostCard";
import { useUserProfile } from "../lib/hooks/useUserProfile";

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
  replyCount: number;
}

export default function Posts() {
  const { data: session, status } = useSession();
  const { profile } = useUserProfile();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Use user's learning language if available, otherwise default to English
        const targetLanguage = profile?.learning_language || "en";
        const response = await fetch(`/api/post?lang=${targetLanguage}`);
        if (response.ok) {
          const data = await response.json();
          setPosts(data.posts);
        } else {
          setError("Failed to load posts");
        }
      } catch (error) {
        setError("Failed to load posts");
        console.error("Error fetching posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch posts when we have the user profile or when not authenticated
    if (status === "authenticated" && profile) {
      fetchPosts();
    } else if (status === "unauthenticated") {
      fetchPosts(); // Fetch with default language for unauthenticated users
    }
  }, [status, profile]);

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Posts - Nolingo</title>
      </Head>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-base-content">Posts</h1>
            <p className="text-base-content/70 mt-2">
              Practice your language skills with posts from the community
            </p>
          </div>

          <div className="flex items-center gap-4">
            {status === "authenticated" && (
              <Link href="/post/new" className="btn btn-primary">
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Post
              </Link>
            )}
          </div>
        </div>

        {/* Posts Timeline */}
        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card bg-base-100 shadow-md">
                <div className="skeleton h-64 w-full"></div>
                <div className="card-body p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="skeleton w-10 h-10 rounded-full"></div>
                    <div className="flex-1">
                      <div className="skeleton h-4 w-24 mb-2"></div>
                      <div className="skeleton h-3 w-16"></div>
                    </div>
                  </div>
                  <div className="skeleton h-4 w-full mb-2"></div>
                  <div className="skeleton h-4 w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
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
            {status === "authenticated" ? (
              <Link href="/post/new" className="btn btn-primary">
                Create Your First Post
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary">
                Sign In to Post
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
