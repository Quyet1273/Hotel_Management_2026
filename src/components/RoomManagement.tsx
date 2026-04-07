import { useState, useEffect } from 'react';
import { Bed, Filter, Plus, Edit, Trash2, Users as UsersIcon, LayoutGrid, List, Loader2, Home } from 'lucide-react';
import { roomService, Room } from '../services/roomService';
import RoomForm from "../modal/RoomForm";

export function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const fetchRooms = async () => {
    setLoading(true);
    const result = await roomService.getAllRooms();
    if (result.success) {
      setRooms(result.data || []);
    } else {
      console.error("Lỗi khi tải danh sách phòng:", result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleAddClick = () => {
    setEditingRoom(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (room: Room) => {
    setEditingRoom(room);
    setIsModalOpen(true);
  };

  const handleSaveRoom = async (roomData: any) => {
    let result;
    if (editingRoom) {
      result = await roomService.updateRoom(editingRoom.id, roomData);
    } else {
      result = await roomService.createRoom(roomData);
    }

    if (result.success) {
      await fetchRooms();
      setIsModalOpen(false);
    } else {
      alert("Lỗi: " + result.error);
      throw new Error(result.error);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phòng này không?")) {
      const result = await roomService.deleteRoom(id);
      if (result.success) {
        await fetchRooms();
      } else {
        alert("Lỗi khi xóa: " + result.error);
      }
    }
  };

  const filteredRooms = rooms.filter(room => {
    const statusMatch = filterStatus === 'all' || room.status === filterStatus;
    const typeMatch = filterType === 'all' || room.room_type === filterType;
    return statusMatch && typeMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700 border-green-200';
      case 'occupied': return 'bg-red-100 text-red-700 border-red-200';
      case 'reserved': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Trống';
      case 'occupied': return 'Đã thuê';
      case 'reserved': return 'Đã đặt';
      case 'maintenance': return 'Bảo trì';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'single': return 'Đơn';
      case 'double': return 'Đôi';
      case 'suite': return 'Suite';
      case 'deluxe': return 'Deluxe';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Đang tải danh sách phòng...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER BANNER - CHUẨN STYLE HOTELPRO */}
      <div style={{ 
        backgroundColor: "#2563eb", borderRadius: "2rem", padding: "2rem", color: "#ffffff",
        display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 15px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ width: "4rem", height: "4rem", backgroundColor: "rgba(255, 255, 255, 0.2)", borderRadius: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Home style={{ width: "2rem", height: "2rem", color: "#ffffff" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.875rem", fontWeight: "900", margin: 0, textTransform: "uppercase" }}>QUẢN LÝ PHÒNG</h1>
            {/* <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: 0 }}>Quản lý sơ đồ phòng, trạng thái và thiết lập giá HotelPro</p> */}
          </div>
        </div>
        <button 
          onClick={handleAddClick}
          style={{ backgroundColor: "#ffffff", color: "#2563eb", padding: "0.8rem 1.5rem", borderRadius: "1rem", border: "none", fontWeight: "900", cursor: "pointer", textTransform: "uppercase", fontSize: "0.75rem" }}
        >
          + Thêm Phòng Mới
        </button>
      </div>

      {/* FILTERS TOOLBAR */}
      <div className="bg-white rounded-[1.5rem] border border-gray-100 p-4 flex flex-wrap items-center gap-6 shadow-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <Filter size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Bộ lọc</span>
        </div>

        <div className="flex flex-wrap gap-4 flex-1">
          <div className="flex items-center gap-3 bg-gray-50/50 px-4 py-2 rounded-xl border border-gray-100">
            <span className="text-[10px] font-black text-gray-400 uppercase">Trạng thái:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-sm font-bold text-gray-600 outline-none cursor-pointer"
            >
              <option value="all">Tất cả</option>
              <option value="available">Trống</option>
              <option value="occupied">Đã thuê</option>
              <option value="reserved">Đã đặt</option>
              <option value="maintenance">Bảo trì</option>
            </select>
          </div>

          <div className="flex items-center gap-3 bg-gray-50/50 px-4 py-2 rounded-xl border border-gray-100">
            <span className="text-[10px] font-black text-gray-400 uppercase">Loại phòng:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-sm font-bold text-gray-600 outline-none cursor-pointer"
            >
              <option value="all">Tất cả</option>
              <option value="single">Phòng Đơn</option>
              <option value="double">Phòng Đôi</option>
              <option value="suite">Suite</option>
            </select>
          </div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DỮ LIỆU HIỂN THỊ */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRooms.map((room) => (
            <div key={room.id} className="group bg-white rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 hover:-translate-y-2">
              <div className="aspect-[16/10] overflow-hidden relative">
                <img 
                  src={room.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'} 
                  alt={`Phòng ${room.room_number}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute top-4 left-4 right-4 flex items-start justify-between text-white">
                  <div>
                    <p className="text-2xl font-black tracking-tighter uppercase drop-shadow-md">Phòng {room.room_number}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Tầng {room.floor}</p>
                  </div>
                  <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                    <Bed className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-4 right-4">
                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-tighter rounded-lg border backdrop-blur-md shadow-lg ${getStatusColor(room.status)}`}>
                    {getStatusText(room.status)}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-2 mb-6">
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50/50 rounded-xl border border-gray-50">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Loại</span>
                    <span className="text-sm font-black text-gray-700">{getTypeText(room.room_type)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50/50 rounded-xl border border-gray-50">
                    <span className="text-[10px] font-black text-gray-400 uppercase">Sức chứa</span>
                    <span className="text-sm font-black text-gray-700 flex items-center gap-1"><UsersIcon className="w-3 h-3" /> {room.capacity} khách</span>
                  </div>
                  <div className="flex items-center justify-between py-3 px-4 bg-blue-50/50 rounded-2xl border border-blue-50">
                    <span className="text-[11px] text-blue-700 font-black uppercase tracking-tighter">Giá thuê</span>
                    <span className="text-blue-900 font-black text-lg">{room.price.toLocaleString('vi-VN')}đ<span className="text-[10px] font-bold text-blue-600">/ĐÊM</span></span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => handleEditClick(room)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                  >
                    <Edit className="w-4 h-4" /> Sửa
                  </button>
                  <button 
                    onClick={() => handleDeleteRoom(room.id)}
                    className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRooms.map((room) => (
            <div key={room.id} className="group bg-white rounded-[1.5rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-56 h-40 md:h-auto overflow-hidden relative flex-shrink-0">
                  <img src={room.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute bottom-4 left-4">
                     <p className="text-xl font-black text-white uppercase tracking-tighter">Phòng {room.room_number}</p>
                  </div>
                </div>

                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg border ${getStatusColor(room.status)}`}>
                        {getStatusText(room.status)}
                      </span>
                      <div className="flex items-center gap-4 text-sm font-bold text-gray-500">
                         <span className="flex items-center gap-1"><Home size={14} className="text-blue-400" /> {getTypeText(room.room_type)}</span>
                         <span className="flex items-center gap-1"><UsersIcon size={14} className="text-purple-400" /> {room.capacity} khách</span>
                         <span className="text-gray-300">|</span>
                         <span>Tầng {room.floor}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-blue-600">{room.price.toLocaleString('vi-VN')}đ<span className="text-xs text-gray-400">/đêm</span></p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4 border-t border-gray-50 pt-4">
                    <button onClick={() => handleEditClick(room)} className="flex items-center gap-2 px-6 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase hover:bg-blue-600 hover:text-white transition-all border border-blue-100">
                      <Edit className="w-4 h-4" /> Chỉnh sửa
                    </button>
                    <button onClick={() => handleDeleteRoom(room.id)} className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all border border-rose-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredRooms.length === 0 && !loading && (
        <div className="bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-200 p-20 text-center">
          <Bed className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 font-bold uppercase text-xs tracking-widest italic">Không tìm thấy phòng phù hợp với yêu cầu</p>
        </div>
      )}

      <RoomForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveRoom} 
        editData={editingRoom} 
      />
    </div>
  );
}