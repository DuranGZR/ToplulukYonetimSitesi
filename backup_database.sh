#!/bin/bash
# PostgreSQL Database Backup Script for Linux/Mac
# HSD Platform - Automated Backup System

# Yapılandırma
BACKUP_DIR="/var/backups/hsd_platform"
DB_NAME="hsd_platform"
DB_USER="postgres"
DB_PASSWORD="postgres"
RETENTION_DAYS=7

# Backup klasörü oluştur
mkdir -p "$BACKUP_DIR"

# Timestamp
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/hsd_platform_backup_$TIMESTAMP.sql"

echo "🔄 Database backup başlatılıyor..."
echo "📁 Dosya: $BACKUP_FILE"

# Backup al
export PGPASSWORD="$DB_PASSWORD"
pg_dump -U "$DB_USER" -h localhost -d "$DB_NAME" -F p -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    # Backup'ı sıkıştır
    gzip "$BACKUP_FILE"
    FILE_SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
    echo "✅ Backup başarılı! Boyut: $FILE_SIZE"
    
    # Eski backup'ları temizle
    echo "🧹 Eski backup'lar temizleniyor ($RETENTION_DAYS günden eski)..."
    find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    echo "✨ Backup işlemi tamamlandı!"
    echo "📊 Backup sayısı: $(ls -1 $BACKUP_DIR/*.sql.gz 2>/dev/null | wc -l)"
else
    echo "❌ Backup HATASI!"
    exit 1
fi

# Şifreyi temizle
unset PGPASSWORD
