/voiceforge
│
├── .env # 環境変数（Google Cloud API キー等）
├── .env.example # 環境変数のサンプル
├── .gitignore # Git の除外ファイル設定
├── package.json # プロジェクト依存関係
├── tsconfig.json # TypeScript 設定
├── next.config.js # Next.js 設定
├── next-env.d.ts # Next.js 型定義
├── postcss.config.mjs # PostCSS 設定
├── eslint.config.mjs # ESLint 設定
├── README.md # プロジェクト説明
│
├── /public # 静的ファイル
│ ├── /audio # 一時的な音声ファイル保存場所
│ ├── file.svg
│ ├── globe.svg
│ ├── next.svg
│ ├── vercel.svg
│ └── window.svg
│
└── /src # ソースコード
├── /app # Next.js App Router
│ ├── layout.tsx # アプリケーションのレイアウト
│ ├── page.tsx # メインページ
│ ├── globals.css # グローバルスタイル
│ └── /api # API ルート
│ └── /tts # TTS API
│ └── route.ts # Google TTS の API エンドポイント
│
├── /components # コンポーネント
│ ├── /ui # UI コンポーネント
│ │ ├── TextInput.tsx # テキスト入力エリア
│ │ ├── VoiceSettings.tsx # 音声設定パネル
│ │ ├── AudioPlayer.tsx # 音声再生プレーヤー
│ │ └── DownloadButton.tsx # ダウンロードボタン
│ │
│ ├── GoogleTTSConverter.tsx # Google TTS 変換処理
│ └── AudioController.tsx # 音声制御ロジック
│
└── /utils # ユーティリティ関数
├── googleTTS.ts # Google TTS API 操作
└── validators.ts # 入力検証
