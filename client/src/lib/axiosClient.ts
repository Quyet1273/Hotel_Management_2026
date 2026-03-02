import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios"

// ================= BASE URL =================
// Ưu tiên lấy từ file .env, nếu không có mới dùng fallback localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081/api"

// ================= AXIOS INSTANCE =================
const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Để false để tránh lỗi CORS khi deploy nếu chưa cấu hình Cookie chuẩn
  withCredentials: true, 
})

// ================= REQUEST INTERCEPTOR =================
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Đảm bảo key "access_token" khớp với code ở trang Login
    const token = localStorage.getItem("access_token")

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// ================= RESPONSE INTERCEPTOR =================
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    // Tự động đá về trang login nếu token hết hạn (lỗi 401)
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token")
      if (window.location.pathname !== "/login") {
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  }
)

export default axiosClient