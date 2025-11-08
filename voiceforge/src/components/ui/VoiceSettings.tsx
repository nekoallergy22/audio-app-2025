// src/components/ui/VoiceSettings.tsx
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

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
    voiceName: "ja-JP-Wavenet-D",
    speakingRate: 1.0,
    pitch: 0,
  });

  const handleLanguageChange = (value: string) => {
    const newSettings = {
      ...settings,
      language: value,
    };
    setSettings(newSettings);
    onChange(newSettings);
  };

  const handleVoiceNameChange = (value: string) => {
    const newSettings = {
      ...settings,
      voiceName: value,
    };
    setSettings(newSettings);
    onChange(newSettings);
  };

  const handleSpeakingRateChange = (value: number[]) => {
    const newSettings = {
      ...settings,
      speakingRate: value[0],
    };
    setSettings(newSettings);
    onChange(newSettings);
  };

  const handlePitchChange = (value: number[]) => {
    const newSettings = {
      ...settings,
      pitch: value[0],
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
    <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="language">言語</Label>
          <Select
            value={settings.language}
            onValueChange={handleLanguageChange}
          >
            <SelectTrigger id="language">
              <SelectValue placeholder="言語を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ja-JP">日本語</SelectItem>
              <SelectItem value="en-US">英語 (米国)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="voiceName">声の種類</Label>
          <Select
            value={settings.voiceName}
            onValueChange={handleVoiceNameChange}
          >
            <SelectTrigger id="voiceName">
              <SelectValue placeholder="声の種類を選択" />
            </SelectTrigger>
            <SelectContent>
              {voiceOptions[settings.language as keyof typeof voiceOptions].map(
                (voice) => (
                  <SelectItem key={voice.value} value={voice.value}>
                    {voice.label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="speakingRate">
            話速 ({settings.speakingRate.toFixed(1)})
          </Label>
          <Slider
            id="speakingRate"
            min={0.25}
            max={4.0}
            step={0.05}
            value={[settings.speakingRate]}
            onValueChange={handleSpeakingRateChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pitch">ピッチ ({settings.pitch.toFixed(1)})</Label>
          <Slider
            id="pitch"
            min={-20}
            max={20}
            step={1}
            value={[settings.pitch]}
            onValueChange={handlePitchChange}
          />
        </div>
    </div>
  );
};

export default VoiceSettings;
