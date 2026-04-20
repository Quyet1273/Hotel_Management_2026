import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";

// 1. Khởi tạo Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Khởi tạo Groq Client
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true, // Bắt buộc phải có cờ này khi chạy Groq trên trình duyệt (Vite)
});

export const chatbotService = {
  // Hàm 1: Lấy lịch sử chat cũ khi mở khung chat
  async getChatHistory(sessionId: string) {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Lỗi lấy lịch sử:", error);
      return [];
    }
  },
// Hàm 2: Xử lý gửi tin nhắn mới và nhận phản hồi từ AI
  // async sendMessage(message: string, sessionId: string) {
  //   try {
  //     // B1. Lưu câu hỏi của User vào Supabase
  //     await supabase.from('chat_messages').insert([
  //       { session_id: sessionId, role: 'user', content: message }
  //     ]);

  //     const { data: history } = await supabase
  //       .from('chat_messages')
  //       .select('role, content')
  //       .eq('session_id', sessionId)
  //       .order('created_at', { ascending: false })
  //       .limit(10); 
        
  //     const formattedHistory = history ? history.reverse() : [];

  //     // ==========================================================
  //     // BƯỚC MỚI: TÌM KIẾM DỮ LIỆU THẬT (RAG CƠ BẢN)
  //     // ==========================================================
  //     let realData = "";
  //     const lowerMessage = message.toLowerCase();

  //     // Nếu user hỏi về "nhân viên"
  //     if (lowerMessage.includes("nhân viên") || lowerMessage.includes("nhân sự")) {
  //       // Query thẳng vào bảng employees trong database của bạn
  //       const { data: employees } = await supabase
  //         .from('employees')
  //         .select('email, role, phone, department');
          
  //       if (employees && employees.length > 0) {
  //         realData = "\n\nĐây là dữ liệu danh sách nhân viên thực tế từ Database:\n" + 
  //           employees.map(emp => `- Email: ${emp.email}, Chức vụ: ${emp.role}, SĐT: ${emp.phone || 'Chưa cập nhật'}`).join("\n");
  //       } else {
  //         realData = "\n\nHiện tại chưa có nhân viên nào trong cơ sở dữ liệu.";
  //       }
  //     }
      
  //     // Bạn có thể làm tương tự cho "phòng", "doanh thu"...
  //     // if (lowerMessage.includes("phòng trống")) { ... query bảng rooms ... }
  //     // ==========================================================

  //     // B3. Chuẩn bị Prompt và gọi Groq (Nhét thêm realData vào)
  //     const systemPrompt = {
  //       role: 'system',
  //       content: `Bạn là trợ lý AI thông minh cho phần mềm quản lý khách sạn HotelPro. 
  //       Nhiệm vụ của bạn là trả lời ngắn gọn, chuyên nghiệp bằng tiếng Việt.
  //       TUYỆT ĐỐI KHÔNG TỰ BỊA RA DỮ LIỆU. Chỉ sử dụng các thông tin được cung cấp dưới đây để trả lời. Nếu không có thông tin, hãy nói "Tôi chưa có dữ liệu về vấn đề này".
  //       ${realData}`
  //     };

  //     const chatCompletion = await groq.chat.completions.create({
  //       messages: [systemPrompt, ...formattedHistory] as any,
  //       model: 'llama-3.3-70b-versatile', 
  //       temperature: 0.2, // Giảm temperature xuống thấp (0.2) để AI bớt "sáng tạo/bịa chuyện"
  //     });

  //     const botReply = chatCompletion.choices[0]?.message?.content || "Xin lỗi, tôi đang gặp chút sự cố kết nối.";

  //     // B4. Lưu câu trả lời vào Supabase
  //     await supabase.from('chat_messages').insert([
  //       { session_id: sessionId, role: 'assistant', content: botReply }
  //     ]);

  //     return botReply;
      
  //   } catch (error) {
  //     console.error("Lỗi xử lý chatbot:", error);
  //     return "Đã xảy ra lỗi khi kết nối với máy chủ AI.";
  //   }
  // },
  // Hàm 2: Xử lý gửi tin nhắn mới và nhận phản hồi từ AI
  async sendMessage(message: string, sessionId: string) {
    try {
      // B1. Lưu câu hỏi của User vào Supabase
      await supabase
        .from("chat_messages")
        .insert([{ session_id: sessionId, role: "user", content: message }]);

      // B2. Kéo lịch sử chat gần nhất (lấy 10 tin để AI hiểu ngữ cảnh)
      const { data: history } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(10);

      // Đảo ngược mảng để đúng thứ tự thời gian cho AI đọc
      const formattedHistory = history ? history.reverse() : [];

      // B3. Chuẩn bị Prompt và gọi Groq
      const systemPrompt = {
        role: "system",
        content:
          "Bạn là trợ lý AI thông minh cho phần mềm quản lý khách sạn HotelPro. Dựa vào lịch sử trò chuyện, hãy trả lời ngắn gọn, chuyên nghiệp bằng tiếng Việt.",
      };
      console.log("Check API Key:", import.meta.env.VITE_GROQ_API_KEY);
      console.log("Check dữ liệu gửi đi:", [systemPrompt, ...formattedHistory]);

      const chatCompletion = await groq.chat.completions.create({
        messages: [systemPrompt, ...formattedHistory] as any,
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
      });

      const botReply =
        chatCompletion.choices[0]?.message?.content ||
        "Xin lỗi, tôi đang gặp chút sự cố kết nối.";

      // B4. Lưu câu trả lời của AI vào Supabase
      await supabase
        .from("chat_messages")
        .insert([
          { session_id: sessionId, role: "assistant", content: botReply },
        ]);

      return botReply;
    } catch (error) {
      console.error("Lỗi xử lý chatbot:", error);
      return "Đã xảy ra lỗi khi kết nối với máy chủ AI.";
    }
  },
};
