#!/bin/bash

# Create backup directory if it doesn't exist
mkdir -p downloads

# Get current timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create zip file
zip -r "downloads/casino_app_backup_${TIMESTAMP}.zip" . \
  -x "node_modules/*" \
  -x ".git/*" \
  -x "dist/*" \
  -x ".env" \
  -x "downloads/*" \
  -x "*.log" \
  -x "*.zip"

echo "Backup created at downloads/casino_app_backup_${TIMESTAMP}.zip"
