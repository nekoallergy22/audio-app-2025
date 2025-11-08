// src/app/page.tsx
"use client";

import React, { useState } from "react";
import TextInput from "../components/ui/TextInput";
import { VoiceSettingsType } from "../components/ui/VoiceSettings";
import { validateText, validateVoiceSettings } from "../utils/validators";
import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AudioPlayer from "@/components/ui/audio-player";
import { useTextSegments } from "@/hooks/useTextSegments";
import VoiceSettings from "../components/ui/VoiceSettings";
import DownloadOptions from "../components/ui/DownloadOptions";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettingsType>({
    language: "ja-JP",
    voiceName: "ja-JP-Wavenet-D",
    speakingRate: 1.0,
    pitch: 0,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    textSegments,
    generateAllVoices,
    regenerateAudio,
    updateSegmentText,
    updateSegmentDuration,
    updateSlideInfo,
  } = useTextSegments();

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
      await generateAllVoices(inputText, voiceSettings);
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

  // 音声を再生成する関数
  const handleRegenerateAudio = async (id: string, newText: string) => {
    try {
      await regenerateAudio(id, newText, voiceSettings);
    } catch (error) {
      console.error("音声再生成エラー:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "音声の再生成中にエラーが発生しました"
      );
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-full">
      <h1 className="text-2xl font-bold mb-6">
        VoiceForge - テキスト読み上げツール
      </h1>

      {/* 3カラムレイアウト */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左：テキスト入力セクション */}
        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 h-fit">
          <h2 className="text-lg font-medium mb-4">テキスト入力</h2>
          <TextInput onChange={handleTextChange} maxLength={5000} />
          {errorMessage && (
            <div className="mt-2 text-red-500 text-sm">{errorMessage}</div>
          )}
          <Button
            onClick={handleGenerateAllVoices}
            disabled={!inputText.trim() || isGenerating}
            className="mt-4 w-full"
          >
            {isGenerating ? (
              "生成中..."
            ) : (
              <>
                <Volume2 className="h-5 w-5 mr-2" />
                音声を生成
              </>
            )}
          </Button>
        </div>

        {/* 中央：生成された音声一覧 */}
        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium mb-4">分割テキスト</h2>
          {textSegments.length > 0 ? (
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
                    updateSegmentDuration(segment.id, duration)
                  }
                  onSlideInfoChange={(id, slideNumber) =>
                    updateSlideInfo(id, slideNumber)
                  }
                  slideNumber={segment.slideNumber}
                  slideOrder={segment.slideOrder}
                  onTabToNext={() => handleTabToNext(index)}
                  editedText={segment.editedText}
                  onTextEdit={updateSegmentText}
                  onRegenerateAudio={handleRegenerateAudio}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">
              テキストを入力して音声を生成してください
            </p>
          )}
        </div>

        {/* 右：設定項目 */}
        <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 h-fit">
          <h2 className="text-lg font-medium mb-4">設定</h2>

          <div className="space-y-6">
            {/* 音声設定 */}
            <div>
              <h3 className="text-md font-medium mb-3">音声設定</h3>
              <VoiceSettings onChange={handleSettingsChange} />
            </div>

            {/* ダウンロードオプション */}
            <div>
              <h3 className="text-md font-medium mb-3">
                ダウンロードオプション
              </h3>
              <DownloadOptions
                segments={textSegments}
                fullText={inputText}
                voiceSettings={voiceSettings}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
