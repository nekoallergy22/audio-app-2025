// src/types/index.ts
export interface TextSegment {
  id: string;
  text: string;
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
