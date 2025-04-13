// src/types/index.ts
export interface TextSegment {
  id: string;
  originalText: string; // 元のテキスト
  editedText: string; // 編集可能なテキスト
  audioUrl: string | null;
  isLoading: boolean;
  duration: number;
  slideNumber?: number;
  slideOrder?: number;
}

export interface VoiceSettingsType {
  language: string;
  voiceName: string;
  speakingRate: number;
  pitch: number;
}
