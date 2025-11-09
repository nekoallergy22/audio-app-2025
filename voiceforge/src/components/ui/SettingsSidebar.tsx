// src/components/ui/SettingsSidebar.tsx
"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import VoiceSettings, { VoiceSettingsType } from "./VoiceSettings";
import DownloadOptions from "./DownloadOptions";

interface TextSegment {
  id: string;
  text: string;
  audioUrl: string | null;
  isLoading: boolean;
  duration: number;
  slideNumber?: number;
  slideOrder?: number;
}

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  segments: TextSegment[];
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
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[400px] sm:max-w-[400px]">
        <SheetHeader>
          <SheetTitle>設定</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6 overflow-y-auto h-[calc(100vh-120px)]">
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
      </SheetContent>
    </Sheet>
  );
}
