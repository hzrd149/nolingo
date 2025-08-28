import { useRef, useState } from "react";
import { ReplyWithTranslation } from "../lib/replies";
import { formatDate } from "../lib/utils/date";
import { getLanguageName } from "../lib/utils/language";
import DictionaryLinksButton from "./DictionaryButton";
import { SpeakerPlayIcon, SpeakerStopIcon } from "./Icons";
import UserAvatar from "./UserAvatar";

interface ReplyCardProps {
  reply: ReplyWithTranslation;
}

export default function ReplyCard({ reply }: ReplyCardProps) {
  const [showOriginalLanguage, setShowOriginalLanguage] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const language = showOriginalLanguage
    ? reply.language
    : reply.translation?.language || reply.language;
  const content = showOriginalLanguage
    ? reply.content
    : reply.translation?.content || reply.content;

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

  return (
    <div className="py-3 px-1 border-b border-base-300 last:border-b-0">
      {/* Hidden audio element */}
      <audio
        src={
          showOriginalLanguage
            ? `/api/reply/${reply.id}/tts?lang=${reply.language}`
            : `/api/reply/${reply.id}/tts`
        }
        ref={audioRef}
      />

      {/* User Info */}
      <div className="flex items-center gap-2 mb-2">
        <UserAvatar user={reply.author} size="size-7" />
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm text-base-content  block truncate">
            {reply.author.display_name || reply.author.username}
          </span>
          <div className="text-xs text-base-content/60">
            {formatDate(reply.created_at)}
          </div>
        </div>

        <div className="flex items-center">
          {/* Language Toggle Button */}
          {reply.translation && (
            <button
              className="btn btn-sm btn-link shrink-0"
              onClick={() => setShowOriginalLanguage(!showOriginalLanguage)}
            >
              Show{" "}
              {showOriginalLanguage
                ? getLanguageName(reply.translation.language)
                : getLanguageName(reply.language)}
            </button>
          )}

          {/* Dictionary Links */}
          <DictionaryLinksButton
            language={language}
            content={content}
            className="btn-sm"
          />

          {/* TTS Button */}
          <button
            onClick={handlePlayTTS}
            disabled={isLoadingAudio}
            className="btn btn-ghost btn-square btn-sm"
            title="Listen to reply"
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

      {/* Reply Content */}
      <div className="space-y-2">
        {/* Reply Content - Show based on toggle state */}
        {reply.translation && showOriginalLanguage ? (
          <p className="border-l-4 border-primary pl-3 bg-base-200/50 p-2 text-xl">
            {reply.content}
          </p>
        ) : (
          <p className="text-xl leading-relaxed">
            {reply.translation?.content || reply.content}
          </p>
        )}
      </div>
    </div>
  );
}
