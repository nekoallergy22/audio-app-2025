# VoiceForge 設計書（Google TTS 使用）

## 要件定義

### 概要

Google Cloud Text-to-Speech API を活用したテキスト音声変換ツール。句点単位での音声分割生成、スライド情報連携、編集可能なセグメント管理を特徴とする。

### 主要機能

1. **テキスト入力**

   - 最大 5,000 文字のマルチライン入力
   - 行番号表示とリアルタイム文字数カウント
   - 句点（。）による自動セグメント分割

2. **音声変換**

   - 言語選択（日本語/英語）
   - 音声タイプ選択（WaveNet/標準）
   - 話速（0.25-4.0）とピッチ（-20-20）調整
   - 個別セグメント再生成機能

3. **音声制御**

   - セグメント単位の再生/一時停止/停止
   - スライド番号と順序情報の連携
   - 音声長さ表示（mm:ss 形式）

4. **データ管理**

   - MP3/ZIP 形式での音声ダウンロード
   - 編集済みテキストの TXT エクスポート
   - スライド情報含む JSON エクスポート
   - セグメント編集履歴追跡

5. **スライド連携**
   - スライド番号の半自動割り当て
   - 同一スライド内の順序自動管理
   - タブ移動による効率的な入力

### 非機能要件

1. **パフォーマンス**

   - セグメント並列生成処理
   - Base64⇨Blob 変換のクライアント側処理
   - 音声 URL のメモリ管理（revokeObjectURL）

2. **拡張性**

   - 型安全な TypeScript 実装
   - モジュール分割されたコンポーネント構造
   - Docker 環境による開発/本番ビルド分離

3. **セキュリティ**
   - API キーの環境変数管理
   - 入力値の厳格なバリデーション
   - エラーハンドリングの一元化

## システム設計

### アーキテクチャ

データフロー図

```

[テキスト入力] → [句点分割] → [セグメント生成] → [並列 API 処理]
↓ ↓ ↓ ↓
[設定管理] → [バリデーション] → [音声変換] → [Blob 生成]
↓ ↓
[UI 状態管理] ← [スライド情報連携] ← [メタデータ抽出]

```

### コンポーネント構成

```

src/
├── app/
│ └── api/tts/route.ts # TTS API エンドポイント
├── components/
│ ├── ui/
│ │ ├── AudioPlayer/ # 音声プレーヤー
│ │ │ ├── LoadingIndicator.tsx
│ │ │ ├── PlaybackControls.tsx
│ │ │ └── SlideInfoInputs.tsx
│ │ ├── SettingsPopup.tsx # 統合設定画面
│ │ └── TextInput.tsx # 行番号付きテキストエリア
│ └── VoiceGenerator.tsx # 音声生成ロジック
├── types/ # 型定義
└── utils/
├── googleTTS.ts # TTS API クライアント
└── validators.ts # 入力検証

```

### 主要コンポーネント仕様

#### 1. AudioPlayer コンポーネント

```

interface AudioPlayerProps {
   audioUrl: string | null
   editedText: string
   onTextEdit: (id: string, text: string) => void
   onRegenerateAudio: (id: string, text: string) => Promise
   slideNumber?: number
   slideOrder?: number
   onSlideInfoChange: (id: string, slideNumber: number) => void
}

```

- 編集可能なテキストエリアを内蔵
- スライド情報入力と自動順序管理
- 変更検知時の自動再生成機能

#### 2. TTS API エンドポイント

```

// POST /api/tts
{
   text: string
   language: string
   voiceName: string
   speakingRate: number
   pitch: number
}

// レスポンス
{
   audioContent: string // Base64
   format: "mp3"
}

```

- 環境変数経由の API キー管理
- 厳格な入力バリデーション
- エラーハンドリングの統一化

#### 3. セグメント管理状態

```

interface TextSegment {
   id: string
   originalText: string
   editedText: string
   audioUrl: string | null
   isLoading: boolean
   duration: number
   slideNumber?: number
   slideOrder?: number
}

```

- オリジナル/編集済みテキストの分離管理
- ローディング状態の追跡
- スライド情報のオプショナル保持

## 技術スタック

### 基盤技術

| カテゴリ       | 技術選定                   |
| -------------- | -------------------------- |
| フロントエンド | Next.js 15, TypeScript 5.3 |
| スタイリング   | Tailwind CSS 3.4           |
| 状態管理       | React Context + useState   |
| アイコン       | Heroicons 2.1.1            |

### 補助技術

| 目的           | 技術選定      |
| -------------- | ------------- |
| 音声処理       | Web Audio API |
| ZIP 圧縮       | JSZip 3.10    |
| フォーマット   | date-fns 3.0  |
| バリデーション | Zod 3.22      |

## 品質保証

### テスト戦略

1. **ユニットテスト**

   - バリデーションロジック
   - 時間フォーマットユーティリティ
   - セグメント分割アルゴリズム

2. **統合テスト**

   - エンドツーエンドの音声生成フロー
   - スライド情報連携機能
   - ファイルエクスポート機能

3. **パフォーマンステスト**
   - 大規模テキスト入力時の処理速度
   - 並列 API 呼び出しの負荷テスト
   - メモリリーク検出

### 監視項目

- Google TTS API の使用量とコスト
- ユーザー操作ログ（Analytics 連携）
- エラー発生率とタイプ
- セグメント生成成功率

## 今後の拡張案

### 短期ロードマップ

1. プレゼンテーションモード（スライド連動再生）
2. 複数音声のミックスダウン機能
3. バッチ処理による大量生成

### 長期ビジョン

1. AI による自動テキスト最適化
2. マルチプラットフォーム対応（Electron 統合）
3. プロジェクト管理機能の追加

```

現行実装との主な相違点：

1. スライド情報連携機能の追加（半自動番号割当）
2. セグメント編集と差分管理機能の実装
3. 複数ファイルエクスポートオプションの拡張
4. 状態管理の最適化（メモリ効率向上）
5. エラーハンドリングの強化

設計書の更新ポイント：

- 実際のコンポーネント構造を反映
- スライド管理機能の詳細を追加
- セグメントベースの処理フローを明示
- 型定義と API 仕様を現行コードに合わせ更新
- テスト戦略にパフォーマンス項目を追加
```
