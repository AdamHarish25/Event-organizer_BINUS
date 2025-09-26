-- Test CASCADE delete functionality
USE test_pro;

-- Lihat jumlah notifikasi sebelum test
SELECT 'Before test:' as status, COUNT(*) as total_notifications FROM notifications;

-- Lihat event dan notifikasi yang ada
SELECT 'Events with notifications:' as info;
SELECT e.id as event_id, e.eventName, COUNT(n.id) as notification_count 
FROM events e 
LEFT JOIN notifications n ON e.id = n.eventId 
GROUP BY e.id, e.eventName 
HAVING notification_count > 0
LIMIT 3;

-- Untuk test manual, ambil salah satu eventId dari hasil di atas dan jalankan:
-- DELETE FROM events WHERE id = 'EVENT_ID_YANG_DIPILIH';
-- 
-- Kemudian cek apakah notifikasi ikut terhapus:
-- SELECT COUNT(*) FROM notifications WHERE eventId = 'EVENT_ID_YANG_DIPILIH';
-- Hasilnya harus 0 jika CASCADE berfungsi