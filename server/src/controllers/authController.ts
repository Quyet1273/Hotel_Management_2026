import { Request, Response } from "express"
import jwt from "jsonwebtoken"
import {
  findByEmail,
  register as registerService,
  verifyPassword,
} from "../services/authService"

/* ================= ENV ================= */
const JWT_SECRET = process.env.JWT_SECRET as string
const JWT_EXPIRES_IN = "15m"

/* ================= REGISTER ================= */
export const register = async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      email,
      phone,
      address,
      password,
      confirmPassword,
    } = req.body

    // ===== Validate =====
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({
        message: "Vui lòng nhập đầy đủ thông tin",
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Mật khẩu xác nhận không khớp",
      })
    }

    // ===== Check email tồn tại =====
    const existedUser = await findByEmail(email)
    if (existedUser) {
      return res.status(409).json({
        message: "Email đã được sử dụng",
      })
    }

    // ===== Create user =====
    const user = await registerService({
      fullName: fullName,
      email,
      phone,
      address,
      password,
    })

    return res.status(201).json({
      message: "Đăng ký thành công",
      user,
    })
  } catch (error: any) {
    console.error("REGISTER ERROR:", error)
    return res.status(500).json({
      message: "Đăng ký thất bại",
    })
  }
}

/* ================= LOGIN ================= */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        message: "Email và mật khẩu là bắt buộc",
      })
    }

    const user = await findByEmail(email)
    if (!user) {
      return res.status(401).json({
        message: "Email hoặc mật khẩu không đúng",
      })
    }

    if (user.status !== "active") {
      return res.status(403).json({
        message: "Tài khoản đã bị vô hiệu hóa",
      })
    }

    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({
        message: "Email hoặc mật khẩu không đúng",
      })
    }

    // ===== ACCESS TOKEN =====
    // Tăng thời gian sống của Access Token lên cao (ví dụ 1 ngày) để không cần refresh token
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "1d" } 
    )

    // ===== TẠM THỜI BỎ REFRESH TOKEN VÀ COOKIE ĐỂ CHẠY LOCAL =====
    /*
    // ===== REFRESH TOKEN =====
    const refreshToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: "7d" }
    )

    // ===== SET COOKIE =====
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: false,        
      sameSite: "lax",    
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    */

    if (user.password) delete user.password

    return res.status(200).json({
      message: "Đăng nhập thành công",
      accessToken, // Frontend sẽ lấy token này lưu vào localStorage
      user,
    })
  } catch (error) {
    console.error("LOGIN ERROR:", error)
    return res.status(500).json({
      message: "Đăng nhập thất bại",
    })
  }
}

// ================= REFRESH TOKEN (Tạm thời vô hiệu hóa) =================
export const refreshToken = async (req: Request, res: Response) => {
  return res.status(404).json({ message: "Tính năng này tạm thời bị tắt" })
  /*
  try {
    const token = req.cookies?.refresh_token
    if (!token) return res.status(401).json({ message: "No refresh token" })

    jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET as string,
      (err: any, decoded: any) => {
        if (err) return res.status(403).json({ message: "Invalid refresh token" })

        const newAccessToken = jwt.sign(
          { id: decoded.id, role: decoded.role },
          process.env.ACCESS_TOKEN_SECRET as string,
          { expiresIn: "15m" }
        )
        res.json({ accessToken: newAccessToken })
      }
    )
  } catch (error) {
    res.status(500).json({ message: "Refresh token error" })
  }
  */
}

// ================= LOGOUT =================
export const logout = async (_req: Request, res: Response) => {
  // res.clearCookie("refresh_token") // Tắt xóa cookie nếu không dùng
  return res.json({ message: "Logout successful" })
}