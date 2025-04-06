// src/components/ui/PlaybackControls.tsx
import React from "react";
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/solid";

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onDownload: () => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  onPlayPause,
  onStop,
  onDownload,
}) => (
  <div className="flex space-x-2 shrink-0">
    <button
      onClick={onPlayPause}
      className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
      title={isPlaying ? "一時停止" : "再生"}
    >
      {isPlaying ? (
        <PauseIcon className="h-5 w-5" />
      ) : (
        <PlayIcon className="h-5 w-5" />
      )}
    </button>
    <button
      onClick={onStop}
      className="p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
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
