"use client";

import React, { useState, useRef, useEffect } from "react";
import { ClockIcon } from "@heroicons/react/24/solid";
import PlaybackControls from "./PlaybackControls";
import LoadingIndicator from "./LoadingIndicator";
import SlideInfoInputs from "./SlideInfoInputs";
import { formatTime, formatSegmentNumber } from "./utils";
import type { AudioPlayerProps } from "./types";

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
  editedText,
  onTextEdit,
  onRegenerateAudio,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [needsRegeneration, setNeedsRegeneration] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // テキストのクリーンアップ（先頭の改行を削除）
  const cleanText = (text || "").replace(/^\n+/, "");

  // テキスト編集時に再生成フラグを立てる
  useEffect(() => {
    if (editedText !== text && editedText.trim() !== "") {
      setNeedsRegeneration(true);
    }
  }, [editedText, text]);

  // 音声メタデータ処理
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
      // 再生成後は自動的に再生を開始
      if (needsRegeneration === false) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
      setDuration(0);
    }
  }, [audioUrl, needsRegeneration]);

  // 再生/一時停止の切り替え（再生成機能を統合）
  const togglePlayPause = async () => {
    // テキストが編集されていて再生成が必要な場合
    if (needsRegeneration && onRegenerateAudio) {
      try {
        await onRegenerateAudio(id, editedText);
        setNeedsRegeneration(false);
        // 再生成後に自動再生するため、ここでは setIsPlaying(true) は不要
        // audioUrlが変わると、useEffectで自動的に再生される
      } catch (error) {
        console.error("再生成エラー:", error);
      }
      return;
    }

    // 通常の再生/一時停止処理
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

  // 音声終了時の処理
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener("ended", handleEnded);

    return () => audio.removeEventListener("ended", handleEnded);
  }, []);

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

  // テキスト変更ハンドラ
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTextEdit(id, e.target.value);
  };

  if (isLoading) return <LoadingIndicator />;

  return (
    <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
      {audioUrl ? (
        <>
          <audio ref={audioRef} key={audioUrl}>
            <source src={audioUrl} type="audio/mpeg" />
          </audio>

          <div className="flex items-center">
            <div className="font-mono text-gray-500 font-medium mr-3 min-w-[40px]">
              {formatSegmentNumber(segmentNumber)}
            </div>

            <textarea
              value={editedText.replace(/^\n+/, "")} // テキストボックスに格納する際も改行を削除
              onChange={handleTextChange}
              className="text-gray-700 flex-grow mr-3 min-h-[3rem] resize-y border rounded-md p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />

            <div className="text-sm text-gray-500 whitespace-nowrap mr-4 flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              {formatTime(duration)}
            </div>

            <PlaybackControls
              isPlaying={isPlaying}
              onPlayPause={togglePlayPause}
              onStop={stop}
              onDownload={handleDownload}
            />

            <SlideInfoInputs
              slideNumber={slideNumber}
              slideOrder={slideOrder}
              segmentNumber={segmentNumber}
              onTabToNext={onTabToNext}
              onChange={(num) => onSlideInfoChange?.(id, num, slideOrder || 0)}
            />
          </div>
        </>
      ) : (
        <div className="flex items-center">
          <div className="font-mono text-gray-500 font-medium mr-3 min-w-[40px]">
            {formatSegmentNumber(segmentNumber)}
          </div>
          <textarea
            value={editedText.replace(/^\n+/, "")} // テキストボックスに格納する際も改行を削除
            onChange={handleTextChange}
            className="text-gray-700 flex-grow mr-3 min-h-[3rem] resize-y border rounded-md p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
          <div className="text-sm text-red-500 ml-auto">
            音声の生成に失敗しました
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
