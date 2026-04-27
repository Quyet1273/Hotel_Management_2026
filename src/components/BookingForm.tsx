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
    // --- Thông tin Khách hàng (Đầy đủ để lưu vào bảng guests) ---
    guestId: "", // UUID nếu là khách cũ, để trống nếu là khách mới
    full_name: "", // Đổi guestName thành full_name cho khớp với bảng guests
    phone: "", // Đổi guestPhone thành phone
    id_number: "", // Đổi guestIdNumber thành id_number
    email: "", // MỚI: Lấy từ GuestForm qua
    address: "", // MỚI: Lấy từ GuestForm qua
    nationality: "Việt Nam",
    // --- Thông tin Đặt phòng (Để lưu vào bảng bookings) ---
    checkIn: "",
    checkOut: "",
    guests: 1, // Số lượng người ở
    roomType: "",
    roomId: "",
    deposit_amount: 0, // Dùng deposit_amount cho khớp với Interface trong Service
    specialRequests: "", // Chính là cái notes trong database
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
      "%c--- TIẾN HÀNH NỔ ĐƠN ---",
      "color: #3b82f6; font-weight: bold",
    );

    try {
      // BƯỚC A: Kiểm tra trùng lịch lần cuối (Phòng ngừa có người đặt nhanh hơn)
      const availability = await bookingService.checkRoomAvailability(
        formData.roomId,
        formData.checkIn,
        formData.checkOut,
      );

      if (!availability.isAvailable) {
        // LẤY ĐƠN TRÙNG ĐẦU TIÊN ĐỂ THÔNG BÁO
        const conflict = availability.conflicts?.[0];

        if (conflict) {
          // Hiện thông báo chi tiết: Phòng bận từ [Giờ] [Ngày] đến [Giờ] [Ngày]
          toast.error(
            `Phòng này đã có lịch từ ${formatTime(conflict.check_in_date)} đến ${formatTime(conflict.check_out_date)}.`,
            {
              duration: 5000, // Cho hiện lâu tí (5 giây) để lễ tân kịp đọc
              style: {
                border: "1px solid #ef4444",
                padding: "16px",
                color: "#b91c1c",
              },
            },
          );
        } else {
          toast.error("Phòng này không sẵn sàng trong khoảng thời gian này!");
        }

        setLoading(false);
        return;
      }

      // BƯỚC B: Upsert khách hàng (Lưu hoặc cập nhật thông tin)
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
          { onConflict: "phone" }, // Nếu trùng số điện thoại thì cập nhật thông tin khách
        )
        .select()
        .single();

      if (guestError) {
        console.error("%c [LỖI KHÁCH HÀNG]:", "color: red;", guestError);
        throw new Error(`Lỗi thông tin khách: ${guestError.message}`);
      }

      // BƯỚC C: Tính tổng tiền
      const selectedRoom = rooms.find((r) => r.id === formData.roomId);
      const nights = calculateNights(formData.checkIn, formData.checkOut);
      const totalAmount = selectedRoom
        ? Number(selectedRoom.price) * nights
        : 0;

      // BƯỚC D: Tạo đơn đặt phòng - DÙNG CHUỖI GỐC (BỎ ISOString)
      const bookingPayload = {
        guest_id: guestData.id,
        room_id: formData.roomId,
        check_in_date: formData.checkIn,
        check_out_date: formData.checkOut,
        status: "confirmed",
        total_amount: totalAmount,
        deposit_amount: Number(formData.deposit_amount) || 0,
        notes: formData.specialRequests,
      };

      const result = await bookingService.createBooking(bookingPayload);

      if (result.success) {
        toast.success("Đã đặt phòng ");
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {bookingId ? "Chỉnh Sửa" : "Tạo Đặt Phòng Mới"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto max-h-[80vh]"
        >
          {/* 1. THÔNG TIN KHÁCH HÀNG (Tích hợp Tìm & Thêm mới) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <User className="text-blue-600 w-5 h-5" />
              <h3 className="font-bold text-gray-800 uppercase tracking-tight">
                Thông tin Khách hàng
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tên & Tìm kiếm */}
              <div className="relative">
                <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">
                  Họ và tên *
                </label>
                <div className="relative flex items-center mt-1">
                  <input
                    placeholder="Tìm khách cũ hoặc nhập tên khách mới..."
                    className="w-full pl-4 pr-12 py-3 border-2 rounded-xl focus:border-blue-500 outline-none transition-all"
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
                  <div className="absolute right-4">
                    <Search className="w-5 h-5 text-blue-600" />
                  </div>
                </div>

                {/* Dropdown gợi ý SearchResults */}
                {showResults && searchResults.length > 0 && (
                  <div className="absolute w-full mt-1 bg-white border border-blue-100 rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto">
                    {searchResults.map((g) => (
                      <div
                        key={g.id}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex justify-between items-center group"
                        onClick={() => handleSelectGuest(g)}
                      >
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-blue-700">
                            {g.full_name}
                          </p>
                          <p className="text-xs text-gray-500">{g.phone}</p>
                        </div>
                        <Check className="w-4 h-4 text-blue-600" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Số điện thoại */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">
                  Số điện thoại *
                </label>
                <input
                  placeholder="Số điện thoại dùng để định danh"
                  required
                  className="w-full mt-1 px-4 py-3 border-2 rounded-xl focus:border-blue-500 outline-none"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              {/* CCCD */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">
                  CCCD / Passport *
                </label>
                <input
                  placeholder="Số giấy tờ tùy thân"
                  required
                  className="w-full mt-1 px-4 py-3 border-2 rounded-xl focus:border-blue-500 outline-none"
                  value={formData.id_number}
                  onChange={(e) =>
                    setFormData({ ...formData, id_number: e.target.value })
                  }
                />
              </div>

              {/* Quốc tịch */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">
                  Quốc tịch
                </label>
                <input
                  placeholder="Việt Nam / Khác..."
                  className="w-full mt-1 px-4 py-3 border-2 rounded-xl focus:border-blue-500 outline-none"
                  value={formData.nationality}
                  onChange={(e) =>
                    setFormData({ ...formData, nationality: e.target.value })
                  }
                />
              </div>

              {/* Email (Bổ sung từ GuestForm) */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="khachhang@gmail.com"
                  className="w-full mt-1 px-4 py-3 border-2 rounded-xl focus:border-blue-500 outline-none"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              {/* Địa chỉ (Bổ sung từ GuestForm) */}
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">
                  Địa chỉ
                </label>
                <input
                  placeholder="Nhập địa chỉ thường trú"
                  className="w-full mt-1 px-4 py-3 border-2 rounded-xl focus:border-blue-500 outline-none"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* 2. THỜI GIAN & LOẠI PHÒNG */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Calendar className="text-blue-600 w-5 h-5" />
              <h3 className="font-bold text-gray-800 uppercase tracking-tight">
                Thời gian & Loại phòng
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">
                  Ngày nhận phòng
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-3 border-2 rounded-xl"
                  value={formData.checkIn}
                  onChange={(e) =>
                    setFormData({ ...formData, checkIn: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase ml-1">
                  Ngày trả phòng
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-3 border-2 rounded-xl"
                  value={formData.checkOut}
                  onChange={(e) =>
                    setFormData({ ...formData, checkOut: e.target.value })
                  }
                />
              </div>
              <select
                className="px-4 py-3 border-2 rounded-xl outline-none focus:border-blue-500"
                value={formData.roomType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    roomType: e.target.value,
                    roomId: "",
                  })
                }
              >
                <option value="">Chọn loại phòng</option>
                <option value="single">Phòng Đơn</option>
                <option value="double">Phòng Đôi</option>
                <option value="suite">Phòng Suite</option>
              </select>
              <button
                type="button"
                onClick={checkAvailableRooms}
                className="bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors py-3 shadow-md"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}{" "}
                Kiểm tra phòng trống
              </button>
            </div>
          </div>

          {/* 3. LỰA CHỌN PHÒNG */}
          {showRoomSelection && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              {availableRooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, roomId: room.id })}
                  className={`p-4 border-2 rounded-xl transition-all ${formData.roomId === room.id ? "border-blue-600 bg-blue-100 shadow-md scale-95" : "bg-white border-gray-100 hover:border-blue-300"}`}
                >
                  <Home
                    className={`mx-auto mb-1 ${formData.roomId === room.id ? "text-blue-600" : "text-gray-400"}`}
                  />
                  <p className="font-black text-center">P.{room.room_number}</p>
                  <p className="text-[11px] text-center text-gray-500">
                    {Number(room.price).toLocaleString()}đ/đêm
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* 4. TIỀN CỌC & TẠM TÍNH (Bản nâng cấp) */}
          {formData.roomId && (
            <div className="space-y-4">
              {/* Ô Nhập Tiền Cọc */}
              <div className="bg-orange-50 p-4 rounded-2xl border-2 border-orange-200">
                <label className="flex items-center gap-2 text-xs font-black text-orange-700 uppercase mb-2">
                  <CreditCard size={16} /> Tiền đặt cọc (VNĐ)
                </label>
                <input
                  type="number"
                  placeholder="Nhập số tiền khách cọc trước..."
                  className="w-full px-4 py-3 bg-white border-2 border-orange-300 rounded-xl outline-none focus:border-orange-500 text-lg font-bold text-orange-600"
                  value={formData.deposit_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deposit_amount: Number(e.target.value),
                    })
                  }
                />
              </div>

              {/* Bảng tính tiền chi tiết */}
              <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-blue-400 pb-3">
                  <span className="text-blue-100 italic">
                    Tổng tiền (
                    {calculateNights(formData.checkIn, formData.checkOut)} đêm):
                  </span>
                  <span className="font-bold text-xl">
                    {(
                      (rooms.find((r) => r.id === formData.roomId)?.price ||
                        0) *
                      calculateNights(formData.checkIn, formData.checkOut)
                    ).toLocaleString()}{" "}
                    VNĐ
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-blue-400 pb-3">
                  <span className="text-blue-100 italic">
                    Khách đã đặt cọc:
                  </span>
                  <span className="font-bold text-xl text-orange-300">
                    -{(formData.deposit_amount || 0).toLocaleString()} VNĐ
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-black uppercase tracking-widest">
                    Còn lại cần thu:
                  </span>
                  <span className="text-3xl font-black text-yellow-300">
                    {(
                      (rooms.find((r) => r.id === formData.roomId)?.price ||
                        0) *
                        calculateNights(formData.checkIn, formData.checkOut) -
                      (formData.deposit_amount || 0)
                    ).toLocaleString()}{" "}
                    VNĐ
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* FOOTER NÚT BẤM */}
          <div className="flex gap-3 pt-6 sticky bottom-0 bg-white">
            <button
              type="submit"
              disabled={loading || !formData.roomId}
              className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200 uppercase"
            >
              {loading ? "Đang xử lý..." : "Xác Nhận Đặt Phòng"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
