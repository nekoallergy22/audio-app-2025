#!/bin/bash

# ./combine.sh -d ./voiceforge/src -o merged.md -e node_modules,dist,build


# 使用方法を表示する関数
usage() {
  echo "使用方法: $0 -d <検索ディレクトリ> -o <出力ファイル> [-e <除外ディレクトリ1,除外ディレクトリ2,...>]"
  echo "  -d: 検索するディレクトリを指定"
  echo "  -o: 出力ファイルを指定"
  echo "  -e: 除外するディレクトリをカンマ区切りで指定（オプション）"
  exit 1
}

# 引数のパース
while getopts "d:o:e:" opt; do
  case $opt in
    d) SEARCH_DIR="$OPTARG" ;;
    o) OUTPUT_FILE="$OPTARG" ;;
    e) EXCLUDE_DIRS="$OPTARG" ;;
    *) usage ;;
  esac
done

# 必須パラメータのチェック
if [ -z "$SEARCH_DIR" ] || [ -z "$OUTPUT_FILE" ]; then
  usage
fi

# 検索ディレクトリの存在確認
if [ ! -d "$SEARCH_DIR" ]; then
  echo "エラー: ディレクトリ '$SEARCH_DIR' が存在しません"
  exit 1
fi

# 出力ファイルを初期化
> "$OUTPUT_FILE"

# 除外ディレクトリの処理
EXCLUDE_PATTERN=""
if [ ! -z "$EXCLUDE_DIRS" ]; then
  IFS=',' read -ra EXCLUDE_ARRAY <<< "$EXCLUDE_DIRS"
  for dir in "${EXCLUDE_ARRAY[@]}"; do
    EXCLUDE_PATTERN="$EXCLUDE_PATTERN -not -path \"*/$dir/*\""
  done
fi

# findコマンドを構築
FIND_CMD="find \"$SEARCH_DIR\" -type f"
if [ ! -z "$EXCLUDE_PATTERN" ]; then
  FIND_CMD="$FIND_CMD $EXCLUDE_PATTERN"
fi

# ファイルを検索して内容を出力ファイルに追加
eval $FIND_CMD | sort | while read -r file; do
  # バイナリファイルをスキップ
  if file "$file" | grep -q "text"; then
    echo "処理中: $file"
    echo "## $file" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  fi
done

echo "完了しました。結果は '$OUTPUT_FILE' に保存されました。"
