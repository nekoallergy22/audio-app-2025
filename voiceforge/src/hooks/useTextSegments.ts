import { useState, useEffect } from "react";
import { TextSegment } from "@/types/audio";
import { splitTextByPeriod, base64ToBlob } from "@/utils/audio";
import { VoiceSettingsType } from "@/components/ui/VoiceSettings";

export const useTextSegments = () => {
  const [textSegments, setTextSegments] = useState<TextSegment[]>([]);

  // 音声を生成する関数
  const generateVoice = async (
    segmentText: string,
    voiceSettings: VoiceSettingsType
  ): Promise<string> => {
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
  const generateAllVoices = async (
    inputText: string,
    voiceSettings: VoiceSettingsType
  ): Promise<void> => {
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
        const audioUrl = await generateVoice(newSegments[i].text, voiceSettings);

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
        throw error;
      }
    }
  };

  // 音声を再生成する関数
  const regenerateAudio = async (
    id: string,
    newText: string,
    voiceSettings: VoiceSettingsType
  ): Promise<void> => {
    // 該当セグメントをローディング状態に
    setTextSegments((prev) =>
      prev.map((segment) =>
        segment.id === id ? { ...segment, isLoading: true } : segment
      )
    );

    // 新しいテキストで音声を生成
    const audioUrl = await generateVoice(newText, voiceSettings);

    // 結果を更新
    setTextSegments((prev) =>
      prev.map((segment) =>
        segment.id === id
          ? { ...segment, audioUrl, isLoading: false, text: newText }
          : segment
      )
    );
  };

  // テキストを編集
  const updateSegmentText = (id: string, newText: string) => {
    setTextSegments((prevSegments) =>
      prevSegments.map((segment) =>
        segment.id === id ? { ...segment, editedText: newText } : segment
      )
    );
  };

  // 再生時間を更新
  const updateSegmentDuration = (id: string, duration: number) => {
    setTextSegments((prevSegments) =>
      prevSegments.map((segment) =>
        segment.id === id ? { ...segment, duration } : segment
      )
    );
  };

  // スライド情報を更新（半自動化機能付き）
  const updateSlideInfo = (id: string, slideNumber: number) => {
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

  // コンポーネントがアンマウントされる際にaudioUrlを解放
  useEffect(() => {
    return () => {
      textSegments.forEach((segment) => {
        if (segment.audioUrl) {
          URL.revokeObjectURL(segment.audioUrl);
        }
      });
    };
  }, [textSegments]);

  return {
    textSegments,
    generateAllVoices,
    regenerateAudio,
    updateSegmentText,
    updateSegmentDuration,
    updateSlideInfo,
  };
};
