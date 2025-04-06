// src/components/SegmentList.tsx
import { useState } from "react";
import dynamic from "next/dynamic";
import { TextSegment } from "../types";

const AudioPlayer = dynamic(() => import("./ui/AudioPlayer"), {
  ssr: false,
});

interface SegmentListProps {
  segments: TextSegment[];
  onDurationChange: (id: string, duration: number) => void;
  onSlideInfoChange: (id: string, slideNumber: number) => void;
}

export default function SegmentList({
  segments,
  onDurationChange,
  onSlideInfoChange,
}: SegmentListProps) {
  // タブ移動のハンドラ
  const handleTabToNext = (currentIndex: number) => {
    const nextInput = document.getElementById(
      `slide-number-${currentIndex + 2}`
    );
    if (nextInput) {
      nextInput.focus();
    }
  };

  if (segments.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
      <h2 className="text-lg font-medium mb-4">生成された音声</h2>
      <div className="space-y-4">
        {segments.map((segment, index) => (
          <AudioPlayer
            key={segment.id}
            id={segment.id}
            audioUrl={segment.audioUrl}
            text={segment.text.replace(/^\n+/, "")}
            isLoading={segment.isLoading}
            segmentNumber={index + 1}
            onDurationChange={(duration) =>
              onDurationChange(segment.id, duration)
            }
            onSlideInfoChange={(id, slideNumber) =>
              onSlideInfoChange(id, slideNumber)
            }
            slideNumber={segment.slideNumber}
            slideOrder={segment.slideOrder}
            onTabToNext={() => handleTabToNext(index)}
          />
        ))}
      </div>
    </div>
  );
}
