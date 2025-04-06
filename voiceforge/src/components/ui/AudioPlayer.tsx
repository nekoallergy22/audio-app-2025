// src/components/ui/AudioPlayer.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { ClockIcon } from "@heroicons/react/24/solid";
import PlaybackControls from "./PlaybackControls";

// 型定義
interface AudioPlayerProps {
  audioUrl: string | null;
  text?: string;
  isLoading?: boolean;
  segmentNumber?: number;
  onDurationChange: (duration: number) => void;
  onSlideInfoChange?: (
    id: string,
    slideNumber: number,
    slideOrder: number
  ) => void;
  id: string;
  slideNumber?: number;
  slideOrder?: number;
}

// 時間表示フォーマット関数
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

// セグメント番号フォーマット関数
const formatSegmentNumber = (num?: number) => {
  return num ? num.toString().padStart(3, "0") : "";
};

// ローディングインジケーターコンポーネント
const LoadingIndicator = () => (
  <div className="flex items-center justify-center py-2">
    <div className="animate-pulse flex space-x-2">
      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
    </div>
    <span className="ml-3 text-gray-500">音声生成中...</span>
  </div>
);

// スライド情報入力コンポーネント
const SlideInfoInputs = ({
  slideNumber,
  slideOrder,
  onChange,
  segmentNumber,
  onTabToNext,
}: {
  slideNumber?: number;
  slideOrder?: number;
  onChange: (slideNumber: number) => void;
  segmentNumber?: number;
  onTabToNext?: () => void; // タブ移動用のコールバック
}) => {
  return (
    <div className="flex items-center space-x-2 shrink-0">
      <input
        id={`slide-number-${segmentNumber}`}
        type="number"
        value={slideNumber || ""}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        min="0"
        className="w-14 p-1 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="スライド"
        title="スライド番号"
        onKeyDown={(e) => {
          if (e.key === "Tab" && !e.shiftKey) {
            // タブキーで次のセグメントへ直接移動
            e.preventDefault();
            if (onTabToNext) onTabToNext();
          } else if (e.key === "Enter") {
            // Enterキーでも次のセグメントへ
            e.preventDefault();
            if (onTabToNext) onTabToNext();
          }
        }}
      />
      <div className="w-14 p-1 text-center bg-gray-100 border border-gray-200 rounded-md text-gray-700">
        {slideOrder || "-"}
      </div>
    </div>
  );
};

// メインのAudioPlayerコンポーネント
const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  text,
  isLoading = false,
  segmentNumber,
  onDurationChange,
  onSlideInfoChange,
  id,
  slideNumber,
  slideOrder,
  onTabToNext,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cleanText = text?.replace(/^\n+/, "") || "";

  // 音声メタデータ読み込み処理
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleMetadata = () => {
      const newDuration = audio.duration;
      setDuration(newDuration);
      onDurationChange(newDuration);
    };

    audio.addEventListener("loadedmetadata", handleMetadata);
    return () => audio.removeEventListener("loadedmetadata", handleMetadata);
  }, [audioRef, onDurationChange]);

  // 音声URL変更時の処理
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.load();
      setIsPlaying(false);
      setDuration(0);
    }
  }, [audioUrl]);

  // 再生/一時停止の切り替え
  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // 停止処理
  const stop = () => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  // ダウンロード処理
  const handleDownload = () => {
    if (!audioUrl) return;

    const sanitizedFileName = cleanText
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

  // スライド情報変更ハンドラ
  const handleSlideInfoChange = (
    newSlideNumber: number,
    newSlideOrder: number
  ) => {
    if (onSlideInfoChange) {
      onSlideInfoChange(id, newSlideNumber, newSlideOrder);
    }
  };

  // 音声終了時の処理
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener("ended", handleEnded);

    return () => audio.removeEventListener("ended", handleEnded);
  }, []);

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
      {audioUrl ? (
        <>
          <audio ref={audioRef} key={audioUrl}>
            <source src={audioUrl} type="audio/mpeg" />
          </audio>

          <div className="flex items-center">
            {/* セグメント番号 */}
            <div className="font-mono text-gray-500 font-medium mr-3 min-w-[40px]">
              {formatSegmentNumber(segmentNumber)}
            </div>

            {/* テキスト */}
            <div className="text-gray-700 flex-grow truncate mr-3">
              {cleanText}
            </div>

            {/* 音声の長さ */}
            <div className="text-sm text-gray-500 whitespace-nowrap mr-4 flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              {formatTime(duration)}
            </div>

            {/* 再生コントロール */}
            <PlaybackControls
              isPlaying={isPlaying}
              onPlayPause={togglePlayPause}
              onStop={stop}
              onDownload={handleDownload}
            />

            {/* スライド情報入力 */}
            <div className="ml-2">
              <SlideInfoInputs
                slideNumber={slideNumber}
                slideOrder={slideOrder}
                onChange={handleSlideInfoChange}
                segmentNumber={segmentNumber}
                onTabToNext={onTabToNext} // タブ移動のコールバックを渡す
              />
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center">
          <div className="font-mono text-gray-500 font-medium mr-3 min-w-[40px]">
            {formatSegmentNumber(segmentNumber)}
          </div>
          <div
            class="text-gray-700 flex-grow mr-3 text-sm min-h-[2.5rem] break-words"
            style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;"
          >
            {cleanText}
          </div>

          <div className="text-sm text-red-500 ml-auto">
            音声の生成に失敗しました
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
