// テキストセグメントと対応する音声URLを管理するインターフェース
export interface TextSegment {
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
