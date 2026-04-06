import { useState, useEffect } from 'react';
import { Users, Plus, Search, Mail, Phone, MapPin, Loader2, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GuestForm } from '../modal/GuestForm';
import { toast } from 'sonner';

export function GuestManagement() {
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER BANNER - CHUẨN STYLE KHO VẬT TƯ */}
      <div style={{ 
        backgroundColor: "#2563eb", borderRadius: "2rem", padding: "2rem", color: "#ffffff",
        display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 15px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ width: "4rem", height: "4rem", backgroundColor: "rgba(255, 255, 255, 0.2)", borderRadius: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users style={{ width: "2rem", height: "2rem", color: "#ffffff" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.875rem", fontWeight: "900", margin: 0, textTransform: "uppercase" }}>QUẢN LÝ KHÁCH HÀNG</h1>
            <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: 0 }}>Lưu trữ và quản lý thông tin khách hàng HotelPro</p>
          </div>
        </div>
        <button 
          onClick={() => { setEditingGuest(null); setShowForm(true); }}
          style={{ backgroundColor: "#ffffff", color: "#2563eb", padding: "0.8rem 1.5rem", borderRadius: "1rem", border: "none", fontWeight: "900", cursor: "pointer", textTransform: "uppercase", fontSize: "0.75rem" }}
        >
          + Thêm Khách Hàng
        </button>
      </div>

      {/* Toolbar - ĐÃ FIX LỖI LỆCH ICON SEARCH */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm theo tên, số điện thoại, CCCD..."
            className="w-full pl-12 pr-4 py-3 border border-gray-100 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Đang tải danh sách...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredGuests.length > 0 ? (
            filteredGuests.map((guest) => (
              <div key={guest.id} className="bg-white rounded-[1.5rem] border border-gray-100 p-5 flex flex-col md:flex-row items-center gap-6 hover:shadow-md hover:border-blue-100 transition-all group">
                {/* Avatar/Icon */}
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-inner">
                  <Users size={28} />
                </div>

                {/* Thông tin chính */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  <div>
                    <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">{guest.full_name}</h3>
                    <p className="text-[11px] text-gray-400 font-black uppercase tracking-tighter">ID: {guest.id_number || 'N/A'}</p>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                      <Phone size={14} className="text-blue-400" /> {guest.phone}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                      <Mail size={14} className="text-gray-300" /> {guest.email || 'Chưa cập nhật email'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                    <MapPin size={14} className="text-rose-400" /> 
                    <span className="truncate">{guest.address || 'Chưa có địa chỉ'}</span>
                  </div>
                </div>

                {/* Nút hành động */}
                <div className="flex gap-2 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 w-full md:w-auto justify-end">
                  <button 
                    onClick={() => handleEdit(guest)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                  >
                    <Edit2 size={14} /> Sửa
                  </button>
                  <button 
                    onClick={() => handleDelete(guest.id, guest.full_name)}
                    className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-200">
               <p className="text-gray-400 font-bold italic">Không tìm thấy khách hàng nào khớp với từ khóa</p>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <GuestForm 
          initialData={editingGuest}
          onClose={() => { setShowForm(false); setEditingGuest(null); }} 
          onSave={fetchGuests} 
        />
      )}
    </div>
  );
}