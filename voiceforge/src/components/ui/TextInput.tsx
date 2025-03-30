// src/components/ui/TextInput.tsx
import React, { useState, useEffect, useMemo } from "react";

interface TextInputProps {
  onChange: (text: string) => void;
  maxLength?: number;
}

const TextInput: React.FC<TextInputProps> = ({
  onChange,
  maxLength = 1000,
}) => {
  const [text, setText] = useState<string>("");
  const [remainingChars, setRemainingChars] = useState<number>(maxLength);

  // 行数をカウント
  const lineCount = useMemo(() => text.split("\n").length, [text]);

  // 行番号の配列を作成
  const linesArr = useMemo(
    () => Array.from({ length: Math.max(1, lineCount) }, (_, i) => i + 1),
    [lineCount]
  );

  useEffect(() => {
    setRemainingChars(maxLength - text.length);
  }, [text, maxLength]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (newText.length <= maxLength) {
      setText(newText);
      onChange(newText);
    }
  };

  // テキストエリアとスクロール位置を同期させる
  const handleTextareaScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const lineNumbers = document.getElementById("line-numbers");
    if (lineNumbers) {
      lineNumbers.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="w-full">
      <div className="flex border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500">
        {/* 行番号表示エリア */}
        <div
          id="line-numbers"
          className="bg-gray-100 text-gray-500 text-right py-3 px-2 select-none overflow-hidden"
          style={{ minWidth: "3rem" }}
        >
          {linesArr.map((num) => (
            <div key={num} className="leading-6 text-sm">
              {num}
            </div>
          ))}
        </div>

        {/* テキスト入力エリア */}
        <textarea
          className="w-full p-3 border-none rounded-md focus:outline-none min-h-[150px] leading-6"
          value={text}
          onChange={handleChange}
          onScroll={handleTextareaScroll}
          placeholder="テキストを入力してください..."
          style={{ resize: "vertical" }}
        />
      </div>

      <div className="text-right text-sm text-gray-500 mt-1">
        残り {remainingChars} 文字
      </div>
    </div>
  );
};

export default TextInput;
