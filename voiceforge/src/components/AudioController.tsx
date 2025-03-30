"use client";

import React from "react";

interface AudioControllerProps {
  audioUrl: string | null;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  isPlaying: boolean;
}

const AudioController: React.FC<AudioControllerProps> = ({
  audioUrl,
  onPlay,
  onPause,
  onStop,
  isPlaying,
}) => {
  const handlePlayPause = () => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  };

  return (
    <div className="flex justify-center space-x-4">
      <button
        onClick={handlePlayPause}
        disabled={!audioUrl}
        className={`p-2 rounded-full focus:outline-none ${
          !audioUrl
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : isPlaying
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-green-500 text-white hover:bg-green-600"
        }`}
      >
        {isPlaying ? "一時停止" : "再生"}
      </button>
      <button
        onClick={onStop}
        disabled={!audioUrl}
        className={`p-2 rounded-full focus:outline-none ${
          !audioUrl
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-red-500 text-white hover:bg-red-600"
        }`}
      >
        停止
      </button>
    </div>
  );
};

export default AudioController;
