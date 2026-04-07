import { useState, useEffect, useMemo } from "react";
import {
  Bed,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowUp,
  Filter,
  Building2,
  Loader2,
  Hotel, // Thêm icon Hotel cho Header
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

// Import các services thực tế
import { roomService, Room } from "../services/roomService";
import { checkInOutService } from "../services/checkInOutService";

export function Dashboard() {
  // 1. STATES
  const [isLoading, setIsLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  // Filters state
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  const branches = [
    { id: "all", name: "Tất cả cơ sở" },
    { id: "hcm1", name: "Chi nhánh Quận 1" },
  ];

  // 2. FETCH DATA KHI RENDER
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [roomsRes, checkInOutRes] = await Promise.all([
          roomService.getAllRooms(),
          checkInOutService.getCheckInOutList(),
        ]);

        if (roomsRes.success) setRooms(roomsRes.data || []);
        if (checkInOutRes.success) setBookings(checkInOutRes.data || []);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu Dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 3. LỌC DỮ LIỆU THEO NGÀY (Dựa vào filter)
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (!b.check_in_date) return false;
      const checkInDate = b.check_in_date.split("T")[0];
      return checkInDate >= dateRange.from && checkInDate <= dateRange.to;
    });
  }, [bookings, dateRange]);

  // 4. TÍNH TOÁN CÁC CHỈ SỐ STATS
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
  const availableRooms = rooms.filter((r) => r.status === "available").length;
  const occupancyRate =
    totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : "0.0";

  const uniqueGuestsCount = new Set(filteredBookings.map((b) => b.guest_id)).size;

  const totalRevenue = filteredBookings
    .filter((b) => b.status === "checked_in" || b.status === "checked_out")
    .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);

  const today = new Date().toISOString().split("T")[0];
  const todayCheckIns = bookings.filter(
    (b) => b.check_in_date?.startsWith(today) && b.status === "confirmed",
  ).length;

  const todayCheckOuts = bookings.filter(
    (b) => b.check_out_date?.startsWith(today) && b.status === "checked_in",
  ).length;

  const stats = [
    {
      label: "Tổng Số Phòng",
      value: totalRooms,
      subtext: `${availableRooms} phòng trống`,
      icon: Bed,
      gradient: "from-blue-400 to-blue-500",
      bgGradient: "from-blue-50 to-blue-100/50",
      change: "+12%",
    },
    {
      label: "Tỷ Lệ Lấp Đầy",
      value: `${occupancyRate}%`,
      subtext: `${occupiedRooms} phòng đang ở`,
      icon: TrendingUp,
      gradient: "from-green-400 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-100/50",
      change: "+8%",
    },
    {
      label: "Khách Đặt Phòng",
      value: uniqueGuestsCount,
      subtext: "Trong kỳ này",
      icon: Users,
      gradient: "from-purple-400 to-purple-500",
      bgGradient: "from-purple-50 to-purple-100/50",
      change: "+23%",
    },
    {
      label: "Doanh Thu",
      value: `${totalRevenue.toLocaleString("vi-VN")}đ`,
      subtext: "Đã thu (Trong kỳ)",
      icon: DollarSign,
      gradient: "from-amber-400 to-orange-500",
      bgGradient: "from-amber-50 to-orange-100/50",
      change: "+15%",
    },
  ];

  // 5. TÍNH TOÁN DATA CHO CÁC BIỂU ĐỒ TRÒN
  const revenueByRoomTypeMap: Record<string, number> = {};
  filteredBookings.forEach((b) => {
    if (b.status === "checked_in" || b.status === "checked_out") {
      const type =
        b.rooms?.room_type === "single"
          ? "Phòng Đơn"
          : b.rooms?.room_type === "double"
            ? "Phòng Đôi"
            : b.rooms?.room_type === "suite"
              ? "Suite"
              : b.rooms?.room_type === "deluxe"
                ? "Deluxe"
                : "Khác";
      revenueByRoomTypeMap[type] =
        (revenueByRoomTypeMap[type] || 0) + (Number(b.total_amount) || 0);
    }
  });

  const roomTypeColors: Record<string, string> = {
    "Phòng Đơn": "#93c5fd",
    "Phòng Đôi": "#c4b5fd",
    Suite: "#fcd34d",
    Deluxe: "#f9a8d4",
    Khác: "#cbd5e1",
  };

  const revenueByRoomType = Object.keys(revenueByRoomTypeMap)
    .map((key) => ({
      name: key,
      value: revenueByRoomTypeMap[key],
      color: roomTypeColors[key],
    }))
    .filter((item) => item.value > 0);

  const roomStatusData = [
    { name: "Trống", value: availableRooms, color: "#86efac" },
    { name: "Đang ở", value: occupiedRooms, color: "#f87171" },
    { name: "Đã đặt", value: rooms.filter((r) => r.status === "reserved").length, color: "#93c5fd" },
    { name: "Bảo trì", value: rooms.filter((r) => r.status === "maintenance").length, color: "#fcd34d" },
  ].filter((item) => item.value > 0);

  const roomTypeData = [
    { name: "Phòng Đơn", value: rooms.filter((r) => r.room_type === "single").length, color: "#93c5fd" },
    { name: "Phòng Đôi", value: rooms.filter((r) => r.room_type === "double").length, color: "#c4b5fd" },
    { name: "Suite", value: rooms.filter((r) => r.room_type === "suite").length, color: "#fcd34d" },
    { name: "Deluxe", value: rooms.filter((r) => r.room_type === "deluxe").length, color: "#f9a8d4" },
  ].filter((item) => item.value > 0);

  const serviceRevenueMap: Record<string, number> = {};
  filteredBookings.forEach((b) => {
    if (b.status === "checked_in" || b.status === "checked_out") {
      b.service_orders?.forEach((order: any) => {
        const serviceName = order.services?.name || "Dịch vụ khác";
        serviceRevenueMap[serviceName] = (serviceRevenueMap[serviceName] || 0) + (Number(order.total_price) || 0);
      });
    }
  });

  const serviceColors = ["#93c5fd", "#c4b5fd", "#fcd34d", "#f9a8d4", "#86efac", "#fda4af"];
  const serviceRevenue = Object.keys(serviceRevenueMap)
    .map((key) => ({ name: key, value: serviceRevenueMap[key] }))
    .filter((item) => item.value > 0);

  const recentBookings = [...bookings].slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] w-full">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Đang đồng bộ dữ liệu tổng quan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans antialiased">
      
      {/* HEADER BANNER - ĐỒNG BỘ MÀU NỀN #D1F4FA VỚI SIDEBAR */}
      <div className="bg-[#D1F4FA] dark:bg-gray-800 rounded-[2rem] p-8 flex justify-between items-center shadow-sm border border-blue-100 dark:border-gray-700">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-600/10 dark:bg-white/10 rounded-2xl flex items-center justify-center">
            <Hotel className="w-8 h-8 text-blue-700 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">
              Bảng Điều Khiển Hệ Thống
            </h1>
          </div>
        </div>
      </div>

      {/* THÔNG TIN LỌC */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/50 dark:border-gray-700 p-5 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Filter className="w-5 h-5" />
            <span className="text-[15px] font-bold text-gray-700 dark:text-gray-300">Bộ lọc:</span>
          </div>

          <div className="flex gap-4 flex-1 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <label className="text-[14px] font-semibold text-gray-700 dark:text-gray-300">Từ ngày:</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-[14px] font-medium bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[14px] font-semibold text-gray-700 dark:text-gray-300">Đến ngày:</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-[14px] font-medium bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* BỘ CHỈ SỐ STATS (4 THẺ) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorTheme = {
            blue: "from-blue-400 to-blue-600 shadow-blue-500/30",
            green: "from-emerald-400 to-emerald-600 shadow-emerald-500/30",
            purple: "from-purple-400 to-purple-600 shadow-purple-500/30",
            amber: "from-amber-400 to-amber-500 shadow-amber-500/30",
          };
          const themeClass = index === 0 ? colorTheme.blue : index === 1 ? colorTheme.green : index === 2 ? colorTheme.purple : colorTheme.amber;

          return (
            <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-slate-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${themeClass} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                    <Icon size={28} className="text-white" />
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-xs font-bold">
                    <ArrowUp size={12} /> {stat.change}
                  </div>
                </div>
                <div>
                  <p className="text-[15px] font-bold text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1 tracking-tight">{stat.value}</p>
                  <p className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{stat.subtext}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* BIỂU ĐỒ CHÍNH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/50 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200/50 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-gray-800 dark:to-gray-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                <DollarSign size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Doanh Thu Theo Loại Phòng</h2>
                <p className="text-[14px] font-semibold text-gray-500 dark:text-gray-400">Phân bố doanh thu thực tế</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={revenueByRoomType} cx="50%" cy="50%" labelLine={false} label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={100} dataKey="value">
                  {revenueByRoomType.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString("vi-VN")}₫`, "Doanh thu"]} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontWeight: 600, fontSize: "14px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200/50 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200/50 dark:border-gray-700 bg-gradient-to-r from-green-50 to-emerald-50/50 dark:from-gray-800 dark:to-gray-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/20">
                <Bed size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Trạng Thái Phòng</h2>
                <p className="text-[14px] font-semibold text-gray-500 dark:text-gray-400">Tổng số {totalRooms} phòng hiện tại</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={roomStatusData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={100} dataKey="value">
                  {roomStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value} phòng`, "Số lượng"]} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontWeight: 600, fontSize: "14px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* BẢNG ĐẶT PHÒNG GẦN ĐÂY */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-slate-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Đặt Phòng Mới Nhất</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-gray-800/80 border-b border-slate-200 dark:border-gray-700">
                {["Khách Hàng", "Phòng", "Ngày Đến", "Ngày Đi", "Trạng Thái"].map((header) => (
                  <th key={header} className="p-4 px-6 text-[12px] font-extrabold text-slate-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-slate-100 dark:divide-gray-700">
              {recentBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="p-4 px-6 text-[15px] font-bold text-gray-900 dark:text-white">
                    {b.guests?.full_name || "Khách lẻ"}
                  </td>
                  <td className="p-4 px-6">
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400">P.{b.rooms?.room_number || "---"}</span>
                  </td>
                  <td className="p-4 px-6 text-[14px] font-semibold text-gray-600 dark:text-gray-300">
                    {new Date(b.check_in_date).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="p-4 px-6 text-[14px] font-semibold text-gray-600 dark:text-gray-300">
                    {new Date(b.check_out_date).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="p-4 px-6">
                    <span className="px-3 py-1.5 text-[12px] font-extrabold rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 uppercase tracking-wider">
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}