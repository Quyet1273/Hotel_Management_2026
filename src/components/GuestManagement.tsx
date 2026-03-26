import { useState, useEffect } from 'react';
import { Users, Plus, Search, Mail, Phone, MapPin, CreditCard, Loader2, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GuestForm } from '../modal/GuestForm';
import { toast } from 'sonner';

export function GuestManagement() {
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  // 1. Thêm state để giữ thông tin khách đang sửa
  const [editingGuest, setEditingGuest] = useState<any>(null);

  const fetchGuests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setGuests(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchGuests(); }, []);

  // 2. Hàm Xử lý XÓA
  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Xóa khách hàng ${name}?`)) {
      const { error } = await supabase.from('guests').delete().eq('id', id);
      if (error) {
        toast.error("Lỗi xóa: " + error.message);
      } else {
        toast.success("Đã xóa khách hàng");
        fetchGuests();
      }
    }
  };

  // 3. Hàm Xử lý khi bấm nút SỬA
  const handleEdit = (guest: any) => {
    setEditingGuest(guest);
    setShowForm(true);
  };

  const filteredGuests = guests.filter(guest => 
    guest.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.phone?.includes(searchTerm) ||
    guest.id_number?.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header - GIỮ NGUYÊN */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản Lý Khách Hàng</h2>
          <p className="text-gray-600 mt-1">Dữ liệu khách hàng trong hệ thống</p>
        </div>
        <button 
          onClick={() => { setEditingGuest(null); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Thêm Khách Hàng</span>
        </button>
      </div>

      {/* Toolbar - GIỮ NGUYÊN */}
      <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-sm">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên, số điện thoại, CCCD..."
            className="w-full pl-12 pr-4 py-2.5 border-none rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredGuests.map((guest) => (
            /* --- GIAO DIỆN LIST STYLE M CẦN --- */
            <div key={guest.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-all">
              {/* Avatar/Icon */}
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                <Users size={32} />
              </div>

              {/* Thông tin chính */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{guest.full_name}</h3>
                  <p className="text-xs text-gray-400 font-mono">CCCD: {guest.id_number}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Phone size={14} className="text-gray-400" /> {guest.phone}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Mail size={14} className="text-gray-400" /> {guest.email || 'Chưa cập nhật'}</div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={14} className="text-gray-400" /> 
                  <span className="truncate">{guest.address || 'Chưa có địa chỉ'}</span>
                </div>
              </div>

              {/* Nút hành động - NÚT SỬA XÓA Ở ĐÂY */}
              <div className="flex gap-2 shrink-0">
                <button 
                  onClick={() => handleEdit(guest)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-100 rounded-xl text-sm font-bold text-blue-600 hover:bg-blue-50 transition-all"
                >
                  <Edit2 size={16} /> Chỉnh sửa
                </button>
                <button 
                  onClick={() => handleDelete(guest.id, guest.full_name)}
                  className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <GuestForm 
          initialData={editingGuest} // Truyền dữ liệu cũ vào để sửa
          onClose={() => { setShowForm(false); setEditingGuest(null); }} 
          onSave={fetchGuests} 
        />
      )}
    </div>
  );
}