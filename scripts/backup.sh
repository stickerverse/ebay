#!/bin/bash

set -e

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="ebay_store_manager_$DATE"

echo "📦 Starting backup process..."

mkdir -p $BACKUP_DIR

echo "Backing up MongoDB..."
docker-compose exec -T mongodb mongodump --db ebay_store_manager --out /tmp/backup

echo "Copying backup files..."
docker cp $(docker-compose ps -q mongodb):/tmp/backup/$BACKUP_NAME.tar.gz $BACKUP_DIR/

echo "Backing up application files..."
tar -czf $BACKUP_DIR/app_$DATE.tar.gz \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=logs \
    backend/ frontend/ docker/ database/

echo "Cleaning old backups (keeping last 7 days)..."
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup completed: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
