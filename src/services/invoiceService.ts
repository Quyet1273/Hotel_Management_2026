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
   * Lấy lịch sử hóa đơn có bộ lọc thời gian và phân trang
   */
  getInvoiceList: async (startDate?: string, endDate?: string, page: number = 1, pageSize: number = 10) => {
    try {
      // 1. Tính toán vị trí bắt đầu và kết thúc cho phân trang
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // 2. Khởi tạo query
      let query = supabase
        .from("invoices")
        .select(`
          *,
          guests (full_name, phone),
          rooms (room_number)
        `, { count: "exact" }); // { count: "exact" } cực kỳ quan trọng để làm Pagination

      // 3. Áp dụng bộ lọc thời gian nếu có
      if (startDate && endDate) {
        query = query.gte("created_at", startDate).lte("created_at", endDate);
      }

      // 4. Sắp xếp, phân trang và thực thi
      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      return { 
        success: true, 
        data, 
        total: count || 0 // Trả về tổng số dòng để UI biết đường chia trang
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};