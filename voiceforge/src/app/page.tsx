// src/app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import TextInput from "../components/ui/TextInput";
import VoiceSettings, {
  VoiceSettingsType,
} from "../components/ui/VoiceSettings";
import { validateText, validateVoiceSettings } from "../utils/validators";
import { SpeakerWaveIcon } from "@heroicons/react/24/solid";

const AudioPlayer = dynamic(() => import("../components/ui/AudioPlayer"), {
  ssr: false,
});

// テキストセグメントと対応する音声URLを管理するインターフェース
interface TextSegment {
  id: string;
  text: string;
  audioUrl: string | null;
  isLoading: boolean;
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

  const handleTextChange = (text: string) => {
    setInputText(text);
    setErrorMessage(null);
  };

  const handleSettingsChange = (settings: VoiceSettingsType) => {
    setVoiceSettings(settings);
    setErrorMessage(null);
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
        audioUrl: null,
        isLoading: true,
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

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 text-center">
        VoiceForge - テキスト読み上げツール
      </h1>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 mb-6">
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

          {/* セグメントごとのAudioPlayerを表示 */}
          <div className="space-y-4">
            {textSegments.map((segment, index) => (
              <AudioPlayer
                key={segment.id}
                audioUrl={segment.audioUrl}
                text={segment.text}
                isLoading={segment.isLoading}
                segmentNumber={index + 1}
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <VoiceSettings onChange={handleSettingsChange} />
        </div>
      </div>
    </main>
  );
}
