#!/usr/bin/env bash

set -e

cd /app

if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm ci --only=production
fi

echo "Starting TypeScript Sprint Zero service..."
exec npm start