import axiosClient from "./axiosClient"

/* ================= TYPES ================= */
export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  phone: string
  address?: string
  password: string
  confirmPassword: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken?: string // Vẫn giữ type để không lỗi code chỗ khác
  user: any
}

/* ================= API ================= */
export const authApi = {
  login(data: LoginPayload) {
    // Gọi API login, nhận về accessToken
    return axiosClient.post<AuthResponse>("/auth/login", data)
  },

  register(data: RegisterPayload) {
    // map field cho backend
    const payload = {
      fullName: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      password: data.password,
      confirmPassword: data.confirmPassword,
    }
    return axiosClient.post("/auth/register", payload)
  },

  // TẠM THỜI COMMENT VÌ BACKEND ĐÃ TẮT COOKIE/REFRESH
  /*
  refreshToken() {
    return axiosClient.post<{ accessToken: string }>("/auth/refresh-token")
  },
  */

  logout() {
    // Khi logout, nhớ xóa token ở localStorage trong Component xử lý
    return axiosClient.post("/auth/logout")
  },

  me() {
    return axiosClient.get("/auth/me")
  },
}