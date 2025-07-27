// src/components/ui/audio-player/PlaybackControls.tsx
import React from "react";
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/solid";

interface PlaybackControlsProps {
  isPlaying: boolean;
  isGenerating: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onDownload: () => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  isGenerating,
  onPlayPause,
  onStop,
  onDownload,
}) => (
  <div className="flex space-x-2 shrink-0">
    <button
      onClick={onPlayPause}
      disabled={isGenerating}
      className={`p-2 rounded-full transition-colors ${
        isGenerating
          ? "bg-gray-400 text-white cursor-not-allowed"
          : "bg-blue-500 text-white hover:bg-blue-600"
      }`}
      title={isGenerating ? "音声生成中..." : isPlaying ? "一時停止" : "再生"}
    >
      {isGenerating ? (
        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : isPlaying ? (
        <PauseIcon className="h-5 w-5" />
      ) : (
        <PlayIcon className="h-5 w-5" />
      )}
    </button>
    <button
      onClick={onStop}
      disabled={isGenerating}
      className={`p-2 rounded-full transition-colors ${
        isGenerating
          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
      }`}
      title="停止"
    >
      <StopIcon className="h-5 w-5" />
    </button>
    <button
      onClick={onDownload}
      className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
      title="ダウンロード"
    >
      <ArrowDownTrayIcon className="h-5 w-5" />
    </button>
  </div>
);

export default PlaybackControls;
