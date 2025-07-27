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
    voiceName: "ja-JP-Wavenet-D",
    speakingRate: 1.0,
    pitch: 0,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpdatingFromSegments, setIsUpdatingFromSegments] = useState(false);

  const handleDurationChange = (id: string, duration: number) => {
    setTextSegments((prevSegments) =>
      prevSegments.map((segment) =>
        segment.id === id ? { ...segment, duration } : segment
      )
    );
  };

  const handleTextChange = (text: string) => {
    if (!isUpdatingFromSegments) {
      setInputText(text);
      setErrorMessage(null);
    }
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
    if (textSegments.length === 0) {
      setErrorMessage("テキストを入力してください");
      return;
    }

    // 未生成の音声セグメントをフィルタリング
    const segmentsToGenerate = textSegments.filter(segment => !segment.audioUrl);
    
    if (segmentsToGenerate.length === 0) {
      alert("全ての音声が既に生成済みです。");
      return;
    }

    // 確認ダイアログを表示
    const confirmed = confirm(
      `${segmentsToGenerate.length}個の未生成音声セグメントを一括生成します。\n` +
      `(生成済み: ${textSegments.length - segmentsToGenerate.length}個、未生成: ${segmentsToGenerate.length}個)\n` +
      "よろしいですか？"
    );
    if (!confirmed) {
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
      // 未生成セグメントのみを処理
      for (let i = 0; i < segmentsToGenerate.length; i++) {
        try {
          const targetSegment = segmentsToGenerate[i];
          
          // セグメントをローディング状態に
          setTextSegments((prev) =>
            prev.map((segment) =>
              segment.id === targetSegment.id ? { ...segment, isLoading: true } : segment
            )
          );

          const audioUrl = await generateVoice(targetSegment.editedText);

          // 特定のセグメントのaudioUrlを更新
          setTextSegments((prev) =>
            prev.map((segment) =>
              segment.id === targetSegment.id ? { ...segment, audioUrl, isLoading: false } : segment
            )
          );
        } catch (error) {
          console.error(`セグメント ${i + 1} の音声生成エラー:`, error);
          // エラーが発生したセグメントを更新
          setTextSegments((prev) =>
            prev.map((segment) =>
              segment.id === segmentsToGenerate[i].id ? { ...segment, isLoading: false } : segment
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

  // リアルタイムでテキスト分割を実行
  useEffect(() => {
    if (!inputText.trim() || isUpdatingFromSegments) {
      if (!inputText.trim()) {
        setTextSegments((prevSegments) => {
          // 既存のaudioUrlを解放
          prevSegments.forEach((segment) => {
            if (segment.audioUrl) {
              URL.revokeObjectURL(segment.audioUrl);
            }
          });
          return [];
        });
      }
      return;
    }

    // テキストを句点で分割
    const segments = splitTextByPeriod(inputText);

    setTextSegments((prevSegments) => {
      // 既存のセグメントと比較
      const currentTexts = prevSegments.map(s => s.editedText);
      const newTexts = segments;
      
      if (JSON.stringify(currentTexts) !== JSON.stringify(newTexts)) {
        // 既存のセグメントを保持しつつ、新しいセグメント配列を作成
        const updatedSegments: TextSegment[] = segments.map((text, index) => {
          // 同じインデックスの既存セグメントを探す
          const existingSegment = prevSegments[index];
          
          // テキストが同じなら既存セグメントを保持（音声も保持）
          if (existingSegment && existingSegment.editedText === text) {
            return existingSegment;
          }
          
          // テキストが異なるか新規セグメントの場合は新しく作成
          return {
            id: existingSegment?.id || `segment-${Date.now()}-${index}`,
            text,
            editedText: text,
            audioUrl: null,
            isLoading: false,
            duration: 0,
          };
        });

        // 削除されたセグメントの音声URLを解放
        prevSegments.slice(segments.length).forEach((segment) => {
          if (segment.audioUrl) {
            URL.revokeObjectURL(segment.audioUrl);
          }
        });

        return updatedSegments;
      }
      return prevSegments;
    });
  }, [inputText, isUpdatingFromSegments]);

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
    setTextSegments((prevSegments) => {
      // セグメントを更新（編集されたセグメントの音声をリセット）
      const updatedSegments = prevSegments.map((segment) => {
        if (segment.id === id) {
          // 編集されたセグメントの音声をリセット
          if (segment.audioUrl) {
            URL.revokeObjectURL(segment.audioUrl);
          }
          return { 
            ...segment, 
            editedText: newText,
            audioUrl: null,
            duration: 0,
            isLoading: false
          };
        }
        return segment;
      });
      
      // 全セグメントのテキストを結合して入力欄を更新
      const combinedText = updatedSegments
        .map((segment) => {
          const text = segment.editedText.trim();
          return text.endsWith("。") ? text : text + "。";
        })
        .join("");
      
      // セグメントからの更新であることを示すフラグを設定
      setIsUpdatingFromSegments(true);
      setInputText(combinedText);
      
      // フラグをリセット（非同期で）
      setTimeout(() => setIsUpdatingFromSegments(false), 0);
      
      return updatedSegments;
    });
  };

  // 音声を再生成する関数
  const handleRegenerateAudio = async (id: string, newText: string): Promise<string | null> => {
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

      return audioUrl;
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
      return null;
    }
  };

  // 個別セグメントの音声を生成する関数
  const handleGenerateAudio = async (id: string, text: string): Promise<string | null> => {
    if (
      !validateVoiceSettings(
        voiceSettings.language,
        voiceSettings.voiceName,
        voiceSettings.speakingRate,
        voiceSettings.pitch
      )
    ) {
      setErrorMessage("音声設定が無効です");
      return null;
    }

    try {
      // 該当セグメントをローディング状態に
      setTextSegments((prev) =>
        prev.map((segment) =>
          segment.id === id ? { ...segment, isLoading: true } : segment
        )
      );

      // 音声を生成
      const audioUrl = await generateVoice(text);

      // 結果を更新（textも更新して同期を保つ）
      setTextSegments((prev) =>
        prev.map((segment) =>
          segment.id === id
            ? { ...segment, audioUrl, isLoading: false, text }
            : segment
        )
      );

      return audioUrl;
    } catch (error) {
      console.error(`セグメント音声生成エラー:`, error);
      setTextSegments((prev) =>
        prev.map((segment) =>
          segment.id === id ? { ...segment, isLoading: false } : segment
        )
      );
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "音声の生成中にエラーが発生しました"
      );
      return null;
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
        <TextInput value={inputText} onChange={handleTextChange} maxLength={5000} />
        {errorMessage && (
          <div className="mt-2 text-red-500 text-sm">{errorMessage}</div>
        )}
        
        {/* 音声生成ボタン */}
        <button
          onClick={handleGenerateAllVoices}
          disabled={textSegments.length === 0 || isGeneratingAudio}
          className={`mt-4 py-2 px-4 rounded-md focus:outline-none w-full flex items-center justify-center ${
            textSegments.length === 0 || isGeneratingAudio
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {isGeneratingAudio ? (
            "音声生成中..."
          ) : (
            <>
              <SpeakerWaveIcon className="h-5 w-5 mr-2" />
              全ての音声を一括生成
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
          <h2 className="text-lg font-medium mb-4">テキスト一覧</h2>
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
                onGenerateAudio={handleGenerateAudio}
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
