// src/components/ui/SettingsPopup.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface SettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  segments: TextSegment[];
  fullText: string;
  voiceSettings: VoiceSettingsType;
  onSettingsChange: (settings: VoiceSettingsType) => void;
}

export default function SettingsPopup({
  isOpen,
  onClose,
  segments,
  fullText,
  voiceSettings,
  onSettingsChange,
}: SettingsPopupProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
      </DialogContent>
    </Dialog>
  );
}
