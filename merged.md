## ./voiceforge/src/app/api/tts/route.ts
// src/app/api/tts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { synthesizeSpeech, TTSRequest } from "../../../utils/googleTTS";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // リクエストの検証
    if (!body.text) {
      return NextResponse.json(
        { error: "テキストが入力されていません" },
        { status: 400 }
      );
    }

    // Google TTSリクエストの作成
    const ttsRequest: TTSRequest = {
      text: body.text,
      language: body.language || "ja-JP",
      voiceName: body.voiceName || "ja-JP-Wavenet-A",
      speakingRate: body.speakingRate || 1.0,
      pitch: body.pitch || 0,
    };

    // 音声合成の実行
    const audioContent = await synthesizeSpeech(ttsRequest);

    // 音声データを返す
    return NextResponse.json({
      audioContent: audioContent,
      format: "mp3",
    });
  } catch (error) {
    console.error("TTS API エラー:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "音声の生成中にエラーが発生しました",
      },
      { status: 500 }
    );
  }
}


## ./voiceforge/src/app/globals.css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}


## ./voiceforge/src/app/layout.tsx
// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VoiceForge - テキスト読み上げツール",
  description: "Google Cloud Text-to-Speechを使用したテキスト読み上げツール",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="bg-gray-50 min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}


## ./voiceforge/src/app/page.tsx
// src/app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import TextInput from "../components/ui/TextInput";
import VoiceSettings, {
  VoiceSettingsType,
} from "../components/ui/VoiceSettings";
import DownloadOptions from "../components/ui/DownloadOptions";
import { validateText, validateVoiceSettings } from "../utils/validators";
import { SpeakerWaveIcon, Cog6ToothIcon } from "@heroicons/react/24/solid";
import SettingsPopup from "../components/ui/SettingsPopup";

import AudioPlayer from "@/components/ui/audio-player";

