#!/bin/bash
set -e

function finish {
    docker-compose --file docker-compose.yml logs
    docker-compose --file docker-compose.yml down --volumes
}

trap finish EXIT

docker-compose --file docker-compose.yml up -d ui

.scripts/docker/wait-healthy.sh "${COMPOSE_PROJECT_NAME:-pattern-library}_ui_1"

http_code=$(curl -sS http://localhost:8889/ -o /dev/null -w '%{http_code}' 2>&1)
[[ "$http_code" == "200" ]]
