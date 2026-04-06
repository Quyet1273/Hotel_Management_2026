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

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );

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
    <div className="space-y-6 pb-10">
      {/* HEADER BANNER - CHUẨN STYLE KHO VẬT TƯ */}
      <div
        style={{
          backgroundColor: "#2563eb",
          borderRadius: "2rem",
          padding: "2rem",
          color: "#ffffff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div
            style={{
              width: "4rem",
              height: "4rem",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: "1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookmarkCheck
              style={{ width: "2rem", height: "2rem", color: "#ffffff" }}
            />
          </div>
          <div>
            <h1
              style={{
                fontSize: "1.875rem",
                fontWeight: "900",
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              QUẢN LÝ ĐẶT PHÒNG
            </h1>
            <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: 0 }}>
              Theo dõi lịch trình lưu trú và trạng thái phòng HotelPro
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowBookingForm(true)}
          style={{
            backgroundColor: "#ffffff",
            color: "#2563eb",
            padding: "0.8rem 1.5rem",
            borderRadius: "1rem",
            border: "none",
            fontWeight: "900",
            cursor: "pointer",
            textTransform: "uppercase",
            fontSize: "0.75rem",
          }}
        >
          + Đặt Phòng Mới
        </button>
      </div>

      {/* Bộ lọc hiện đại */}
      <div className="bg-white rounded-[1.5rem] border border-gray-100 p-5 flex flex-wrap gap-4 shadow-sm">
        <div className="flex-1 relative">
          {/* Lớp bọc Icon để căn giữa tuyệt đối theo chiều dọc */}
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>

          <input
            type="text"
            placeholder="Tìm mã booking, tên khách, số phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3 bg-gray-50/50 px-4 py-1 rounded-xl border border-gray-200">
          <Filter size={18} className="text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-transparent py-2 text-sm font-bold text-gray-600 outline-none cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="checked_in">Đã nhận phòng</option>
            <option value="checked_out">Đã trả phòng</option>
          </select>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-5">Mã Booking</th>
                <th className="px-6 py-5">Khách Hàng</th>
                <th className="px-6 py-5 text-center">Phòng</th>
                <th className="px-6 py-5">Thời Gian (In/Out)</th>
                <th className="px-6 py-5 text-right">Tổng Tiền</th>
                <th className="px-6 py-5 text-center">Trạng Thái</th>
                <th className="px-6 py-5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-20">
                    <Loader2 className="animate-spin mx-auto text-blue-500 w-8 h-8" />
                    <p className="mt-2 text-xs font-bold text-gray-400 uppercase tracking-tighter">
                      Đang tải dữ liệu...
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-blue-50/30 group transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-[11px] font-bold text-blue-600">
                      #{booking.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-gray-900">
                        {booking.guests?.full_name}
                      </div>
                      <div className="text-[11px] font-bold text-gray-400">
                        {booking.guests?.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-black">
                        P.{booking.rooms?.room_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase leading-relaxed">
                      <div className="flex items-center gap-2">
                        <span className="w-8 text-emerald-500">In:</span>{" "}
                        {new Date(booking.check_in_date).toLocaleDateString(
                          "vi-VN",
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-8 text-rose-500">Out:</span>{" "}
                        {new Date(booking.check_out_date).toLocaleDateString(
                          "vi-VN",
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-gray-900">
                      {Number(booking.total_amount).toLocaleString()}đ
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-3 py-1 text-[10px] font-black rounded-lg border uppercase tracking-tighter ${getStatusStyle(booking.status)}`}
                      >
                        {booking.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedBookingId(booking.id)}
                          className="flex items-center gap-1.5 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white text-[11px] font-black px-3 py-2 rounded-xl transition-all border border-blue-100"
                        >
                          <Receipt size={14} /> CHI TIẾT
                        </button>

                        {booking.status === "checked_in" && (
                          <button
                            onClick={() => setSelectedBookingId(booking.id)}
                            className="flex items-center gap-1.5 bg-rose-50 text-rose-600 text-[11px] font-black px-3 py-2 border border-rose-100 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
                          >
                            <LogOut size={14} /> TRẢ PHÒNG
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