// テキストセグメントと対応する音声URLを管理するインターフェース
interface TextSegment {
  id: string;
  text: string;
  originalText?: string;
  editedText: string;
  audioUrl: string | null;
  isLoading: boolean;
  duration: number;
  slideNumber?: number;
  slideOrder?: number;
}

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [textSegments, setTextSegments] = useState<TextSegment[]>([]);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettingsType>({
    language: "ja-JP",
    voiceName: "ja-JP-Wavenet-A",
    speakingRate: 1.0,
    pitch: 0,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleDurationChange = (id: string, duration: number) => {
    setTextSegments((prevSegments) =>
      prevSegments.map((segment) =>
        segment.id === id ? { ...segment, duration } : segment
      )
    );
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    setErrorMessage(null);
  };

  const handleSettingsChange = (settings: VoiceSettingsType) => {
    setVoiceSettings(settings);
    setErrorMessage(null);
  };

  const handleTabToNext = (currentIndex: number) => {
    const nextInput = document.getElementById(
      `slide-number-${currentIndex + 2}`
    );
    if (nextInput) {
      nextInput.focus();
    }
  };

  // スライド情報変更ハンドラを修正（半自動化機能を追加）
  const handleSlideInfoChange = (id: string, slideNumber: number) => {
    // 現在のセグメントのインデックスを取得
    const currentIndex = textSegments.findIndex((segment) => segment.id === id);
    if (currentIndex === -1) return;

    // セグメントを更新（半自動化：現在のセグメント以降に同じスライド番号を設定）
    setTextSegments((prevSegments) => {
      // まず現在のセグメントとそれ以降を更新
      const updatedSegments = prevSegments.map((segment, index) => {
        // 現在のセグメントまたはそれ以降のセグメントの場合
        if (index >= currentIndex) {
          // 現在のセグメントか、それ以降のセグメントに新しいスライド番号を設定
          return { ...segment, slideNumber };
        }
        return segment;
      });

      // スライド内順番を再計算
      const newSlideOrderMap = new Map<number, number>();

      // 各スライド番号ごとに順番を1から振り直す
      return updatedSegments.map((segment) => {
        if (!segment.slideNumber || segment.slideNumber <= 0) {
          return { ...segment, slideOrder: undefined };
        }

        const slideNum = segment.slideNumber;
        const order = newSlideOrderMap.get(slideNum) || 0;
        newSlideOrderMap.set(slideNum, order + 1);

        return { ...segment, slideOrder: order + 1 };
      });
    });
  };

  // テキストを句点で分割する関数
  const splitTextByPeriod = (text: string): string[] => {
    // 句点で分割し、空の要素を除外
    const segments = text
      .split("。")
      .filter((segment) => segment.trim() !== "");

    // 最後のセグメントが句点で終わっていない場合、句点を追加
    return segments.map((segment, index) => {
      return index === segments.length - 1 && !text.endsWith("。")
        ? segment
        : segment + "。";
    });
  };

  // Base64文字列をBlobに変換する関数
  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mimeType });
  };

  // 音声を生成する関数
  const generateVoice = async (segmentText: string): Promise<string> => {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: segmentText,
        ...voiceSettings,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "音声の生成に失敗しました");
    }

    const data = await response.json();
    const audioBlob = base64ToBlob(data.audioContent, "audio/mp3");
    return URL.createObjectURL(audioBlob);
  };

  // すべてのセグメントの音声を生成
  const handleGenerateAllVoices = async () => {
    if (!validateText(inputText)) {
      setErrorMessage("テキストが入力されていないか、文字数制限を超えています");
      return;
    }

    if (
      !validateVoiceSettings(
        voiceSettings.language,
        voiceSettings.voiceName,
        voiceSettings.speakingRate,
        voiceSettings.pitch
      )
    ) {
      setErrorMessage("音声設定が無効です");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      // テキストを句点で分割
      const segments = splitTextByPeriod(inputText);

      // 既存のaudioUrlを解放
      textSegments.forEach((segment) => {
        if (segment.audioUrl) {
          URL.revokeObjectURL(segment.audioUrl);
        }
      });

      // 新しいセグメントの配列を作成
      const newSegments: TextSegment[] = segments.map((text, index) => ({
        id: `segment-${Date.now()}-${index}`,
        text,
        editedText: text, // 初期値は元のテキスト
        audioUrl: null,
        isLoading: true,
        duration: 0,
      }));

      setTextSegments(newSegments);

      // 各セグメントごとに音声を生成
      for (let i = 0; i < newSegments.length; i++) {
        try {
          const audioUrl = await generateVoice(newSegments[i].text);

          // 特定のセグメントのaudioUrlを更新
          setTextSegments((prev) =>
            prev.map((segment, idx) =>
              idx === i ? { ...segment, audioUrl, isLoading: false } : segment
            )
          );
        } catch (error) {
          console.error(`セグメント ${i + 1} の音声生成エラー:`, error);
          // エラーが発生したセグメントを更新
          setTextSegments((prev) =>
            prev.map((segment, idx) =>
              idx === i ? { ...segment, isLoading: false } : segment
            )
          );
        }
      }
    } catch (error) {
      console.error("音声生成エラー:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "音声の生成中にエラーが発生しました"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // コンポーネントがアンマウントされる際にaudioUrlを解放
  useEffect(() => {
    return () => {
      textSegments.forEach((segment) => {
        if (segment.audioUrl) {
          URL.revokeObjectURL(segment.audioUrl);
        }
      });
    };
  }, []);

  const handleTextEdit = (id: string, newText: string) => {
    setTextSegments((prevSegments) =>
      prevSegments.map((segment) =>
        segment.id === id ? { ...segment, editedText: newText } : segment
      )
    );
  };

  // 音声を再生成する関数
  const handleRegenerateAudio = async (id: string, newText: string) => {
    try {
      // 該当セグメントをローディング状態に
      setTextSegments((prev) =>
        prev.map((segment) =>
          segment.id === id ? { ...segment, isLoading: true } : segment
        )
      );

      // 新しいテキストで音声を生成
      const audioUrl = await generateVoice(newText);

      // 結果を更新
      setTextSegments((prev) =>
        prev.map((segment) =>
          segment.id === id
            ? { ...segment, audioUrl, isLoading: false, text: newText }
            : segment
        )
      );
    } catch (error) {
      console.error("音声再生成エラー:", error);
      setTextSegments((prev) =>
        prev.map((segment) =>
          segment.id === id ? { ...segment, isLoading: false } : segment
        )
      );
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "音声の再生成中にエラーが発生しました"
      );
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6 text-center">
        VoiceForge - テキスト読み上げツール
      </h1>

      {/* テキスト入力セクションのみ表示 */}
      <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 mb-8 relative">
        {/* 設定アイコン */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="設定"
          >
            <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <h2 className="text-lg font-medium mb-4">テキスト入力</h2>
        <TextInput onChange={handleTextChange} maxLength={5000} />
        {errorMessage && (
          <div className="mt-2 text-red-500 text-sm">{errorMessage}</div>
        )}
        <button
          onClick={handleGenerateAllVoices}
          disabled={!inputText.trim() || isGenerating}
          className={`mt-4 py-2 px-4 rounded-md focus:outline-none w-full flex items-center justify-center ${
            !inputText.trim() || isGenerating
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {isGenerating ? (
            "生成中..."
          ) : (
            <>
              <SpeakerWaveIcon className="h-5 w-5 mr-2" />
              音声を生成
            </>
          )}
        </button>
      </div>

      {/* 設定ポップアップ */}
      <SettingsPopup
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        segments={textSegments}
        fullText={inputText}
        voiceSettings={voiceSettings}
        onSettingsChange={handleSettingsChange}
      />

      {/* 下部セクション：生成された音声一覧 */}
      {textSegments.length > 0 && (
        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium mb-4">生成された音声</h2>
          <div className="space-y-4">
            {textSegments.map((segment, index) => (
              <AudioPlayer
                key={segment.id}
                id={segment.id}
                audioUrl={segment.audioUrl}
                text={segment.text.replace(/^\n+/, "")}
                isLoading={segment.isLoading}
                segmentNumber={index + 1}
                onDurationChange={(duration) =>
                  handleDurationChange(segment.id, duration)
                }
                onSlideInfoChange={(id, slideNumber) =>
                  handleSlideInfoChange(id, slideNumber)
                }
                slideNumber={segment.slideNumber}
                slideOrder={segment.slideOrder}
                onTabToNext={() => handleTabToNext(index)}
                editedText={segment.editedText}
                onTextEdit={handleTextEdit}
                onRegenerateAudio={handleRegenerateAudio}
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}


## ./voiceforge/src/components/AudioController.tsx
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


## ./voiceforge/src/components/GoogleTTSConverter.tsx
// src/components/GoogleTTSConverter.tsx
"use client";

import React, { useState } from "react";
import { VoiceSettingsType } from "./ui/VoiceSettings";
import { validateText, validateVoiceSettings } from "../utils/validators";

interface GoogleTTSConverterProps {
  text: string;
  voiceSettings: VoiceSettingsType;
  onConversionStart: () => void;
  onConversionComplete: (audioUrl: string) => void;
  onConversionError: (error: string) => void;
}

const GoogleTTSConverter: React.FC<GoogleTTSConverterProps> = ({
  text,
  voiceSettings,
  onConversionStart,
  onConversionComplete,
  onConversionError,
}) => {
  const [isConverting, setIsConverting] = useState(false);

  const convertTextToSpeech = async () => {
    // テキストの検証
    if (!validateText(text)) {
      onConversionError(
        "テキストが入力されていないか、文字数制限を超えています"
      );
      return;
    }

    // 音声設定の検証
    if (
      !validateVoiceSettings(
        voiceSettings.language,
        voiceSettings.voiceName,
        voiceSettings.speakingRate,
        voiceSettings.pitch
      )
    ) {
      onConversionError("音声設定が無効です");
      return;
    }

    setIsConverting(true);
    onConversionStart();

    try {
      // APIリクエスト
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          ...voiceSettings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "音声の生成に失敗しました");
      }

      const data = await response.json();

      // Base64エンコードされた音声データをBlobに変換
      const audioBlob = base64ToBlob(data.audioContent, "audio/mp3");
      const audioUrl = URL.createObjectURL(audioBlob);

      onConversionComplete(audioUrl);
    } catch (error) {
      console.error("音声変換エラー:", error);
      onConversionError(
        error instanceof Error
          ? error.message
          : "音声の生成中にエラーが発生しました"
      );
    } finally {
      setIsConverting(false);
    }
  };

  // Base64文字列をBlobに変換する関数
  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mimeType });
  };

  return (
    <button
      onClick={convertTextToSpeech}
      disabled={isConverting || !text.trim()}
      className={`w-full py-2 px-4 rounded-md focus:outline-none ${
        isConverting || !text.trim()
          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
          : "bg-blue-500 text-white hover:bg-blue-600"
      }`}
    >
      {isConverting ? "生成中..." : "音声を生成"}
    </button>
  );
};

export default GoogleTTSConverter;


## ./voiceforge/src/components/SegmentList.tsx
// src/components/SegmentList.tsx
import { useState } from "react";
import dynamic from "next/dynamic";
import { TextSegment } from "../types";

const AudioPlayer = dynamic(() => import("./ui/AudioPlayer"), {
  ssr: false,
});

interface SegmentListProps {
  segments: TextSegment[];
  onDurationChange: (id: string, duration: number) => void;
  onSlideInfoChange: (id: string, slideNumber: number) => void;
}

export default function SegmentList({
  segments,
  onDurationChange,
  onSlideInfoChange,
}: SegmentListProps) {
  // タブ移動のハンドラ
  const handleTabToNext = (currentIndex: number) => {
    const nextInput = document.getElementById(
      `slide-number-${currentIndex + 2}`
    );
    if (nextInput) {
      nextInput.focus();
    }
  };

  if (segments.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
      <h2 className="text-lg font-medium mb-4">生成された音声</h2>
      <div className="space-y-4">
        {segments.map((segment, index) => (
          <AudioPlayer
            key={segment.id}
            id={segment.id}
            audioUrl={segment.audioUrl}
            text={segment.text.replace(/^\n+/, "")}
            isLoading={segment.isLoading}
            segmentNumber={index + 1}
            onDurationChange={(duration) =>
              onDurationChange(segment.id, duration)
            }
            onSlideInfoChange={(id, slideNumber) =>
              onSlideInfoChange(id, slideNumber)
            }
            slideNumber={segment.slideNumber}
            slideOrder={segment.slideOrder}
            onTabToNext={() => handleTabToNext(index)}
          />
        ))}
      </div>
    </div>
  );
}


## ./voiceforge/src/components/VoiceGenerator.tsx
// src/components/VoiceGenerator.tsx
import { useState } from "react";
import { TextSegment, VoiceSettingsType } from "../types";
import { validateText, validateVoiceSettings } from "../utils/validators";
import { SpeakerWaveIcon } from "@heroicons/react/24/solid";

interface VoiceGeneratorProps {
  inputText: string;
  voiceSettings: VoiceSettingsType;
  onGenerateStart: () => void;
  onGenerateComplete: (segments: TextSegment[]) => void;
  onError: (message: string) => void;
}

export default function VoiceGenerator({
  inputText,
  voiceSettings,
  onGenerateStart,
  onGenerateComplete,
  onError,
}: VoiceGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  // テキストを句点で分割する関数
  const splitTextByPeriod = (text: string): string[] => {
    const segments = text
      .split("。")
      .filter((segment) => segment.trim() !== "");

    return segments.map((segment, index) => {
      return index === segments.length - 1 && !text.endsWith("。")
        ? segment
        : segment + "。";
    });
  };

  // Base64文字列をBlobに変換する関数
  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mimeType });
  };

  // 音声を生成する関数
  const generateVoice = async (segmentText: string): Promise<string> => {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: segmentText,
        ...voiceSettings,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "音声の生成に失敗しました");
    }

    const data = await response.json();
    const audioBlob = base64ToBlob(data.audioContent, "audio/mp3");
    return URL.createObjectURL(audioBlob);
  };

  // すべてのセグメントの音声を生成
  const handleGenerateAllVoices = async () => {
    if (!validateText(inputText)) {
      onError("テキストが入力されていないか、文字数制限を超えています");
      return;
    }

    if (
      !validateVoiceSettings(
        voiceSettings.language,
        voiceSettings.voiceName,
        voiceSettings.speakingRate,
        voiceSettings.pitch
      )
    ) {
      onError("音声設定が無効です");
      return;
    }

    setIsGenerating(true);
    onGenerateStart();

    try {
      // テキストを句点で分割
      const segments = splitTextByPeriod(inputText);

      // 新しいセグメントの配列を作成
      const newSegments: TextSegment[] = segments.map((text, index) => ({
        id: `segment-${Date.now()}-${index}`,
        text,
        audioUrl: null,
        isLoading: true,
        duration: 0,
      }));

      onGenerateComplete(newSegments);

      // 各セグメントごとに音声を生成
      for (let i = 0; i < newSegments.length; i++) {
        try {
          const audioUrl = await generateVoice(newSegments[i].text);

          // 特定のセグメントのaudioUrlを更新
          newSegments[i].audioUrl = audioUrl;
          newSegments[i].isLoading = false;
          onGenerateComplete([...newSegments]);
        } catch (error) {
          console.error(`セグメント ${i + 1} の音声生成エラー:`, error);
          newSegments[i].isLoading = false;
          onGenerateComplete([...newSegments]);
        }
      }
    } catch (error) {
      console.error("音声生成エラー:", error);
      onError(
        error instanceof Error
          ? error.message
          : "音声の生成中にエラーが発生しました"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerateAllVoices}
      disabled={!inputText.trim() || isGenerating}
      className={`mt-4 py-2 px-4 rounded-md focus:outline-none w-full flex items-center justify-center ${
        !inputText.trim() || isGenerating
          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
          : "bg-blue-500 text-white hover:bg-blue-600"
      }`}
    >
      {isGenerating ? (
        "生成中..."
      ) : (
        <>
          <SpeakerWaveIcon className="h-5 w-5 mr-2" />
          音声を生成
        </>
      )}
    </button>
  );
}


## ./voiceforge/src/components/ui/DownloadButton.tsx
// src/components/ui/DownloadButton.tsx
"use client";

import React, { useState } from "react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/solid";

interface DownloadButtonProps {
  audioUrl: string | null;
  defaultFileName?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({
  audioUrl,
  defaultFileName = "voice",
}) => {
  const [fileName, setFileName] = useState(defaultFileName);

  const handleDownload = () => {
    if (!audioUrl) return;

    // ダウンロードリンクを作成
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `${fileName}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
      <div className="flex flex-col space-y-3">
        <div>
          <label
            htmlFor="fileName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            ファイル名
          </label>
          <input
            id="fileName"
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ファイル名を入力"
          />
        </div>
        <button
          onClick={handleDownload}
          disabled={!audioUrl}
          className={`w-full py-2 px-4 rounded-md focus:outline-none flex items-center justify-center ${
            audioUrl
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
          ダウンロード
        </button>
      </div>
    </div>
  );
};

export default DownloadButton;


## ./voiceforge/src/components/ui/DownloadOptions.tsx
// src/components/ui/DownloadOptions.tsx
"use client";

import React, { useState } from "react";
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/solid";
import { Switch } from "@headlessui/react";

interface TextSegment {
  id: string;
  text: string;
  audioUrl: string | null;
  isLoading: boolean;
  duration: number;
  slideNumber?: number;
  slideOrder?: number;
}

interface DownloadOptionsProps {
  segments: TextSegment[];
  fullText: string;
  voiceSettings: any;
}

const DownloadOptions: React.FC<DownloadOptionsProps> = ({
  segments,
  fullText,
  voiceSettings,
}) => {
  const [usePrefix, setUsePrefix] = useState(false);
  const [prefix, setPrefix] = useState("segment_");

  // 全音声をZIPでダウンロード
  const handleDownloadAllAudio = async () => {
    // JSZipをダイナミックインポート
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    // 有効な音声セグメントをフィルタリング
    const validSegments = segments.filter((segment) => segment.audioUrl);

    if (validSegments.length === 0) {
      alert("ダウンロード可能な音声がありません");
      return;
    }

    try {
      // 各セグメントを処理
      for (let i = 0; i < validSegments.length; i++) {
        const segment = validSegments[i];
        if (!segment.audioUrl) continue;

        // 音声データを取得
        const response = await fetch(segment.audioUrl);
        const blob = await response.blob();

        // ファイル名を作成
        const segmentNumber = (i + 1).toString().padStart(4, "0");
        const cleanText = segment.text.replace(/^\n+/, "");
        const fileName = usePrefix
          ? `${prefix}${segmentNumber}_${cleanText
              .substring(0, 20)
              .replace(/[\\/:*?"<>|]/g, "_")}.mp3`
          : `${segmentNumber}_${cleanText
              .substring(0, 30)
              .replace(/[\\/:*?"<>|]/g, "_")}.mp3`;

        // ZIPに追加
        zip.file(fileName, blob);
      }

      // ZIPを生成してダウンロード
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);

      const link = document.createElement("a");
      link.href = url;
      link.download = "voiceforge_audio.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // URLを解放
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("ZIP作成エラー:", error);
      alert("音声ファイルのダウンロード中にエラーが発生しました");
    }
  };

  // テキストをダウンロード
  const handleDownloadText = () => {
    if (!fullText.trim()) {
      alert("ダウンロードするテキストがありません");
      return;
    }

    const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "voiceforge_text.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  // JSONをダウンロード
  const handleDownloadJSON = () => {
    if (segments.length === 0) {
      alert("ダウンロードするデータがありません");
      return;
    }

    // スライドごとのデータを集計
    const slideMap = new Map();

    // 有効なスライド番号を持つセグメントを処理
    segments.forEach((segment, index) => {
      const slideNumber = segment.slideNumber;
      if (slideNumber !== undefined && slideNumber > 0) {
        // スライド情報がまだ存在しない場合は初期化
        if (!slideMap.has(slideNumber)) {
          slideMap.set(slideNumber, {
            id: slideNumber,
            name: slideNumber.toString(),
            num_audio: 0,
            audio_list: [],
            duration: 0,
            margin: 1000,
          });
        }

        // スライド情報を更新
        const slideInfo = slideMap.get(slideNumber);
        slideInfo.num_audio += 1;
        slideInfo.audio_list.push(index + 1); // 1-based index
        slideInfo.duration += Math.round(segment.duration * 1000); // ミリ秒に変換
      }
    });

    // スライド情報を配列に変換し、ID順にソート
    const slideArray = Array.from(slideMap.values()).sort(
      (a, b) => a.id - b.id
    );

    // JSONデータを作成
    const jsonData = {
      voiceSettings,
      segments: segments.map((segment, index) => ({
        id: index + 1, // 1-based index
        text: segment.text.replace(/^\n+/, ""),
        duration: Math.round(segment.duration * 1000), // ミリ秒に変換
        slideNumber: segment.slideNumber || null,
        slideOrder: segment.slideOrder || null,
      })),
      slide: slideArray,
      createdAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "voiceforge_data.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium mb-4">ダウンロードオプション</h3>

      <div className="space-y-4">
        {/* プレフィックス設定 */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">
            ファイル名プレフィックス
          </div>
          <Switch
            checked={usePrefix}
            onChange={setUsePrefix}
            className={`${
              usePrefix ? "bg-blue-500" : "bg-gray-200"
            } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
          >
            <span className="sr-only">プレフィックスを使用</span>
            <span
              className={`${
                usePrefix ? "translate-x-6" : "translate-x-1"
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        </div>

        {usePrefix && (
          <div>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="プレフィックス"
            />
            <p className="text-xs text-gray-500 mt-1">
              例: {prefix}0001_こんにちは.mp3
            </p>
          </div>
        )}

        {/* ダウンロードボタン */}
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={handleDownloadAllAudio}
            disabled={segments.filter((s) => s.audioUrl).length === 0}
            className={`py-2 px-4 rounded-md flex items-center justify-center ${
              segments.filter((s) => s.audioUrl).length === 0
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            全音声をZIPでダウンロード
          </button>

          <button
            onClick={handleDownloadText}
            disabled={!fullText.trim()}
            className={`py-2 px-4 rounded-md flex items-center justify-center ${
              !fullText.trim()
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            テキストをダウンロード
          </button>

          <button
            onClick={handleDownloadJSON}
            disabled={segments.length === 0}
            className={`py-2 px-4 rounded-md flex items-center justify-center ${
              segments.length === 0
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-purple-500 text-white hover:bg-purple-600"
            }`}
          >
            <CodeBracketIcon className="h-5 w-5 mr-2" />
            JSONデータをダウンロード
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadOptions;


## ./voiceforge/src/components/ui/SettingsPopup.tsx
// src/components/ui/SettingsPopup.tsx
import { XMarkIcon } from "@heroicons/react/24/solid";
import VoiceSettings, { VoiceSettingsType } from "./VoiceSettings";
import DownloadOptions from "./DownloadOptions";

interface SettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  segments: any[];
  fullText: string;
  voiceSettings: VoiceSettingsType;
  onSettingsChange: (settings: VoiceSettingsType) => void;
}

export default function SettingsPopup({
  isOpen,
  onClose,
  segments,
  fullText,
  voiceSettings,
  onSettingsChange,
}: SettingsPopupProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* 背景をグレーがけ */}
      <div className="fixed inset-0 bg-gray-200 opacity-75 z-40"></div>

      {/* 設定ポップアップ */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[80vh] overflow-y-auto border border-gray-300">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-medium">設定</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* 音声設定 */}
            <div>
              <h3 className="text-md font-medium mb-3">音声設定</h3>
              <VoiceSettings onChange={onSettingsChange} />
            </div>

            {/* ダウンロードオプション */}
            <div>
              <h3 className="text-md font-medium mb-3">
                ダウンロードオプション
              </h3>
              <DownloadOptions
                segments={segments}
                fullText={fullText}
                voiceSettings={voiceSettings}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


## ./voiceforge/src/components/ui/TextInput.tsx
// src/components/ui/TextInput.tsx
import React, { useState, useEffect, useMemo } from "react";

interface TextInputProps {
  onChange: (text: string) => void;
  maxLength?: number;
}

const TextInput: React.FC<TextInputProps> = ({
  onChange,
  maxLength = 1000,
}) => {
  const [text, setText] = useState<string>("");
  const [remainingChars, setRemainingChars] = useState<number>(maxLength);

  // 行数をカウント
  const lineCount = useMemo(() => text.split("\n").length, [text]);

  // 行番号の配列を作成
  const linesArr = useMemo(
    () => Array.from({ length: Math.max(1, lineCount) }, (_, i) => i + 1),
    [lineCount]
  );

  useEffect(() => {
    setRemainingChars(maxLength - text.length);
  }, [text, maxLength]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (newText.length <= maxLength) {
      setText(newText);
      onChange(newText);
    }
  };

  // テキストエリアとスクロール位置を同期させる
  const handleTextareaScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const lineNumbers = document.getElementById("line-numbers");
    if (lineNumbers) {
      lineNumbers.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="w-full">
      <div className="flex border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500">
        {/* 行番号表示エリア */}
        <div
          id="line-numbers"
          className="bg-gray-100 text-gray-500 text-right py-3 px-2 select-none overflow-hidden"
          style={{ minWidth: "3rem" }}
        >
          {linesArr.map((num) => (
            <div key={num} className="leading-6 text-sm">
              {num}
            </div>
          ))}
        </div>

        {/* テキスト入力エリア */}
        <textarea
          className="w-full p-3 border-none rounded-md focus:outline-none min-h-[150px] leading-6"
          value={text}
          onChange={handleChange}
          onScroll={handleTextareaScroll}
          placeholder="テキストを入力してください..."
          style={{ resize: "vertical" }}
        />
      </div>

      <div className="text-right text-sm text-gray-500 mt-1">
        残り {remainingChars} 文字
      </div>
    </div>
  );
};

export default TextInput;


## ./voiceforge/src/components/ui/VoiceSettings.tsx
// src/components/ui/VoiceSettings.tsx
import React, { useState } from "react";

export interface VoiceSettingsType {
  language: string;
  voiceName: string;
  speakingRate: number;
  pitch: number;
}

interface VoiceSettingsProps {
  onChange: (settings: VoiceSettingsType) => void;
}

const VoiceSettings: React.FC<VoiceSettingsProps> = ({ onChange }) => {
  const [settings, setSettings] = useState<VoiceSettingsType>({
    language: "ja-JP",
    voiceName: "ja-JP-Wavenet-A",
    speakingRate: 1.0,
    pitch: 0,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const newSettings = {
      ...settings,
      [name]:
        name === "speakingRate" || name === "pitch" ? parseFloat(value) : value,
    };
    setSettings(newSettings);
    onChange(newSettings);
  };

  // 日本語と英語の音声オプション
  const voiceOptions = {
    "ja-JP": [
      { value: "ja-JP-Wavenet-A", label: "女性 A (WaveNet)" },
      { value: "ja-JP-Wavenet-B", label: "女性 B (WaveNet)" },
      { value: "ja-JP-Wavenet-C", label: "男性 A (WaveNet)" },
      { value: "ja-JP-Wavenet-D", label: "男性 B (WaveNet)" },
      { value: "ja-JP-Standard-A", label: "女性 A (標準)" },
      { value: "ja-JP-Standard-B", label: "女性 B (標準)" },
      { value: "ja-JP-Standard-C", label: "男性 A (標準)" },
      { value: "ja-JP-Standard-D", label: "男性 B (標準)" },
    ],
    "en-US": [
      { value: "en-US-Wavenet-A", label: "女性 A (WaveNet)" },
      { value: "en-US-Wavenet-B", label: "男性 A (WaveNet)" },
      { value: "en-US-Wavenet-C", label: "女性 B (WaveNet)" },
      { value: "en-US-Wavenet-D", label: "男性 B (WaveNet)" },
      { value: "en-US-Wavenet-E", label: "女性 C (WaveNet)" },
      { value: "en-US-Wavenet-F", label: "女性 D (WaveNet)" },
      { value: "en-US-Standard-A", label: "女性 A (標準)" },
      { value: "en-US-Standard-B", label: "男性 A (標準)" },
    ],
  };

  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium mb-4">音声設定</h3>

      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            言語
          </label>
          <select
            name="language"
            value={settings.language}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ja-JP">日本語</option>
            <option value="en-US">英語 (米国)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            声の種類
          </label>
          <select
            name="voiceName"
            value={settings.voiceName}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {voiceOptions[settings.language as keyof typeof voiceOptions].map(
              (voice) => (
                <option key={voice.value} value={voice.value}>
                  {voice.label}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            話速 ({settings.speakingRate.toFixed(1)})
          </label>
          <input
            type="range"
            name="speakingRate"
            min="0.25"
            max="4.0"
            step="0.05"
            value={settings.speakingRate}
            onChange={handleChange}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ピッチ ({settings.pitch.toFixed(1)})
          </label>
          <input
            type="range"
            name="pitch"
            min="-20"
            max="20"
            step="1"
            value={settings.pitch}
            onChange={handleChange}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default VoiceSettings;


## ./voiceforge/src/components/ui/audio-player/LoadingIndicator.tsx
// src/components/ui/audio-player/LoadingIndicator.tsx
export default function LoadingIndicator() {
  return (
    <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
      <div className="flex items-center justify-center py-2">
        <div className="animate-pulse flex space-x-2">
          <div className="h-2 w-2 bg-blue-500 rounded-full" />
          <div className="h-2 w-2 bg-blue-500 rounded-full" />
          <div className="h-2 w-2 bg-blue-500 rounded-full" />
        </div>
        <span className="ml-3 text-gray-500">音声生成中...</span>
      </div>
    </div>
  );
}


## ./voiceforge/src/components/ui/audio-player/PlaybackControls.tsx
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
  onPlayPause: () => void;
  onStop: () => void;
  onDownload: () => void;
  // onRegenerateプロパティを削除
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
    {/* 再生成ボタンを削除 */}
  </div>
);

export default PlaybackControls;


## ./voiceforge/src/components/ui/audio-player/SlideInfoInputs.tsx
import React from "react";

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

export default SlideInfoInputs;


## ./voiceforge/src/components/ui/audio-player/index.tsx
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

    // テキスト変更がある場合の再生成処理
    if (needsRegeneration && onRegenerateAudio) {
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
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("再生成エラー:", error);
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
  }, []);

  // ダウンロード処理
  const handleDownload = () => {
    if (!audioUrl) return;

    const sanitizedFileName = editedText
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
            value={editedText.replace(/^\n+/g, "")}
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


## ./voiceforge/src/components/ui/audio-player/types.tsx
// src/components/ui/audio-player/types.ts
export interface AudioPlayerProps {
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
  onTabToNext?: () => void;
  editedText: string;
  onTextEdit: (id: string, text: string) => void;
  onRegenerateAudio?: (id: string, text: string) => Promise<void>;
}


## ./voiceforge/src/components/ui/audio-player/utils.ts
// src/components/ui/audio-player/utils.ts
export const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const formatSegmentNumber = (num?: number) => {
  return num ? num.toString().padStart(3, "0") : "";
};


## ./voiceforge/src/types/index.ts
// src/types/index.ts
export interface TextSegment {
  id: string;
  originalText: string; // 元のテキスト
  editedText: string; // 編集可能なテキスト
  audioUrl: string | null;
  isLoading: boolean;
  duration: number;
  slideNumber?: number;
  slideOrder?: number;
}

export interface VoiceSettingsType {
  language: string;
  voiceName: string;
  speakingRate: number;
  pitch: number;
}


## ./voiceforge/src/utils/googleTTS.ts
// src/utils/googleTTS.ts
import { VoiceSettingsType } from "../components/ui/VoiceSettings";

export interface TTSRequest {
  text: string;
  language: string;
  voiceName: string;
  speakingRate: number;
  pitch: number;
}

export async function synthesizeSpeech(request: TTSRequest): Promise<string> {
  try {
    // API Keyを環境変数から取得
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;

    if (!apiKey) {
      throw new Error("Google Cloud API Keyが設定されていません");
    }

    // Google Cloud Text-to-Speech API エンドポイント
    const apiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

    // APIリクエストの作成
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: { text: request.text },
        voice: {
          languageCode: request.language,
          name: request.voiceName,
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: request.speakingRate,
          pitch: request.pitch,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "音声合成APIエラー");
    }

    const data = await response.json();

    if (!data.audioContent) {
      throw new Error("音声データが生成されませんでした");
    }

    // Base64エンコードされた音声データを返す
    return data.audioContent;
  } catch (error) {
    console.error("音声合成エラー:", error);
    throw error;
  }
}


## ./voiceforge/src/utils/validators.ts
// src/utils/validators.ts
export const validateText = (
  text: string,
  maxLength: number = 5000
): boolean => {
  if (!text || text.trim().length === 0) {
    return false;
  }

  if (text.length > maxLength) {
    return false;
  }

  return true;
};

export const validateVoiceSettings = (
  language: string,
  voiceName: string,
  speakingRate: number,
  pitch: number
): boolean => {
  // 言語コードの検証
  const validLanguages = ["ja-JP", "en-US"];
  if (!validLanguages.includes(language)) {
    return false;
  }

  // 音声名の検証
  if (!voiceName || !voiceName.startsWith(language)) {
    return false;
  }

  // 話速の検証
  if (speakingRate < 0.25 || speakingRate > 4.0) {
    return false;
  }

  // ピッチの検証
  if (pitch < -20 || pitch > 20) {
    return false;
  }

  return true;
};


