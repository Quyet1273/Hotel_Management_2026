import { useState, useEffect } from 'react';
import { X, User, Phone, CreditCard, Mail, MapPin, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface GuestFormProps {
  onClose: () => void;
  onSave: () => void;
  initialData?: any; // Nhận dữ liệu để sửa
}

export function GuestForm({ onClose, onSave, initialData }: GuestFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!initialData; // Kiểm tra xem là Sửa hay Thêm

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    id_number: '',
    address: '',
    nationality: 'Việt Nam'
  });

  // Đổ dữ liệu vào form khi bấm nút Sửa
  useEffect(() => {
    if (initialData) {
      setFormData({
        full_name: initialData.full_name || '',
        phone: initialData.phone || '',
        email: initialData.email || '',
        id_number: initialData.id_number || '',
        address: initialData.address || '',
        nationality: initialData.nationality || 'Việt Nam'
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        // CẬP NHẬT
        const { error } = await supabase
          .from('guests')
          .update(formData)
          .eq('id', initialData.id);
        if (error) throw error;
        toast.success("Cập nhật thành công!");
      } else {
        // THÊM MỚI
        const { error } = await supabase
          .from('guests')
          .insert([formData]);
        if (error) throw error;
        toast.success("Thêm mới thành công!");
      }

      onSave();
      onClose();
    } catch (error: any) {
      toast.error("Lỗi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header - Luôn là màu Blue cho đồng bộ */}
        <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <User size={20}/> 
            {isEditing ? "Chỉnh sửa khách hàng" : "Thêm Khách Hàng Mới"}
          </h3>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 ml-1">Họ và tên *</label>
              <input required placeholder="Họ và tên *" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Số điện thoại *</label>
                <input required placeholder="Số điện thoại *" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1">CCCD/Passport *</label>
                <input required placeholder="Số CCCD/Passport *" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.id_number} onChange={e => setFormData({...formData, id_number: e.target.value})} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 ml-1">Email</label>
              <input placeholder="Email" type="email" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 ml-1">Địa chỉ</label>
              <input placeholder="Địa chỉ" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button 
              type="submit" 
              disabled={loading} 
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              {loading ? (
                "Đang lưu..."
              ) : (
                <>
                  <Save size={18} />
                  {isEditing ? "Cập nhật thông tin" : "Lưu Khách Hàng"}
                </>
              )}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}