# TTS アプリケーション設計書（Google TTS 使用）

## 要件定義書

### 概要

テキスト入力を Google Cloud Text-to-Speech API を使用して音声に変換し、ブラウザ上で再生および MP3 形式でダウンロードできる Web アプリケーションを開発します。

### 主要機能

1. テキスト入力機能

   - ユーザーがテキストを入力できるテキストエリアを提供
   - 文字数制限と残り文字数の表示

2. 音声変換機能

   - 入力されたテキストを Google Cloud Text-to-Speech API を使用して音声に変換
   - 言語、声質（WaveNet など）、速度などの設定オプション

3. 音声再生機能

   - ブラウザ上で変換された音声をその場で再生
   - 再生/一時停止/停止などの基本的な制御

4. 音声ダウンロード機能
   - 変換された音声を MP3 形式でダウンロード
   - ファイル名のカスタマイズオプション

### 非機能要件

1. パフォーマンス

   - API 呼び出しのレスポンス時間を最小限に抑える
   - 大量のテキスト入力にも対応（Google TTS の制限内）

2. ユーザビリティ

   - シンプルで直感的な UI
   - モバイルデバイスを含む様々な画面サイズに対応

3. アクセシビリティ
   - スクリーンリーダー対応
   - キーボードナビゲーション対応

## 設計書

### アプリケーション概略設計

このアプリケーションは Next.js の App Router を使用して構築します。テキスト入力から Google TTS による音声変換、再生、ダウンロードまでの一連の流れをシンプルな UI で提供します。

### 機能設計

#### テキスト入力機能

- テキストエリアコンポーネント
- 文字数カウンター
- 入力バリデーション

#### 音声変換機能

- Google Cloud Text-to-Speech API を使用したテキスト音声変換
- 言語選択機能（日本語、英語など）
- 音声パラメータ調整（WaveNet 音声、標準音声、速度、ピッチなど）

#### 音声再生機能

- オーディオプレーヤーコンポーネント
- 再生コントロール（再生/一時停止/停止）

#### 音声ダウンロード機能

- Google TTS から返される MP3 形式の音声ファイルのダウンロード
- ダウンロードボタン
- ファイル名入力フィールド

### コンポーネント構成

#### ページコンポーネント

- `app/page.tsx`: メインページ

#### UI コンポーネント

- `components/ui/TextInput.tsx`: テキスト入力エリア
- `components/ui/VoiceSettings.tsx`: 音声設定パネル（Google TTS 用）
- `components/ui/AudioPlayer.tsx`: 音声再生プレーヤー
- `components/ui/DownloadButton.tsx`: ダウンロードボタン

#### 機能コンポーネント

- `components/GoogleTTSConverter.tsx`: Google TTS によるテキスト音声変換処理
- `components/AudioController.tsx`: 音声制御ロジック

#### ユーティリティ

- `utils/googleTTS.ts`: Google Cloud Text-to-Speech API 操作
- `utils/validators.ts`: 入力検証

### Google TTS 実装詳細

#### API 認証

- Google Cloud プロジェクトの作成
- Cloud Text-to-Speech API の有効化
- サービスアカウントキー（JSON）の作成と管理[1]
- API キーの安全な管理（環境変数など）[3]

#### API 呼び出し

```typescript
// Google TTS APIリクエスト例
const request = {
  input: { text: inputText },
  voice: { languageCode: "ja-JP", name: "ja-JP-Wavenet-A" },
  audioConfig: { audioEncoding: "MP3" },
};

const [response] = await client.synthesizeSpeech(request);
```

#### 料金考慮

- 標準音声は月間 400 万文字、WaveNet 音声は月間 100 万文字まで無料[5]
- 使用量の監視と制限機能の実装

## データフロー図

```
[テキスト入力] → [バリデーション] → [音声設定適用] → [Google TTS API呼び出し]
                                                    ↓
[ダウンロード] ← [音声ファイル処理] ← [API応答処理] ← [音声データ]
                                    ↓
                              [音声再生]
```

## 技術スタック詳細

- **フロントエンド**: Next.js 15.2.3 (App Router), TypeScript, Tailwind CSS, Heroicons
- **音声処理**: Google Cloud Text-to-Speech API
- **開発環境**: Docker, Docker Compose, Node.js, npm
- **テスト**: Jest, React Testing Library

## 実装計画

1. プロジェクト初期設定
2. Google Cloud 設定（プロジェクト作成、API 有効化、認証情報取得）
3. UI コンポーネント実装
4. Google TTS API 連携実装
5. 音声再生機能実装
6. 音声ダウンロード機能実装
7. テスト実装
8. デプロイ
