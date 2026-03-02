import dotenv from "dotenv"
dotenv.config()

import cors from "cors"
import express from "express"
import { supabase } from "./config/supabase"
import authRouter from "./routes/authRouter"

const app = express()

// ================= MIDDLEWARE =================
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ================= CORS =================
const allowedOrigins = [
  
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "https://hotelmanagement-ecru.vercel.app", //link Vercel 
]
app.use(
  cors({
    origin: allowedOrigins, 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
)
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // Cho phép các request không có origin (như Postman hoặc mobile app)
//       if (!origin) return callback(null, true);
      
//       if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true,
//   })
// )


// ================= SUPABASE TEST =================
const testSupabase = async () => {
  const { error } = await supabase.from("rooms").select("*").limit(1)

  if (error) {
    console.log("❌ Supabase FAIL")
  } else {
    console.log("✅ Supabase CONNECTED")
  }
}

testSupabase()

// ================= ROUTES =================
app.get("/", (req, res) => {
  res.send("Server is running 🚀")
})

app.get("/api", (req, res) => {
  res.json({ message: "API is working ✅" })
})

app.use("/api/auth", authRouter)
// ================= START SERVER =================
const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})