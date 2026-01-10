#!/bin/bash
# SSH 터널 시작 스크립트
# 원격 MySQL(5100) -> 로컬(3306) 포트 포워딩

SSH_HOST="ahnbi2.suwon.ac.kr"
SSH_USER="ahnbi2"
REMOTE_PORT=5100
LOCAL_PORT=3306

echo "Starting SSH tunnel: localhost:${LOCAL_PORT} -> ${SSH_HOST}:${REMOTE_PORT}"
echo "Press Ctrl+C to stop the tunnel"

ssh -N -L ${LOCAL_PORT}:127.0.0.1:${REMOTE_PORT} ${SSH_USER}@${SSH_HOST} \
    -o ServerAliveInterval=60 \
    -o ServerAliveCountMax=3
