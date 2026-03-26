import React, { useState, useEffect } from "react";
import { Upload, Download, X, DollarSign, Truck, CreditCard, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { inventoryService } from "../services/inventoryservice";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: any;
  type: "import" | "export";
}

export function TransactionModal({ isOpen, onClose, onSuccess, item, type }: TransactionModalProps) {
  const [formData, setFormData] = useState({
    quantity: 1,
    unit_price: 0,
    supplier_name: "",
    reason: "",
    payment_status: "paid",
    payment_method: "cash",
  });

  const isImport = type === "import";

  useEffect(() => {
    if (item && isOpen) {
      setFormData({
        quantity: 1,
        unit_price: item.price || 0,
        supplier_name: "",
        reason: "",
        payment_status: "paid",
        payment_method: "cash",
      });
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleSubmit = async () => {
    if (formData.quantity <= 0) {
      toast.error("Số lượng phải lớn hơn 0!");
      return;
    }

    const res = await inventoryService.processTransaction({
      item_id: item.id,
      transaction_type: isImport ? "IN" : "OUT",
      quantity: formData.quantity,
      unit_price: isImport ? formData.unit_price : item.price,
      supplier_name: isImport ? formData.supplier_name : "Nội bộ",
      note: formData.reason,
      payment_status: isImport ? formData.payment_status : "paid",
      payment_method: isImport ? formData.payment_method : "cash",
    });

    if (res.success) {
      toast.success(isImport ? "Đã nhập kho và ghi nhận thanh toán!" : "Xuất kho thành công!");
      onSuccess();
      onClose();
    } else {
      toast.error("Lỗi: " + res.error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-200 border border-gray-200">
        
        {/* HEADER - Ép màu trực tiếp bằng style để không bị trắng xóa */}
        <div 
          style={{ backgroundColor: isImport ? '#10b981' : '#f43f5e' }} 
          className="p-6 text-white flex justify-between items-center padding-top-10"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              {isImport ? <Upload size={24} /> : <Download size={24} />}
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight m-0">
                {isImport ? "Phiếu Nhập Kho" : "Phiếu Xuất Kho"}
              </h3>
              <p className="text-[10px] font-bold opacity-90 uppercase m-0 tracking-widest">{item.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 bg-gray-50/50">
          {/* BOX TỒN KHO */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Hiện có</p>
              <p className="font-bold text-gray-800 text-sm">{item.quantity_in_stock || 0} {item.unit}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Số lượng {isImport ? 'nhập' : 'xuất'}</p>
              <input
                type="number"
                className="w-20 text-right font-black text-blue-600 text-lg outline-none bg-transparent"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* CHỈ HIỆN KHI NHẬP KHO */}
          {isImport && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-2 flex items-center gap-1"><DollarSign size={10}/> Giá nhập</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:border-emerald-500"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-2 flex items-center gap-1"><Truck size={10}/> Nhà cung cấp</label>
                  <input
                    type="text"
                    placeholder="Tên NCC..."
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:border-emerald-500"
                    value={formData.supplier_name}
                    onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  />
                </div>
              </div>

              {/* THANH TOÁN */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select 
                    className="w-full px-2 py-2 bg-white border border-emerald-200 rounded-lg font-bold text-[11px] text-emerald-800 outline-none"
                    value={formData.payment_status}
                    onChange={(e) => setFormData({...formData, payment_status: e.target.value})}
                  >
                    <option value="paid">Đã thanh toán</option>
                    <option value="pending">Ghi nợ (Chưa trả)</option>
                  </select>
                  <select 
                    className="w-full px-2 py-2 bg-white border border-emerald-200 rounded-lg font-bold text-[11px] text-emerald-800 outline-none"
                    value={formData.payment_method}
                    onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                  >
                    <option value="cash">Tiền mặt</option>
                    <option value="transfer">Chuyển khoản</option>
                  </select>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
                  <span className="text-[10px] font-black text-emerald-600 uppercase">Thành tiền:</span>
                  <span className="text-base font-black text-emerald-700">
                    {new Intl.NumberFormat("vi-VN").format(formData.quantity * formData.unit_price)} đ
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[9px] font-black text-gray-400 uppercase ml-2 flex items-center gap-1"><AlertCircle size={10}/> Ghi chú</label>
            <input
              type="text"
              placeholder="Lý do nhập/xuất..."
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 text-sm outline-none focus:border-blue-500"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>

          <button
            onClick={handleSubmit}
            style={{ backgroundColor: isImport ? '#10b981' : '#f43f5e' }}
            className="w-full py-4 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-gray-200 active:scale-95 transition-all"
          >
            Xác nhận {isImport ? "Nhập Kho" : "Xuất Kho"}
          </button>
        </div>
      </div>
    </div>
  );
}