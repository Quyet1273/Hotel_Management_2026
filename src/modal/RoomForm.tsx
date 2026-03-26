import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  editData?: any; 
}

const RoomModal: React.FC<RoomModalProps> = ({ isOpen, onClose, onSave, editData }) => {
  const [loading, setLoading] = useState(false);
  
  // Dùng string cho các ô nhập số để tránh lỗi NaN khi người dùng xóa trắng ô nhập
  const [formData, setFormData] = useState({
    room_number: '',
    room_type: 'single',
    price: '',
    floor: '',
    capacity: '',
    status: 'available'
  });

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          room_number: editData.room_number?.toString() || '',
          room_type: editData.room_type || 'single',
          price: editData.price?.toString() || '',
          floor: editData.floor?.toString() || '',
          capacity: editData.capacity?.toString() || '',
          status: editData.status || 'available'
        });
      } else {
        setFormData({ 
          room_number: '', 
          room_type: 'single', 
          price: '', 
          floor: '1', 
          capacity: '1', 
          status: 'available' 
        });
      }
    }
  }, [isOpen, editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Xử lý dữ liệu: Nếu trống thì mặc định là 0 hoặc 1 để tránh lỗi database
    const finalData = {
      ...formData,
      price: Number(formData.price) || 0,
      floor: Number(formData.floor) || 1,
      capacity: Number(formData.capacity) || 1,
    };

    try {
      await onSave(finalData);
      onClose();
    } catch (error) {
      // Lỗi đã được xử lý ở component cha qua alert
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-white/20">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">
            {editData ? "Chỉnh sửa phòng" : "Thêm phòng mới"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Số phòng</label>
              <input 
                required 
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                value={formData.room_number} 
                onChange={e => setFormData({...formData, room_number: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Loại phòng</label>
              <select 
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                value={formData.room_type} 
                onChange={e => setFormData({...formData, room_type: e.target.value})}
              >
                <option value="single">Đơn</option>
                <option value="double">Đôi</option>
                <option value="suite">Suite</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Tầng</label>
              <input 
                required 
                type="number"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                value={formData.floor} 
                onChange={e => setFormData({...formData, floor: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Sức chứa</label>
              <input 
                required 
                type="number"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
                value={formData.capacity} 
                onChange={e => setFormData({...formData, capacity: e.target.value})} 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Giá phòng (₫)</label>
            <input 
              required 
              type="number"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" 
              value={formData.price} 
              onChange={e => setFormData({...formData, price: e.target.value})} 
            />
          </div>

          {editData && (
             <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Trạng thái</label>
              <select 
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                value={formData.status} 
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="available">Trống</option>
                <option value="occupied">Đã thuê</option>
                <option value="reserved">Đã đặt</option>
                <option value="maintenance">Bảo trì</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-6">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors">
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg disabled:opacity-50 transition-all"
            >
              {loading ? "Đang xử lý..." : (editData ? "Cập nhật" : "Thêm phòng")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomModal;