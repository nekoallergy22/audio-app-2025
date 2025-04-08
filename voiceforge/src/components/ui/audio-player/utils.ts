// src/components/ui/audio-player/utils.ts
export const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

export const formatSegmentNumber = (num?: number) => {
  return num ? num.toString().padStart(3, "0") : "";
};
