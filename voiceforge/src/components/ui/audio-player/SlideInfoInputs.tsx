import React from "react";

// スライド情報入力コンポーネント
const SlideInfoInputs = ({
  slideNumber,
  slideOrder,
  onChange,
  segmentNumber,
  onTabToNext,
}: {
  slideNumber?: number;
  slideOrder?: number;
  onChange: (slideNumber: number) => void;
  segmentNumber?: number;
  onTabToNext?: () => void; // タブ移動用のコールバック
}) => {
  return (
    <div className="flex items-center space-x-2 shrink-0">
      <input
        id={`slide-number-${segmentNumber}`}
        type="number"
        value={slideNumber || ""}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        min="0"
        className="w-14 p-1 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="スライド"
        title="スライド番号"
        onKeyDown={(e) => {
          if (e.key === "Tab" && !e.shiftKey) {
            // タブキーで次のセグメントへ直接移動
            e.preventDefault();
            if (onTabToNext) onTabToNext();
          } else if (e.key === "Enter") {
            // Enterキーでも次のセグメントへ
            e.preventDefault();
            if (onTabToNext) onTabToNext();
          }
        }}
      />
      <div className="w-14 p-1 text-center bg-gray-100 border border-gray-200 rounded-md text-gray-700">
        {slideOrder || "-"}
      </div>
    </div>
  );
};

export default SlideInfoInputs;
