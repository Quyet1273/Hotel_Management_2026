import { supabase } from "../lib/supabase";

// 2. Cập nhật Interface Booking (Thêm surcharge_total và actual_received)
export interface Booking {
  id?: string;
  guest_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  status: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
  total_amount: number;      // Tổng tiền (Phòng + Thuế)
  deposit_amount: number;    // Tiền cọc
  actual_received: number;   // Thực thu (GrandTotal - Cọc)
  notes?: string;            // Ghi chú
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
// 2. Tạo mới một đặt phòng (Đã gỡ bỏ hoàn toàn luồng Phụ phí cũ)
  createBooking: async (booking: any) => {
    // Log gói hàng tổng quát
    console.log(
      "%c [PAYLOAD GỬI ĐI]:",
      "color: #8b5cf6; font-weight: bold;",
      { booking },
    );

    try {
      // --- CHỈ CẦN NỔ ĐƠN VÀO BẢNG BOOKINGS LÀ XONG ---
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .insert([booking])
        .select();

      if (bookingError) {
        console.error("%c [LỖI SQL CREATE BOOKING]:", "color: #ef4444; font-weight: bold;", {
          mã_lỗi: bookingError.code,
          nội_dung: bookingError.message,
          chi_tiết: bookingError.details,
        });
        throw bookingError;
      }

      const newBookingId = bookingData[0]?.id;
      console.log("%c [SUCCESS] Đã nổ đơn bookings! ID:", "color: #10b981; font-weight: bold;", newBookingId);

      return { success: true, data: bookingData };
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
},
// 7. Hàm lấy chi tiết khách hàng mới thêm vào đây:
  getGuestWithHistory: async (guestId: string) => {
    try {
      const { data: guest, error: guestError } = await supabase
        .from("guests")
        .select("*")
        .eq("id", guestId)
        .single();

      if (guestError) throw guestError;

      const { data: history, error: historyError } = await supabase
        .from("bookings")
        .select(`
          id, check_in_date, check_out_date, status, total_amount, actual_received,
          rooms (room_number)
        `)
        .eq("guest_id", guestId)
        .order("created_at", { ascending: false });

      if (historyError) throw historyError;

      const totalSpent = history
        ?.filter(b => b.status === "checked_out" || b.status === "confirmed" || b.status === "checked_in")
        .reduce((sum, booking) => sum + (Number(booking.total_amount) || 0), 0) || 0;

      return { success: true, guest, history, totalSpent };
    } catch (error: any) {
      console.error("Lỗi lấy chi tiết khách hàng:", error);
      return { success: false, error: error.message };
    }
  }
};
