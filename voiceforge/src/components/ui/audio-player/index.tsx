"use client";

import React, { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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
  const playPromiseRef = useRef<Promise<void> | null>(null);

  // テキスト比較用（改行と前後スペースを除去）
  const cleanOriginalText = (text || "").trim().replace(/^\n+/g, "");
  const cleanEditedText = editedText.trim().replace(/^\n+/g, "");

  // テキスト変更検知
  useEffect(() => {
    setNeedsRegeneration(cleanEditedText !== cleanOriginalText);
  }, [cleanEditedText, cleanOriginalText]);

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

  // 音声再生の問題をデバッグするためのイベントリスナー
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleStalled = () => {
      console.warn("音声読み込みが停止しました (stalled)");
    };

    const handleSuspend = () => {
      console.warn("音声読み込みが一時停止しました (suspend)");
    };

    const handleWaiting = () => {
      console.warn("音声バッファリング中 (waiting)");
    };

    const handleError = () => {
      console.error("音声エラー:", audio.error);
    };

    const handleCanPlay = () => {
      console.log("音声再生可能 (canplay)");
    };

    audio.addEventListener("stalled", handleStalled);
    audio.addEventListener("suspend", handleSuspend);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("error", handleError);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("stalled", handleStalled);
      audio.removeEventListener("suspend", handleSuspend);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [audioRef]);

  // 再生/一時停止処理
  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    // テキスト変更がある場合の再生成処理
    if (needsRegeneration && onRegenerateAudio) {
      // 進行中のplay()があれば待つ
      if (playPromiseRef.current) {
        try {
          await playPromiseRef.current;
        } catch {
          // play()が中断された場合は無視
        }
        playPromiseRef.current = null;
      }

      try {
        await onRegenerateAudio(id, editedText);
        setNeedsRegeneration(false);

        // 再チェック（非同期処理後）
        if (!audioRef.current) return;

        // 音声ソースの更新
        audioRef.current.src = "";
        audioRef.current.src = audioUrl || "";

        // メタデータの再読み込み待機
        await new Promise<void>((resolve) => {
          if (!audioRef.current) return;
          audioRef.current.onloadedmetadata = () => resolve();
        });

        // 再生開始
        playPromiseRef.current = audioRef.current.play();
        await playPromiseRef.current;
        playPromiseRef.current = null;
        setIsPlaying(true);
      } catch (error) {
        console.error("再生成エラー:", error);
        playPromiseRef.current = null;
        setIsPlaying(false);
      }
      return;
    }

    // 通常の再生/一時停止処理
    if (isPlaying) {
      // 進行中のplay()があれば待ってからpause()
      if (playPromiseRef.current) {
        try {
          await playPromiseRef.current;
        } catch {
          // play()が失敗した場合は無視
        }
        playPromiseRef.current = null;
      }
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        playPromiseRef.current = audioRef.current.play();
        await playPromiseRef.current;
        playPromiseRef.current = null;
        setIsPlaying(true);
      } catch (error) {
        console.error("再生エラー:", error);
        playPromiseRef.current = null;
        setIsPlaying(false);
      }
    }
  };

  // 停止処理
  const stop = async () => {
    if (!audioRef.current) return;

    // 進行中のplay()があれば待ってからstop()
    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current;
      } catch {
        // play()が失敗した場合は無視
      }
      playPromiseRef.current = null;
    }

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  // 音声終了処理
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      playPromiseRef.current = null;
      setIsPlaying(false);
    };
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, []);

  // ダウンロード処理
  const handleDownload = async () => {
    if (!audioUrl) return;

    try {
      // Blob URLからBlobを取得
      const response = await fetch(audioUrl);
      const blob = await response.blob();

      const sanitizedFileName = editedText
        .replace(/[\\/:*?"<>|]/g, "_")
        .substring(0, 50)
        .trim();

      // BlobからオブジェクトURLを作成してダウンロード
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${sanitizedFileName}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // メモリ解放
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("ダウンロードエラー:", error);
      alert("音声のダウンロードに失敗しました");
    }
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
          <audio ref={audioRef} key={audioUrl} preload="auto">
            <source src={audioUrl} type="audio/mpeg" />
          </audio>

          <div className="flex items-center">
            <div className="font-mono text-gray-500 font-medium mr-3 min-w-[40px]">
              {formatSegmentNumber(segmentNumber)}
            </div>

            <Textarea
              value={editedText.replace(/^\n+/g, "")}
              onChange={handleTextChange}
              className="flex-grow mr-3 min-h-[3rem] resize-y text-sm"
              rows={2}
            />

            <div className="text-sm text-muted-foreground whitespace-nowrap mr-4 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
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
          <Textarea
            value={editedText.replace(/^\n+/g, "")}
            onChange={handleTextChange}
            className="flex-grow mr-3 min-h-[3rem] resize-y text-sm"
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
