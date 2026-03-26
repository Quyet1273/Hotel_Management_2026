import { supabase } from '../lib/supabase';

export const inventoryService = {
  // 1. Lấy danh sách vật tư/hàng hóa
  async getItems() {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('category')
        .order('name');
      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // 2. Thêm vật tư mới vào danh mục (Dùng khi khai báo sản phẩm mới chưa từng có)
  async addItem(item: { name: string; category: string; unit: string; min_quantity: number; price: number }) {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert([{ ...item, quantity_in_stock: 0 }])
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // 3. Xử lý Nhập / Xuất kho (ĐÃ TỐI ƯU: Không cần tính toán newStock ở đây nữa)
 async processTransaction(payload: any) {
    try {
      console.log("1. Dữ liệu nhận vào:", payload);

      // Tính tổng tiền
      const total = payload.quantity * (payload.unit_price || 0);

      // 1. Lưu vào bảng inventory_transactions
      // Đảm bảo truyền đủ total_amount vào payload trước khi insert
      const { data: transData, error: transError } = await supabase
        .from('inventory_transactions')
        .insert([{
          ...payload,
          total_amount: total
        }])
        .select()
        .single();

      if (transError) {
        console.error("2. Lỗi Insert Kho:", transError.message);
        throw transError;
      }

      console.log("3. Lưu kho xong, ID giao dịch:", transData.id);

      // 2. LOGIC NHẢY SANG HÓA ĐƠN CHI PHÍ
      // Kiểm tra kỹ điều kiện: Viết thường 'paid' và 'IN'
      if (payload.transaction_type === 'IN' && payload.payment_status === 'paid') {
        console.log("4. Đang tạo hóa đơn chi phí cho khoản nhập này...");
        
        const { error: expError } = await supabase
          .from('expenses')
          .insert([{
            description: `Nhập hàng: ${payload.note || 'Không có ghi chú'}`,
            amount: total,
            category: 'inventory',
            payment_method: payload.payment_method || 'cash',
            ref_id: transData.id
          }]);

        if (expError) {
          console.error("5. Lỗi tạo hóa đơn Chi Phí:", expError.message);
        } else {
          console.log("6. Đã tạo hóa đơn Chi Phí thành công!");
        }
      } else {
        console.log("4. Không tạo hóa đơn vì loại trans không phải IN hoặc chưa trả tiền:", payload.transaction_type, payload.payment_status);
      }

      return { success: true, data: transData };
    } catch (error: any) {
      console.error("Lỗi hệ thống:", error.message);
      return { success: false, error: error.message };
    }
  },

  // 4. Lấy lịch sử giao dịch
async getTransactions() {
  try {
    const { data, error } = await supabase
      .from('v_inventory_history')
      .select('*')
      // Thêm dòng này để luôn hiện giao dịch mới nhất lên trên cùng
      .order('created_at', { ascending: false }); 
      
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
},
// 5. Cập nhật thông tin vật tư (Dùng để chỉnh sửa tên, đơn vị, giá cả, v.v.)
// 1. Cập nhật vật tư
async updateItem(id: string, updates: any) {
  const { data, error } = await supabase
    .from('inventory_items')
    .update(updates)
    .eq('id', id);
  return error ? { success: false, error: error.message } : { success: true, data };
},

// 2. Xóa vật tư (Dùng Soft Delete - Chuẩn khách sạn thực tế)
async deleteItem(id: string) {
  const { data, error } = await supabase
    .from('inventory_items')
    .update({ is_active: false }) // Chỉ ẩn đi, không xóa khỏi lịch sử
    .eq('id', id);
  return error ? { success: false, error: error.message } : { success: true, data };
},

// 3. Xóa lịch sử giao dịch (Dùng khi nhập sai hoàn toàn)
async deleteTransaction(id: string) {
  const { error } = await supabase
    .from('inventory_transactions')
    .delete()
    .eq('id', id);
  return error ? { success: false, error: error.message } : { success: true };
}
};