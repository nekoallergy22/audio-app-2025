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
