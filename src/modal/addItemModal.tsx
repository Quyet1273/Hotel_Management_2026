import React, { useState } from "react";
import { Package, X } from "lucide-react";
import { toast } from "sonner";
import { inventoryService } from "../services/inventoryservice";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddItemModal({ isOpen, onClose, onSuccess }: AddItemModalProps) {
  const [form, setForm] = useState({
    name: "",
    category: "other",
    unit: "Cái",
    min_quantity: 10,
    price: 0,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await inventoryService.addItem(form);
    if (res.success) {
      toast.success("Thêm vật tư thành công!");
      setForm({ name: "", category: "other", unit: "Cái", min_quantity: 10, price: 0 });
      onSuccess();
      onClose();
    } else {
      toast.error("Lỗi: " + res.error);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-200">
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center relative">
          <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5" /> Thêm Danh Mục
          </h3>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-gray-50/50">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Tên vật tư <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none font-bold text-gray-800"
              placeholder="VD: Nước suối Lavie..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Danh mục</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none font-bold text-gray-800 appearance-none"
              >
                <option value="amenities">Tiện nghi</option>
                <option value="food">Thực phẩm</option>
                <option value="beverage">Đồ uống</option>
                <option value="cleaning">Vệ sinh</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Đơn vị *</label>
              <input
                required
                type="text"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none font-bold text-gray-800"
                placeholder="Chai, Cái..."
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Cảnh báo hết</label>
              <input
                type="number"
                value={form.min_quantity}
                onChange={(e) => setForm({ ...form, min_quantity: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none font-bold text-gray-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Giá nhập (VNĐ)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none font-bold text-gray-800"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
            Lưu Thông Tin
          </button>
        </form>
      </div>
    </div>
  );
}