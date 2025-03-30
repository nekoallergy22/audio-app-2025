// src/utils/validators.ts
export const validateText = (
  text: string,
  maxLength: number = 5000
): boolean => {
  if (!text || text.trim().length === 0) {
    return false;
  }

  if (text.length > maxLength) {
    return false;
  }

  return true;
};

export const validateVoiceSettings = (
  language: string,
  voiceName: string,
  speakingRate: number,
  pitch: number
): boolean => {
  // 言語コードの検証
  const validLanguages = ["ja-JP", "en-US"];
  if (!validLanguages.includes(language)) {
    return false;
  }

  // 音声名の検証
  if (!voiceName || !voiceName.startsWith(language)) {
    return false;
  }

  // 話速の検証
  if (speakingRate < 0.25 || speakingRate > 4.0) {
    return false;
  }

  // ピッチの検証
  if (pitch < -20 || pitch > 20) {
    return false;
  }

  return true;
};
