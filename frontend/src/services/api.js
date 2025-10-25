import axios from "axios";
import { showModalFromAnywhere } from "../Utils/modalHandler";

const BASE = "http://localhost:5000";

const api = axios.create({
  baseURL: BASE,
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  // withCredentials: true, // uncomment only if backend uses cookie auth
});

// Request: tambahkan Authorization jika ada token
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {
    // silent
  }
  return config;
}, (err) => Promise.reject(err));

// Response: tampilkan modal dari backend message/warning dan tangani 401
api.interceptors.response.use((res) => {
  const data = res?.data || {};
  // fleksibel cek message / warning / status
  const message = data?.message || data?.warning || (typeof data === "string" ? data : null);
  const isWarning = data?.status === "warning" || res.status === 206;
  if (message && isWarning) {
    showModalFromAnywhere({ title: "Peringatan", message: String(message), variant: "warning" });
  }
  return res;
}, (err) => {
  const resp = err.response;
  const data = resp?.data;
  if (data?.message) {
    showModalFromAnywhere({ title: "Galat", message: String(data.message), variant: "error" });
  } else if (resp?.status === 401) {
    showModalFromAnywhere({ title: "Autentikasi", message: "Sesi berakhir. Silakan login ulang.", variant: "warning" });
    // optional: remove token and redirect
    try { localStorage.removeItem("accessToken"); } catch {}
    // window.location.href = "/login"; // uncomment if you want auto-redirect
  } else {
    showModalFromAnywhere({ title: "Galat", message: "Terjadi kesalahan jaringan atau server.", variant: "error" });
  }
  return Promise.reject(err);
});

export default api;