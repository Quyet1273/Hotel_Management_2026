import { useState, useEffect } from "react";
import {
  X,
  Loader2,
  Receipt,
  Bed,
  Calculator,
  User,
  Phone,
  Calendar,
  Plus,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { CheckoutModal } from "../modal/checkOutModal";

interface BookingDetailProps {
  bookingId: string;
  onClose: () => void;
  onRefresh?: () => void;
}

export function BookingDetail({
  bookingId,
  onClose,
  onRefresh,
}: BookingDetailProps) {
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [showAddService, setShowAddService] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchBookingDetail();
    fetchServices();
  }, [bookingId]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const fetchBookingDetail = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          guests (*),
          rooms (*),
          service_orders (
            id, quantity, total_price,
            services:service_id (name)
          )
        `,
        )
        .eq("id", bookingId)
        .single();

      if (error) throw error;
      setBooking(data);
    } catch (error) {
      console.error("Lỗi tải thông tin:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    const { data } = await supabase.from("services").select("*");
    setAvailableServices(data || []);
  };

  const handleAddService = async () => {
    const service = availableServices.find((s) => s.id === selectedServiceId);
    if (!service) return;

    const { error } = await supabase.from("service_orders").insert({
      booking_id: bookingId,
      service_id: selectedServiceId,
      quantity: quantity,
      total_price: service.price * quantity,
    });

    if (error) {
      alert("Lỗi thêm dịch vụ: " + error.message);
    } else {
      setShowAddService(false);
      setSelectedServiceId("");
      setQuantity(1);
      fetchBookingDetail();
    }
  };

  const calculateFinalTotal = () => {
    if (!booking) return 0;
    const roomCharge = Number(booking.total_amount) || 0;
    const servicesCharge =
      booking.service_orders?.reduce((sum: number, item: any) => {
        return sum + (Number(item.total_price) || 0);
      }, 0) || 0;
    return roomCharge + servicesCharge;
  };

  if (loading || !booking)
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] backdrop-blur-sm">
        <Loader2 className="animate-spin text-white w-12 h-12" />
      </div>
    );

return (
  <div 
    className="fixed inset-0 flex items-center justify-center p-2 sm:p-4" 
    style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)', zIndex: 999 }}
  >
    {/* KHUNG MODAL - Thu nhỏ từ 2xl xuống lg (khoảng 512px) */}
    <div 
      className="w-full max-w-lg flex flex-col relative overflow-hidden shadow-2xl" 
      style={{ 
        backgroundColor: '#ffffff', 
        borderRadius: '24px', // Giảm bo góc một chút cho cân đối
        maxHeight: '90vh' 
      }}
    >
      
      {/* NÚT X THOÁT - Thu nhỏ size icon và padding */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute flex items-center justify-center transition-all"
        style={{ 
          top: '12px', right: '12px', zIndex: 1000, padding: '6px', 
          backgroundColor: '#f43f5e', color: '#ffffff', borderRadius: '12px', 
          border: '2px solid #ffffff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e11d48'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f43f5e'}
        title="Đóng (Esc)"
      >
        <X size={18} strokeWidth={3} />
      </button>

      {/* Header - Giảm padding p-8 xuống p-5 */}
      <div
        className="p-5 text-white shrink-0 relative"
        style={{ 
          backgroundColor: (booking.status?.toLowerCase() === "confirmed" || booking.status?.toLowerCase() === "pending")
            ? "#2563eb" : booking.status?.toLowerCase() === "checked_in" ? "#059669" : "#334155" 
        }}
      >
        <div className="relative z-10">
          <h2 className="flex items-center gap-2" style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
            <Receipt size={22} /> Chi tiết đặt phòng
          </h2>
          <p style={{ fontSize: '9px', opacity: 0.7, fontFamily: 'monospace', marginTop: '2px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Ref: {booking.id}
          </p>
        </div>
      </div>

      {/* Thân Modal - Giảm padding p-8 xuống p-5, giảm gap space-y-8 xuống space-y-5 */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5" style={{ backgroundColor: 'rgba(241, 245, 249, 0.5)' }}>
        
        {/* Trạng thái & Nút Thanh Toán */}
        <div className="flex items-center justify-between" style={{ backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase' }}>Trạng thái:</span>
            <span style={{ padding: '4px 12px', backgroundColor: '#eff6ff', color: '#1d4ed8', borderRadius: '9999px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }}>
              {booking.status}
            </span>
          </div>
          {booking.status?.toLowerCase() === "checked_in" && (
            <button
              onClick={() => setShowCheckoutModal(true)}
              className="transition-all"
              style={{ 
                backgroundColor: '#2563eb', color: '#ffffff', padding: '8px 16px', borderRadius: '12px', 
                fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', border: 'none', cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              Thanh toán
            </button>
          )}
        </div>

        {/* Thông tin - Chỉnh grid-cols-1 cho mobile, md:grid-cols-2 cho máy tính */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Thông tin khách */}
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
            <h3 className="flex items-center gap-2" style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>
              <User size={12} style={{ color: '#3b82f6' }} /> Thông tin khách
            </h3>
            <div className="space-y-2">
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', margin: 0 }}>{booking.guests?.full_name}</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>Điện thoại</p>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#475569', margin: 0 }}>{booking.guests?.phone}</p>
                </div>
                <div>
                  <p style={{ fontSize: '8px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>CCCD</p>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#475569', margin: 0 }}>{booking.guests?.id_number || "---"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Phòng & Lịch */}
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
            <h3 className="flex items-center gap-2" style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>
              <Bed size={12} style={{ color: '#f97316' }} /> Phòng & Lịch
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                 <p style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>P.{booking.rooms?.room_number}</p>
                 <span style={{ fontSize: '8px', fontWeight: 900, color: '#ea580c', backgroundColor: '#fff7ed', padding: '2px 8px', borderRadius: '6px' }}>{booking.rooms?.room_type}</span>
              </div>
              <p className="flex items-center gap-1" style={{ fontSize: '11px', fontWeight: 700, color: '#475569', margin: 0 }}>
                <Calendar size={12} /> {booking.check_in_date} — {booking.check_out_date}
              </p>
            </div>
          </div>
        </div>

        {/* Dịch vụ sử dụng */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="flex items-center gap-2" style={{ fontSize: '9px', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>
              <Calculator size={12} style={{ color: '#3b82f6' }} /> Dịch vụ sử dụng
            </h3>
            {booking.status?.toLowerCase() === "checked_in" && (
              <button onClick={() => setShowAddService(!showAddService)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors border-none cursor-pointer">
                <Plus size={14} />
              </button>
            )}
          </div>

          {/* Form thêm dịch vụ - Gọn hơn */}
          {showAddService && (
            <div className="flex gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 items-center">
              <select 
                className="flex-1 p-2 rounded-lg text-[11px] font-bold border-slate-200 outline-none"
                value={selectedServiceId} 
                onChange={(e) => setSelectedServiceId(e.target.value)}
              >
                <option value="">Chọn dịch vụ...</option>
                {availableServices.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.price.toLocaleString()}đ)</option>
                ))}
              </select>
              <input 
                type="number" min="1" className="w-12 p-2 rounded-lg text-[11px] text-center font-bold border-slate-200"
                value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}
              />
              <button onClick={handleAddService} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase border-none cursor-pointer">Lưu</button>
            </div>
          )}

          {/* Bảng dịch vụ - Thu nhỏ padding các ô */}
          <div className="overflow-hidden bg-white rounded-2xl border border-slate-100">
            <table className="w-full text-left" style={{ fontSize: '11px' }}>
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 pl-4 font-black text-slate-400 uppercase text-[9px]">Tên dịch vụ</th>
                  <th className="p-3 text-center font-black text-slate-400 uppercase text-[9px]">SL</th>
                  <th className="p-3 pr-4 text-right font-black text-slate-400 uppercase text-[9px]">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {booking.service_orders?.map((bs: any) => (
                  <tr key={bs.id} className="border-t border-slate-50">
                    <td className="p-3 pl-4 font-bold text-slate-700">{bs.services?.name}</td>
                    <td className="p-3 text-center font-bold text-slate-500">{bs.quantity}</td>
                    <td className="p-3 pr-4 text-right font-black text-slate-900">{Number(bs.total_price).toLocaleString()}đ</td>
                  </tr>
                ))}
                {(!booking.service_orders || booking.service_orders.length === 0) && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-300 italic text-[11px]">Chưa có phí dịch vụ phát sinh</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer Modal - Giảm padding p-8 xuống p-5 */}
      <div className="p-5 flex justify-between items-center shrink-0 bg-slate-900 text-white">
        <div>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tổng tạm tính</p>
          <p className="text-2xl font-black text-orange-400 leading-none">
            {calculateFinalTotal().toLocaleString()} 
            <span className="text-[10px] text-slate-600 ml-1 font-normal uppercase">VND</span>
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[8px] text-slate-500 font-bold uppercase margin-0">Ngày lập đơn</p>
          <p className="text-[11px] font-mono text-slate-400 margin-0">{new Date(booking.created_at).toLocaleString()}</p>
        </div>
      </div>
    </div>

    {/* Modal Thanh Toán Con */}
    <CheckoutModal
      isOpen={showCheckoutModal}
      bookingId={booking.id}
      onClose={() => setShowCheckoutModal(false)}
      onSuccess={() => {
        setShowCheckoutModal(false);
        fetchBookingDetail();
        if (onRefresh) onRefresh();
      }}
    />
  </div>
);
}