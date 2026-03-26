import { supabase } from "../lib/supabase";
import { inventoryService } from "./inventoryservice";

export const housekeepingService = {
  /**
   * Hoàn tất dọn phòng & Trừ kho vật tư
   */
  completeCleaning: async (payload: {
    roomId: string,
    itemsUsed: { item_id: string, quantity: number }[],
    notes?: string
  }) => {
    try {
      // 1. Tạo bản ghi Log dọn phòng
      const { data: log, error: logErr } = await supabase
        .from("housekeeping_logs")
        .insert([{
          room_id: payload.roomId,
          end_time: new Date().toISOString(),
          notes: payload.notes
        }])
        .select()
        .single();

      if (logErr) throw logErr;

      // 2. Trừ kho vật tư (Tận dụng Trigger của bạn)
      // Chạy vòng lặp để tạo các giao dịch OUT trong inventory_transactions
      for (const item of payload.itemsUsed) {
        if (item.quantity > 0) {
          const res = await inventoryService.processTransaction({
            item_id: item.item_id,
            transaction_type: 'OUT',
            quantity: item.quantity,
            note: `Dọn phòng - Log ID: ${log.id}`
          });
          
          if (!res.success) throw new Error(`Lỗi trừ kho item ${item.item_id}: ${res.error}`);
        }
      }

      // 3. Cuối cùng, cập nhật trạng thái phòng về Available
      const { error: roomErr } = await supabase
        .from("rooms")
        .update({ 
          status: 'available', 
          last_cleaned_at: new Date().toISOString() 
        })
        .eq("id", payload.roomId);

      if (roomErr) throw roomErr;

      return { success: true };
    } catch (error: any) {
      console.error("Housekeeping Error:", error.message);
      return { success: false, error: error.message };
    }
  }
};