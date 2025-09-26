-- Fix CASCADE constraint untuk notifications table (MySQL compatible)
-- Jalankan query ini di database MySQL

USE test_pro;

-- Periksa constraint yang ada
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM 
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE 
    TABLE_SCHEMA = 'test_pro' 
    AND TABLE_NAME = 'notifications' 
    AND REFERENCED_TABLE_NAME IS NOT NULL;

-- Periksa foreign key constraints
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    REFERENCED_TABLE_NAME
FROM 
    INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS 
WHERE 
    CONSTRAINT_SCHEMA = 'test_pro' 
    AND TABLE_NAME = 'notifications';

-- Hapus constraint lama jika ada
SET FOREIGN_KEY_CHECKS = 0;

-- Coba hapus foreign key constraint yang mungkin ada
ALTER TABLE notifications DROP FOREIGN KEY notifications_ibfk_1;

-- Tambahkan foreign key constraint baru dengan CASCADE
ALTER TABLE notifications 
ADD CONSTRAINT fk_notifications_eventId 
FOREIGN KEY (eventId) REFERENCES events(id) 
ON DELETE CASCADE ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;

-- Verifikasi constraint baru
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM 
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE 
    TABLE_SCHEMA = 'test_pro' 
    AND TABLE_NAME = 'notifications' 
    AND REFERENCED_TABLE_NAME IS NOT NULL;