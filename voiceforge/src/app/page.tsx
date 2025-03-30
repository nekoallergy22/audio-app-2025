// src/app/page.tsx
"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import TextInput from "../components/ui/TextInput";
import VoiceSettings, {
  VoiceSettingsType,
} from "../components/ui/VoiceSettings";
import { validateText, validateVoiceSettings } from "../utils/validators";

// クライアントサイドのみでレンダリングするコンポーネント
const AudioPlayer = dynamic(() => import("../components/ui/AudioPlayer"), {
  ssr: false,
});

const DownloadButton = dynamic(
  () => import("../components/ui/DownloadButton"),
  {
    ssr: false,
  }
);

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettingsType>({
    language: "ja-JP",
    voiceName: "ja-JP-Wavenet-A",
    speakingRate: 1.0,
    pitch: 0,
  });
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleTextChange = (text: string) => {
    setInputText(text);
    setErrorMessage(null);
  };

  const handleSettingsChange = (settings: VoiceSettingsType) => {
    setVoiceSettings(settings);
    setErrorMessage(null);
  };

  const handleGenerateVoice = async () => {
    // テキストの検証
    if (!validateText(inputText)) {
      setErrorMessage("テキストが入力されていないか、文字数制限を超えています");
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
      setErrorMessage("音声設定が無効です");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // APIを呼び出す
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
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

      // 既存のaudioUrlがある場合は解放
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      // 新しいaudioUrlを作成
      const newAudioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(newAudioUrl);
    } catch (error) {
      console.error("音声生成エラー:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "音声の生成中にエラーが発生しました"
      );
    } finally {
      setIsLoading(false);
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

  // コンポーネントがアンマウントされる際にaudioUrlを解放
  React.useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
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
              onClick={handleGenerateVoice}
              disabled={!inputText.trim() || isLoading}
              className={`mt-4 py-2 px-4 rounded-md focus:outline-none w-full ${
                !inputText.trim() || isLoading
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {isLoading ? "生成中..." : "音声を生成"}
            </button>
          </div>

          <AudioPlayer audioUrl={audioUrl} />
        </div>

        <div className="space-y-6">
          <VoiceSettings onChange={handleSettingsChange} />
          <DownloadButton audioUrl={audioUrl} />
        </div>
      </div>
    </main>
  );
}
