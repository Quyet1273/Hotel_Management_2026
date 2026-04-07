import { supabase } from "../lib/supabase";

export interface InvoiceData {
  booking_id: string;
  guest_id: string;
  room_id: string;
  room_total: number;
  discount_amount: number;
  service_total: number;
  total_amount: number;
  payment_method: string;
}

export const invoiceService = {
  /**
   * Tạo hóa đơn mới vào bảng invoices
   */
  createInvoice: async (data: InvoiceData) => {
    try {
      const { error } = await supabase
        .from("invoices")
        .insert([data]);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
  

  /**
   * Lấy lịch sử tất cả hóa đơn (Dùng cho trang Thống kê/Báo cáo)
   */
  getInvoiceList: async () => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          guests (full_name, phone),
          rooms (room_number)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};