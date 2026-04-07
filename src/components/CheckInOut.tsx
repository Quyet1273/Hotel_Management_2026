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
  ConciergeBell,
  Home,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { checkInOutService } from "../services/checkInOutService";
import { roomService, Room } from "../services/roomService";
import { toast } from "sonner";
import { CheckoutModal } from "../modal/checkOutModal";

export function CheckInOut() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATES BỘ LỌC ---
  const [activeTab, setActiveTab] = useState<
    "pending" | "confirmed" | "checked_in"
  >("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null,
  );

  // --- 1. RESET TOÀN BỘ BỘ LỌC KHI ĐỔI TAB (FIX LỖI CHÍ MẠNG) ---
  useEffect(() => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterType("all");
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingRes, roomRes] = await Promise.all([
        checkInOutService.getCheckInOutList(),
        roomService.getAllRooms(),
      ]);
      if (bookingRes.success) setBookings(bookingRes.data || []);
      if (roomRes.success) setRooms(roomRes.data || []);
    } catch (error) {
      toast.error("Không thể kết nối máy chủ");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- 2. LOGIC LỌC PHÒNG (FIX LỖI BỘ LỌC MÀU VÀNG) ---
  const filteredRooms = rooms.filter((room) => {
    // Khớp Search (Số phòng)
    const searchMatch = room.room_number
      .toString()
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Khớp Loại phòng
    const typeMatch = filterType === "all" || room.room_type === filterType;

    // Khớp Trạng thái (Quan trọng nhất)
    let statusMatch = false;
    if (filterStatus === "all") {
      statusMatch = true;
    } else if (filterStatus === "available") {
      statusMatch = room.status === "available";
    } else if (filterStatus === "occupied") {
      statusMatch = room.status === "occupied";
    } else if (filterStatus === "maintenance") {
      // Nếu không phải Xanh (available) và Đỏ (occupied) thì là Vàng
      statusMatch = room.status !== "available" && room.status !== "occupied";
    }

    return searchMatch && typeMatch && statusMatch;
  });

  // --- 3. LOGIC LỌC BOOKING (NHẬN/TRẢ PHÒNG) ---
  const filteredBookings = bookings
    .filter((b) => b.status === activeTab)
    .filter((b) => {
      const s = searchTerm.toLowerCase();
      return (
        b.guests?.full_name?.toLowerCase().includes(s) ||
        b.rooms?.room_number?.toString().includes(s)
      );
    });

  const handleMarkAsReady = async (roomId: string) => {
    const result = await roomService.updateRoom(roomId, {
      status: "available",
    });
    if (result.success) {
      toast.success("Phòng đã sạch sẽ!");
      loadData();
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: string,
    msg: string,
  ) => {
    if (status === "checked_in") {
      const target = bookings.find((b) => b.id === id);
      const result = await checkInOutService.confirmCheckInMaster(
        id,
        target.room_id,
      );
      if (result?.success) {
        toast.success(msg);
        loadData();
      }
    } else if (status === "checked_out") {
      setSelectedBookingId(id);
      setIsCheckoutModalOpen(true);
    }
  };

  const getRoomVisuals = (status: string) => {
    if (status === "occupied")
      return {
        color: "#e11d48",
        bg: "#fff1f2",
        border: "#fecaca",
        text: "Đang thuê",
      };
    if (status === "available")
      return {
        color: "#10b981",
        bg: "#ecfdf5",
        border: "#a7f3d0",
        text: "Trống",
      };
    return {
      color: "#f59e0b",
      bg: "#fffbeb",
      border: "#fef08a",
      text: "Chờ dọn",
    };
  };

  if (loading)
    return (
      <div className="p-20 text-center font-black text-gray-400 animate-pulse">
        HỆ THỐNG ĐANG TẢI...
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 font-sans antialiased">
      {/* HEADER BANNER - ĐỒNG BỘ MÀU NỀN #D1F4FA */}
      <div className="bg-[#D1F4FA] dark:bg-gray-800 rounded-[2rem] p-8 flex justify-between items-center shadow-sm border border-blue-100 dark:border-gray-700">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-600/10 dark:bg-white/10 rounded-2xl flex items-center justify-center">
            <ConciergeBell className="w-8 h-8 text-blue-700 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">
              Quầy Lễ Tân
            </h1>
            <p className="text-[15px] font-bold text-gray-700 dark:text-gray-300 mt-1">
              Phòng {rooms.length} | Chờ dọn{" "}
              {
                rooms.filter(
                  (r) => r.status !== "available" && r.status !== "occupied",
                ).length
              }
            </p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="p-3 bg-white/60 hover:bg-white dark:bg-gray-700 dark:hover:bg-gray-600 text-blue-700 dark:text-blue-400 rounded-xl transition-all shadow-sm border border-white/50 dark:border-gray-600"
        >
          <RefreshCw size={24} />
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* MENU TABS */}
        <div className="flex p-2 gap-2 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
          {[
            {
              id: "pending",
              label: "Buồng phòng",
              icon: <Home size={18} />,
              color: "#f59e0b",
              darkColor: "#fbbf24",
            },
            {
              id: "confirmed",
              label: "Nhận phòng",
              icon: <LogIn size={18} />,
              color: "#3b82f6",
              darkColor: "#60a5fa",
            },
            {
              id: "checked_in",
              label: "Trả phòng",
              icon: <LogOut size={18} />,
              color: "#e11d48",
              darkColor: "#fb7185",
            },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-extrabold uppercase text-[13px] tracking-wide transition-all ${
                activeTab === t.id
                  ? "bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              }`}
              style={{ color: activeTab === t.id ? t.color : "" }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* SEARCH & FILTERS - ĐÃ LÀM NỔI BẬT VIỀN VÀ HIỆU ỨNG */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 bg-white dark:bg-gray-800">
          <div className="relative flex-1 min-w-[250px]">
            {/* Bọc icon thế này là auto căn giữa 100% theo input */}
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={18} />
            </div>

            <input
              type="text"
              placeholder={
                activeTab === "pending"
                  ? "Tìm số phòng..."
                  : "Tìm tên khách hoặc số phòng..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900/80 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-2xl focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold outline-none text-[15px]"
            />
          </div>

          {activeTab === "pending" && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-6 py-3.5 bg-gray-50 dark:bg-gray-900/80 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-2xl text-[13px] font-extrabold uppercase tracking-wide outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer appearance-none"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="available">Phòng trống (Xanh)</option>
              <option value="occupied">Đang thuê (Đỏ)</option>
              <option value="maintenance">Chờ dọn (Vàng)</option>
            </select>
          )}
        </div>

        {/* LIST CONTENT */}
        <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {activeTab === "pending" ? (
            filteredRooms.length > 0 ? (
              filteredRooms.map((room) => {
                const visual = getRoomVisuals(room.status);
                return (
                  <div
                    key={room.id}
                    className="p-6 hover:bg-blue-50/30 dark:hover:bg-gray-700/30 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-6">
                      <div
                        style={{
                          backgroundColor: visual.bg,
                          borderColor: visual.border,
                        }}
                        className="w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center shadow-sm group-hover:scale-105 transition-transform"
                      >
                        <span
                          style={{ color: visual.color }}
                          className="text-xl font-extrabold"
                        >
                          {room.room_number}
                        </span>
                        <span
                          style={{ color: visual.color }}
                          className="text-[9px] font-extrabold uppercase tracking-wider"
                        >
                          {visual.text}
                        </span>
                      </div>
                      <div>
                        <p className="font-extrabold text-[15px] text-gray-900 dark:text-white uppercase tracking-wide mb-1">
                          Loại: {room.room_type}
                        </p>
                        <p className="text-[13px] text-gray-500 dark:text-gray-400 font-bold">
                          Vị trí: Tầng {room.floor || 1}
                        </p>
                      </div>
                    </div>
                    {room.status !== "available" &&
                    room.status !== "occupied" ? (
                      <button
                        onClick={() => handleMarkAsReady(room.id)}
                        className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all"
                      >
                        <CheckCircle2 size={16} /> Sẵn sàng
                      </button>
                    ) : (
                      <div
                        style={{
                          color: visual.color,
                          backgroundColor: visual.bg,
                          borderColor: visual.border,
                        }}
                        className="px-5 py-2 rounded-full text-[11px] font-extrabold uppercase tracking-wider border shadow-sm"
                      >
                        {visual.text}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-20 text-center text-gray-400 dark:text-gray-500 font-extrabold uppercase text-[13px] tracking-widest">
                Không tìm thấy phòng phù hợp
              </div>
            )
          ) : /* BOOKING LIST (CONFIRMED / CHECKED_IN) */
          filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="p-6 hover:bg-blue-50/30 dark:hover:bg-gray-700/30 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Cột 1: Khách hàng */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shadow-sm">
                        <User size={22} />
                      </div>
                      <div>
                        <p className="font-extrabold text-[15px] text-gray-900 dark:text-white mb-0.5">
                          {booking.guests?.full_name}
                        </p>
                        <p className="text-[13px] text-gray-500 dark:text-gray-400 font-bold">
                          {booking.guests?.phone}
                        </p>
                      </div>
                    </div>

                    {/* Cột 2: Phòng */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center shadow-sm">
                        <Bed size={22} />
                      </div>
                      <div>
                        <p className="font-extrabold text-[15px] text-gray-900 dark:text-white mb-0.5">
                          Phòng {booking.rooms?.room_number}
                        </p>
                        <p className="text-[11px] text-purple-600 dark:text-purple-400 font-extrabold uppercase tracking-wider">
                          {booking.rooms?.room_type}
                        </p>
                      </div>
                    </div>

                    {/* Cột 3: Thời gian */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl flex items-center justify-center shadow-sm">
                        <Calendar size={22} />
                      </div>
                      <div>
                        <p className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">
                          Lưu trú
                        </p>
                        <p className="text-[13px] font-bold text-gray-700 dark:text-gray-300">
                          {booking.check_in_date} → {booking.check_out_date}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Nút hành động */}
                  <div className="mt-4 lg:mt-0 flex-shrink-0">
                    {activeTab === "confirmed" ? (
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            booking.id,
                            "checked_in",
                            "Check-in thành công",
                          )
                        }
                        className="w-full lg:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-extrabold text-[13px] uppercase tracking-wider shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                      >
                        Nhận Phòng
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          handleUpdateStatus(booking.id, "checked_out", "")
                        }
                        className="w-full lg:w-auto px-8 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-extrabold text-[13px] uppercase tracking-wider shadow-lg shadow-rose-500/30 transition-all active:scale-95"
                      >
                        Thanh toán
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 text-center text-gray-400 dark:text-gray-500 font-extrabold uppercase text-[13px] tracking-widest">
              Danh sách trống
            </div>
          )}
        </div>
      </div>

      <CheckoutModal
        isOpen={isCheckoutModalOpen}
        bookingId={selectedBookingId}
        onClose={() => {
          setIsCheckoutModalOpen(false);
          setSelectedBookingId(null);
        }}
        onSuccess={() => loadData()}
      />
    </div>
  );
}
