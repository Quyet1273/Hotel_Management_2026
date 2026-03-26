import { useState, useEffect } from "react";
import {
  X,
  Search,
  User,
  Calendar,
  Home,
  AlertCircle,
  Check,
  Loader2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { bookingService } from "../services/bookingService";

interface BookingFormProps {
  bookingId?: string;
  onClose: () => void;
  onSave: () => void;
}

export function BookingForm({ bookingId, onClose, onSave }: BookingFormProps) {
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [showRoomSelection, setShowRoomSelection] = useState(false);
  const [errors, setErrors] = useState<any>({});

  // States cho tính năng tìm kiếm khách hàng
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const [formData, setFormData] = useState({
    guestId: "", 
    guestName: "",
    guestPhone: "",
    guestIdNumber: "",
    guestNationality: "Việt Nam",
    checkIn: "",
    checkOut: "",
    guests: 1,
    roomType: "",
    roomId: "",
    specialRequests: "",
  });

  // 1. Khởi tạo dữ liệu
  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await supabase.from("rooms").select("*");
      if (data) setRooms(data);
    };
    fetchRooms();

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    setFormData((prev) => ({
      ...prev,
      checkIn: today.toISOString().split("T")[0] + "T14:00",
      checkOut: tomorrow.toISOString().split("T")[0] + "T12:00",
    }));
  }, []);

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
      guestName: guest.full_name,
      guestPhone: guest.phone,
      guestIdNumber: guest.id_number,
      guestNationality: guest.nationality || "Việt Nam",
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
      alert("Vui lòng chọn đầy đủ thời gian và loại phòng");
      return;
    }
    setLoading(true);
    const filteredByType = rooms.filter((r) => r.room_type === formData.roomType);
    const available: any[] = [];

    for (const room of filteredByType) {
      const res = await bookingService.checkRoomAvailability(
        room.id,
        formData.checkIn.split("T")[0],
        formData.checkOut.split("T")[0],
      );
      if (res.isAvailable) available.push(room);
    }
    setAvailableRooms(available);
    setShowRoomSelection(true);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.roomId) return;

    setLoading(true);
    try {
      // BƯỚC 1: Lấy UUID thật bằng cách upsert khách hàng
      const { data: guestData, error: guestError } = await supabase
        .from("guests")
        .upsert(
          {
            full_name: formData.guestName,
            phone: formData.guestPhone,
            id_number: formData.guestIdNumber,
            nationality: formData.guestNationality,
          },
          { onConflict: "phone" }
        )
        .select()
        .single();

      if (guestError) throw guestError;

      // BƯỚC 2: Tính tổng tiền
      const selectedRoom = rooms.find((r) => r.id === formData.roomId);
      const nights = calculateNights(formData.checkIn, formData.checkOut);
      const totalAmount = selectedRoom ? Number(selectedRoom.price) * nights : 0;

      // BƯỚC 3: Tạo Booking
      const bookingPayload = {
        guest_id: guestData.id, 
        room_id: formData.roomId,
        check_in_date: formData.checkIn.split("T")[0],
        check_out_date: formData.checkOut.split("T")[0],
        status: "confirmed" as "confirmed" | "pending" | "checked_in" | "checked_out" | "cancelled",
        total_amount: totalAmount,
        notes: formData.specialRequests,
      };

      const result = await bookingService.createBooking(bookingPayload);
      
      if (result.success) {
        alert("Đặt phòng thành công!");
        onSave();
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      alert("Lỗi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">{bookingId ? "Chỉnh Sửa" : "Tạo Đặt Phòng Mới"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          {/* Guest Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <User className="text-blue-600 w-5 h-5" />
              <h3 className="font-bold text-gray-800">Thông tin Khách hàng</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <div className="relative flex items-center">
                  <input
                    placeholder="Tìm theo tên hoặc SĐT..."
                    className="w-full pl-4 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowResults(true);
                      setFormData({...formData, guestName: e.target.value, guestId: ""});
                    }}
                    onFocus={() => setShowResults(true)}
                  />
                  <div className="absolute right-4 pointer-events-none">
                    <Search className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                {showResults && searchResults.length > 0 && (
                  <div className="absolute w-full mt-1 bg-white border border-blue-100 rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto">
                    {searchResults.map((g) => (
                      <div
                        key={g.id}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex justify-between items-center group"
                        onClick={() => handleSelectGuest(g)}
                      >
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-blue-700">{g.full_name}</p>
                          <p className="text-xs text-gray-500">{g.phone}</p>
                        </div>
                        <Check className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input placeholder="Số điện thoại *" required className="px-4 py-3 border rounded-xl" value={formData.guestPhone} onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })} />
              <input placeholder="CCCD/Passport *" required className="px-4 py-3 border rounded-xl" value={formData.guestIdNumber} onChange={(e) => setFormData({ ...formData, guestIdNumber: e.target.value })} />
              <input placeholder="Quốc tịch" className="px-4 py-3 border rounded-xl" value={formData.guestNationality} onChange={(e) => setFormData({ ...formData, guestNationality: e.target.value })} />
            </div>
          </div>

          {/* Booking Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <Calendar className="text-blue-600 w-5 h-5" />
              <h3 className="font-bold text-gray-800">Thời gian & Loại phòng</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="datetime-local" className="px-4 py-3 border rounded-xl" value={formData.checkIn} onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })} />
              <input type="datetime-local" className="px-4 py-3 border rounded-xl" value={formData.checkOut} onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })} />
              <select className="px-4 py-3 border rounded-xl" value={formData.roomType} onChange={(e) => setFormData({ ...formData, roomType: e.target.value, roomId: "" })}>
                <option value="">Chọn loại phòng</option>
                <option value="single">Phòng Đơn</option>
                <option value="double">Phòng Đôi</option>
                <option value="suite">Phòng Suite</option>
                {/* <option value="deluxe">Phòng Deluxe</option> */}
              </select>
              <button type="button" onClick={checkAvailableRooms} className="bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Kiểm tra phòng trống
              </button>
            </div>
          </div>

          {/* Room Selection Grid */}
          {showRoomSelection && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-xl">
              {availableRooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, roomId: room.id })}
                  className={`p-4 border-2 rounded-xl transition-all ${formData.roomId === room.id ? "border-blue-600 bg-blue-100 shadow-md" : "bg-white border-transparent hover:border-gray-200"}`}
                >
                  <Home className={`mx-auto mb-1 ${formData.roomId === room.id ? "text-blue-600" : "text-gray-400"}`} />
                  <p className="font-bold text-center">P.{room.room_number}</p>
                  <p className="text-xs text-center text-gray-500">{Number(room.price).toLocaleString()}đ</p>
                </button>
              ))}
            </div>
          )}

          {/* Bảng tính tiền báo giá khách */}
          {formData.roomId && (
            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 space-y-3 shadow-inner">
              <div className="flex justify-between text-sm text-gray-600 italic">
                <span>Chi phí tạm tính cho {calculateNights(formData.checkIn, formData.checkOut)} đêm:</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-blue-900 uppercase tracking-wider">Tổng cộng:</span>
                <span className="text-2xl font-black text-blue-600">
                  {((rooms.find(r => r.id === formData.roomId)?.price || 0) * calculateNights(formData.checkIn, formData.checkOut)).toLocaleString()} VNĐ
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white">
            <button type="submit" disabled={loading || !formData.roomId} className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200">
              {loading ? "Đang xử lý..." : "Xác Nhận Đặt Phòng"}
            </button>
            <button type="button" onClick={onClose} className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
}