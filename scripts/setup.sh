#!/bin/bash

# init
git clone https://github.com/nekoallergy22/audio-app-2025.git
cd audio-app-2025

# setup nextjs
npx create-next-app@latest voiceforge --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes

# VoiceForgeアプリケーションの追加ディレクトリとファイルを作成するスクリプト

# 環境変数ファイルの作成
touch .env .env.example

# public/audioディレクトリの作成
mkdir -p public/audio

# src/appディレクトリの確認と作成
if [ ! -d "src/app" ]; then
  mkdir -p src/app
fi

# src/app内のファイル作成
touch src/app/layout.tsx src/app/page.tsx src/app/globals.css

# src/app/api/ttsディレクトリとファイルの作成
mkdir -p src/app/api/tts
touch src/app/api/tts/route.ts

# src/componentsディレクトリとファイルの作成
mkdir -p src/components/ui
touch src/components/ui/TextInput.tsx src/components/ui/VoiceSettings.tsx src/components/ui/AudioPlayer.tsx src/components/ui/DownloadButton.tsx
touch src/components/GoogleTTSConverter.tsx src/components/AudioController.tsx

# src/utilsディレクトリとファイルの作成
mkdir -p src/utils
touch src/utils/googleTTS.ts src/utils/validators.ts

echo "VoiceForgeアプリケーションの追加ディレクトリとファイルが作成されました。"
