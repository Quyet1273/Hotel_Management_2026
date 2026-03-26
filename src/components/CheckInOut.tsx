import { useState, useEffect, cloneElement } from "react";
import {
  LogIn,
  LogOut,
  Search,
  Calendar,
  User,
  Bed,
  Clock,
  Receipt,
  ChevronRight,
  Phone,
} from "lucide-react";
import { checkInOutService } from "../services/checkInOutService";
import { toast } from "sonner";

// Import Modal dùng chung
import { CheckoutModal } from "../modal/checkOutModal";

export function CheckInOut() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "confirmed" | "checked_in">("pending");
  
  // State quản lý hiệu ứng hover cho Tab
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  // State quản lý Modal Thanh toán
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Cấu hình màu sắc cho từng Tab
  const tabConfig: any = {
    pending: { base: '#f59e0b', light: '#fffbeb', shadow: 'rgba(245, 158, 11, 0.3)', label: "Chờ duyệt", icon: <Clock /> },
    confirmed: { base: '#3b82f6', light: '#eff6ff', shadow: 'rgba(59, 130, 246, 0.3)', label: "Nhận phòng", icon: <LogIn /> },
    checked_in: { base: '#e11d48', light: '#fff1f2', shadow: 'rgba(225, 29, 72, 0.3)', label: "Trả phòng", icon: <LogOut /> },
  };

  const loadBookings = async () => {
    setLoading(true);
    const result = await checkInOutService.getCheckInOutList();
    if (result.success) {
      setBookings(result.data || []);
    } else {
      toast.error("Lỗi tải dữ liệu: " + result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleUpdateStatus = async (id: string, status: string, msg: string) => {
    if (status === "checked_in") {
      const target = bookings.find((b) => b.id === id);
      const result = await checkInOutService.confirmCheckInMaster(id, target.room_id);
      if (result?.success) {
        toast.success(msg);
        loadBookings();
      } else {
        toast.error("Thất bại: " + result?.error);
      }
    } else if (status === "checked_out") {
      setSelectedBookingId(id);
      setIsCheckoutModalOpen(true);
    }
  };

  const displayBookings = bookings.filter((b) => b.status === activeTab);

  const filteredBookings = displayBookings.filter((b) => {
    const search = searchTerm.toLowerCase();
    return (
      b.guests?.full_name?.toLowerCase().includes(search) ||
      b.rooms?.room_number?.toString().includes(search)
    );
  });

  if (loading)
    return (
      <div className="p-10 text-center animate-pulse text-gray-500 font-medium italic">
        Đang tải dữ liệu từ hệ thống...
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Quầy Lễ Tân</h2>
          <p className="text-gray-500 text-sm italic">Quản lý nhận phòng, trả phòng & thanh toán tức thì</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
          <p className="text-blue-600 font-bold text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Hôm nay: {new Date().toLocaleDateString("vi-VN")}
          </p>
        </div>
      </div>

      {/* Tabs Menu & Search Bar Box */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        {/* Tabs Row */}
        <div style={{ display: 'flex', padding: '8px', gap: '8px', backgroundColor: '#f8fafc' }}>
          {Object.keys(tabConfig).map((key) => {
            const config = tabConfig[key];
            const isActive = activeTab === key;
            const isHovered = hoveredTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                onMouseEnter={() => setHoveredTab(key)}
                onMouseLeave={() => setHoveredTab(null)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '12px 20px',
                  borderRadius: '1.25rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '800',
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundColor: isActive ? config.light : 'transparent',
                  color: isActive ? config.base : '#94a3b8',
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: isHovered ? `0 10px 20px ${config.shadow}` : 'none',
                  zIndex: isHovered ? 10 : 1,
                }}
              >
                <span style={{ color: isActive || isHovered ? config.base : '#94a3b8' }}>
                  {cloneElement(config.icon, { size: 18 })}
                </span>
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div style={{ padding: '16px', borderBottom: '1px solid #f9fafb' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', color: '#9ca3af', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Tìm theo tên khách hoặc số phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '10px 16px 10px 44px', backgroundColor: '#f8fafc',
                border: '1px solid #f1f5f9', borderRadius: '12px', fontSize: '14px', color: '#1e293b',
                outline: 'none', transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#f1f5f9';
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Bookings List */}
        <div className="divide-y divide-gray-50">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="p-6 hover:bg-slate-50/50 transition-all cursor-default group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="grid grid-cols-3 flex-1 gap-6 items-center">
                    
                    {/* Cột 1: Khách hàng */}
                    <div className="flex gap-3 items-center" style={{ minWidth: '160px' }}>
                      <div style={{ 
                        width: '36px', height: '36px', borderRadius: '12px', 
                        backgroundColor: '#eff6ff', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', color: '#3b82f6', flexShrink: 0 
                      }}>
                        <User size={18} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', margin: 0, whiteSpace: 'nowrap' }}>
                          {booking.guests?.full_name}
                        </p>
                        <p style={{ fontSize: '11px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Phone size={10} /> {booking.guests?.phone}
                        </p>
                      </div>
                    </div>

                    {/* Cột 2: Thông tin Phòng */}
                    <div className="flex items-center" style={{ gap: "8px", minWidth: "140px", flexShrink: 1 }}>
                      <div style={{
                        width: "36px", height: "36px", backgroundColor: "#f5f3ff", 
                        border: "1px solid #ede9fe", borderRadius: "12px", 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <Bed size={18} className="text-purple-600" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "14px", fontWeight: "bold", color: "#111827", margin: 0, whiteSpace: "nowrap" }}>
                          Phòng {booking.rooms?.room_number}
                        </p>
                        <p style={{ fontSize: "10px", color: "#7c3aed", fontWeight: "800", textTransform: "uppercase", margin: 0 }}>
                          {booking.rooms?.room_type}
                        </p>
                      </div>
                    </div>

                    {/* Cột 3: Lịch trình */}
                    <div className="flex items-center" style={{ gap: "8px", minWidth: "140px", flexShrink: 1 }}>
                      <div style={{
                        width: "36px", height: "36px", backgroundColor: "#f0f9ff", 
                        border: "1px solid #e0f2fe", borderRadius: "12px", 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <Calendar size={18} className="text-blue-600" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: "bold", color: "#1f2937", margin: 0, whiteSpace: "nowrap" }}>
                          Thời gian lưu trú
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: "600", color: "#6b7280" }}>
                          <span style={{ whiteSpace: "nowrap" }}>{booking.check_in_date}</span>
                          <span style={{ color: "#d1d5db" }}>›</span>
                          <span style={{ whiteSpace: "nowrap" }}>{booking.check_out_date}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nút hành động */}
                  <div className="flex items-center shrink-0 ml-4">
                    {activeTab === "confirmed" && (
                      <button
                        onClick={() => handleUpdateStatus(booking.id, "checked_in", "Khách nhận phòng")}
                        className="px-8 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all font-bold flex items-center gap-2 active:scale-95"
                      >
                        <LogIn size={20} />
                        <span>Nhận Phòng</span>
                      </button>
                    )}

                    {activeTab === "checked_in" && (
                      <button
                        onClick={() => handleUpdateStatus(booking.id, "checked_out", "")}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                          padding: "12px 24px", minWidth: "fit-content", flexShrink: 0, marginLeft: "auto",
                          backgroundColor: "#e11d48", color: "white", borderRadius: "12px", border: "none",
                          fontWeight: "bold", fontSize: "14px", cursor: "pointer",
                          boxShadow: "0 10px 15px -3px rgba(225, 29, 72, 0.2)", transition: "all 0.1s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#be123c'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e11d48'}
                      >
                        <Receipt size={18} />
                        <span>Thanh toán</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 text-center">
              <Calendar className="text-gray-200 w-16 h-16 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">Hiện không có yêu cầu nào trong danh sách này</p>
            </div>
          )}
        </div>
      </div>

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        bookingId={selectedBookingId}
        onClose={() => { setIsCheckoutModalOpen(false); setSelectedBookingId(null); }}
        onSuccess={() => loadBookings()}
      />
    </div>
  );
}