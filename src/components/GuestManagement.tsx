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
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 font-sans antialiased">
      
      {/* HEADER BANNER - ĐỒNG BỘ NỀN VÀ FONT */}
      <div className="bg-[#D1F4FA] dark:bg-gray-800 rounded-[2rem] p-8 flex flex-col md:flex-row gap-4 justify-between md:items-center shadow-sm border border-blue-100 dark:border-gray-700">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-600/10 dark:bg-white/10 rounded-2xl flex items-center justify-center">
            <Users className="w-8 h-8 text-blue-700 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">
              Quản Lý Khách Hàng
            </h1>
          </div>
        </div>
        <button 
          onClick={() => { setEditingGuest(null); setShowForm(true); }}
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-extrabold text-[13px] uppercase tracking-wider shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span>+ Thêm Khách Hàng</span>
        </button>
      </div>

      {/* TOOLBAR SEARCH - ĐỒNG BỘ 100% KIỂU DÁNG VỚI QUẦY LỄ TÂN */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={18} />
          </div>
          <input
            type="text"
            placeholder="Tìm theo tên, số điện thoại, CCCD..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900/80 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-2xl focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold outline-none text-[15px]"
          />
        </div>
      </div>

     {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
          <p className="text-gray-500 dark:text-gray-400 font-extrabold text-[12px] uppercase tracking-widest">Đang tải danh sách...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredGuests.length > 0 ? (
            filteredGuests.map((guest) => (
              <div key={guest.id} className="bg-white dark:bg-gray-800 rounded-[1.5rem] border-2 border-gray-200 dark:border-gray-600 p-5 flex flex-col md:flex-row items-center gap-6 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all group overflow-hidden">
                
                {/* Avatar/Icon */}
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-blue-500 transition-colors shadow-inner border border-blue-100 dark:border-blue-800">
                  <Users size={28} />
                </div>

                {/* Thông tin chính - Đã thêm đường kẻ chia cột (divide-x-2) */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 md:divide-x-2 divide-gray-200 dark:divide-gray-600 w-full items-center">
                  
                  {/* Cột 1: Tên & ID */}
                  <div className="md:pr-6">
                    <h3 className="font-extrabold text-gray-900 dark:text-white text-[16px] uppercase tracking-wide">{guest.full_name}</h3>
                    <p className="text-[12px] text-gray-500 dark:text-gray-400 font-extrabold uppercase tracking-wider mt-0.5">ID: {guest.id_number || 'N/A'}</p>
                  </div>
                  
                  {/* Cột 2: Liên hệ */}
                  <div className="md:px-6 space-y-2">
                    <div className="flex items-center gap-2 text-[14px] font-bold text-gray-700 dark:text-gray-300">
                      <Phone size={16} className="text-blue-500" /> {guest.phone}
                    </div>
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-500 dark:text-gray-400">
                      <Mail size={16} className="text-gray-400" /> {guest.email || 'Chưa cập nhật'}
                    </div>
                  </div>
                  
                  {/* Cột 3: Địa chỉ */}
                  <div className="md:px-6 flex items-center gap-2 text-[14px] font-bold text-gray-700 dark:text-gray-300">
                    <MapPin size={16} className="text-rose-500 shrink-0" /> 
                    <span className="truncate">{guest.address || 'Chưa có địa chỉ'}</span>
                  </div>

                </div>

                {/* Nút hành động - Thêm vách ngăn bên trái */}
                <div className="flex gap-3 shrink-0 border-t-2 border-gray-200 dark:border-gray-600 md:border-t-0 md:border-l-2 md:pl-6 pt-4 md:pt-0 w-full md:w-auto justify-end">
                  <button 
                    onClick={() => handleEdit(guest)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-[12px] font-extrabold uppercase hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all border-2 border-blue-100 dark:border-blue-800/50"
                  >
                    <Edit2 size={16} /> Sửa
                  </button>
                  <button 
                    onClick={() => handleDelete(guest.id, guest.full_name)}
                    className="p-2.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all border-2 border-rose-100 dark:border-rose-800/50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-800/50 rounded-[2rem] border-2 border-dashed border-gray-300 dark:border-gray-600">
               <p className="text-gray-500 dark:text-gray-400 font-bold text-[14px]">Không tìm thấy khách hàng nào khớp với từ khóa</p>
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