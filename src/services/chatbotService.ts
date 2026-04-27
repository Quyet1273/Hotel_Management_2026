import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";

// 1. Khởi tạo Supabase Client (Lưu ý: Nếu file này bị báo lỗi đỏ chữ supabase,
// hãy đổi thành: import { supabase } from "../lib/supabase"; và xóa 3 dòng dưới đi nhé)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Khởi tạo Groq Client
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const chatbotService = {
  // Hàm 1: Lấy lịch sử chat
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

  // Hàm 2: Xử lý gửi tin nhắn & RAG nâng cao
  async sendMessage(message: string, sessionId: string) {
    try {
      // B1. Lưu tin nhắn User
      await supabase
        .from("chat_messages")
        .insert([{ session_id: sessionId, role: "user", content: message }]);

      // B2. Kéo lịch sử chat (Lấy 10 tin gần nhất)
      const { data: history } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(10);

      const formattedHistory = history ? history.reverse() : [];

      // ==========================================================
      // BƯỚC 3: BỘ NÃO RAG - TRUY XUẤT DỮ LIỆU ĐA NỀN TẢNG
      // ==========================================================
      let realData = "";
      const lowerMessage = message.toLowerCase();

      try {
        // 🟢 LUỒNG 1: DOANH THU & BÁO CÁO TÀI CHÍNH
        if (
          lowerMessage.includes("doanh thu") ||
          lowerMessage.includes("tiền") ||
          lowerMessage.includes("hóa đơn") ||
          lowerMessage.includes("báo cáo")
        ) {
          // Đã xóa chữ 'status' đi để query chạy mượt mà 100%
          const { data: invoices, error: invoiceError } = await supabase
            .from("invoices")
            .select("total_amount, created_at");

          if (invoiceError)
            console.error("Lỗi kéo data hóa đơn:", invoiceError);

          if (invoices && invoices.length > 0) {
            const now = new Date();
            const today = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
            );
            const firstDayOfMonth = new Date(
              now.getFullYear(),
              now.getMonth(),
              1,
            );

            let revToday = 0,
              revMonth = 0,
              revTotal = 0;

            invoices.forEach((inv) => {
              const invDate = new Date(inv.created_at);
              const amount = Number(inv.total_amount) || 0;
              revTotal += amount;
              if (invDate >= today) revToday += amount;
              if (invDate >= firstDayOfMonth) revMonth += amount;
            });

            realData += `\n[💰 DOANH THU]: 
            - Hôm nay: ${revToday.toLocaleString("vi-VN")} VND
            - Tháng này: ${revMonth.toLocaleString("vi-VN")} VND
            - Tổng lũy kế: ${revTotal.toLocaleString("vi-VN")} VND (trên ${invoices.length} hóa đơn).`;
          } else {
            realData += `\n[💰 DOANH THU]: Hiện chưa có dữ liệu hóa đơn nào trong hệ thống.`;
          }
        }

        // 🟢 LUỒNG 2: TỒN KHO & VẬT TƯ
        if (
          lowerMessage.includes("kho") ||
          lowerMessage.includes("tồn") ||
          lowerMessage.includes("hàng hóa") ||
          lowerMessage.includes("vật tư")
        ) {
          const { data: inventory } = await supabase
            .from("inventory_items")
            .select("*")
            .limit(20);
          if (inventory && inventory.length > 0) {
            const itemsList = inventory
              .map((item) => {
                const name = item.name || item.item_name || "Mặt hàng ẩn danh";
                const qty = item.quantity || item.stock || 0;
                return `- ${name}: ${qty} ${item.unit || ""}`;
              })
              .join("\n");
            realData += `\n[📦 TỒN KHO]: Danh sách vật tư hiện có:\n${itemsList}`;
          } else {
            realData += `\n[📦 TỒN KHO]: Kho hiện đang trống.`;
          }
        }

        // 🟢 LUỒNG 3: TRẠNG THÁI PHÒNG
        if (
          lowerMessage.includes("phòng") ||
          lowerMessage.includes("trống") ||
          lowerMessage.includes("đang ở")
        ) {
          // Sửa 'type' thành 'room_type' để khớp với cơ sở dữ liệu
          const { data: rooms, error: roomError } = await supabase
            .from("rooms")
            .select("room_number, status, room_type");

          if (roomError) console.error("Lỗi kéo data phòng:", roomError);

          if (rooms && rooms.length > 0) {
            const available = rooms.filter(
              (r) =>
                r.status?.toLowerCase() === "available" ||
                r.status?.toLowerCase() === "trống",
            );
            const occupied = rooms.filter(
              (r) =>
                r.status?.toLowerCase() === "occupied" ||
                r.status?.toLowerCase() === "đang ở",
            );

            realData += `\n[🏨 TRẠNG THÁI PHÒNG]: 
            - Tổng số: ${rooms.length} phòng.
            - Sẵn sàng đón khách: ${available.length} phòng (Gồm các phòng: ${available.map((r) => r.room_number).join(", ")}).
            - Đang có khách thuê: ${occupied.length} phòng.`;
          }
        }

        // 🟢 LUỒNG 4: NHÂN VIÊN & KHÁCH HÀNG
        if (
          lowerMessage.includes("nhân viên") ||
          lowerMessage.includes("nhân sự") ||
          lowerMessage.includes("khách hàng")
        ) {
          const { data: employees } = await supabase
            .from("employees")
            .select("email, role")
            .limit(10);
          const { data: guests } = await supabase
            .from("guests")
            .select("full_name, phone")
            .limit(5);

          if (employees) {
            realData +=
              `\n[👥 NHÂN SỰ]: Hệ thống ghi nhận ${employees.length} nhân viên. VD: ` +
              employees.map((e) => `${e.email} (${e.role})`).join(", ") +
              `.`;
          }
          if (guests) {
            realData +=
              `\n[🤝 KHÁCH HÀNG]: Các khách hàng gần đây: ` +
              guests.map((g) => `${g.full_name}`).join(", ") +
              `.`;
          }
        }
        // 🟢 LUỒNG 5: TRỢ LÝ LỊCH TRÌNH
        if (
          lowerMessage.includes("lịch") ||
          lowerMessage.includes("nhận phòng") ||
          lowerMessage.includes("trả phòng") ||
          lowerMessage.includes("hôm nay")
        ) {
          const now = new Date();
          // Lấy ngày YYYY-MM-DD theo giờ địa phương (Việt Nam)
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, "0");
          const day = String(now.getDate()).padStart(2, "0");
          const localToday = `${year}-${month}-${day}`;
          const currentDate = now.toLocaleDateString("vi-VN");

          // Thêm mốc thời gian thực vào để "khóa" não AI
          const localTimeStr = now.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          });
          realData += `\n[GIỜ HỆ THỐNG HIỆN TẠI]: ${localTimeStr} ngày ${day}/${month}/${year}\n`;

          const { data: bookings } = await supabase
            .from("bookings")
            .select(
              `check_in_date, check_out_date, guests(full_name), rooms(room_number)`,
            )
            .gte("check_in_date", `${localToday}T00:00:00`)
            .lte("check_in_date", `${localToday}T23:59:59`);

          if (bookings && bookings.length > 0) {
            let schedule = "";
            bookings.forEach((b: any) => {
              const gName =
                b.guests?.full_name ||
                (Array.isArray(b.guests)
                  ? b.guests[0]?.full_name
                  : "Khách ẩn danh");
              const rNum =
                b.rooms?.room_number ||
                (Array.isArray(b.rooms) ? b.rooms[0]?.room_number : "??");
              const isCheckIn = b.check_in_date.includes(localToday);
              const targetDate = new Date(
                isCheckIn ? b.check_in_date : b.check_out_date,
              );

              schedule += `- ${isCheckIn ? "🚩 NHẬN" : "🏁 TRẢ"} P.${rNum}: **${gName}** | Giờ: **${targetDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}** | Ngày: **${targetDate.toLocaleDateString("vi-VN")}**\n`;
            });
            realData += `\n[DỮ LIỆU GỐC TRONG DATABASE]:\n${schedule}`;
          } else {
            realData += `\n[DỮ LIỆU GỐC TRONG DATABASE]: Trống.`;
          }
        }
      } catch (dbError) {
        console.error("Lỗi truy xuất RAG Supabase:", dbError);
      }

      // 🟢 XỬ LÝ NẾU KHÔNG TRÚNG TỪ KHÓA NÀO
      if (!realData) {
        realData =
          "\n[LƯU Ý KỊCH BẢN]: User đang giao tiếp thông thường. Hãy trả lời lịch sự. Nếu họ muốn biết số liệu, hãy nhắc họ dùng các từ khóa như: 'doanh thu', 'tồn kho', 'phòng trống', 'nhân viên'.";
      }

      // ==========================================================
      // BƯỚC 4: GỌI GROQ AI VỚI SYSTEM PROMPT CỰC GẮT
      // ==========================================================
      const systemPrompt = {
        role: "system",
        content: `Bạn là Giám đốc điều hành AI của HotelPro. Bạn có nhiệm vụ cung cấp số liệu chính xác và tư vấn quản lý.
        
      QUY TẮC SỐNG CÒN:
        1. TUYỆT ĐỐI KHÔNG TỰ BỊA DỮ LIỆU. Chỉ sử dụng dữ liệu thực tế được cung cấp trong tag [DỮ LIỆU] bên dưới.
        2. Nếu một chỉ số (như doanh thu) có giá trị là 0 VND, hãy trả lời thẳng là "Hôm nay/Hôm qua chưa có doanh thu (0 VND)", TUYỆT ĐỐI KHÔNG được viện cớ là "Dữ liệu chưa được cập nhật".
        3. Nếu user hỏi thông tin KHÔNG HỀ CÓ trong [DỮ LIỆU], hãy trả lời: "Dữ liệu này hiện chưa được cập nhật trong hệ thống."
        4. Trình bày đẹp mắt bằng Markdown: dùng gạch đầu dòng, in đậm các con số và thời gian quan trọng.
        5. TRỢ LÝ LỊCH TRÌNH: Phải đọc chính xác GIỜ và NGÀY từ tag [DỮ LIỆU LỊCH TRÌNH THỰC TẾ]. 
          - TUYỆT ĐỐI CẤM tự ý thêm cụm từ "(trong 2 tiếng tới)" vào báo cáo.
          - Nếu bây giờ là 01:30 mà khách đến lúc 14:00, AI phải báo đúng 14:00 và KHÔNG được nhận xét là "sắp tới".
          - Luôn hiển thị đầy đủ: Tên khách - Phòng - Giờ - Ngày.  
        6. PHONG CÁCH: Luôn chào hỏi thân thiện và tóm tắt ngắn gọn tình hình trước khi đi vào chi tiết số liệu.
        DỮ LIỆU HỆ THỐNG TRÍCH XUẤT ĐƯỢC LÚC NÀY:
        ${realData}`,
      };

      const chatCompletion = await groq.chat.completions.create({
        messages: [systemPrompt, ...formattedHistory] as any,
        model: "llama-3.3-70b-versatile",
        temperature: 0.1, // Cực kỳ thấp để AI KHÔNG bịa chuyện, chỉ đọc data
      });

      const botReply =
        chatCompletion.choices[0]?.message?.content ||
        "Xin lỗi, máy chủ AI đang quá tải, vui lòng thử lại sau.";

      // B5. Lưu phản hồi vào Database
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
