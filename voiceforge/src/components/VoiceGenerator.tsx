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
