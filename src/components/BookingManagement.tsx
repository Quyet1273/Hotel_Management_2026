import { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Loader2,
  Receipt,
  LogOut,
  BookmarkCheck,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { BookingForm } from "./BookingForm";
import { BookingDetail } from "./BookingDetail";
import { toast } from "react-hot-toast";

// 1. Định nghĩa Interface chuẩn hóa
export interface Booking {
  id: string;
  guest_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  status: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
  total_amount: number;
  deposit: number;
  notes: string;
  guests?: { full_name: string; phone: string };
  rooms?: { room_number: string; room_type: string };
}

export function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("confirmed");
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );
const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
  setLoading(true);
  try {
    // 1. Tìm xem đơn này đặt phòng nào
    const { data: bokingInfo } = await supabase
      .from("bookings")
      .select("room_id").eq("id", bookingId).single();

    if (!bokingInfo) return;

    // 2. CHẶN ĐỨNG: Kiểm tra trạng thái thực tế của phòng NGAY BÂY GIỜ
    if (newStatus === "checked_in") {
      const { data: room } = await supabase
        .from("rooms")
        .select("status").eq("id", bokingInfo.room_id).single();

      if (room?.status !== "available") {
        toast.error("PHÒNG ĐANG CÓ NGƯỜI! Đừng có làm liều đại ca!");
        return; // DỪNG LUÔN TẠI ĐÂY
      }
    }

    // 3. Nếu OK thì mới update đồng thời cả 2 bảng
    await supabase.from("bookings").update({ status: newStatus }).eq("id", bookingId);
    
    const nextRoomStatus = newStatus === "checked_in" ? "occupied" : "cleaning";
    await supabase.from("rooms").update({ status: nextRoomStatus }).eq("id", bokingInfo.room_id);

    toast.success("Xong! Đã khóa phòng an toàn.");
    fetchBookings(); // Load lại để nút xám đi ngay lập tức
  } catch (e) {
    toast.error("Lỗi rồi!");
  } finally {
    setLoading(false);
  }
};
  // 2. Hàm lấy dữ liệu thật từ Supabase (ĐÃ THÊM STATUS PHÒNG)
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          guests (full_name, phone),
          rooms (room_number, room_type, status) 
        `, // <--- PHẢI CÓ 'status' Ở ĐÂY đại ca nhé!
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. TỰ ĐỘNG REFRESH KHI ĐỔI TAB
  useEffect(() => {
    fetchBookings();
    // Mỗi khi đại ca bấm đổi Tab (activeTab), hàm này sẽ chạy lại để lấy trạng thái phòng mới nhất
  }, [activeTab]);

  // 3. Logic tìm kiếm & Lọc
  const filteredBookings = bookings.filter((booking) => {
    const guestName = booking.guests?.full_name?.toLowerCase() || "";
    const guestPhone = booking.guests?.phone || "";
    const roomNum = booking.rooms?.room_number || "";
    const search = searchTerm.toLowerCase();

    const searchMatch =
      booking.id.toLowerCase().includes(search) ||
      guestName.includes(search) ||
      guestPhone.includes(search) ||
      roomNum.includes(search);

    const statusMatch =
      filterStatus === "all" || booking.status === filterStatus;
    return searchMatch && statusMatch;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "checked_in":
        return "bg-green-100 text-green-700 border-green-200";
      case "checked_out":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="space-y-6 pb-10 font-sans antialiased">
      {/* HEADER BANNER - ĐỒNG BỘ NỀN VÀ FONT */}
      <div className="bg-[#D1F4FA] dark:bg-gray-800 rounded-[2rem] p-8 flex flex-col md:flex-row gap-4 justify-between md:items-center shadow-sm border border-blue-100 dark:border-gray-700">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-600/10 dark:bg-white/10 rounded-2xl flex items-center justify-center">
            <BookmarkCheck className="w-8 h-8 text-blue-700 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">
              Quản Lý Đặt Phòng
            </h1>
          </div>
        </div>
        <button
          onClick={() => setShowBookingForm(true)}
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-extrabold text-[13px] uppercase tracking-wider shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span>+ Đặt Phòng Mới</span>
        </button>
      </div>

      {/* BỘ LỌC HIỆN ĐẠI - ĐỒNG BỘ UI SEARCH */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex flex-wrap gap-4 shadow-sm">
        <div className="flex-1 relative min-w-[250px]">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm mã booking, tên khách, số phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900/80 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-2xl focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold outline-none text-[15px]"
          />
        </div>
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/80 px-4 py-2 rounded-2xl border-2 border-gray-200 dark:border-gray-600 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
          <Filter size={18} className="text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent py-1.5 text-[13px] font-extrabold uppercase tracking-wide text-gray-700 dark:text-gray-200 outline-none cursor-pointer appearance-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="checked_in">Đã nhận phòng</option>
            <option value="checked_out">Đã trả phòng</option>
          </select>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU - VIỀN KẺ RÕ RÀNG */}
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] border-2 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b-2 border-gray-200 dark:border-gray-700 text-[12px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">
                <th className="px-6 py-5">Mã Booking</th>
                <th className="px-6 py-5">Khách Hàng</th>
                <th className="px-6 py-5 text-center">Phòng</th>
                <th className="px-6 py-5">Thời Gian (In/Out)</th>
                <th className="px-6 py-5 text-right">Tổng Tiền</th>
                <th className="px-6 py-5 text-center">Trạng Thái</th>
                <th className="px-6 py-5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-20">
                    <Loader2 className="animate-spin mx-auto text-blue-500 w-8 h-8 mb-3" />
                    <p className="text-[12px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      Đang tải dữ liệu...
                    </p>
                  </td>
                </tr>
              ) : filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors group"
                  >
                    <td className="px-6 py-4 font-mono text-[13px] font-extrabold text-blue-600 dark:text-blue-400">
                      #{booking.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[15px] font-extrabold text-gray-900 dark:text-white mb-0.5 whitespace-nowrap">
                        {booking.guests?.full_name}
                      </div>
                      <div className="text-[13px] font-bold text-gray-500 dark:text-gray-400">
                        {booking.guests?.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-[13px] font-extrabold whitespace-nowrap">
                        P.{booking.rooms?.room_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-bold text-gray-600 dark:text-gray-300 leading-relaxed whitespace-nowrap">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-8 text-[11px] font-extrabold text-emerald-500 uppercase tracking-wider">
                          In:
                        </span>{" "}
                        {new Date(booking.check_in_date).toLocaleDateString(
                          "vi-VN",
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-8 text-[11px] font-extrabold text-rose-500 uppercase tracking-wider">
                          Out:
                        </span>{" "}
                        {new Date(booking.check_out_date).toLocaleDateString(
                          "vi-VN",
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-[15px] font-extrabold text-gray-900 dark:text-white whitespace-nowrap">
                      {Number(booking.total_amount).toLocaleString()}đ
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-3 py-1.5 text-[11px] font-extrabold rounded-lg border uppercase tracking-wider whitespace-nowrap ${getStatusStyle(booking.status)}`}
                      >
                        {booking.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-100 md:opacity-80 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedBookingId(booking.id)}
                          className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-[11px] font-extrabold px-4 py-2.5 rounded-xl transition-all border border-blue-200 dark:border-blue-800/50 whitespace-nowrap"
                        >
                          <Receipt size={14} /> CHI TIẾT
                        </button>

                        {booking.status === "checked_in" && (
                          <button
                            onClick={() => setSelectedBookingId(booking.id)}
                            className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[11px] font-extrabold px-4 py-2.5 border border-rose-200 dark:border-rose-800/50 rounded-xl hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all whitespace-nowrap"
                          >
                            <LogOut size={14} /> TRẢ PHÒNG
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-16 text-gray-500 dark:text-gray-400 font-bold text-[14px]"
                  >
                    Không tìm thấy đặt phòng nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showBookingForm && (
        <BookingForm
          onClose={() => setShowBookingForm(false)}
          onSave={() => {
            fetchBookings();
            setShowBookingForm(false);
          }}
        />
      )}

      {selectedBookingId && (
        <BookingDetail
          bookingId={selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
          onRefresh={() => fetchBookings()}
        />
      )}
    </div>
  );
}
