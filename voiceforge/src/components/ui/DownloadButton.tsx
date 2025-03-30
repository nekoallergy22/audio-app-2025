// src/components/ui/DownloadButton.tsx
import React, { useState } from "react";

interface DownloadButtonProps {
  audioUrl: string | null;
  defaultFileName?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({
  audioUrl,
  defaultFileName = "voice",
}) => {
  const [fileName, setFileName] = useState(defaultFileName);

  const handleDownload = () => {
    if (!audioUrl) return;

    // ダウンロードリンクを作成
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `${fileName}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200">
      <div className="flex flex-col space-y-3">
        <div>
          <label
            htmlFor="fileName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            ファイル名
          </label>
          <input
            id="fileName"
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ファイル名を入力"
          />
        </div>
        <button
          onClick={handleDownload}
          disabled={!audioUrl}
          className={`w-full py-2 px-4 rounded-md focus:outline-none ${
            audioUrl
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          ダウンロード
        </button>
      </div>
    </div>
  );
};

export default DownloadButton;
