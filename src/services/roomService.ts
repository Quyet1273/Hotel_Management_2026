import { supabase } from "../lib/supabase";

export interface Room {
  id: string;
  room_number: string;
  room_type: 'single' | 'double' | 'suite' | 'deluxe';
  price: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'dirty' | 'cleaning';
  floor: number;
  capacity: number;
  image_url: string | null;
  last_cleaned_at?: string; 
  created_at?: string;
}

export const roomService = {
  // 1. Lấy danh sách tất cả các phòng
  getAllRooms: async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("room_number", { ascending: true });

      if (error) throw error;
      return { success: true, data: data as Room[] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // 2. Thêm phòng mới
  createRoom: async (roomData: Omit<Room, "id" | "created_at">) => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .insert([roomData])
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // 3. Cập nhật thông tin phòng
  updateRoom: async (id: string, updates: Partial<Room>) => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .update(updates)
        .eq("id", id)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // 4. Xóa phòng
  deleteRoom: async (id: string) => {
    try {
      const { error } = await supabase
        .from("rooms")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
  // 5. Lấy danh sách phòng dành riêng cho Housekeeping
  getHousekeepingRooms: async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .in("status", ["dirty", "cleaning"]) // Chỉ lấy phòng bẩn hoặc đang dọn
        .order("room_number", { ascending: true });

      if (error) throw error;
      return { success: true, data: data as Room[] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Chuyển trạng thái sang "Đang dọn"
  startCleaning: async (roomId: string) => {
    return await roomService.updateRoom(roomId, { status: 'cleaning' });
  }
};