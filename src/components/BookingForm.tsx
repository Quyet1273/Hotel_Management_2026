import { useState, useEffect } from "react";
import { toast } from "sonner"; // Dùng trực tiếp từ thư viện
import {
  X,
  Search,
  User,
  Calendar,
  Home,
  AlertCircle,
  CreditCard,
  Check,
  Loader2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { bookingService } from "../services/bookingService";

interface BookingFormProps {
  bookingId?: string;
  initialRoom?: any;
  onClose: () => void;
  onSave: () => void;
}

export function BookingForm({
  bookingId,
  initialRoom,
  onClose,
  onSave,
}: BookingFormProps) {
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [showRoomSelection, setShowRoomSelection] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const now = new Date().toLocaleString("sv-SE").slice(0, 16);

  // States cho tính năng tìm kiếm khách hàng
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState("confirmed");

  const [formData, setFormData] = useState({
    // --- Thông tin Khách hàng ---
    guestId: "",
    full_name: "",
    phone: "",
    id_number: "",
    email: "",
    address: "",
    nationality: "Việt Nam",

    // --- Thông tin Đặt phòng ---
    checkIn: "",
    checkOut: "",
    guests: 1,
    roomType: "",
    roomId: "",
    payment_method: "Tiền mặt",
    deposit_amount: 0,
    specialRequests: "",

    // --- MỚI: BỔ SUNG ĐỂ TÍNH TOÁN "NHẢY SỐ" TRÊN UI ---
    surcharge_total: 0, // Tổng tiền phụ phí (để hiện lên cho lễ tân thấy)
    discount_value: 0, // Giá trị giảm giá (nếu có)
    discount_type: "amount", // "percent" hoặc "amount"
    total_amount: 0, // Tổng cuối cùng (Phòng + Phí + Thuế - Giảm giá)
    actual_received: 0, // Thực thu tại quầy (Total - Cọc)
  });
  // useEffect(() => {
  //   console.log("Tab đã đổi sang:", activeTab, " -> Đang tải lại dữ liệu mới nhất...");
  //   fetchBookings();
  // }, [activeTab]);

  // 1. Khởi tạo dữ liệu
  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await supabase.from("rooms").select("*");
      if (data) setRooms(data);
    };
    fetchRooms();
    const now = new Date().toISOString().slice(0, 16);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    setFormData((prev) => ({
      ...prev,
      checkIn: today.toISOString().split("T")[0] + "T14:00",
      checkOut: tomorrow.toISOString().split("T")[0] + "T12:00",
    }));
  }, []);
  useEffect(() => {
    if (initialRoom) {
      setFormData((prev) => ({
        ...prev,
        roomType: initialRoom.room_type,
        roomId: initialRoom.id,
      }));
      // Nếu muốn hiện luôn danh sách phòng đã chọn
      setAvailableRooms([initialRoom]);
      setShowRoomSelection(true);
    }
  }, [initialRoom]);
  // 2. Logic tìm kiếm khách hàng
  useEffect(() => {
    const searchGuest = async () => {
      if (searchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      const { data } = await supabase
        .from("guests")
        .select("*")
        .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(5);

      setSearchResults(data || []);
    };

    const timer = setTimeout(searchGuest, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectGuest = (guest: any) => {
    setFormData({
      ...formData,
      guestId: guest.id,
      full_name: guest.full_name,
      phone: guest.phone,
      id_number: guest.id_number,
      email: guest.email || "",
      address: guest.address || "",
      nationality: guest.nationality || "Việt Nam",
    });
    setSearchTerm(guest.full_name);
    setShowResults(false);
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 1;
  };

  const checkAvailableRooms = async () => {
    if (!formData.checkIn || !formData.checkOut || !formData.roomType) {
      toast.error("Điền đủ ngày giờ và loại phòng đã đại ca!");
      return;
    }
    setLoading(true);

    try {
      // 1. Lọc danh sách phòng theo loại
      const roomsOfType = rooms.filter(
        (r) => r.room_type === formData.roomType,
      );

      // 2. Chạy kiểm tra đồng thời tất cả các phòng
      const checkPromises = roomsOfType.map(async (room) => {
        const res = await bookingService.checkRoomAvailability(
          room.id,
          formData.checkIn, // Gửi chuỗi gốc (VD: "2026-05-01T14:00") để tránh lệch múi giờ
          formData.checkOut,
        );
        if (res.isAvailable) return room;
        return null;
      });

      const results = await Promise.all(checkPromises);
      const filteredAvailable = results.filter((r) => r !== null);

      setAvailableRooms(filteredAvailable);
      setShowRoomSelection(true);

      if (filteredAvailable.length === 0) {
        toast("Hết sạch phòng này trong khoảng thời gian này!", { icon: "⚠️" });
      } else {
        toast.success(`Ngon! Có ${filteredAvailable.length} phòng sẵn sàng.`);
      }
    } catch (error: any) {
      console.error("Lỗi checkAvailableRooms:", error);
      toast.error("Hệ thống check phòng đang trục trặc!");
    } finally {
      setLoading(false);
    }
  };
  // 1.  hàm để định dạng ngày giờ cho dễ đọc
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Kiểm tra đầu vào
    if (!formData.roomId) {
      toast.error("Chưa chọn phòng");
      return;
    }

    const now = new Date();
    const checkInDate = new Date(formData.checkIn);
    const checkOutDate = new Date(formData.checkOut);

    if (checkInDate < now) {
      toast.error("Ngày này qua rồi");
      return;
    }

    if (checkOutDate <= checkInDate) {
      toast.error("Ngày trả phòng phải sau ngày nhận!");
      return;
    }

    setLoading(true);
    console.log(
      "%c--- TIẾN HÀNH NỔ ĐƠN ĐẶT PHÒNG ---",
      "color: #3b82f6; font-weight: bold",
    );

    try {
      // BƯỚC A: Kiểm tra trùng lịch lần cuối
      const availability = await bookingService.checkRoomAvailability(
        formData.roomId,
        formData.checkIn,
        formData.checkOut,
      );

      if (!availability.isAvailable) {
        const conflict = availability.conflicts?.[0];
        if (conflict) {
          toast.error(
            `Phòng bận từ ${formatTime(conflict.check_in_date)} đến ${formatTime(conflict.check_out_date)}.`,
            { duration: 5000 },
          );
        } else {
          toast.error("Phòng này không sẵn sàng!");
        }
        setLoading(false);
        return;
      }

      // BƯỚC B: Upsert khách hàng
      const { data: guestData, error: guestError } = await supabase
        .from("guests")
        .upsert(
          {
            full_name: formData.full_name,
            phone: formData.phone,
            id_number: formData.id_number,
            nationality: formData.nationality,
            email: formData.email,
            address: formData.address,
          },
          { onConflict: "phone" },
        )
        .select()
        .single();

      if (guestError)
        throw new Error(`Lỗi thông tin khách: ${guestError.message}`);

      // BƯỚC C: LOGIC TÍNH TOÁN (CHỈ TÍNH PHÒNG + THUẾ)
      const selectedRoom = rooms.find((r) => r.id === formData.roomId);
      const nights = calculateNights(formData.checkIn, formData.checkOut);

      // 1. Tiền phòng gốc
      const roomCharge = selectedRoom ? Number(selectedRoom.price) * nights : 0;

      // 2. Tạm tính & Thuế VAT 10% (Gỡ bỏ surchargeTotal)
      const subTotal = roomCharge;
      const taxTotal = Math.round(subTotal * 0.1);

      // 3. Tổng hóa đơn và Thực thu
      const grandTotal = subTotal + taxTotal;
      const deposit = Number(formData.deposit_amount) || 0;
      const actualReceived = grandTotal - deposit;

      // BƯỚC D: Tạo đơn đặt phòng (Chỉ truyền 1 tham số duy nhất)
      const bookingPayload = {
        guest_id: guestData.id,
        room_id: formData.roomId,
        check_in_date: formData.checkIn,
        check_out_date: formData.checkOut,
        status: "confirmed",
        total_amount: grandTotal,
        actual_received: actualReceived,
        deposit_amount: deposit,
        notes: formData.specialRequests,
      };

      // Gọi API createBooking (Đã lược bỏ tham số selectedSurcharges)
      const result = await bookingService.createBooking(bookingPayload);

      if (result.success) {
        toast.success("Đã đặt phòng thành công!");
        onSave();
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error(
        "%c LỖI THỰC THI CHUNG:",
        "color: red; font-weight: bold",
        error,
      );
      toast.error(`Đặt phòng lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  // --- TÍNH TOÁN REAL-TIME ---
  const currentNights = calculateNights(formData.checkIn, formData.checkOut);
  const currentRoomPrice =
    rooms.find((r) => r.id === formData.roomId)?.price || 0;

  // Tổng hóa đơn
  const currentGrandTotal = currentRoomPrice * currentNights;
  const currentRemain = currentGrandTotal - (formData.deposit_amount || 0);
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      {/* Điều chỉnh độ rộng vừa phải (max-w-6xl) để form cân đối */}
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col border border-white/10">
        {/* 1. Header cố định */}
        <div className="bg-blue-600 text-white p-5 px-8 flex items-center justify-between shadow-md">
          <div>
            <h2 className="text-xl font-black uppercase tracking-widest">
              {bookingId ? "Chỉnh Sửa Đặt Phòng" : "Tạo Đặt Phòng Mới"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* 2. Nội dung cuộn (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-gray-50/30">
          {/* SECTION: THÔNG TIN KHÁCH HÀNG - 3 CỘT GỌN GÀNG */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-blue-600 border-b pb-2">
              <User size={20} className="font-bold" />
              <h3 className="font-black text-sm uppercase tracking-wider">
                Thông tin khách hàng
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cột 1: Tên & Tìm kiếm */}
              <div className="relative">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                  Họ và tên *
                </label>
                <div className="relative flex items-center mt-1">
                  <input
                    placeholder="Tìm hoặc nhập tên..."
                    className="w-full pl-4 pr-10 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition-all font-bold text-sm"
                    value={formData.full_name}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowResults(true);
                      setFormData({
                        ...formData,
                        full_name: e.target.value,
                        guestId: "",
                      });
                    }}
                    onFocus={() => setShowResults(true)}
                  />
                  <Search className="absolute right-3 w-4 h-4 text-blue-600" />
                </div>
                {showResults && searchResults.length > 0 && (
                  <div className="absolute w-full mt-1 bg-white border-2 border-blue-100 rounded-xl shadow-2xl z-[100] max-h-48 overflow-y-auto">
                    {searchResults.map((g) => (
                      <div
                        key={g.id}
                        className="p-2.5 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex justify-between items-center group"
                        onClick={() => handleSelectGuest(g)}
                      >
                        <div>
                          <p className="font-bold text-sm text-gray-900 group-hover:text-blue-700">
                            {g.full_name}
                          </p>
                          <p className="text-[10px] text-gray-500">{g.phone}</p>
                        </div>
                        <Check className="w-3 h-3 text-blue-600" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cột 2: SĐT */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                  Số điện thoại *
                </label>
                <input
                  required
                  placeholder="Số điện thoại"
                  className="w-full mt-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none font-bold text-sm"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              {/* Cột 3: CCCD */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                  CCCD / Passport *
                </label>
                <input
                  required
                  placeholder="Số giấy tờ"
                  className="w-full mt-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none font-bold text-sm"
                  value={formData.id_number}
                  onChange={(e) =>
                    setFormData({ ...formData, id_number: e.target.value })
                  }
                />
              </div>

              {/* Hàng tiếp theo */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                  Quốc tịch
                </label>
                <input
                  placeholder="Việt Nam..."
                  className="w-full mt-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none font-bold text-sm"
                  value={formData.nationality}
                  onChange={(e) =>
                    setFormData({ ...formData, nationality: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  className="w-full mt-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none font-bold text-sm"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                  Địa chỉ
                </label>
                <input
                  placeholder="Số nhà, tên đường..."
                  className="w-full mt-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none font-bold text-sm"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
            </div>
          </section>

          {/* SECTION: THỜI GIAN & PHÒNG - TỐI ƯU CHIỀU CAO */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-blue-600 border-b pb-2">
              <Calendar size={20} />
              <h3 className="font-black text-sm uppercase tracking-wider">
                Thời gian & Loại phòng
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                  Nhận phòng
                </label>
                <input
                  type="datetime-local"
                  className="w-full mt-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500"
                  value={formData.checkIn}
                  onChange={(e) =>
                    setFormData({ ...formData, checkIn: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                  Trả phòng
                </label>
                <input
                  type="datetime-local"
                  className="w-full mt-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500"
                  value={formData.checkOut}
                  onChange={(e) =>
                    setFormData({ ...formData, checkOut: e.target.value })
                  }
                />
              </div>

              <div className="flex gap-2">
                <select
                  className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500 cursor-pointer"
                  value={formData.roomType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      roomType: e.target.value,
                      roomId: "",
                    })
                  }
                >
                  <option value="">Chọn loại...</option>
                  <option value="single">Phòng Đơn</option>
                  <option value="double">Phòng Đôi</option>
                  <option value="suite">Phòng Suite</option>
                </select>
                <button
                  type="button"
                  onClick={checkAvailableRooms}
                  className="bg-green-600 text-white px-4 rounded-xl font-black text-[10px] uppercase hover:bg-green-700 transition-all flex items-center gap-2 shadow-md"
                >
                  {loading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Search size={14} />
                  )}{" "}
                  Check
                </button>
              </div>
            </div>

            {showRoomSelection && (
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2 p-4 bg-white rounded-2xl border-2 border-dashed border-gray-100">
                {availableRooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, roomId: room.id })
                    }
                    className={`p-2 border-2 rounded-lg transition-all ${formData.roomId === room.id ? "border-blue-600 bg-blue-50 shadow-sm scale-95" : "bg-white border-gray-100 hover:border-blue-200"}`}
                  >
                    <p className="font-black text-xs text-center">
                      P.{room.room_number}
                    </p>
                    <p className="text-[9px] text-center text-blue-600 font-bold">
                      {Number(room.price).toLocaleString()}đ
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>
          {/* SECTION: PHỤ PHÍ & GHI CHÚ */}
          {formData.roomId && (
            <section className="space-y-4">
             
              <div className="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm flex flex-col mt-4">
                <div className="flex items-center gap-2 text-gray-400 mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Ghi chú của khách (Note)
                  </span>
                </div>
                <textarea
                  className="w-full min-h-[100px] p-4 border-2 border-gray-50 bg-gray-50/30 rounded-2xl outline-none focus:border-blue-500 focus:bg-white font-medium text-sm text-gray-700 resize-none transition-all"
                  placeholder="Ví dụ: Khách yêu cầu tầng cao, phòng yên tĩnh, hoặc các yêu cầu đặc biệt khác..."
                  value={formData.specialRequests}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      specialRequests: e.target.value,
                    })
                  }
                />
              </div>
            </section>
          )}

          {/* SECTION: THANH TOÁN - GỌN GÀNG & TÍCH HỢP HÌNH THỨC */}
          {formData.roomId && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-blue-600 border-b pb-1.5">
                <CreditCard size={18} />
                <h3 className="font-black text-xs uppercase tracking-wider">
                  Tạm tính & Đặt cọc
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
                {/* KHỐI NHẬP LIỆU: Tiền cọc & Phương thức (Chiếm 5/12) */}
                <div className="md:col-span-5 bg-orange-50/50 p-3 rounded-xl border border-orange-100 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black text-orange-700 uppercase ml-1 mb-1 block">
                      Tiền đặt cọc (VNĐ)
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-1.5 border border-orange-200 rounded-lg outline-none focus:border-orange-500 font-bold text-sm text-orange-600 shadow-sm"
                      placeholder="0"
                      value={formData.deposit_amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          deposit_amount: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-orange-700 uppercase ml-1 mb-1 block">
                      Hình thức
                    </label>
                    <select
                      className="w-full px-2 py-1.5 border border-orange-200 rounded-lg outline-none focus:border-orange-500 font-bold text-xs text-orange-700 bg-white cursor-pointer"
                      value={formData.payment_method || "Tiền mặt"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payment_method: e.target.value,
                        })
                      }
                    >
                      <option value="Tiền mặt">💵 Tiền mặt</option>
                      <option value="Chuyển khoản">🏦 Chuyển khoản</option>
                      <option value="Quẹt thẻ">💳 Quẹt thẻ</option>
                    </select>
                  </div>
                </div>

                {/* KHỐI TỔNG KẾT: Ép mỏng chiều dọc (Chiếm 7/12) */}
                <div className="md:col-span-7 bg-blue-600 rounded-xl p-3 text-white flex items-center justify-between gap-4 shadow-lg">
                  <div className="flex-1 border-r border-blue-400/40 pr-3">
                    <p className="text-[9px] text-blue-100 font-bold uppercase italic leading-tight">
                      Tổng (
                      {calculateNights(formData.checkIn, formData.checkOut)}{" "}
                      đêm)
                    </p>
                    <p className="text-base font-black">
                      {(
                        (rooms.find((r) => r.id === formData.roomId)?.price ||
                          0) *
                        calculateNights(formData.checkIn, formData.checkOut)
                      ).toLocaleString()}
                      đ
                    </p>
                  </div>

                  <div className="flex-1 border-r border-blue-400/40 pr-3">
                    <p className="text-[9px] text-orange-300 font-bold uppercase italic leading-tight">
                      Khấu trừ cọc
                    </p>
                    <p className="text-base font-black text-orange-300">
                      -{(formData.deposit_amount || 0).toLocaleString()}đ
                    </p>
                  </div>

                  <div className="flex-1 text-center bg-white/10 py-1.5 rounded-lg border border-white/20">
                    <p className="text-[8px] font-black uppercase text-blue-50">
                      Còn thu
                    </p>
                    <p className="text-lg font-black text-yellow-300">
                      {(
                        (rooms.find((r) => r.id === formData.roomId)?.price ||
                          0) *
                          calculateNights(formData.checkIn, formData.checkOut) -
                        (formData.deposit_amount || 0)
                      ).toLocaleString()}
                      đ
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* 3. Footer cố định */}
        <div className="p-5 px-8 border-t bg-white flex gap-4">
          <button
            type="submit"
            form="booking-form" // Nếu bạn bọc form bên ngoài, hoặc dùng onSubmit của form
            onClick={handleSubmit}
            disabled={loading || !formData.roomId}
            className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-black text-sm uppercase hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg active:scale-95"
          >
            {loading ? "Đang xử lý..." : "Xác Nhận Đặt Phòng"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3.5 bg-gray-100 text-gray-500 rounded-xl font-black text-xs uppercase hover:bg-gray-200 transition-all"
          >
            Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  );
}
