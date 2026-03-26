export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity_in_stock: number;
  min_quantity: number;
  price: number;
}

export interface InventoryTransaction {
  item_id: string;
  transaction_type: 'IN' | 'OUT' | 'DAMAGE';
  quantity: number;
  unit_price: number;
  supplier_name?: string;
  note?: string;
}

export interface InventoryHistoryView {
  "Ngày nhập": string;
  "Tên sản phẩm": string;
  "Loại": string;
  "Số lượng": number;
  "Đơn giá": number;
  "Tổng tiền": number;
  "Nhà cung cấp": string;
}