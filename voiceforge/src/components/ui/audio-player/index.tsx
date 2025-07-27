"use client";

import React, { useState, useRef, useEffect } from "react";
import { ClockIcon, SpeakerWaveIcon } from "@heroicons/react/24/solid";
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
  onGenerateAudio,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [needsRegeneration, setNeedsRegeneration] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // テキスト比較用（改行と前後スペースを除去）
  const cleanOriginalText = (text || "").trim().replace(/^\n+/g, "");
  const cleanEditedText = editedText.trim().replace(/^\n+/g, "");

  // テキスト変更検知
  useEffect(() => {
    setNeedsRegeneration(cleanEditedText !== cleanOriginalText);
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

  // 再生/一時停止処理
  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    // 音声が未生成または変更がある場合の生成処理
    if (!audioUrl || needsRegeneration) {
      try {
        let generatedAudioUrl = audioUrl;
        
        // 音声生成処理を実行
        if (onGenerateAudio) {
          const newAudioUrl = await onGenerateAudio(id, editedText);
          if (newAudioUrl) {
            generatedAudioUrl = newAudioUrl;
          }
          setNeedsRegeneration(false);
        } else if (onRegenerateAudio && needsRegeneration) {
          const regeneratedUrl = await onRegenerateAudio(id, editedText);
          if (regeneratedUrl) {
            generatedAudioUrl = regeneratedUrl;
          }
          setNeedsRegeneration(false);
        }

        // 音声生成後の再チェック（非同期処理後）
        if (!audioRef.current || !generatedAudioUrl) return;

        // 音声ソースの更新
        audioRef.current.src = "";
        audioRef.current.src = generatedAudioUrl;

        // メタデータの再読み込み待機
        await new Promise<void>((resolve) => {
          if (!audioRef.current) return;
          audioRef.current.onloadedmetadata = () => resolve();
        });

        // 再生開始
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("音声生成エラー:", error);
      }
      return;
    }

    // 通常の再生/一時停止処理
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      await audioRef.current.play();
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

  // 音声終了処理
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [audioUrl]); // audioUrlが変更されたときにイベントリスナーを再登録

  // ダウンロード処理（音声未生成時は生成してからダウンロード）
  const handleDownload = async () => {
    let downloadUrl = audioUrl;

    if (!audioUrl || needsRegeneration) {
      try {
        // 音声生成処理を実行
        if (onGenerateAudio) {
          const generatedUrl = await onGenerateAudio(id, editedText);
          if (generatedUrl) {
            downloadUrl = generatedUrl;
          }
          setNeedsRegeneration(false);
        } else if (onRegenerateAudio && needsRegeneration) {
          const regeneratedUrl = await onRegenerateAudio(id, editedText);
          if (regeneratedUrl) {
            downloadUrl = regeneratedUrl;
          }
          setNeedsRegeneration(false);
        }
      } catch (error) {
        console.error("ダウンロード用音声生成エラー:", error);
        return;
      }
    }

    if (!downloadUrl) {
      console.error("音声URLが利用できません");
      return;
    }

    const sanitizedFileName = editedText
      .replace(/[\\/:*?"<>|]/g, "_")
      .substring(0, 50)
      .trim();

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${sanitizedFileName}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // テキスト変更ハンドラ
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTextEdit(id, e.target.value);
  };


  // isLoadingが全体のUIを置き換えないように変更

  return (
    <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
      <audio ref={audioRef} key={audioUrl}>
        {audioUrl && <source src={audioUrl} type="audio/mpeg" />}
      </audio>

      <div className="flex items-center">
        <div className="font-mono text-gray-500 font-medium mr-3 min-w-[40px]">
          {formatSegmentNumber(segmentNumber)}
        </div>

        <textarea
          value={editedText.replace(/^\n+/g, "")}
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
          isGenerating={isLoading}
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
    </div>
  );
};

export default AudioPlayer;
