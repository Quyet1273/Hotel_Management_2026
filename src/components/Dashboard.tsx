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
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER BANNER - CHUẨN STYLE KHO VẬT TƯ */}
      <div style={{ 
        backgroundColor: "#2563eb", borderRadius: "2rem", padding: "2rem", color: "#ffffff",
        display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 15px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ width: "4rem", height: "4rem", backgroundColor: "rgba(255, 255, 255, 0.2)", borderRadius: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Hotel style={{ width: "2rem", height: "2rem", color: "#ffffff" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.875rem", fontWeight: "900", margin: 0, textTransform: "uppercase" }}>Bảng Điều Khiển Hệ Thống</h1>
            <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: 0 }}>Chào mừng trở lại! Theo dõi hoạt động HotelPro của bạn.</p>
          </div>
        </div>
        {/* <button
          style={{ backgroundColor: "#ffffff", color: "#2563eb", padding: "0.8rem 1.5rem", borderRadius: "1rem", border: "none", fontWeight: "900", cursor: "pointer", textTransform: "uppercase", fontSize: "0.75rem" }}
        >
          Xuất Báo Cáo
        </button> */}
      </div>

      {/* THÔNG TIN LỌC */}
      <div
        className="shadow-sm"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "1rem",
          border: "1px solid rgba(229, 231, 235, 0.5)",
          padding: "20px",
        }}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2" style={{ color: "#94a3b8" }}>
            <Filter className="w-5 h-5" />
            <span style={{ fontSize: "14px", fontWeight: 500, color: "#4b5563" }}>Bộ lọc:</span>
          </div>

          <div className="flex gap-4 flex-1 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: "#6b7280" }} />
              <label style={{ fontSize: "14px", color: "#4b5563", fontWeight: 500 }}>Từ ngày:</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                style={{ padding: "8px 16px", border: "1px solid #e5e7eb", borderRadius: "0.75rem", fontSize: "14px", backgroundColor: "#f9fafb", outline: "none" }}
              />
            </div>

            <div className="flex items-center gap-2">
              <label style={{ fontSize: "14px", color: "#4b5563", fontWeight: 500 }}>Đến ngày:</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                style={{ padding: "8px 16px", border: "1px solid #e5e7eb", borderRadius: "0.75rem", fontSize: "14px", backgroundColor: "#f9fafb", outline: "none" }}
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
            blue: { grad: "linear-gradient(135deg, #60a5fa, #3b82f6)", bg: "#eff6ff" },
            green: { grad: "linear-gradient(135deg, #34d399, #10b981)", bg: "#ecfdf5" },
            purple: { grad: "linear-gradient(135deg, #a78bfa, #8b5cf6)", bg: "#f5f3ff" },
            amber: { grad: "linear-gradient(135deg, #fbbf24, #f59e0b)", bg: "#fffbeb" },
          };
          const theme = index === 0 ? colorTheme.blue : index === 1 ? colorTheme.green : index === 2 ? colorTheme.purple : colorTheme.amber;

          return (
            <div key={stat.label} style={{ position: "relative", backgroundColor: "#ffffff", borderRadius: "1.5rem", padding: "24px", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", transition: "all 0.3s ease", cursor: "pointer", overflow: "hidden" }}>
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: theme.grad, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}>
                    <Icon size={28} color="#ffffff" />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", backgroundColor: "#f0fdf4", color: "#16a34a", borderRadius: "8px", fontSize: "12px", fontWeight: 700 }}>
                    <ArrowUp size={12} /> {stat.change}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: "14px", color: "#64748b", fontWeight: 600, margin: "0 0 4px 0" }}>{stat.label}</p>
                  <p style={{ fontSize: "26px", fontWeight: 900, color: "#0f172a", margin: "0 0 4px 0", letterSpacing: "-0.5px" }}>{stat.value}</p>
                  <p style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>{stat.subtext}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* BIỂU ĐỒ CHÍNH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div style={{ backgroundColor: "#ffffff", borderRadius: "1.5rem", border: "1px solid rgba(229, 231, 235, 0.5)", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", overflow: "hidden" }}>
          <div style={{ padding: "24px", borderBottom: "1px solid rgba(229, 231, 235, 0.5)", background: "linear-gradient(to right, #eff6ff, #eef2ff)" }}>
            <div className="flex items-center gap-3">
              <div style={{ width: "48px", height: "48px", borderRadius: "0.75rem", background: "linear-gradient(to bottom right, #3b82f6, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 6px rgba(59, 130, 246, 0.3)" }}>
                <DollarSign size={24} color="#ffffff" />
              </div>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>Doanh Thu Theo Loại Phòng</h2>
                <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Phân bố doanh thu thực tế</p>
              </div>
            </div>
          </div>
          <div style={{ padding: "24px" }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={revenueByRoomType} cx="50%" cy="50%" labelLine={false} label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={100} dataKey="value">
                  {revenueByRoomType.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString("vi-VN")}₫`, "Doanh thu"]} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", borderRadius: "1.5rem", border: "1px solid rgba(229, 231, 235, 0.5)", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)", overflow: "hidden" }}>
          <div style={{ padding: "24px", borderBottom: "1px solid rgba(229, 231, 235, 0.5)", background: "linear-gradient(to right, #f0fdf4, #ecfdf5)" }}>
            <div className="flex items-center gap-3">
              <div style={{ width: "48px", height: "48px", borderRadius: "0.75rem", background: "linear-gradient(to bottom right, #22c55e, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 6px rgba(34, 197, 94, 0.3)" }}>
                <Bed size={24} color="#ffffff" />
              </div>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", margin: 0 }}>Trạng Thái Phòng</h2>
                <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Tổng số {totalRooms} phòng hiện tại</p>
              </div>
            </div>
          </div>
          <div style={{ padding: "24px" }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={roomStatusData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={100} dataKey="value">
                  {roomStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value} phòng`, "Số lượng"]} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* BẢNG ĐẶT PHÒNG GẦN ĐÂY */}
      <div className="overflow-hidden" style={{ backgroundColor: "#ffffff", borderRadius: "1.5rem", border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
        <div style={{ padding: "24px", borderBottom: "1px solid #f1f5f9", background: "linear-gradient(to right, #f8fafc, #ffffff)" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Đặt Phòng Mới Nhất</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse", minWidth: "600px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {["Khách Hàng", "Phòng", "Ngày Đến", "Ngày Đi", "Trạng Thái"].map((header) => (
                  <th key={header} style={{ padding: "16px 24px", textAlign: "left", fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ backgroundColor: "#ffffff" }}>
              {recentBookings.map((b) => (
                <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px 24px" }}><div style={{ fontSize: "14px", fontWeight: 600 }}>{b.guests?.full_name || "Khách lẻ"}</div></td>
                  <td style={{ padding: "16px 24px" }}><span style={{ fontWeight: 700, color: "#4f46e5" }}>P.{b.rooms?.room_number || "---"}</span></td>
                  <td style={{ padding: "16px 24px" }}>{new Date(b.check_in_date).toLocaleDateString("vi-VN")}</td>
                  <td style={{ padding: "16px 24px" }}>{new Date(b.check_out_date).toLocaleDateString("vi-VN")}</td>
                  <td style={{ padding: "16px 24px" }}>
                    <span style={{ padding: "4px 12px", fontSize: "11px", fontWeight: 800, borderRadius: "9999px", backgroundColor: "#dcfce7", color: "#15803d" }}>{b.status}</span>
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