import { useState, useEffect } from 'react';
import { 
  CheckCircle, Clock, Bed, Loader2, Sparkles, LayoutGrid 
} from 'lucide-react';
import { toast } from 'sonner';
import { roomService, Room } from '../services/roomService';

export function HousekeepingManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null); // Lưu ID phòng đang xử lý

  // Chỉ lấy dữ liệu phòng, bỏ phần lấy kho (Inventory)
  const fetchData = async () => {
    setLoading(true);
    const roomRes = await roomService.getHousekeepingRooms();
    if (roomRes.success) setRooms(roomRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // 1. Logic Bắt đầu dọn (dirty -> cleaning)
  const handleStartCleaning = async (roomId: string) => {
    const res = await roomService.updateRoom(roomId, { status: 'cleaning' });
    if (res.success) {
      toast.success("Đã xác nhận bắt đầu dọn dẹp");
      fetchData();
    }
  };

  // 2. Logic Hoàn tất dọn (cleaning -> available) - Xử lý trực tiếp không qua Modal
  const handleFinishCleaning = async (roomId: string, roomNumber: string) => {
    setIsSubmitting(roomId);
    
    // Cập nhật trạng thái phòng thẳng về 'available' (hoặc 'vacant' tùy DB của bạn)
    const res = await roomService.updateRoom(roomId, { status: 'available' });

    if (res.success) {
      toast.success(`Phòng ${roomNumber} đã sạch sẽ và sẵn sàng đón khách!`);
      fetchData();
    } else {
      toast.error("Lỗi: " + res.error);
    }
    setIsSubmitting(null);
  };

  if (loading) return (
    <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <Loader2 size={48} color="#f59e0b" className="animate-spin" />
      <p style={{ color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '2px' }}>Đang đồng bộ dữ liệu...</p>
    </div>
  );

  return (
    <div style={{ paddingBottom: '80px', fontFamily: 'sans-serif' }}>
      
      {/* HEADER SECTION */}
      <div style={{
        display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '20px', backgroundColor: '#ffffff', padding: '24px',
        borderRadius: '2rem', border: '1px solid #f1f5f9', marginBottom: '32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px', height: '56px', backgroundColor: '#4f46e5', borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff',
            boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.2)'
          }}>
            <Sparkles size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: 0, textTransform: 'uppercase' }}>Buồng Phòng</h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>Quản lý vệ sinh & trạng thái phòng</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ padding: '12px 20px', backgroundColor: '#fff1f2', border: '1px solid #ffe4e6', borderRadius: '16px', color: '#e11d48', fontWeight: '800', fontSize: '12px' }}>
                {rooms.filter(r => r.status === 'dirty').length} PHÒNG BẨN
            </div>
            <div style={{ padding: '12px 20px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '16px', color: '#d97706', fontWeight: '800', fontSize: '12px' }}>
                {rooms.filter(r => r.status === 'cleaning').length} ĐANG DỌN
            </div>
        </div>
      </div>

      {/* ROOM GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gap: '24px' }}>
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <div key={room.id} style={{
              backgroundColor: '#ffffff', borderRadius: '2.5rem', border: '1px solid #e2e8f0',
              padding: '24px', transition: 'all 0.3s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff',
                    backgroundColor: room.status === 'dirty' ? '#f43f5e' : '#f59e0b',
                    boxShadow: `0 8px 15px ${room.status === 'dirty' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                  }}>
                    <Bed size={28} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0 }}>P.{room.room_number}</h3>
                    <p style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', margin: '4px 0 0 0' }}>{room.room_type}</p>
                  </div>
                </div>
                <div style={{
                  padding: '4px 10px', borderRadius: '99px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase',
                  backgroundColor: room.status === 'dirty' ? '#fff1f2' : '#fffbeb',
                  color: room.status === 'dirty' ? '#e11d48' : '#d97706',
                  border: `1px solid ${room.status === 'dirty' ? '#ffe4e6' : '#fef3c7'}`
                }}>
                  {room.status === 'dirty' ? 'Bẩn' : 'Dọn'}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: '#94a3b8', fontWeight: '700', fontSize: '12px' }}>
                <LayoutGrid size={16} /> Tầng {room.floor}
              </div>

              {room.status === 'dirty' ? (
                <button
                  onClick={() => handleStartCleaning(room.id)}
                  style={{
                    width: '100%', padding: '16px', backgroundColor: '#0f172a', color: '#ffffff', borderRadius: '18px',
                    border: 'none', fontWeight: '800', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <Clock size={16} /> Bắt đầu dọn
                </button>
              ) : (
                <button
                  onClick={() => handleFinishCleaning(room.id, room.room_number)}
                  disabled={isSubmitting === room.id}
                  style={{
                    width: '100%', padding: '16px', backgroundColor: '#f59e0b', color: '#ffffff', borderRadius: '18px',
                    border: 'none', fontWeight: '800', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 8px 20px rgba(245, 158, 11, 0.2)',
                    opacity: isSubmitting === room.id ? 0.7 : 1
                  }}
                >
                  {isSubmitting === room.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  {isSubmitting === room.id ? 'Đang xử lý...' : 'Hoàn tất dọn'}
                </button>
              )}
            </div>
          ))
        ) : (
          <div style={{
            gridColumn: '1 / -1', padding: '100px 20px', backgroundColor: '#f8fafc', borderRadius: '3rem',
            border: '2px dashed #e2e8f0', textAlign: 'center'
          }}>
            <CheckCircle size={64} color="#10b981" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>Sạch sẽ 100%</h3>
            <p style={{ color: '#64748b', marginTop: '8px' }}>Hiện tại không có phòng nào cần dọn dẹp.</p>
          </div>
        )}
      </div>
    </div>
  );
}