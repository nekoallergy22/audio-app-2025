// src/components/ui/VoiceSettings.tsx
import React, { useState } from "react";

export interface VoiceSettingsType {
  language: string;
  voiceName: string;
  speakingRate: number;
  pitch: number;
}

interface VoiceSettingsProps {
  onChange: (settings: VoiceSettingsType) => void;
}

const VoiceSettings: React.FC<VoiceSettingsProps> = ({ onChange }) => {
  const [settings, setSettings] = useState<VoiceSettingsType>({
    language: "ja-JP",
    voiceName: "ja-JP-Wavenet-A",
    speakingRate: 1.0,
    pitch: 0,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const newSettings = {
      ...settings,
      [name]:
        name === "speakingRate" || name === "pitch" ? parseFloat(value) : value,
    };
    setSettings(newSettings);
    onChange(newSettings);
  };

  // 日本語と英語の音声オプション
  const voiceOptions = {
    "ja-JP": [
      { value: "ja-JP-Wavenet-A", label: "女性 A (WaveNet)" },
      { value: "ja-JP-Wavenet-B", label: "女性 B (WaveNet)" },
      { value: "ja-JP-Wavenet-C", label: "男性 A (WaveNet)" },
      { value: "ja-JP-Wavenet-D", label: "男性 B (WaveNet)" },
      { value: "ja-JP-Standard-A", label: "女性 A (標準)" },
      { value: "ja-JP-Standard-B", label: "女性 B (標準)" },
      { value: "ja-JP-Standard-C", label: "男性 A (標準)" },
      { value: "ja-JP-Standard-D", label: "男性 B (標準)" },
    ],
    "en-US": [
      { value: "en-US-Wavenet-A", label: "女性 A (WaveNet)" },
      { value: "en-US-Wavenet-B", label: "男性 A (WaveNet)" },
      { value: "en-US-Wavenet-C", label: "女性 B (WaveNet)" },
      { value: "en-US-Wavenet-D", label: "男性 B (WaveNet)" },
      { value: "en-US-Wavenet-E", label: "女性 C (WaveNet)" },
      { value: "en-US-Wavenet-F", label: "女性 D (WaveNet)" },
      { value: "en-US-Standard-A", label: "女性 A (標準)" },
      { value: "en-US-Standard-B", label: "男性 A (標準)" },
    ],
  };

  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium mb-4">音声設定</h3>

      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            言語
          </label>
          <select
            name="language"
            value={settings.language}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ja-JP">日本語</option>
            <option value="en-US">英語 (米国)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            声の種類
          </label>
          <select
            name="voiceName"
            value={settings.voiceName}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {voiceOptions[settings.language as keyof typeof voiceOptions].map(
              (voice) => (
                <option key={voice.value} value={voice.value}>
                  {voice.label}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            話速 ({settings.speakingRate.toFixed(1)})
          </label>
          <input
            type="range"
            name="speakingRate"
            min="0.25"
            max="4.0"
            step="0.05"
            value={settings.speakingRate}
            onChange={handleChange}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ピッチ ({settings.pitch.toFixed(1)})
          </label>
          <input
            type="range"
            name="pitch"
            min="-20"
            max="20"
            step="1"
            value={settings.pitch}
            onChange={handleChange}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default VoiceSettings;
