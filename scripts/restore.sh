#!/bin/bash

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/restore.sh <backup_file>"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "🔄 Restoring from backup: $BACKUP_FILE"

echo "Stopping services..."
docker-compose down

echo "Restoring database..."
docker run --rm -v $(dirname $BACKUP_FILE):/backup mongo:6.0 \
    mongorestore --host mongodb --db ebay_store_manager /backup/$(basename $BACKUP_FILE)

echo "Starting services..."
docker-compose up -d

echo "✅ Restore completed successfully!"
