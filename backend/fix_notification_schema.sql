-- Fix notification schema untuk mengatasi masalah Data truncated
-- Jalankan query ini di database MySQL

USE test_pro;

-- Periksa struktur tabel notifications saat ini
DESCRIBE notifications;

-- Ubah kolom notificationType menjadi VARCHAR dengan panjang yang cukup
ALTER TABLE notifications 
MODIFY COLUMN notificationType VARCHAR(50) NOT NULL;

-- Atau jika ingin menggunakan ENUM yang benar, hapus dan buat ulang
-- ALTER TABLE notifications 
-- MODIFY COLUMN notificationType ENUM(
--     'event_created',
--     'event_updated', 
--     'event_deleted',
--     'event_pending',
--     'event_revised',
--     'event_approved',
--     'event_rejected'
-- ) NOT NULL;

-- Verifikasi perubahan
DESCRIBE notifications;