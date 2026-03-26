import { useState, useEffect } from "react";
import { Calendar, Plus, Search, Filter, Loader2, Receipt, LogOut } from "lucide-react";
import { supabase } from "../lib/supabase";
import { BookingForm } from "./BookingForm";
import { BookingDetail } from "./BookingDetail";

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
  
  // Modals state (Đã dọn dẹp, chỉ giữ lại 2 cái cần thiết)
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // 2. Hàm lấy dữ liệu thật từ Supabase
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          guests (full_name, phone),
          rooms (room_number, room_type)
        `,
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

  useEffect(() => {
    fetchBookings();
  }, []);

  // 3. Logic tìm kiếm & Lọc theo đúng database schema
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

  // 4. Helper hiển thị màu sắc trạng thái
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
        return "bg-amber-100 text-amber-700 border-amber-200"; // pending
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Quản Lý Đặt Phòng
          </h2>
          <p className="text-gray-500">Dữ liệu từ hệ thống</p>
        </div>
        <button
          onClick={() => setShowBookingForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span className="font-semibold">Đặt Phòng Mới</span>
        </button>
      </div>

      {/* Bộ lọc */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm mã, khách hàng, số phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white outline-none"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ xác nhận (Pending)</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="checked_in">Đã nhận phòng</option>
          <option value="checked_out">Đã trả phòng</option>
        </select>
      </div>

      {/* Bảng dữ liệu */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                <th className="px-6 py-4">Mã Booking</th>
                <th className="px-6 py-4">Khách Hàng</th>
                <th className="px-6 py-4">Phòng</th>
                <th className="px-6 py-4">Thời Gian (In/Out)</th>
                <th className="px-6 py-4">Tổng Tiền</th>
                <th className="px-6 py-4">Trạng Thái</th>
                <th className="px-6 py-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-20">
                    <Loader2 className="animate-spin mx-auto text-blue-500" />
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-blue-50/20 group transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-blue-600">
                      #{booking.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {booking.guests?.full_name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {booking.guests?.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      P.{booking.rooms?.room_number}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div>In: {booking.check_in_date}</div>
                      <div>Out: {booking.check_out_date}</div>
                    </td>
                    <td className="px-6 py-4 font-bold">
                      {Number(booking.total_amount).toLocaleString()}đ
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 text-[10px] font-bold rounded-full border ${getStatusStyle(booking.status)}`}
                      >
                        {booking.status.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* Nút Chi tiết - Luôn hiển thị */}
                        <button
                          onClick={() => setSelectedBookingId(booking.id)}
                          className="flex items-center gap-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border border-blue-100"
                        >
                          <Receipt size={14} /> Chi tiết
                        </button>

                        {/* Nút Trả phòng - Luôn hiển thị nếu khách đang ở */}
                        {booking.status === "checked_in" && (
                          <button
                            onClick={() => setSelectedBookingId(booking.id)} // Vẫn mở BookingDetail, bên trong đó có nút Trả Phòng gọi Modal
                            className="flex items-center gap-1.5 bg-rose-50 text-rose-600 text-xs font-bold px-3 py-1.5 border border-rose-100 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                          >
                            <LogOut size={14} /> Trả phòng
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals Rendering */}
      {showBookingForm && (
        <BookingForm
          onClose={() => setShowBookingForm(false)}
          onSave={() => {
            fetchBookings();
            setShowBookingForm(false);
          }}
        />
      )}

      {/* Modal hiển thị chi tiết và thanh toán */}
      {selectedBookingId && (
        <BookingDetail
          bookingId={selectedBookingId}
          onClose={() => setSelectedBookingId(null)}
          onRefresh={() => {
            fetchBookings(); // Đã sửa lỗi thiếu dấu ngoặc () ở đây
          }}
        />
      )}
    </div>
  );
}