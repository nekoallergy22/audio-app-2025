// src/components/ui/audio-player/LoadingIndicator.tsx
export default function LoadingIndicator() {
  return (
    <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
      <div className="flex items-center justify-center py-2">
        <div className="animate-pulse flex space-x-2">
          <div className="h-2 w-2 bg-blue-500 rounded-full" />
          <div className="h-2 w-2 bg-blue-500 rounded-full" />
          <div className="h-2 w-2 bg-blue-500 rounded-full" />
        </div>
        <span className="ml-3 text-gray-500">音声生成中...</span>
      </div>
    </div>
  );
}
