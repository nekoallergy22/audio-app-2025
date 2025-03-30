# VoiceForge - テキスト読み上げツール

Google Cloud Text-to-Speech API を使用して、テキストを高品質な音声に変換する Web アプリケーションです。

## 機能

- テキスト入力と音声変換
- 複数の言語と音声タイプのサポート（日本語・英語）
- 話速とピッチの調整
- ブラウザ上での音声再生
- MP3 形式での音声ダウンロード

## 始め方

### リポジトリのクローン

```bash
git clone https://github.com/nekoallergy22/audio-app-2025.git
cd audio-app-2025
```

### 依存関係のインストール

```bash
npm install
```

### 環境変数の設定

`.env.local`ファイルをプロジェクトのルートディレクトリに作成し、以下の内容を追加してください：

```
# Google Cloud API Key
GOOGLE_CLOUD_API_KEY=your-api-key-here
```

※ Google Cloud Console で Text-to-Speech API を有効にし、API キーを取得してください。

### アプリケーションの起動

```bash
# 開発モードで起動
./launch.sh

# 本番モードで起動
./launch.sh prod
```

### アプリケーションの停止

```bash
# 開発モードで停止
./stop.sh

# 本番モードで停止
./stop.sh prod
```

## 使用方法

1. テキスト入力欄にテキストを入力します
2. 必要に応じて音声設定（言語、声質、話速、ピッチ）を調整します
3. 「音声を生成」ボタンをクリックします
4. 生成された音声を再生したり、MP3 形式でダウンロードしたりできます

## 技術スタック

- Next.js 15.2.4
- TypeScript
- Tailwind CSS
- Google Cloud Text-to-Speech API
