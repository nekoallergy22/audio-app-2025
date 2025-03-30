// src/components/ui/AudioPlayer.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";

interface AudioPlayerProps {
  audioUrl: string | null;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioUrl) {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioRef]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const stop = () => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;

    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
      {audioUrl ? (
        <>
          <audio ref={audioRef} src={audioUrl} />
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-500">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={togglePlayPause}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none"
              >
                {isPlaying ? "⏸️" : "▶️"}
              </button>
              <button
                onClick={stop}
                className="p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 focus:outline-none"
              >
                ⏹️
              </button>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.01"
            value={currentTime}
            onChange={handleSliderChange}
            className="w-full"
          />
        </>
      ) : (
        <div className="text-center text-gray-500 py-4">
          音声が生成されていません
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
