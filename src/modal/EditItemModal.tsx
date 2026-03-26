import { useState, useEffect } from "react";
import { X, Save, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { inventoryService } from "../services/inventoryservice";

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: any;
}

export function EditItemModal({
  isOpen,
  onClose,
  onSuccess,
  item,
}: EditItemModalProps) {
  const [form, setForm] = useState({
    name: "",
    category: "other",
    unit: "Cái",
    min_quantity: 10,
    price: 0,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || "",
        category: item.category || "other",
        unit: item.unit || "Cái",
        min_quantity: item.min_quantity || 0,
        price: item.price || 0,
      });
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await inventoryService.updateItem(item.id, form);
    if (res.success) {
      toast.success("Cập nhật vật tư thành công!");
      onSuccess();
      onClose();
    } else {
      toast.error("Lỗi: " + res.error);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[1.5rem] shadow-2xl max-w-md w-full overflow-hidden border border-gray-200">
        
        {/* HEADER: Dùng style trực tiếp để ép màu Cam (Amber) */}
        <div 
          style={{ backgroundColor: '#f59e0b' }} 
          className="p-5 text-white flex justify-between items-center"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black/20 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold uppercase">Chỉnh sửa vật tư</h3>
          </div>
          
          {/* NÚT X: Cho màu nền đen nhẹ để nổi bật trên nền cam */}
          <button
            onClick={onClose}
            className="p-2 bg-black/10 hover:bg-black/20 rounded-full text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase ml-1">
              Tên vật tư
            </label>
            <input
              required
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-semibold text-gray-800 focus:border-amber-500 outline-none transition-all"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase ml-1">
                Đơn vị
              </label>
              <input
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-semibold text-gray-800 focus:border-amber-500 outline-none transition-all"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase ml-1">
                Giá nhập
              </label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-semibold text-gray-800 focus:border-amber-500 outline-none transition-all"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* NÚT LƯU: Ép màu Cam bằng style inline để không bị trắng trơn */}
          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: '#f59e0b' }}
            className="w-full py-4 text-white rounded-xl font-bold uppercase tracking-wider shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Lưu Thay Đổi</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}