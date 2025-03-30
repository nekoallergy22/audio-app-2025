// src/components/ui/AudioPlayer.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/solid";

interface AudioPlayerProps {
  audioUrl: string | null;
  text?: string;
  isLoading?: boolean;
  segmentNumber?: number;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  text,
  isLoading = false,
  segmentNumber,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 音声メタデータ読み込み処理
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // 音声制御処理
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.load();
      setIsPlaying(false);
      setDuration(0);
    }
  }, [audioUrl]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const stop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  // ダウンロード処理
  const handleDownload = () => {
    if (!audioUrl) return;

    const sanitizedFileName = (text || "voice")
      .replace(/[\\/:*?"<>|]/g, "_")
      .substring(0, 50)
      .trim();

    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `${sanitizedFileName}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 時間表示フォーマット
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-pulse flex space-x-2">
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
          </div>
          <span className="ml-3 text-gray-500">音声生成中...</span>
        </div>
      ) : audioUrl ? (
        <>
          <audio
            ref={audioRef}
            key={audioUrl}
            onLoadedMetadata={handleLoadedMetadata}
          >
            <source src={audioUrl} type="audio/mpeg" />
          </audio>

          {/* セグメント番号とテキスト表示 */}
          <div className="mb-4">
            {segmentNumber && (
              <div className="text-sm font-medium text-gray-500 mb-1">
                セグメント {segmentNumber}
              </div>
            )}
            {text && (
              <div className="text-gray-700 mb-2 break-words">{text}</div>
            )}
            <div className="text-sm text-gray-500">
              音声の長さ: {formatTime(duration)}
            </div>
          </div>

          {/* コントロールボタン */}
          <div className="flex justify-end space-x-2">
            <button
              onClick={togglePlayPause}
              className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              {isPlaying ? (
                <PauseIcon className="h-5 w-5" />
              ) : (
                <PlayIcon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={stop}
              className="p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors"
            >
              <StopIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </button>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-500 py-4">
          {text ? (
            <>
              <div className="mb-2 break-words">{text}</div>
              <div>音声の生成に失敗しました</div>
            </>
          ) : (
            "音声が生成されていません"
          )}
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
