// src/components/ui/TextInput.tsx
import React, { useState, useEffect } from "react";

interface TextInputProps {
  onChange: (text: string) => void;
  maxLength?: number;
}

const TextInput: React.FC<TextInputProps> = ({
  onChange,
  maxLength = 1000,
}) => {
  const [text, setText] = useState<string>(
    "VoiceForge - テキスト読み上げツール"
  );
  const [remainingChars, setRemainingChars] = useState<number>(maxLength);

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

  return (
    <div className="w-full">
      <textarea
        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]"
        value={text}
        onChange={handleChange}
        placeholder="テキストを入力してください..."
      />
      <div className="text-right text-sm text-gray-500 mt-1">
        残り {remainingChars} 文字
      </div>
    </div>
  );
};

export default TextInput;
