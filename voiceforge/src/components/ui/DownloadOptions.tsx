// src/components/ui/DownloadOptions.tsx
"use client";

import React, { useState } from "react";
import { Download, FileText, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import JSZip from "jszip"; // JSZipをインポート
import { VoiceSettingsType } from "./VoiceSettings";

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
  voiceSettings: VoiceSettingsType;
}

const DownloadOptions: React.FC<DownloadOptionsProps> = ({
  segments,
  fullText,
  voiceSettings,
}) => {
  const [usePrefix, setUsePrefix] = useState(false);
  const [prefix, setPrefix] = useState("segment_");

  // プロジェクトIDと名前の状態管理を追加
  const [projId, setProjId] = useState("test");
  const [projName, setProjName] = useState("test");

  // プロジェクトID入力ハンドラ
  const handleProjIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjId(e.target.value);
  };

  // プロジェクト名入力ハンドラ
  const handleProjNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjName(e.target.value);
  };

  // 全音声をZIPでダウンロード
  const handleDownloadAllAudio = async () => {
    const zip = new JSZip();
    const validSegments = segments.filter((segment) => segment.audioUrl);

    if (validSegments.length === 0) {
      alert("ダウンロード可能な音声がありません");
      return;
    }

    try {
      for (let i = 0; i < validSegments.length; i++) {
        const segment = validSegments[i];
        try {
          const response = await fetch(segment.audioUrl!);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const blob = await response.blob();

          const segmentNumber = (i + 1).toString().padStart(4, "0");
          const cleanText = segment.text.replace(/^\n+/, "");
          const sanitizedText = cleanText.replace(/[\\/:*?"<>|]/g, "_");
          const fileName = usePrefix
            ? `${prefix}${segmentNumber}_${sanitizedText.substring(0, 20)}.mp3`
            : `${segmentNumber}_${sanitizedText.substring(0, 30)}.mp3`;

          zip.file(fileName, blob);
        } catch (fetchError) {
          console.error(`セグメント ${i + 1} の取得エラー:`, fetchError);
          // エラーが発生したセグメントをスキップして続行
          continue;
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);

      const link = document.createElement("a");
      link.href = url;
      link.download = "voiceforge_audio.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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

    // スライド数と音声セグメント数を計算
    const numSlide = slideArray.length;
    const numAudio = segments.length;

    // 現在の日付を取得（YYYY-MM-DD形式）
    const currentDate = new Date().toISOString().split("T")[0];

    // JSONデータを作成（projectセクションを追加）
    const jsonData = {
      project: {
        proj_id: projId, // 状態変数を使用
        name: projName, // 状態変数を使用
        num_slide: numSlide,
        num_audio: numAudio,
        create_at: currentDate,
        update_at: currentDate,
      },
      voiceSettings,
      audios: segments.map((segment, index) => ({
        id: index + 1, // インデックスベースのID（1始まり）
        text: segment.text.replace(/^\n+/, ""),
        duration: Math.round(segment.duration * 1000), // ミリ秒に変換
        slideNumber: segment.slideNumber || null,
        slideOrder: segment.slideOrder || null,
      })),
      slide: slideArray,
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
    <div className="space-y-4">
        {/* プロジェクト情報入力フィールド */}
        <div className="space-y-2">
          <div className="space-y-2">
            <Label htmlFor="projId">プロジェクトID</Label>
            <Input
              id="projId"
              type="text"
              value={projId}
              onChange={handleProjIdChange}
              placeholder="プロジェクトIDを入力"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="projName">プロジェクト名</Label>
            <Input
              id="projName"
              type="text"
              value={projName}
              onChange={handleProjNameChange}
              placeholder="プロジェクト名を入力"
            />
          </div>
        </div>

        {/* ファイル名プレフィックス設定 */}
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="usePrefix" className="text-sm font-medium">
            ファイル名プレフィックス
          </Label>
          <Switch
            id="usePrefix"
            checked={usePrefix}
            onCheckedChange={setUsePrefix}
          />
        </div>

        {usePrefix && (
          <div className="space-y-2">
            <Input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="プレフィックス"
            />
            <p className="text-xs text-muted-foreground">
              プレフィックス例：{prefix}0001_こんにちは.mp3
            </p>
          </div>
        )}

        {/* ダウンロードボタン群 */}
        <div className="grid grid-cols-1 gap-2">
          <Button
            onClick={handleDownloadAllAudio}
            disabled={segments.filter((s) => s.audioUrl).length === 0}
            className="w-full"
          >
            <Download className="h-5 w-5 mr-2" />
            全音声をZIPでダウンロード
          </Button>

          <Button
            onClick={handleDownloadText}
            disabled={!fullText.trim()}
            className="w-full bg-green-500 hover:bg-green-600"
          >
            <FileText className="h-5 w-5 mr-2" />
            テキストをダウンロード
          </Button>

          <Button
            onClick={handleDownloadJSON}
            disabled={segments.length === 0}
            className="w-full bg-purple-500 hover:bg-purple-600"
          >
            <Code className="h-5 w-5 mr-2" />
            JSONデータをダウンロード
          </Button>
        </div>
    </div>
  );
};

export default DownloadOptions;
