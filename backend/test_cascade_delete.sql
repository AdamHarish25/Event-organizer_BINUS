-- Test script untuk memverifikasi CASCADE delete berfungsi
USE test_pro;

-- Lihat jumlah notifikasi sebelum test
SELECT COUNT(*) as total_notifications FROM notifications;

-- Lihat notifikasi berdasarkan eventId (ganti dengan eventId yang ada)
SELECT eventId, COUNT(*) as notification_count 
FROM notifications 
GROUP BY eventId 
LIMIT 5;

-- Untuk test manual:
-- 1. Catat eventId yang memiliki notifikasi
-- 2. Hapus event tersebut melalui aplikasi
-- 3. Jalankan query berikut untuk memverifikasi notifikasi ikut terhapus:
-- SELECT COUNT(*) FROM notifications WHERE eventId = 'EVENT_ID_YANG_DIHAPUS';