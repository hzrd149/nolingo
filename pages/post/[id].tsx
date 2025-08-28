import ReplyCard from "@/components/ReplyCard";
import ReplyForm from "@/components/ReplyForm";
import { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useRef, useState } from "react";

import DictionaryLinksButton from "../../components/DictionaryButton";
import {
  BackIcon,
  SpeakerPlayIcon,
  SpeakerStopIcon,
} from "../../components/Icons";
import UserAvatar from "../../components/UserAvatar";
import { PostWithTranslation } from "../../lib/posts";
import { ReplyWithTranslation } from "../../lib/replies";
import { getLanguageName } from "../../lib/utils/language";

interface PostPageProps {
  post: PostWithTranslation;
  initialReplies: ReplyWithTranslation[];
}

export default function PostPage({ post, initialReplies }: PostPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [replies, setReplies] =
    useState<ReplyWithTranslation[]>(initialReplies);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOriginalLanguage, setShowOriginalLanguage] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Get the link to the translated content in the dictionary
  const language = showOriginalLanguage
    ? post.language
    : post.translation?.language || post.language;
  const content = showOriginalLanguage
    ? post.content
    : post.translation?.content || post.content;

  const handleReplyCreated = async () => {
    // Refresh replies after a new reply is created
    if (session?.user?.learning_language) {
      setIsLoadingReplies(true);
      try {
        const response = await fetch(`/api/post/${post.id}/replies`);
        if (response.ok) {
          const newReplies = await response.json();
          setReplies(newReplies);
        }
      } catch (error) {
        console.error("Failed to refresh replies:", error);
      } finally {
        setIsLoadingReplies(false);
      }
    }
  };

  const handlePlayTTS = async () => {
    try {
      // Stop current audio if playing
      if (audioRef.current && audioRef.current.currentTime > 0) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
        return;
      }

      setIsLoadingAudio(true);

      // Set the audio source and play
      if (audioRef.current) {
        audioRef.current.onended = () => {
          setIsPlaying(false);
        };
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Failed to play TTS audio:", error);
      alert("Failed to play audio. Please try again.");
    } finally {
      setIsLoadingAudio(false);
    }
  };

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
    <>
      <Head>
        <title>
          {`${post.author.display_name || post.author.username} - ${(post.translation?.content || post.content).slice(0, 16)}...`}
        </title>
      </Head>

      {/* Hidden audio element */}
      <audio
        src={
          showOriginalLanguage
            ? `/api/post/${post.id}/tts?lang=${post.language}`
            : `/api/post/${post.id}/tts`
        }
        ref={audioRef}
      />

      <div className="bg-base-100">
        <div className="container mx-auto px-2 py-4 max-w-4xl pb-10">
          {/* Back button */}
          <button onClick={() => router.back()} className="btn btn-ghost mb-4">
            <BackIcon /> back
          </button>

          {/* Post content */}
          <div className="bg-base-100 mb-6">
            {/* Post Image - Full width */}
            <div className="relative mb-4">
              <img
                src={post.picture.original_url}
                alt="Post image"
                className="w-full h-auto min-h-[30vh] max-h-[70vh] object-contain bg-base-200 rounded-lg"
              />
              {/* Language Badge */}
              <div className="absolute top-2 right-2">
                <div className="badge badge-primary">
                  {getLanguageName(post.language)}
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-2 mb-4 px-1 flex-wrap">
              <div className="flex items-center gap-3">
                <UserAvatar user={post.author} size="size-12 text-2xl" />
                <div>
                  <h2 className="font-semibold text-base-content">
                    {post.author.display_name || post.author.username}
                  </h2>
                  <p className="text-sm text-base-content/60">
                    @{post.author.username} • {formatDate(post.created_at)}
                  </p>
                </div>
              </div>

              {/* Post Actions */}
              <div className="flex items-center p-2 ms-auto">
                {/* Language Toggle Button */}
                {post.translation && (
                  <div className="flex justify-end ms-auto">
                    <button
                      className="btn btn-sm btn-link shrink-0"
                      onClick={() =>
                        setShowOriginalLanguage(!showOriginalLanguage)
                      }
                    >
                      Show{" "}
                      {showOriginalLanguage
                        ? getLanguageName(post.translation.language)
                        : getLanguageName(post.language)}
                    </button>
                  </div>
                )}
                <DictionaryLinksButton language={language} content={content} />

                {/* TTS Button */}
                <button
                  onClick={handlePlayTTS}
                  disabled={isLoadingAudio}
                  className="btn btn-ghost btn-square"
                  title="Listen to post"
                >
                  {isLoadingAudio ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : isPlaying ? (
                    <SpeakerStopIcon />
                  ) : (
                    <SpeakerPlayIcon />
                  )}
                </button>
              </div>
            </div>

            {/* Post Content */}
            <div className="pb-4 space-y-4 px-1 border-b border-base-300">
              {/* Post Content - Show based on toggle state */}
              {post.translation && showOriginalLanguage ? (
                <p className="border-l-4 border-primary pl-3 bg-base-200/50 p-3 text-2xl">
                  {post.content}
                </p>
              ) : (
                <p className="text-2xl">
                  {post.translation?.content || post.content}
                </p>
              )}
            </div>
          </div>

          {/* Reply Form */}
          <ReplyForm postId={post.id} onReplyCreated={handleReplyCreated} />

          {/* Replies Section */}
          <div>
            <h2 className="text-xl font-semibold text-base-content mb-4">
              Replies ({replies.length})
              {isLoadingReplies && (
                <span className="loading loading-spinner loading-sm ml-2"></span>
              )}
            </h2>

            {replies.length === 0 ? (
              <div className="text-center text-base-content/60 py-8">
                <p>No replies yet. Be the first to reply!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {replies.map((reply) => (
                  <ReplyCard key={reply.id} reply={reply} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
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

    // Dynamically import all dependencies to avoid build-time execution
    const { getPostWithTranslation } = await import("@/lib/posts");
    const { getRepliesWithTranslations } = await import("@/lib/replies");
    const { getServerSession } = await import("next-auth/next");
    const { authOptions } = await import("../api/auth/[...nextauth]");

    const session = await getServerSession(
      context.req,
      context.res,
      authOptions,
    );

    const targetLanguage = session?.user?.learning_language || "en";

    const [post, replies] = await Promise.all([
      getPostWithTranslation(postId, targetLanguage),
      getRepliesWithTranslations(postId, targetLanguage),
    ]);

    if (!post) {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        post,
        initialReplies: replies,
      },
    };
  } catch (error) {
    console.error("Error fetching post:", error);
    return {
      notFound: true,
    };
  }
};
