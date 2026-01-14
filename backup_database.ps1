# PostgreSQL Database Backup Script for Windows
# HSD Platform - Automated Backup System

param(
    [string]$BackupDir = "C:\HSD_Backups",
    [string]$DBName = "hsd_platform",
    [string]$DBUser = "postgres",
    [string]$DBPassword = "postgres",
    [int]$RetentionDays = 7
)

# Backup klasörü oluştur
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
    Write-Host "✓ Backup klasörü oluşturuldu: $BackupDir" -ForegroundColor Green
}

# Timestamp oluştur
$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupFile = "$BackupDir\hsd_platform_backup_$Timestamp.sql"

Write-Host "🔄 Database backup başlatılıyor..." -ForegroundColor Cyan
Write-Host "📁 Dosya: $BackupFile"

# PostgreSQL şifresini environment variable olarak ayarla
$env:PGPASSWORD = $DBPassword

try {
    # pg_dump komutu ile backup al
    # Not: PostgreSQL bin klasörü PATH'de olmalı
    & pg_dump -U $DBUser -h localhost -d $DBName -F p -f $BackupFile
    
    if ($LASTEXITCODE -eq 0) {
        $FileSize = (Get-Item $BackupFile).Length / 1MB
        Write-Host "✅ Backup başarılı! Boyut: $([math]::Round($FileSize, 2)) MB" -ForegroundColor Green
        
        # Backup'ı sıkıştır (opsiyonel)
        $ZipFile = "$BackupFile.zip"
        Compress-Archive -Path $BackupFile -DestinationPath $ZipFile -Force
        Remove-Item $BackupFile
        Write-Host "📦 Backup sıkıştırıldı: $ZipFile" -ForegroundColor Green
    } else {
        Write-Host "❌ Backup HATASI!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ HATA: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Şifreyi temizle
    $env:PGPASSWORD = $null
}

# Eski backup'ları temizle (RetentionDays'den eski olanlar)
Write-Host "🧹 Eski backup'lar temizleniyor ($RetentionDays günden eski)..." -ForegroundColor Yellow
$OldBackups = Get-ChildItem $BackupDir -Filter "*.zip" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) }

foreach ($OldBackup in $OldBackups) {
    Remove-Item $OldBackup.FullName -Force
    Write-Host "  🗑️ Silindi: $($OldBackup.Name)" -ForegroundColor Gray
}

Write-Host "✨ Backup işlemi tamamlandı!" -ForegroundColor Green
Write-Host "📊 Backup sayısı: $((Get-ChildItem $BackupDir -Filter '*.zip').Count)" -ForegroundColor Cyan
