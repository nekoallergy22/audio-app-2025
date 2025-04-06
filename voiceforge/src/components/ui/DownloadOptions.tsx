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
