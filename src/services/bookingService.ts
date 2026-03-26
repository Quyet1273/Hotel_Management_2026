import { supabase } from "../lib/supabase";
export interface Booking {
  id?: string;
  guest_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  total_amount: number;
  deposit?: number;
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
        .select(`
          *,
          guests (full_name, phone),
          rooms (room_number, room_type)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // 2. Tạo mới một đặt phòng
  createBooking: async (booking: Booking) => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .insert([booking])
        .select();

      if (error) throw error;
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
      const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // 5. Kiểm tra phòng trống (Quan trọng cho chức năng Booking)
  checkRoomAvailability: async (roomId: string, checkIn: string, checkOut: string) => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("id")
        .eq("room_id", roomId)
        .neq("status", "cancelled") // Bỏ qua các đơn đã hủy
        .or(`and(check_in_date.lte.${checkOut},check_out_date.gte.${checkIn})`);

      if (error) throw error;
      return { isAvailable: data.length === 0 };
    } catch (error: any) {
      return { error: error.message };
    }
  }
};