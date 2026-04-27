import { supabase } from "../lib/supabase";
export interface Booking {
  id?: string;
  guest_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  status: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
  total_amount: number;
  deposit_amount: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const bookingService = {
  // 1. Lấy toàn bộ danh sách đặt phòng (kèm thông tin khách và phòng)
  getAllBookings: async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          guests (full_name, phone),
          rooms (room_number, room_type)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // 2. Tạo mới một đặt phòng
  // 2. Tạo mới một đặt phòng (Bản gia cố bắt lỗi)
  createBooking: async (booking: any) => {
    // In ra gói hàng trước khi gửi để check ID và Ngày tháng
    console.log(
      "%c [PAYLOAD GỬI ĐI]:",
      "color: #8b5cf6; font-weight: bold;",
      booking,
    );

    try {
      const { data, error } = await supabase
        .from("bookings")
        .insert([booking])
        .select();

      if (error) {
        // IN CHI TIẾT LỖI TỪ DATABASE - KHÔNG CẦN ĐOÁN MÒ NỮA
        console.error(
          "%c [LỖI SQL CREATE]:",
          "color: #ef4444; font-weight: bold;",
          {
            mã_lỗi: error.code,
            nội_dung: error.message,
            chi_tiết: error.details,
            gợi_ý: error.hint,
          },
        );
        throw error;
      }

      console.log(
        "%c [SUCCESS] Đã nổ đơn thành công! ID đơn:",
        "color: #10b981; font-weight: bold;",
        data[0]?.id,
      );
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // 3. Cập nhật thông tin đặt phòng (ví dụ: đổi ngày, đổi trạng thái)
  updateBooking: async (id: string, updates: Partial<Booking>) => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .update(updates)
        .eq("id", id)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // 4. Hủy/Xóa đặt phòng
  deleteBooking: async (id: string) => {
    try {
      const { error } = await supabase.from("bookings").delete().eq("id", id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // 5. Kiểm tra phòng trống (Quan trọng cho chức năng Booking)
  checkRoomAvailability: async (
    roomId: string,
    checkIn: string,
    checkOut: string,
  ) => {
    console.log(
      `%c [SOI PHÒNG] ID: ${roomId}`,
      "color: #3b82f6; font-weight: bold;",
    );
    console.log(`%c [TIME] ${checkIn} -> ${checkOut}`, "color: #6366f1;");

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, check_in_date, check_out_date, status")
        .eq("room_id", roomId)
        // CHỐT CHẶN VÀNG: Chỉ bắt những đơn ĐANG CÓ HIỆU LỰC (Đặt trước hoặc Đang ở)
        // Những đơn đã Trả phòng (checked_out) hoặc đã Hủy (cancelled) sẽ bị LOẠI BỎ NGAY
        .in("status", ["confirmed", "checked_in"])
        // LOGIC CHỒNG LẤN CHUẨN (Giao thoa thời gian)
        .lt("check_in_date", checkOut)
        .gt("check_out_date", checkIn);

      if (error) {
        console.error("%c [LỖI SQL]:", "color: #ef4444;", error);
        throw error;
      }

      if (data && data.length > 0) {
        console.warn(
          `%c [TRÙNG THẬT] Thằng này mới là thằng ngáng đường đại ca:`,
          "color: #f59e0b;",
          data,
        );
        return {
          isAvailable: false,
          conflicts: data,
          message: "Phòng này đã có người khác đặt/ở rồi!",
        };
      }

      console.log(
        "%c [OK] PHÒNG TRỐNG SẠCH SẼ - NỔ ĐƠN THÔI!",
        "color: #10b981; font-weight: bold;",
      );
      return { isAvailable: true };
    } catch (error: any) {
      console.error("[EXCEPTION]:", error);
      return { isAvailable: false, error: error.message };
    }
  },
  // 6. Lấy thống kê  (Số lượng check-in/check-out )
  getTodaySummary: async () => {
  const today = new Date().toISOString().split('T')[0]; // Lấy ngày YYYY-MM-DD
  
  const { data } = await supabase
    .from("bookings")
    .select(`
      id, check_in_date, check_out_date, status,
      guests (full_name),
      rooms (room_number)
    `)
    .or(`check_in_date.ilike.%${today}%,check_out_date.ilike.%${today}%`);

  return data || [];
}
};
