// Frontend validation matching backend Joi schemas

export const validateEmail = (email) => {
  if (!email) return ["Email wajib diisi."];
  const emailRegex = /^[a-zA-Z0-9._%+-]+@(binus\.ac\.id|gmail\.com)$/;
  if (!emailRegex.test(email.toLowerCase())) {
    return ["Email harus menggunakan domain @binus.ac.id atau @gmail.com."];
  }
  return [];
};

export const validatePassword = (password, isLogin = false) => {
  if (!password) return ["Password wajib diisi."];
  if (!isLogin && password.length < 8) return ["Password minimal 8 karakter."];
  if (!isLogin && password.length > 64) return ["Password maksimal 64 karakter."];
  return [];
};

export const validateName = (name, fieldName) => {
  if (!name) return [`${fieldName} wajib diisi.`];
  if (name.length < 1) return [`${fieldName} minimal 1 karakter.`];
  if (name.length > 20) return [`${fieldName} maksimal 20 karakter.`];
  return [];
};

export const validateEventName = (eventName) => {
  if (!eventName) return ["Nama event wajib diisi."];
  const trimmed = eventName.trim();
  if (trimmed.length < 3) return ["Nama event minimal 3 karakter."];
  if (trimmed.length > 150) return ["Nama event maksimal 150 karakter."];
  return [];
};

export const validateTime = (time, fieldName) => {
  if (!time) return [`${fieldName} wajib diisi.`];
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(time)) {
    return [`Format ${fieldName.toLowerCase()} tidak valid. Gunakan format HH:MM (misal: 14:30).`];
  }
  return [];
};

export const validateTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return [];
  
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;
  
  if (endTotalMinutes <= startTotalMinutes) {
    return ["Waktu selesai harus lebih besar dari waktu mulai."];
  }
  
  const durationMinutes = endTotalMinutes - startTotalMinutes;
  if (durationMinutes < 15) return ["Durasi event minimal 15 menit."];
  if (durationMinutes > 720) return ["Durasi event maksimal 12 jam."];
  
  return [];
};

export const validateDate = (date, startTime) => {
  if (!date) return ["Tanggal event wajib diisi."];
  
  const eventDate = new Date(date);
  if (isNaN(eventDate.getTime())) return ["Tanggal tidak valid."];
  
  if (startTime && /^\d{2}:\d{2}$/.test(startTime)) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const eventStartDateTime = new Date(eventDate);
    eventStartDateTime.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    if (eventStartDateTime <= fiveMinutesFromNow) {
      return ["Tanggal dan waktu event tidak boleh di masa lalu."];
    }
  }
  
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  if (eventDate > oneYearFromNow) {
    return ["Tanggal event tidak boleh lebih dari 1 tahun ke depan."];
  }
  
  return [];
};

export const validateLocation = (location) => {
  if (!location) return ["Lokasi event wajib diisi."];
  const trimmed = location.trim();
  if (trimmed.length < 5) return ["Lokasi event minimal 5 karakter."];
  if (trimmed.length > 100) return ["Lokasi event maksimal 100 karakter."];
  return [];
};

export const validateSpeaker = (speaker) => {
  const trimmed = speaker ? speaker.trim() : '';
  if (trimmed.length > 0) {
    if (trimmed.length < 3) return ["Nama speaker minimal 3 karakter."];
    if (trimmed.length > 100) return ["Nama speaker maksimal 100 karakter."];
  }
  return [];
};

export const validateImage = (file, isRequired = true) => {
  if (!file && isRequired) return ["Poster event wajib diisi."];
  if (!file) return [];
  
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return ["Tipe file harus JPEG, JPG, PNG, GIF, atau WebP."];
  }
  
  if (file.size < 1024) return ["Ukuran gambar minimal 1KB."];
  if (file.size > 10 * 1024 * 1024) return ["Ukuran gambar tidak boleh melebihi 10MB."];
  
  return [];
};

export const validateFeedback = (feedback) => {
  if (!feedback) return ["Feedback wajib diisi."];
  const trimmed = feedback.trim();
  if (trimmed.length < 1) return ["Feedback tidak boleh kosong."];
  if (trimmed.length > 1000) return ["Feedback maksimal 1000 karakter."];
  return [];
};