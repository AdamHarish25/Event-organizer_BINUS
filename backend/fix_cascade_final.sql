-- Fix CASCADE constraint untuk notifications table (final version)
USE test_pro;

-- Hapus constraint lama untuk eventId
SET FOREIGN_KEY_CHECKS = 0;
ALTER TABLE notifications DROP FOREIGN KEY notifications_ibfk_136;

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
    AND REFERENCED_TABLE_NAME = 'events';