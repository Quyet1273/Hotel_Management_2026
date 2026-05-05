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
  Eye,
  Plus,
} from "lucide-react";
import { checkInOutService } from "../services/checkInOutService";
import { roomService, Room } from "../services/roomService";
import { toast } from "sonner";
import { CheckoutModal } from "../modal/checkOutModal";
import { BookingForm } from "./BookingForm";
import { BookingDetail } from "./BookingDetail";

export function CheckInOut() {
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [selectedRoomToBook, setSelectedRoomToBook] = useState<Room | null>(
    null,
  );
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Logic "Hợp nhất" dữ liệu: Mỗi phòng sẽ biết mình đang có khách nào
  const now = new Date();
  const roomsWithBookingData = rooms.map((room) => {
    // 1. Tìm khách đang ở (status: checked_in)
    const activeBooking = bookings.find(
      (b) => b.room_id === room.id && b.status === "checked_in",
    );

    // 2. Tìm khách đặt trước (status: confirmed)
    // Lọc các đơn của phòng này, chưa check-in, và ngày vào phải sau thời điểm hiện tại

    const nextBooking = bookings
      .filter(
        (b) =>
          b.room_id === room.id &&
          b.status === "confirmed" &&
          new Date(b.check_in_date) > now,
      )
      // Sắp xếp để lấy đơn có ngày vào gần nhất
      .sort(
        (a, b) =>
          new Date(a.check_in_date).getTime() -
          new Date(b.check_in_date).getTime(),
      )[0];

    return { ...room, activeBooking, nextBooking };
  });

  // --- STATES BỘ LỌC ---
  const [activeTab, setActiveTab] = useState<
    "pending" | "confirmed" | "checked_in"
  >("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [isBookingDetailOpen, setIsBookingDetailOpen] = useState(false);
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
      // Chạy song song 2 hàm lấy data
      const [bookingRes, roomRes] = await Promise.all([
        checkInOutService.getCheckInOutList(),
        roomService.getAllRooms(),
      ]);

      // Nếu thành công thì set data
      if (bookingRes.success) setBookings(bookingRes.data || []);
      if (roomRes.success) setRooms(roomRes.data || []);
      
      // Nếu lỗi 400, log ra để mình biết là hàm nào chết
      if (!bookingRes.success) console.error("Lỗi Booking:", bookingRes.error);
      if (!roomRes.success) console.error("Lỗi Room:", roomRes.error);

    } catch (error) {
      console.error("Lỗi hệ thống:", error);
      toast.error("Không thể kết nối máy chủ");
    } finally {
      // QUAN TRỌNG NHẤT: Bắt buộc phải tắt loading ở đây
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);
  const filteredRooms = roomsWithBookingData.filter((room) => {
    const searchMatch = room.room_number.toString().includes(searchTerm);
    const typeMatch = filterType === "all" || room.room_type === filterType;

    let statusMatch = false;
    if (filterStatus === "all") statusMatch = true;
    else if (filterStatus === "available")
      statusMatch = room.status === "available";
    else if (filterStatus === "occupied")
      statusMatch = room.status === "occupied";
    else if (filterStatus === "maintenance")
      statusMatch = room.status !== "available" && room.status !== "occupied";

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
  // 3. Hàm mở đặt phòng nhanh
  const handleOpenQuickBook = (room: Room) => {
    setSelectedRoomToBook(room);
    setIsBookingFormOpen(true);
  };

  const handleUpdateStatus = async (
    id: string,
    status: string,
    msg: string,
  ) => {
    if (status === "checked_in") {
      // 1. Tìm đơn đặt phòng đang bấm
      const targetBooking = bookings.find((b) => b.id === id);
      if (!targetBooking) return;

      // 2. TÌM PHÒNG TƯƠNG ỨNG TRONG DANH SÁCH 'rooms' ĐỂ CHECK STATUS
      const targetRoom = rooms.find((r) => r.id === targetBooking.room_id);

      // 3. CHỐT CHẶN: Nếu phòng không phải 'available' thì biến, không cho check-in
      if (!targetRoom || targetRoom.status !== "available") {
        toast.error(
          `Phòng ${targetRoom?.room_number || "này"} hiện đang ${
            targetRoom?.status === "occupied" ? "có khách" : "chờ dọn"
          }. Không thể nhận phòng!`,
        );
        return; // DỪNG LUÔN, KHÔNG GỌI SERVICE
      }

      // 4. Chỉ khi phòng trống mới gọi service
      const result = await checkInOutService.confirmCheckInMaster(
        id,
        targetBooking.room_id,
      );
      if (result?.success) {
        toast.success(msg);
        loadData(); // Tải lại toàn bộ dữ liệu để cập nhật UI
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
              /* Grid Container: Chia cột hợp lý cho mọi màn hình */
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-5">
                {filteredRooms.map((room) => {
                  const visual = getRoomVisuals(room.status);
                  const booking = room.activeBooking;
                  return (
                    <div
                      key={room.id}
                      className={`group bg-white dark:bg-gray-800 border-2 rounded-[2rem] p-4 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden
                      ${room.status === "occupied" ? "border-purple-200 dark:border-purple-800/50" : "border-gray-200 dark:border-gray-700/50 hover:border-blue-500/50"}`}
                    >
                      {/* Header: Số phòng & Tầng */}
                      <div className="flex justify-between items-start mb-4">
                        <div
                          style={{
                            backgroundColor: visual.bg,
                            borderColor: visual.border,
                            color: visual.color,
                          }}
                          className="w-12 h-12 rounded-2xl border flex flex-col items-center justify-center shadow-sm group-hover:scale-105 transition-transform"
                        >
                          <span className="text-lg font-black leading-none">
                            {room.room_number}
                          </span>
                          <span className="text-[7px] font-black uppercase tracking-tighter opacity-70">
                            {visual.text}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block leading-none mb-0.5">
                            Floor
                          </span>
                          <span className="text-lg font-black text-gray-800 dark:text-white leading-none">
                            {room.floor || 1}
                          </span>
                        </div>
                      </div>

                      {/* Thông tin phòng / Khách lưu trú - Đã nâng cấp hiện Giờ:Phút */}
                      <div className="mb-5 flex-1 min-h-[90px]">
                        {room.status === "occupied" && booking ? (
                          <div className="space-y-3 animate-in fade-in duration-300">
                            <div>
                              <p className="text-[9px] font-black text-purple-500 uppercase tracking-widest leading-none mb-1">
                                Khách lưu trú
                              </p>
                              <p className="text-[14px] font-bold text-gray-800 dark:text-gray-100 truncate">
                                {booking.guests?.full_name}
                              </p>
                            </div>

                            {/* TIMELINE CHI TIẾT IN/OUT KÈM GIỜ GIẤC */}
                            <div className="pt-2 border-t border-dashed border-gray-100 dark:border-gray-700/50 space-y-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-gray-400 font-bold uppercase">
                                  In:
                                </span>
                                <span className="text-gray-700 dark:text-gray-300 font-black">
                                  {new Date(
                                    booking.check_in_date,
                                  ).toLocaleTimeString("vi-VN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}{" "}
                                  -{" "}
                                  {new Date(
                                    booking.check_in_date,
                                  ).toLocaleDateString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                  })}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-gray-400 font-bold uppercase">
                                  Out:
                                </span>
                                <span className="text-rose-500 font-black">
                                  {new Date(
                                    booking.check_out_date,
                                  ).toLocaleTimeString("vi-VN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}{" "}
                                  -{" "}
                                  {new Date(
                                    booking.check_out_date,
                                  ).toLocaleDateString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <h3 className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-tight">
                              {room.room_type}
                            </h3>
                            <p className="text-[12px] font-bold text-gray-400 italic">
                              {room.status === "available"
                                ? "Sẵn sàng đón khách"
                                : "Đang dọn dẹp..."}
                            </p>
                          </div>
                        )}
                      </div>
                      {room.nextBooking && (
                        <div className="mb-3 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 animate-pulse">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} className="text-blue-600" />
                            <span className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-tighter">
                              Sắp có khách:{" "}
                              {new Date(
                                room.nextBooking.check_in_date,
                              ).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -{" "}
                              {new Date(
                                room.nextBooking.check_in_date,
                              ).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Nút hành động & Thông tin đặt trước */}
                      <div className="mt-auto">
                        {/* 1. HIỂN THỊ NGƯỜI ĐẾN SAU (Nếu có nextBooking) */}
                        {room.nextBooking && (
                          <div className="mb-3 px-3 py-2 bg-blue-50/80 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50 animate-in fade-in slide-in-from-bottom-1 duration-500">
                            <div className="flex items-center gap-1.5 mb-1">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                              <span className="text-[9px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">
                                Sắp có khách tiếp theo
                              </span>
                            </div>
                            <div className="flex justify-between items-end">
                              <div>
                                <p className="text-[11px] font-bold text-gray-700 dark:text-gray-200 truncate max-w-[100px]">
                                  {room.nextBooking.guests?.full_name}
                                </p>
                                <p className="text-[8px] font-black text-blue-500/80 uppercase">
                                  {new Date(
                                    room.nextBooking.check_in_date,
                                  ).toLocaleTimeString("vi-VN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}{" "}
                                  •{" "}
                                  {new Date(
                                    room.nextBooking.check_in_date,
                                  ).toLocaleDateString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                  })}
                                </p>
                              </div>
                              <Calendar
                                size={12}
                                className="text-blue-300 mb-0.5"
                              />
                            </div>
                          </div>
                        )}

                        {/* 2. CỤM NÚT BẤM DỰA TRÊN TRẠNG THÁI */}
                        <div className="flex gap-2">
                          {room.status === "available" ? (
                            <button
                              onClick={() => handleOpenQuickBook(room)}
                              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                            >
                              Đặt phòng
                            </button>
                          ) : room.status === "occupied" ? (
  <div className="flex flex-col gap-2 w-full mt-4">
    {/* TẦNG 1: CHI TIẾT & THÊM DỊCH VỤ (Ở TRÊN) */}
    <div className="flex gap-2">
      {/* Nút Chi tiết - Mở Modal xem bill và thông tin khách */}
      <button
        onClick={() => {
          setSelectedBookingId(room.activeBooking?.id);
          setIsBookingDetailOpen(true);
        }}
        className="flex-1 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl font-black text-[10px] uppercase tracking-widest border border-indigo-100 dark:border-indigo-800 transition-all hover:bg-indigo-600 hover:text-white flex items-center justify-center gap-2 shadow-sm"
      >
        <Eye size={14} strokeWidth={3} /> Chi tiết
      </button>

      {/* Nút Thêm dịch vụ/Phụ phí nhanh - Icon dấu cộng nổi bật */}
      <button
        onClick={() => {
          setSelectedBookingId(room.activeBooking?.id);
          setIsBookingDetailOpen(true); // Trỏ thẳng vào Detail vì trong đó có form thêm dịch vụ rồi
        }}
        className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-800 transition-all hover:bg-blue-600 hover:text-white flex items-center justify-center"
        title="Thêm dịch vụ & Phụ phí"
      >
        <Plus size={18} strokeWidth={3} />
      </button>
    </div>

    {/* TẦNG 2: THANH TOÁN (NẰM DƯỚI CÙNG - TO VÀ RÕ) */}
    <button
      onClick={() =>
        handleUpdateStatus(
          room.activeBooking?.id || booking?.id,
          "checked_out",
          "Tiến hành thanh toán",
        )
      }
      className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-[11px] uppercase tracking-wider shadow-lg shadow-rose-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
    >
      <Receipt size={16} /> Thanh toán
    </button>
  </div>
) : (
                            /* Trạng thái Maintenance / Dọn dẹp */
                            <button
                              onClick={() => handleMarkAsReady(room.id)}
                              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                            >
                              <CheckCircle2 size={14} /> Xác nhận sạch
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State */
              <div className="p-20 text-center text-gray-400 font-black uppercase text-[12px] tracking-widest">
                Không tìm thấy phòng phù hợp
              </div>
            )
          ) : /* BOOKING LIST (CONFIRMED / CHECKED_IN) */
          filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="p-6 hover:bg-blue-50/30 dark:hover:bg-gray-700/30 transition-all border-b border-gray-100 dark:border-gray-800 last:border-0"
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
                          {new Date(booking.check_in_date).toLocaleDateString(
                            "vi-VN",
                          )}{" "}
                          →{" "}
                          {new Date(booking.check_out_date).toLocaleDateString(
                            "vi-VN",
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Nút hành động - ĐÃ GIA CỐ LOGIC CHẶN ĐÈ PHÒNG */}
                  <div className="mt-4 lg:mt-0 flex-shrink-0">
                    {activeTab === "confirmed" ? (
                      <button
                        // Tìm status của phòng trong mảng rooms để khóa nút
                        disabled={
                          rooms.find((r) => r.id === booking.room_id)
                            ?.status !== "available"
                        }
                        onClick={() =>
                          handleUpdateStatus(
                            booking.id,
                            "checked_in",
                            "Nhận phòng thành công",
                          )
                        }
                        className={`w-full lg:w-auto px-8 py-3.5 rounded-2xl font-extrabold text-[13px] uppercase tracking-wider transition-all active:scale-95 shadow-lg ${
                          rooms.find((r) => r.id === booking.room_id)
                            ?.status === "available"
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30"
                            : "bg-gray-400 cursor-not-allowed text-gray-200 shadow-none opacity-60"
                        }`}
                      >
                        {rooms.find((r) => r.id === booking.room_id)?.status ===
                        "available"
                          ? "Nhận Phòng"
                          : "Phòng bận"}
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            booking.id,
                            "checked_out",
                            "Thanh toán thành công",
                          )
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
      {/* MODAL CHI TIẾT ĐẶT PHÒNG */}
      {isBookingDetailOpen && selectedBookingId && (
        <BookingDetail
          bookingId={selectedBookingId}
          onClose={() => {
            setIsBookingDetailOpen(false);
            loadData(); // Load lại data để cập nhật tiền nong nếu có thêm dịch vụ
          }}
        />
      )}

      {isBookingFormOpen && (
        <BookingForm
          initialRoom={selectedRoomToBook} // Truyền phòng đã chọn vào đây
          onClose={() => {
            setIsBookingFormOpen(false);
            setSelectedRoomToBook(null);
          }}
          onSave={() => loadData()} // Load lại data sau khi đặt thành công
        />
      )}
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
