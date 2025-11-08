// src/components/ui/SettingsSidebar.tsx
"use client";

import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import VoiceSettings, { VoiceSettingsType } from "./VoiceSettings";
import DownloadOptions from "./DownloadOptions";

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  segments: any[];
  fullText: string;
  voiceSettings: VoiceSettingsType;
  onSettingsChange: (settings: VoiceSettingsType) => void;
}

export default function SettingsSidebar({
  isOpen,
  onClose,
  segments,
  fullText,
  voiceSettings,
  onSettingsChange,
}: SettingsSidebarProps) {
  return (
    <>
      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* サイドバー */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">設定</h2>
          <Button onClick={onClose} variant="ghost" size="icon">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* コンテンツ */}
        <div className="overflow-y-auto h-[calc(100%-64px)] p-4 space-y-6">
          {/* 音声設定 */}
          <div>
            <h3 className="text-md font-medium mb-3">音声設定</h3>
            <VoiceSettings onChange={onSettingsChange} />
          </div>

          {/* ダウンロードオプション */}
          <div>
            <h3 className="text-md font-medium mb-3">
              ダウンロードオプション
            </h3>
            <DownloadOptions
              segments={segments}
              fullText={fullText}
              voiceSettings={voiceSettings}
            />
          </div>
        </div>
      </div>
    </>
  );
}
