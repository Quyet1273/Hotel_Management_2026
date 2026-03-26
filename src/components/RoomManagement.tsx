import { useState, useEffect } from 'react';
import { Bed, Filter, Plus, Edit, Trash2, Users as UsersIcon, LayoutGrid, List, Loader2 } from 'lucide-react';
import { roomService, Room } from '../services/roomService';
import RoomForm from "../modal/RoomForm";

export function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // --- QUẢN LÝ MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Hàm fetch data
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

  // --- LOGIC XỬ LÝ SỰ KIỆN ---
  
  // Mở modal thêm mới
  const handleAddClick = () => {
    setEditingRoom(null);
    setIsModalOpen(true);
  };

  // Mở modal để sửa
  const handleEditClick = (room: Room) => {
    setEditingRoom(room);
    setIsModalOpen(true);
  };

  // Hàm lưu (Xử lý cả Update và Create)
  const handleSaveRoom = async (roomData: any) => {
    let result;
    if (editingRoom) {
      // Nếu đang có data sửa -> Gọi Update
      result = await roomService.updateRoom(editingRoom.id, roomData);
    } else {
      // Nếu không có data sửa -> Gọi Create
      result = await roomService.createRoom(roomData);
    }

    if (result.success) {
      await fetchRooms();
      setIsModalOpen(false); // Đóng modal sau khi lưu thành công
    } else {
      alert("Lỗi: " + result.error);
      throw new Error(result.error);
    }
  };

  // Hàm xóa phòng
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

  // Logic lọc dữ liệu
  const filteredRooms = rooms.filter(room => {
    const statusMatch = filterStatus === 'all' || room.status === filterStatus;
    const typeMatch = filterType === 'all' || room.room_type === filterType;
    return statusMatch && typeMatch;
  });

  // --- HELPERS UI (Giữ nguyên giao diện của bạn) ---
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
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500">Đang tải danh sách phòng...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
     {/* 1. HEADER SECTION */}
      <div className="flex items-center justify-between flex-wrap gap-4" style={{ marginBottom: '24px' }}>
        <div>
          <h2 style={{ 
            color: '#111827', 
            fontWeight: 800, 
            fontSize: '24px', 
            margin: 0, 
            letterSpacing: '-0.025em' 
          }}>
            Quản Lý Phòng
          </h2>
          <p style={{ 
            color: '#6b7280', 
            marginTop: '4px', 
            margin: 0, 
            fontSize: '14px', 
            fontWeight: 500 
          }}>
            Quản lý tất cả các phòng và trạng thái hiện tại
          </p>
        </div>

        {/* Nút Thêm Phòng với hiệu ứng Hover giả lập */}
        <button 
          onClick={handleAddClick}
          className="flex items-center gap-2 transition-all duration-200"
          style={{ 
            padding: '10px 20px', 
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', 
            color: '#ffffff', 
            borderRadius: '14px', 
            border: 'none', 
            cursor: 'pointer', 
            fontWeight: 600, 
            fontSize: '14px',
            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(37, 99, 235, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(37, 99, 235, 0.3)';
          }}
        >
          <Plus size={20} />
          <span>Thêm Phòng</span>
        </button>
      </div>

      {/* 2. BỘ LỌC (FILTERS) */}
      <div 
        className="shadow-sm"
        style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '1.5rem', 
          border: '1px solid rgba(229, 231, 235, 0.5)', 
          padding: '20px',
          marginBottom: '24px'
        }}
      >
        <div className="flex items-center gap-6 flex-wrap">
          {/* Label Lọc */}
          <div className="flex items-center gap-2" style={{ color: '#94a3b8' }}>
            <Filter size={20} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Lọc theo:
            </span>
          </div>

          <div className="flex gap-6 flex-1 flex-wrap">
            {/* Lọc Trạng thái */}
            <div className="flex items-center gap-3">
              <label style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>Trạng thái:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ 
                  padding: '8px 16px', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px', 
                  fontSize: '14px', 
                  backgroundColor: '#f8fafc', 
                  fontWeight: 600,
                  color: '#334155',
                  outline: 'none',
                  cursor: 'pointer',
                  minWidth: '130px'
                }}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="available">🟢 Trống (Sẵn sàng)</option>
                <option value="occupied">🔴 Đã thuê</option>
                <option value="reserved">🔵 Đã đặt</option>
                <option value="maintenance">🟡 Bảo trì</option>
              </select>
            </div>

            {/* Lọc Loại phòng */}
            <div className="flex items-center gap-3">
              <label style={{ fontSize: '14px', color: '#64748b', fontWeight: 600 }}>Loại phòng:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ 
                  padding: '8px 16px', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '12px', 
                  fontSize: '14px', 
                  backgroundColor: '#f8fafc', 
                  fontWeight: 600,
                  color: '#334155',
                  outline: 'none',
                  cursor: 'pointer',
                  minWidth: '130px'
                }}
              >
                <option value="all">Tất cả loại</option>
                <option value="single">Phòng Đơn</option>
                <option value="double">Phòng Đôi</option>
                <option value="suite">Phòng Suite</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-white rounded-2xl border border-gray-200/50 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="font-medium">Grid</span>
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl ${viewMode === 'list' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            onClick={() => setViewMode('list')}
          >
            <List className="w-5 h-5" />
            <span className="font-medium">List</span>
          </button>
        </div>
      </div>

      {/* Room Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRooms.map((room) => (
            <div key={room.id} className="group bg-white rounded-2xl border border-gray-200/50 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={room.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'} 
                  alt={`Phòng ${room.room_number}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute top-4 left-4 right-4 flex items-start justify-between text-white">
                  <div>
                    <p className="text-2xl font-bold drop-shadow-lg">Phòng {room.room_number}</p>
                    <p className="text-sm opacity-90 mt-1">Tầng {room.floor}</p>
                  </div>
                  <Bed className="w-8 h-8 opacity-80 drop-shadow-lg" />
                </div>
                <div className="absolute bottom-4 right-4">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border backdrop-blur-sm ${getStatusColor(room.status)}`}>
                    {getStatusText(room.status)}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Loại phòng</span>
                    <span className="text-sm font-medium text-gray-900">{getTypeText(room.room_type)}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <UsersIcon className="w-4 h-4" /> Sức chứa
                    </span>
                    <span className="text-sm font-medium text-gray-900">{room.capacity} khách</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg">
                    <span className="text-sm text-blue-700 font-medium">Giá phòng</span>
                    <span className="text-blue-900 font-semibold">{room.price.toLocaleString('vi-VN')}đ<span className="text-sm text-blue-600">/đêm</span></span>
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => handleEditClick(room)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="w-4 h-4" /> Sửa
                  </button>
                  <button 
                    onClick={() => handleDeleteRoom(room.id)}
                    className="px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
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
            <div key={room.id} className="group bg-white rounded-2xl border border-gray-200/50 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-64 h-48 md:h-auto overflow-hidden relative flex-shrink-0">
                  <img 
                    src={room.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'} 
                    alt={`Phòng ${room.room_number}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent"></div>
                  <div className="absolute top-4 left-4">
                    <p className="text-2xl font-bold text-white drop-shadow-lg">Phòng {room.room_number}</p>
                    <p className="text-sm text-white/90 mt-1">Tầng {room.floor}</p>
                  </div>
                </div>

                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(room.status)}`}>
                          {getStatusText(room.status)}
                        </span>
                        <span className="text-sm text-gray-600">
                          <span className="font-medium text-gray-900">{getTypeText(room.room_type)}</span> • <UsersIcon className="w-4 h-4 inline" /> {room.capacity} khách
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{room.price.toLocaleString('vi-VN')}đ</p>
                      <p className="text-sm text-gray-500">/đêm</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="py-2 px-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-0.5">Số phòng</p>
                      <p className="text-sm font-medium text-gray-900">{room.room_number}</p>
                    </div>
                    <div className="py-2 px-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-0.5">Tầng</p>
                      <p className="text-sm font-medium text-gray-900">Tầng {room.floor}</p>
                    </div>
                    <div className="py-2 px-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-0.5">Loại</p>
                      <p className="text-sm font-medium text-gray-900">{getTypeText(room.room_type)}</p>
                    </div>
                    <div className="py-2 px-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-0.5">Sức chứa</p>
                      <p className="text-sm font-medium text-gray-900">{room.capacity} khách</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditClick(room)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" /> Chỉnh sửa
                    </button>
                    <button 
                      onClick={() => handleDeleteRoom(room.id)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {filteredRooms.length === 0 && !loading && (
        <div className="bg-white rounded-2xl border border-gray-200/50 p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bed className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-900 mb-1">Không tìm thấy phòng</p>
          <p className="text-sm text-gray-500">Không có phòng nào phù hợp với bộ lọc đã chọn</p>
        </div>
      )}

      {/* Modal - Luôn nhận editData để phân biệt Add/Edit */}
      <RoomForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveRoom} 
        editData={editingRoom} 
      />
    </div>
  );
}