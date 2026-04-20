import { supabase } from "../lib/supabase";
import { invoiceService } from "./invoiceService"; 

export interface InvoiceCalculation {
  nights: number;
  roomCharge: number;
  serviceCharge: number;
  discountAmount: number;
  subtotal: number;
  tax: number;
  total: number;
}

export const checkInOutService = {
  /**
   * 1. Lấy danh sách cho màn hình chính (Check-in / Check-out / Chờ duyệt)
   * Lấy đầy đủ thông tin Khách, Phòng và các đơn dịch vụ đi kèm.
   */
  getCheckInOutList: async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          guests (id, full_name, phone),
          rooms (id, room_number, room_type, price),
          service_orders (
            id,
            quantity,
            total_price,
            services:service_id (name, is_active)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error("Error fetching check-in/out list:", error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * 2. Lấy chi tiết & Tự động tính toán hóa đơn
   * Phục vụ cho việc hiển thị Modal trước khi thanh toán.
   */
  getInvoiceDetail: async (
    bookingId: string, 
    discountValue: number = 0, 
    discountType: 'percent' | 'amount' = 'percent'
  ) => {
    try {
      const { data: b, error } = await supabase
        .from("bookings")
        .select(`
          *,
          guests (id, full_name, phone),
          rooms (id, room_number, room_type, price),
          service_orders (
            id,
            quantity,
            total_price,
            services:service_id (name)
          )
        `)
        .eq("id", bookingId)
        .single();

      if (error) throw error;
      if (!b) throw new Error("Không tìm thấy thông tin đặt phòng");

      // a. Tính số đêm (Nights) - Tối thiểu 1 đêm
      const checkIn = new Date(b.check_in_date);
      const checkOut = new Date(b.check_out_date);
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      // b. Tiền phòng & Tiền dịch vụ
      const roomCharge = (b.rooms?.price || 0) * nights;
      const serviceCharge = b.service_orders?.reduce(
        (sum: number, item: any) => sum + (Number(item.total_price) || 0), 0
      ) || 0;

      // c. Tính giảm giá (nếu có)
      const discountAmount = discountType === 'percent' 
        ? (roomCharge + serviceCharge) * (discountValue / 100)
        : discountValue;

      // d. Thuế & Tổng cộng
      const subtotal = roomCharge + serviceCharge - discountAmount;
      const tax = subtotal * 0.1; // VAT 10%
      const total = subtotal + tax;

      const calculation: InvoiceCalculation = {
        nights,
        roomCharge,
        serviceCharge,
        discountAmount,
        subtotal,
        tax,
        total
      };

      return { success: true, data: b, calculation };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * 3. XÁC NHẬN NHẬN PHÒNG (Check-in Master)
   */
  confirmCheckInMaster: async (bookingId: string, roomId: string) => {
    try {
      const { error: bErr } = await supabase
        .from("bookings")
        .update({ status: 'checked_in', updated_at: new Date().toISOString() })
        .eq("id", bookingId);

      const { error: rErr } = await supabase
        .from("rooms")
        .update({ status: 'occupied' })
        .eq("id", roomId);

      if (bErr || rErr) throw new Error("Lỗi cập nhật trạng thái nhận phòng");
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  /**
   * 4. XÁC NHẬN TRẢ PHÒNG & LƯU HÓA ĐƠN (ĐÃ FIX GIẢM GIÁ)
   */
  confirmCheckOutMaster: async (
    booking: any, 
    amounts: { roomTotal: number; serviceTotal: number; discountAmount: number; grandTotal: number }, 
    paymentMethod: string
  ) => {
    try {
      // a. Gọi invoiceService để tạo bản ghi hóa đơn mới - Đã thêm discount_amount
      const invResult = await invoiceService.createInvoice({
        booking_id: booking.id,
        guest_id: booking.guests?.id,
        room_id: booking.rooms?.id,
        room_total: amounts.roomTotal,
        service_total: amounts.serviceTotal,
        discount_amount: amounts.discountAmount, // <--- LƯU GIẢM GIÁ VÀO ĐÂY
        total_amount: amounts.grandTotal,        // <--- ĐÂY LÀ TỔNG TẠM TÍNH (trước VAT/giảm giá nếu bác muốn)
        payment_method: paymentMethod
      });

      if (!invResult.success) throw new Error("Không thể lưu hóa đơn: " + invResult.error);

      // b. Cập nhật trạng thái Booking sang checked_out và ghi nhận doanh thu thực tế
      // Thực thu = Tổng cộng - Giảm giá
      const actualRevenue = amounts.grandTotal - (amounts.discountAmount || 0);

      const { error: bErr } = await supabase
        .from("bookings")
        .update({ 
          status: 'checked_out', 
          total_amount: actualRevenue, 
          updated_at: new Date().toISOString()
        })
        .eq("id", booking.id);

      if (bErr) throw bErr;

      // c. Trả phòng về trạng thái chờ dọn (dirty)
      const { error: rErr } = await supabase
        .from("rooms")
        .update({ status: 'dirty' })
        .eq("id", booking.rooms?.id);

      if (rErr) throw rErr;

      return { success: true };
    } catch (error: any) {
      console.error("Check-out Master Error:", error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * 5. Hủy đơn đặt phòng
   */
  cancelBooking: async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq("id", bookingId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};