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
    echo "Stopping development mode..."
else
    echo "Stopping production mode..."
fi

docker compose -f $COMPOSE_FILE down
