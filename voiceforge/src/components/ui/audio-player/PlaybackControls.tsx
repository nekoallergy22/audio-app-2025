// src/components/ui/audio-player/PlaybackControls.tsx
import React from "react";
import { Play, Pause, Square, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onDownload: () => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  onPlayPause,
  onStop,
  onDownload,
}) => (
  <div className="flex space-x-2 shrink-0">
    <Button
      onClick={onPlayPause}
      size="icon"
      className="rounded-full"
      title={isPlaying ? "一時停止" : "再生"}
    >
      {isPlaying ? (
        <Pause className="h-5 w-5" />
      ) : (
        <Play className="h-5 w-5" />
      )}
    </Button>
    <Button
      onClick={onStop}
      size="icon"
      variant="secondary"
      className="rounded-full"
      title="停止"
    >
      <Square className="h-5 w-5" />
    </Button>
    <Button
      onClick={onDownload}
      size="icon"
      className="rounded-full bg-green-500 hover:bg-green-600"
      title="ダウンロード"
    >
      <Download className="h-5 w-5" />
    </Button>
  </div>
);

export default PlaybackControls;
