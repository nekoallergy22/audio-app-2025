// src/components/ui/audio-player/types.ts
export interface AudioPlayerProps {
  audioUrl: string | null;
  text?: string;
  isLoading?: boolean;
  segmentNumber?: number;
  onDurationChange: (duration: number) => void;
  onSlideInfoChange?: (
    id: string,
    slideNumber: number,
    slideOrder: number
  ) => void;
  id: string;
  slideNumber?: number;
  slideOrder?: number;
  onTabToNext?: () => void;
  editedText: string;
  onTextEdit: (id: string, text: string) => void;
  onRegenerateAudio?: (id: string, text: string) => Promise<string | null>;
  onGenerateAudio?: (id: string, text: string) => Promise<string | null>;
}
