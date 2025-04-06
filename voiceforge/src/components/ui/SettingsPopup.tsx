// src/components/ui/SettingsPopup.tsx
import { XMarkIcon } from "@heroicons/react/24/solid";
import VoiceSettings, { VoiceSettingsType } from "./VoiceSettings";
import DownloadOptions from "./DownloadOptions";

interface SettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  segments: any[];
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
  if (!isOpen) return null;

  return (
    <>
      {/* 背景をグレーがけ */}
      <div className="fixed inset-0 bg-gray-200 opacity-75 z-40"></div>

      {/* 設定ポップアップ */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[80vh] overflow-y-auto border border-gray-300">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-medium">設定</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-4 space-y-6">
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
      </div>
    </>
  );
}
