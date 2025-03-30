// src/app/page.tsx
"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import TextInput from "../components/ui/TextInput";
import VoiceSettings, {
  VoiceSettingsType,
} from "../components/ui/VoiceSettings";

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

  const handleTextChange = (text: string) => {
    setInputText(text);
  };

  const handleSettingsChange = (settings: VoiceSettingsType) => {
    setVoiceSettings(settings);
  };

  const handleGenerateVoice = async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);

    // ここではまだAPIを実装していないので、モックデータを使用
    try {
      // 実際のAPIが実装されたら、ここでAPIを呼び出す
      // const response = await fetch('/api/tts', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ text: inputText, ...voiceSettings }),
      // });

      // モック処理（実際のAPIが実装されるまでのダミー）
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 仮のオーディオファイルを設定（実際のAPIが実装されるまでのダミー）
      // 実際はAPIからのレスポンスを使用
      setAudioUrl("/audio/sample.mp3");
    } catch (error) {
      console.error("音声生成エラー:", error);
      alert("音声の生成中にエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

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
