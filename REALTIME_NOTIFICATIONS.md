# 🔔 Sistem Notifikasi Realtime

## Overview
Sistem notifikasi realtime untuk Dashboard Admin yang menggunakan Socket.IO untuk memberikan update langsung ketika ada perubahan event.

## ✨ Fitur Utama

### 1. **Event Created** 
- ✅ Notifikasi muncul realtime di Dashboard Super Admin
- ✅ Notifikasi tersimpan di database
- ✅ Socket emit ke `super_admin-room`

### 2. **Event Updated**
- ✅ Hapus notifikasi lama untuk event tersebut
- ✅ Buat notifikasi baru dengan data terbaru
- ✅ Emit realtime ke Super Admin dan Creator

### 3. **Event Deleted**
- ✅ Hapus semua notifikasi lama untuk event tersebut
- ✅ Buat notifikasi "Event Terhapus" 
- ✅ Emit realtime dengan pesan khusus

## 🔧 Implementasi Backend

### Socket Events
```javascript
// Event Created
io.to("super_admin-room").emit("new_notification", {
    type: "event_created",
    title: "A new request has been submitted",
    message: `${creatorName} has submitted a request for the event: ${eventName}`,
    isRead: false,
    data: eventData
});

// Event Updated  
io.to("super_admin-room").emit("new_notification", {
    type: "event_updated", 
    title: "Event Updated",
    message: `Event "${eventName}" has been updated and is pending approval.`,
    isRead: false,
    data: eventData
});

// Event Deleted
io.to("super_admin-room").emit("new_notification", {
    type: "event_deleted",
    title: "Event Terhapus", 
    message: `Event "${eventName}" telah dihapus oleh ${adminName}.`,
    isRead: false,
    data: { eventName, deletedBy: adminName }
});
```

### Database Operations
```javascript
// Saat Update Event - Hapus notifikasi lama
await NotificationModel.destroy({
    where: { eventId: eventId },
    transaction: t,
});

// Saat Delete Event - Hapus notifikasi lama, buat yang baru
await NotificationModel.destroy({
    where: { eventId: eventId },
    transaction: t,
});

const notifications = superAdmins.map((superAdmin) => ({
    senderId: adminId,
    recipientId: superAdmin.id,
    notificationType: "event_deleted",
    payload: {
        eventName: eventName,
        message: "Event Terhapus",
        deletedBy: adminName,
    },
}));
```

## 🎨 Implementasi Frontend

### Socket Connection
```javascript
// Connect socket dengan token
socketService.connect(user.accessToken);

// Listen for realtime notifications
const handleNewNotification = (notification) => {
    console.log('New notification received:', notification);
    setNotifications(prev => [notification, ...prev]);
    
    // Show modal for important notifications
    if (notification.type === 'event_deleted') {
        handleOpenModal('status', {
            variant: 'info',
            title: 'Event Terhapus',
            message: notification.message
        });
    }
};

socketService.onNotification(handleNewNotification);
```

### Notification Display
```javascript
// Visual indicators for unread notifications
className={`notification-item ${
    !item.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''
}`}

// Notification types with icons
const statusIcons = {
    REVISION: <FaExclamationTriangle className="text-yellow-500" />,
    REJECTED: <FaTimesCircle className="text-red-500" />,
    APPROVED: <FaCheckCircle className="text-green-500" />,
    PENDING: <FaClock className="text-blue-500" />,
    UPDATED: <FaExclamationTriangle className="text-orange-500" />,
    DELETED: <FaTimesCircle className="text-gray-500" />,
};
```

## 🚀 Cara Testing

### 1. Start Backend Server
```bash
cd backend
npm start
```

### 2. Start Frontend
```bash
cd frontend  
npm run dev
```

### 3. Test Scenario
1. **Login sebagai Super Admin** di satu browser tab
2. **Login sebagai Admin** di tab lain
3. **Sebagai Admin**: Create event → Lihat notifikasi muncul realtime di Super Admin
4. **Sebagai Admin**: Edit event → Notifikasi lama hilang, yang baru muncul
5. **Sebagai Admin**: Delete event → Notifikasi "Event Terhapus" muncul

### 4. Test Script
```bash
cd backend
node test_realtime_notifications.js
```

## 📋 Notification Types

| Type | Trigger | Target | Message |
|------|---------|--------|---------|
| `event_created` | Admin creates event | Super Admin | "New request submitted" |
| `event_updated` | Admin edits event | Super Admin + Admin | "Event updated, pending approval" |
| `event_deleted` | Admin deletes event | Super Admin | "Event Terhapus" |
| `event_pending` | Event status → pending | Admin | "Request is pending" |
| `event_approved` | Super Admin approves | Admin | "Request approved" |
| `event_rejected` | Super Admin rejects | Admin | "Request rejected" |

## 🔍 Debugging

### Check Socket Connection
```javascript
console.log('Socket connected:', socketService.isSocketConnected());
```

### Monitor Socket Events
```javascript
// Backend logs
logger.info("Socket notification emitted", { 
    room: "super_admin-room", 
    type: notification.type 
});

// Frontend logs  
console.log('New notification received:', notification);
```

### Database Verification
```sql
-- Check notifications for specific event
SELECT * FROM notifications WHERE eventId = 'your-event-id';

-- Check latest notifications
SELECT * FROM notifications ORDER BY createdAt DESC LIMIT 10;
```

## ⚡ Performance Notes

- **Reduced Polling**: Polling interval dikurangi dari 10s ke 30s karena ada realtime
- **Efficient Updates**: Hanya update notifications yang berubah
- **Memory Management**: Socket listeners dibersihkan saat component unmount
- **Error Handling**: Fallback ke polling jika socket gagal

## 🛠️ Troubleshooting

### Socket Not Connecting
1. Check backend server running on port 5000
2. Verify token valid in localStorage
3. Check CORS settings in socket config

### Notifications Not Appearing
1. Verify user role (super_admin for admin notifications)
2. Check socket room membership
3. Verify notification payload structure

### Database Issues
1. Check foreign key constraints
2. Verify transaction rollback on errors
3. Check cascade delete settings