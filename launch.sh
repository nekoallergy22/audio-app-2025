#!/bin/bash

# Default to development mode
MODE=dev

# Check for arguments to switch to production mode
if [ "$1" == "prod" ]; then
    MODE=prod
fi

# Set the appropriate Docker Compose file
COMPOSE_FILE=./voiceforge/docker/docker-compose.$MODE.yml

# Check if the Docker Compose file exists
if [ ! -f $COMPOSE_FILE ]; then
    echo "Error: $COMPOSE_FILE does not exist."
    exit 1
fi

# Docker Compose commands
if [ "$MODE" == "dev" ]; then
    echo "Starting in development mode with hot reloading enabled..."
    
    # 開発モードでは既存のコンテナを停止して再起動
    docker compose -f $COMPOSE_FILE down
    
    # ホットリロードを有効にするための環境変数を設定
    export WATCHPACK_POLLING=true
    
    # コンテナを起動（バックグラウンドではなくフォアグラウンドで実行してログを表示）
    docker compose -f $COMPOSE_FILE up --build
else
    echo "Starting in production mode..."
    docker compose -f $COMPOSE_FILE up -d --build
fi
