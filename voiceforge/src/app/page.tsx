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
import { SpeakerWaveIcon, Cog6ToothIcon, DocumentTextIcon } from "@heroicons/react/24/solid";
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
    voiceName: "ja-JP-Wavenet-D",
    speakingRate: 1.0,
    pitch: 0,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
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

  // テキストセグメントを生成
  const handleGenerateTextSegments = () => {
    if (!validateText(inputText)) {
      setErrorMessage("テキストが入力されていないか、文字数制限を超えています");
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

      // 新しいセグメントの配列を作成（音声なし）
      const newSegments: TextSegment[] = segments.map((text, index) => ({
        id: `segment-${Date.now()}-${index}`,
        text,
        editedText: text, // 初期値は元のテキスト
        audioUrl: null,
        isLoading: false,
        duration: 0,
      }));

      setTextSegments(newSegments);
    } catch (error) {
      console.error("テキスト分割エラー:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "テキストの分割中にエラーが発生しました"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // すべてのセグメントの音声を生成
  const handleGenerateAllVoices = async () => {
    if (textSegments.length === 0) {
      setErrorMessage("先にテキストを生成してください");
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

    setIsGeneratingAudio(true);
    setErrorMessage(null);

    try {
      // 各セグメントごとに音声を生成
      for (let i = 0; i < textSegments.length; i++) {
        try {
          // セグメントをローディング状態に
          setTextSegments((prev) =>
            prev.map((segment, idx) =>
              idx === i ? { ...segment, isLoading: true } : segment
            )
          );

          const audioUrl = await generateVoice(textSegments[i].editedText);

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
      setIsGeneratingAudio(false);
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
        
        {/* ボタンを左右に配置 */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <div className="text-xs text-gray-500 mb-1 text-center">Step 1</div>
            <button
              onClick={handleGenerateTextSegments}
              disabled={!inputText.trim() || isGenerating}
              className={`py-2 px-4 rounded-md focus:outline-none flex items-center justify-center ${
                !inputText.trim() || isGenerating
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              {isGenerating ? (
                "分割中..."
              ) : (
                <>
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  テキストを生成
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col">
            <div className="text-xs text-gray-500 mb-1 text-center">Step 2</div>
            <button
              onClick={handleGenerateAllVoices}
              disabled={textSegments.length === 0 || isGeneratingAudio}
              className={`py-2 px-4 rounded-md focus:outline-none flex items-center justify-center ${
                textSegments.length === 0 || isGeneratingAudio
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {isGeneratingAudio ? (
                "生成中..."
              ) : (
                <>
                  <SpeakerWaveIcon className="h-5 w-5 mr-2" />
                  音声を生成
                </>
              )}
            </button>
          </div>
        </div>
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
          <h2 className="text-lg font-medium mb-4">
            {textSegments.some(segment => segment.audioUrl) ? "生成された音声" : "生成されたテキストセグメント"}
          </h2>
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
