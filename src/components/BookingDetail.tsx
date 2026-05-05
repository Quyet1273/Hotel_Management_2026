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
  CreditCard,
  Clock,
  Tag,
  Globe,
  Mail,
  ShieldCheck,
  Hash,
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

  const fetchBookingDetail = async () => {
    // Nếu không có ID thì tắt loading luôn, đừng bắt nó đợi
    if (!bookingId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          guests (*),
          rooms (*),
          service_orders (
            id, 
            quantity, 
            total_price,
            services:service_id (name, price)
          )
        `) // <-- Đã xóa dấu phẩy thừa ở đây
        .eq("id", bookingId)
        .single();

      if (error) throw error;
      setBooking(data);
    } catch (error: any) {
      // Log chi tiết lỗi để mình còn biết đường mà lần
      console.error("Lỗi tải thông tin chi tiết:", error.message || error);
    } finally {
      // Dù thành công hay lỗi 400 thì cũng phải tắt quay vòng tròn
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

  // Hàm tính số đêm
  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diff > 0 ? diff : 1;
  };
const calculateFinalTotal = () => {
    if (!booking) return 0;
    
    // 1. Tiền phòng: Tính thực tế theo số đêm (An toàn hơn dùng total_amount trong DB)
    const nights = calculateNights(booking.check_in_date, booking.check_out_date);
    const roomPrice = Number(booking.rooms?.price) || 0;
    const roomCharge = roomPrice * nights;
    
    // 2. Tiền dịch vụ (Bao gồm cả Đồ ăn, Nước uống và các loại Phụ phí đã gộp vào đây)
    const servicesCharge = booking.service_orders?.reduce(
      (sum: number, item: any) => sum + (Number(item.total_price) || 0),
      0
    ) || 0;

    // 3. TỔNG CỘNG TẠM TÍNH (Đã bỏ hoàn toàn surchargesCharge vì nó không còn tồn tại)
    return roomCharge + servicesCharge;
  };

  if (loading || !booking)
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] backdrop-blur-sm">
        <Loader2 className="animate-spin text-white w-12 h-12" />
      </div>
    );

  const nights = calculateNights(booking.check_in_date, booking.check_out_date);
  // --- TÍNH TOÁN BÓC TÁCH ĐỂ NÉM XUỐNG THANH MÀU XANH ---
  // 1. Tiền phòng (Dựa trên hàm calculateFinalTotal của ông)
  const roomTotal = Number(booking?.total_amount) || 0;

  // 2. Tổng dịch vụ ăn uống 
  const serviceOrdersTotal = booking?.service_orders?.reduce(
    (sum: number, item: any) => sum + (Number(item.total_price) || 0), 0
  ) || 0;

  // 3. Tổng phụ phí
  const surchargeTotal = booking?.booking_surcharges?.reduce(
    (sum: number, item: any) => sum + (Number(item.price_at_time) * (item.quantity || 1)), 0
  ) || 0;

  // 4. Tổng Dịch vụ hiển thị (Phụ phí + Ăn uống)
  const totalExtraServices = serviceOrdersTotal + surchargeTotal;

  // 5. Tổng tất cả trừ Cọc (Gọi lại hàm của ông cho chắc cốp)
  const grandTotal = calculateFinalTotal() - (Number(booking?.deposit_amount) || 0);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[999] bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-6xl bg-white rounded-[2.5rem] flex flex-col relative overflow-hidden shadow-2xl max-h-[95vh]">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 z-20 p-2 bg-red-500 hover:bg-red-600 text-white rounded-2xl transition-all shadow-lg active:scale-90"
        >
          <X size={24} strokeWidth={3} />
        </button>

        {/* HEADER: PHONG CÁCH TƯƠI SÁNG & HIỆN ĐẠI */}
        <div className="bg-[#D1F4FA] p-10 pb-16 relative overflow-hidden shrink-0">
          {/* Họa tiết trang trí tạo độ "chill" cho form */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-400/10 rounded-full"></div>
          <div className="absolute top-10 -right-5 w-20 h-20 bg-white/40 rounded-full blur-xl"></div>

          <div className="flex items-center gap-5 relative z-10">
            {/* Box Icon: Màu xanh đậm nổi bật trên nền sáng */}
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200 ring-4 ring-white/50">
              <Receipt size={32} className="text-white" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                Chi Tiết Hồ Sơ Đặt Phòng
              </h2>

              <div className="flex flex-wrap items-center gap-3 mt-2">
                {/* Mã đơn: Màu xanh nhẹ nhàng */}
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-white/60 px-3 py-1 rounded-lg border border-blue-100 shadow-sm">
                  Ref: {booking.id.slice(0, 12)}
                </span>

                {/* Trạng thái: Màu rực rỡ để dễ nhận diện */}
                <span
                  className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-md ${
                    booking.status === "checked_in"
                      ? "bg-emerald-500 text-white shadow-emerald-100"
                      : booking.status === "confirmed"
                        ? "bg-blue-500 text-white shadow-blue-100"
                        : "bg-slate-500 text-white shadow-slate-100"
                  }`}
                >
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                  {booking.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* THÂN MODAL - SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-8 -mt-6 bg-gray-50 rounded-t-[2.5rem] space-y-8">
          {/* HÀNG 1: KHÁCH HÀNG & PHÒNG */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CARD: THÔNG TIN KHÁCH */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-5 text-blue-600">
                <User size={18} strokeWidth={3} />
                <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Thông tin khách hàng
                </span>
              </div>
              <div className="space-y-4">
                {/* Tên khách hàng to và rõ */}
                <p className="text-xl font-black text-gray-900 leading-none">
                  {booking.guests?.full_name}
                </p>

                <div className="grid grid-cols-1 gap-3 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Phone size={14} className="text-blue-500" />
                    <span className="text-sm font-bold">
                      {booking.guests?.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <ShieldCheck size={14} className="text-blue-500" />
                    <span className="text-sm font-bold">
                      CCCD: {booking.guests?.id_number || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Mail size={14} className="text-blue-500" />
                    <span className="text-sm font-bold">
                      {booking.guests?.email || "Chưa cập nhật email"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Globe size={14} className="text-blue-500" />
                    <span className="text-sm font-bold">
                      {booking.guests?.nationality || "Việt Nam"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD: THÔNG TIN PHÒNG */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-5 text-orange-500">
                <Bed size={18} strokeWidth={3} />
                <span className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Chi tiết phòng
                </span>
              </div>
              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <div>
                    {/* Số phòng cực to làm điểm nhấn */}
                    <p className="text-4xl font-black text-gray-900">
                      P.{booking.rooms?.room_number}
                    </p>
                    <span className="inline-block mt-2 text-xs font-black text-orange-600 bg-orange-50 px-4 py-1.5 rounded-full uppercase">
                      {booking.rooms?.room_type}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">
                      Giá phòng
                    </p>
                    <p className="text-lg font-black text-gray-800">
                      {Number(booking.rooms?.price).toLocaleString()}đ
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 space-y-2">
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-600">
                    <Clock size={16} className="text-orange-500" />
                    <span>{nights} đêm</span>
                  </div>
                  <p className="text-sm text-gray-500 font-medium pl-7">
                    {new Date(booking.check_in_date).toLocaleDateString(
                      "vi-VN",
                    )}{" "}
                    —{" "}
                    {new Date(booking.check_out_date).toLocaleDateString(
                      "vi-VN",
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>


          {/* ================= DỊCH VỤ SỬ DỤNG ================= */}
          <div className="bg-white p-7 rounded-[2.5rem] shadow-sm border border-gray-100 mt-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-indigo-500">
                <Calculator size={20} strokeWidth={3} />
                <span className="text-sm font-black uppercase tracking-wider text-gray-400">
                  Dịch vụ bổ sung
                </span>
              </div>
              
              {/* Nút cộng dịch vụ của ông (GIỮ NGUYÊN) */}
              {booking?.status === "checked_in" && (
                <button
                  onClick={() => setShowAddService(!showAddService)}
                  className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  <Plus size={20} strokeWidth={3} />
                </button>
              )}
            </div>

            {/* Form chọn thêm dịch vụ (GIỮ NGUYÊN) */}
            {showAddService && (
              <div className="flex gap-3 p-5 mb-6 bg-indigo-50/50 rounded-[1.5rem] border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                <select
                  className="flex-1 p-3 rounded-xl text-sm font-bold border-none outline-none focus:ring-2 ring-indigo-500 shadow-inner"
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                >
                  <option value="">Chọn dịch vụ...</option>
                  {availableServices?.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.price.toLocaleString()}đ)
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  className="w-20 p-3 rounded-xl text-sm text-center font-bold outline-none shadow-inner"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
                <button
                  onClick={handleAddService}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md active:scale-95 transition-transform"
                >
                  Thêm
                </button>
              </div>
            )}

            <div className="space-y-3">
              {/* Header bảng dịch vụ */}
              <div className="grid grid-cols-4 px-4 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                <div className="col-span-2">Tên Dịch vụ</div>
                <div className="text-center">Số lượng</div>
                <div className="text-right">Thành tiền</div>
              </div>

              {/* 1. MẢNG PHỤ PHÍ (Thêm mới - Màu cam) */}
              {booking?.booking_surcharges?.map((bs: any, index: number) => (
                <div
                  key={`surcharge-${index}`}
                  className="grid grid-cols-4 px-4 py-4 bg-orange-50/50 rounded-2xl items-center border border-transparent hover:border-orange-100 transition-colors"
                >
                  <div className="col-span-2 text-sm font-black text-orange-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                    {bs.surcharges?.name || 'Phụ phí'}
                  </div>
                  <div className="text-center text-sm font-bold text-orange-400/80">
                    x{bs.quantity}
                  </div>
                  <div className="text-right text-sm font-black text-orange-600">
                    {(Number(bs.price_at_time) * (bs.quantity || 1)).toLocaleString()}đ
                  </div>
                </div>
              ))}

              {/* 2. MẢNG DỊCH VỤ ĂN UỐNG CỦA ÔNG (Giữ nguyên style) */}
              {booking?.service_orders?.map((bs: any, index: number) => (
                <div
                  key={`service-${index}`}
                  className="grid grid-cols-4 px-4 py-4 bg-gray-50 rounded-2xl items-center border border-transparent hover:border-indigo-100 transition-colors"
                >
                  <div className="col-span-2 text-sm font-black text-gray-700 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    {bs.services?.name || 'Dịch vụ'}
                  </div>
                  <div className="text-center text-sm font-bold text-gray-400">
                    x{bs.quantity}
                  </div>
                  <div className="text-right text-sm font-black text-indigo-600">
                    {Number(bs.total_price).toLocaleString()}đ
                  </div>
                </div>
              ))}

              {/* 3. HIỂN THỊ TRỐNG KHI KHÔNG CÓ CẢ 2 */}
              {(!booking?.service_orders?.length && !booking?.booking_surcharges?.length) && (
                <div className="text-center py-10 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                  <p className="text-sm text-gray-400 italic">
                    Khách hàng chưa sử dụng thêm dịch vụ nào
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

       {/* FOOTER - Thiết kế lại để phân cấp thông tin rõ ràng */}
<div className="bg-slate-900 text-white px-10 py-6 flex flex-row items-center justify-between shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] relative z-20">
  
  {/* NHÓM 1: CHI TIẾT CÁC KHOẢN (Bên trái) */}
  <div className="flex items-center divide-x divide-slate-700">
    {/* Tiền phòng */}
    <div className="px-8 first:pl-0 flex flex-col gap-1">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        Tiền phòng
      </span>
      <span className="text-xl font-bold font-mono text-white">
        {(Number(booking.total_amount) || 0).toLocaleString()}đ
      </span>
    </div>

    {/* Dịch vụ */}
    <div className="px-8 flex flex-col gap-1">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        Dịch vụ
      </span>
      <span className="text-xl font-bold font-mono text-indigo-400">
        {+(booking.service_orders?.reduce(
          (sum: number, item: any) => sum + (Number(item.total_price) || 0),
          0
        ) || 0).toLocaleString()}đ
      </span>
    </div>

    {/* Đã đặt cọc */}
    <div className="px-8 flex flex-col gap-1">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
        Đã đặt cọc
      </span>
      <span className="text-xl font-bold font-mono text-orange-400">
        -{(booking.deposit_amount || 0).toLocaleString()}đ
      </span>
    </div>
  </div>

  {/* NHÓM 2: TỔNG THANH TOÁN (Bên phải - Điểm nhấn) */}
  <div className="flex items-center gap-10">
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300">
          Còn lại phải thu
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-black text-yellow-400 tracking-tighter">
          {(calculateFinalTotal() - (booking.deposit_amount || 0)).toLocaleString()}
        </span>
        <span className="text-lg font-black text-yellow-400/60 uppercase">VND</span>
      </div>
    </div>

    {/* Nút thanh toán nổi bật */}
    {booking.status === "checked_in" && (
      <button
        onClick={() => setShowCheckoutModal(true)}
        className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 overflow-hidden"
      >
        <div className="relative z-10 flex items-center gap-3">
          <CreditCard size={20} className="group-hover:rotate-12 transition-transform" />
          <span className="text-sm font-black uppercase tracking-widest">Thanh toán ngay</span>
        </div>
        {/* Hiệu ứng bóng đổ chạy qua nút */}
        <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-white/20 skew-x-[-30deg] group-hover:left-[150%] transition-all duration-700" />
      </button>
    )}
  </div>
</div>
      </div>

      {/* MODAL THANH TOÁN */}
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
