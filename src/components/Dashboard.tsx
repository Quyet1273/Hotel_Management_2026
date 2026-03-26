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
    { id: "hcm1", name: "Chi nhánh Quận 1" }, // Có thể mở rộng sau nếu DB có branch_id
  ];

  // 2. FETCH DATA KHI RENDER
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [roomsRes, checkInOutRes] = await Promise.all([
          roomService.getAllRooms(),
          checkInOutService.getCheckInOutList(),
          // getCheckInOutList đã bao gồm thông tin guests, rooms, service_orders
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

  // Tổng số lượng khách duy nhất đã từng đặt phòng (hoặc nằm trong filter)
  const uniqueGuestsCount = new Set(filteredBookings.map((b) => b.guest_id))
    .size;

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
      change: "+12%", // Bạn có thể tính toán số % so với tháng trước nếu muốn
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
  // a. Doanh thu theo loại phòng
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

  // b. Trạng thái phòng hiện tại (Dùng mảng rooms gốc)
  const roomStatusData = [
    { name: "Trống", value: availableRooms, color: "#86efac" },
    { name: "Đang ở", value: occupiedRooms, color: "#f87171" },
    {
      name: "Đã đặt",
      value: rooms.filter((r) => r.status === "reserved").length,
      color: "#93c5fd",
    },
    {
      name: "Bảo trì",
      value: rooms.filter((r) => r.status === "maintenance").length,
      color: "#fcd34d",
    },
  ].filter((item) => item.value > 0);

  // c. Tỉ lệ số lượng Loại phòng hiện có (Dùng mảng rooms gốc)
  const roomTypeData = [
    {
      name: "Phòng Đơn",
      value: rooms.filter((r) => r.room_type === "single").length,
      color: "#93c5fd",
    },
    {
      name: "Phòng Đôi",
      value: rooms.filter((r) => r.room_type === "double").length,
      color: "#c4b5fd",
    },
    {
      name: "Suite",
      value: rooms.filter((r) => r.room_type === "suite").length,
      color: "#fcd34d",
    },
    {
      name: "Deluxe",
      value: rooms.filter((r) => r.room_type === "deluxe").length,
      color: "#f9a8d4",
    },
  ].filter((item) => item.value > 0);

  // d. Doanh thu theo loại dịch vụ
  const serviceRevenueMap: Record<string, number> = {};
  filteredBookings.forEach((b) => {
    if (b.status === "checked_in" || b.status === "checked_out") {
      b.service_orders?.forEach((order: any) => {
        const serviceName = order.services?.name || "Dịch vụ khác";
        serviceRevenueMap[serviceName] =
          (serviceRevenueMap[serviceName] || 0) +
          (Number(order.total_price) || 0);
      });
    }
  });

  const serviceColors = [
    "#93c5fd",
    "#c4b5fd",
    "#fcd34d",
    "#f9a8d4",
    "#86efac",
    "#fda4af",
  ];
  const serviceRevenue = Object.keys(serviceRevenueMap)
    .map((key) => ({ name: key, value: serviceRevenueMap[key] }))
    .filter((item) => item.value > 0);

  // Lấy 5 đơn đặt phòng gần đây nhất
  const recentBookings = [...bookings].slice(0, 5);

  // MÀN HÌNH LOADING
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] w-full">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">
          Đang đồng bộ dữ liệu tổng quan...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* THÔNG TIN LỌC */}
    <div 
  className="shadow-sm"
  style={{ 
    backgroundColor: '#ffffff', 
    borderRadius: '1rem', 
    border: '1px solid rgba(229, 231, 235, 0.5)', 
    padding: '20px' 
  }}
>
  <div className="flex items-center gap-4 flex-wrap">
    {/* Nhãn bộ lọc */}
    <div className="flex items-center gap-2" style={{ color: '#94a3b8' }}>
      <Filter className="w-5 h-5" />
      <span style={{ fontSize: '14px', fontWeight: 500, color: '#4b5563' }}>
        Bộ lọc:
      </span>
    </div>

    {/* Các ô nhập liệu */}
    <div className="flex gap-4 flex-1 flex-wrap">
      
      {/* Chọn cơ sở */}
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4" style={{ color: '#6b7280' }} />
        <label style={{ fontSize: '14px', color: '#4b5563', fontWeight: 500 }}>
          Cơ sở:
        </label>
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          style={{ 
            padding: '8px 16px', 
            border: '1px solid #e5e7eb', 
            borderRadius: '0.75rem', 
            fontSize: '14px', 
            backgroundColor: '#f9fafb',
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>

      {/* Ngày bắt đầu */}
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4" style={{ color: '#6b7280' }} />
        <label style={{ fontSize: '14px', color: '#4b5563', fontWeight: 500 }}>
          Từ ngày:
        </label>
        <input
          type="date"
          value={dateRange.from}
          onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
          style={{ 
            padding: '8px 16px', 
            border: '1px solid #e5e7eb', 
            borderRadius: '0.75rem', 
            fontSize: '14px', 
            backgroundColor: '#f9fafb',
            outline: 'none'
          }}
        />
      </div>

      {/* Ngày kết thúc */}
      <div className="flex items-center gap-2">
        <label style={{ fontSize: '14px', color: '#4b5563', fontWeight: 500 }}>
          Đến ngày:
        </label>
        <input
          type="date"
          value={dateRange.to}
          onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
          style={{ 
            padding: '8px 16px', 
            border: '1px solid #e5e7eb', 
            borderRadius: '0.75rem', 
            fontSize: '14px', 
            backgroundColor: '#f9fafb',
            outline: 'none'
          }}
        />
      </div>

    </div>
  </div>
</div>

    {/* BIỂU ĐỒ CHÍNH - Responsive Grid giữ lại Tailwind */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Doanh thu theo loại phòng */}
        <div 
          className="transition-all duration-300"
          style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '1.5rem', 
            border: '1px solid rgba(229, 231, 235, 0.5)', 
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 
            overflow: 'hidden' 
          }}
        >
          {/* Header với Gradient CSS */}
          <div style={{ 
            padding: '24px', 
            borderBottom: '1px solid rgba(229, 231, 235, 0.5)', 
            background: 'linear-gradient(to right, #eff6ff, #eef2ff)' 
          }}>
            <div className="flex items-center gap-3">
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '0.75rem', 
                background: 'linear-gradient(to bottom right, #3b82f6, #4f46e5)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)' 
              }}>
                <DollarSign size={24} color="#ffffff" />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                  Doanh Thu Theo Loại Phòng
                </h2>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px', margin: 0 }}>
                  Phân bố doanh thu thực tế
                </p>
              </div>
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueByRoomType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  // Logic tính % giữ nguyên 100%
                  label={({ name, value }: any) => {
                    const total = revenueByRoomType.reduce(
                      (sum, item) => sum + item.value,
                      0,
                    );
                    return `${name}: ${total > 0 ? ((value / total) * 100).toFixed(0) : 0}%`;
                  }}
                  outerRadius={100}
                  dataKey="value"
                >
                  {revenueByRoomType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [
                    `${Number(value).toLocaleString("vi-VN")}₫`,
                    "Doanh thu",
                  ]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Trạng thái phòng hiện tại */}
        <div 
          className="transition-all duration-300"
          style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '1.5rem', 
            border: '1px solid rgba(229, 231, 235, 0.5)', 
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 
            overflow: 'hidden' 
          }}
        >
          {/* Header với Green Gradient CSS */}
          <div style={{ 
            padding: '24px', 
            borderBottom: '1px solid rgba(229, 231, 235, 0.5)', 
            background: 'linear-gradient(to right, #f0fdf4, #ecfdf5)' 
          }}>
            <div className="flex items-center gap-3">
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '0.75rem', 
                background: 'linear-gradient(to bottom right, #22c55e, #10b981)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                boxShadow: '0 4px 6px rgba(34, 197, 94, 0.3)' 
              }}>
                <Bed size={24} color="#ffffff" />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                  Trạng Thái Phòng
                </h2>
                <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '2px', margin: 0 }}>
                  Tổng số {totalRooms} phòng hiện tại
                </p>
              </div>
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roomStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  // Logic tính % giữ nguyên 100%
                  label={({ name, value }: any) => {
                    const total = roomStatusData.reduce(
                      (sum, item) => sum + item.value,
                      0,
                    );
                    return `${name}: ${total > 0 ? ((value / total) * 100).toFixed(0) : 0}%`;
                  }}
                  outerRadius={100}
                  dataKey="value"
                >
                  {roomStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value} phòng`, "Số lượng"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
{/* BỘ CHỈ SỐ STATS (4 THẺ) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ gap: '24px' }}>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          
          // Map màu sắc cố định để tránh lỗi Tailwind không load màu
          const colorTheme = {
            blue: { grad: 'linear-gradient(135deg, #60a5fa, #3b82f6)', bg: '#eff6ff' },
            green: { grad: 'linear-gradient(135deg, #34d399, #10b981)', bg: '#ecfdf5' },
            purple: { grad: 'linear-gradient(135deg, #a78bfa, #8b5cf6)', bg: '#f5f3ff' },
            amber: { grad: 'linear-gradient(135deg, #fbbf24, #f59e0b)', bg: '#fffbeb' }
          };

          // Chọn theme dựa trên index hoặc label
          const theme = index === 0 ? colorTheme.blue : index === 1 ? colorTheme.green : index === 2 ? colorTheme.purple : colorTheme.amber;

          return (
            <div
              key={stat.label}
              style={{
                position: 'relative',
                backgroundColor: '#ffffff',
                borderRadius: '1.5rem',
                padding: '24px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                overflow: 'hidden'
              }}
              // Giả lập hiệu ứng hover của Tailwind bằng Inline Style
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.borderColor = '#f1f5f9';
              }}
            >
              {/* Lớp nền màu nhạt khi hover (thay thế group-hover opacity) */}
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: theme.bg,
                opacity: 0.3,
                zIndex: 0
              }}></div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: theme.grad,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}>
                    <Icon size={28} color="#ffffff" />
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    backgroundColor: '#f0fdf4',
                    color: '#16a34a',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700
                  }}>
                    <ArrowUp size={12} />
                    {stat.change}
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 600, margin: '0 0 4px 0' }}>
                    {stat.label}
                  </p>
                  <p style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
                    {stat.value}
                  </p>
                  <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {stat.subtext}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

  {/* CHECK-IN / CHECK-OUT HÔM NAY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nhận phòng */}
        <div 
          style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '1.5rem', 
            padding: '24px', 
            border: '1px solid #f1f5f9', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #22c55e, #10b981)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.25)'
            }}>
              <Calendar size={24} color="#ffffff" />
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Nhận Phòng Hôm Nay</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <p style={{ fontSize: '36px', fontWeight: 900, color: '#0f172a', margin: 0 }}>{todayCheckIns}</p>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0, fontWeight: 500 }}>lượt khách dự kiến đến</p>
          </div>
        </div>

        {/* Trả phòng */}
        <div 
          style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '1.5rem', 
            padding: '24px', 
            border: '1px solid #f1f5f9', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, #f43f5e, #e11d48)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 8px 16px -4px rgba(225, 29, 72, 0.25)'
            }}>
              <Calendar size={24} color="#ffffff" />
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Trả Phòng Hôm Nay</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <p style={{ fontSize: '36px', fontWeight: 900, color: '#0f172a', margin: 0 }}>{todayCheckOuts}</p>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0, fontWeight: 500 }}>lượt khách dự kiến đi</p>
          </div>
        </div>
      </div>

      {/* HAI BIỂU ĐỒ BÊN DƯỚI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Loại Phòng Phân Bổ */}
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '1.5rem', 
          border: '1px solid #f1f5f9', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cơ Cấu Loại Phòng</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0', fontWeight: 500 }}>Phân bố theo số lượng thực tế</p>
          </div>
          <div style={{ padding: '24px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roomTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {roomTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`${value} phòng`, "Số lượng"]}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Doanh thu dịch vụ */}
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '1.5rem', 
          border: '1px solid #f1f5f9', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Doanh Thu Dịch Vụ</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0', fontWeight: 500 }}>Phân bố doanh thu từ các order dịch vụ</p>
          </div>
          <div style={{ padding: '24px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceRevenue}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {serviceRevenue.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={serviceColors[index % serviceColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => [`${Number(value).toLocaleString("vi-VN")}₫`, "Doanh thu"]}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* BẢNG ĐẶT PHÒNG GẦN ĐÂY */}
      <div 
        className="overflow-hidden"
        style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '1.5rem', 
          border: '1px solid #f1f5f9', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' 
        }}
      >
        {/* Header của bảng */}
        <div style={{ 
          padding: '24px', 
          borderBottom: '1px solid #f1f5f9', 
          background: 'linear-gradient(to right, #f8fafc, #ffffff)' 
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Đặt Phòng Mới Nhất</h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', margin: 0 }}>
            Danh sách 5 lượt đặt/nhận phòng gần đây nhất
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Khách Hàng', 'Phòng', 'Ngày Đến', 'Ngày Đi', 'Trạng Thái'].map((header) => (
                  <th 
                    key={header}
                    style={{ 
                      padding: '16px 24px', 
                      textAlign: 'left', 
                      fontSize: '11px', 
                      fontWeight: 800, 
                      color: '#64748b', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em' 
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody style={{ backgroundColor: '#ffffff' }}>
              {recentBookings.length === 0 ? (
                <tr>
                  <td 
                    colSpan={5} 
                    style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}
                  >
                    Chưa có dữ liệu đặt phòng
                  </td>
                </tr>
              ) : (
                recentBookings.map((b) => {
                  // Chuyển đổi status sang Inline CSS để không bao giờ lỗi hiển thị
                  const getStatusStyle = (status: string) => {
                    const styles: any = {
                      pending: { bg: '#fef3c7', text: '#b45309', label: 'Chờ duyệt' },
                      confirmed: { bg: '#dbeafe', text: '#1d4ed8', label: 'Đã xác nhận' },
                      checked_in: { bg: '#dcfce7', text: '#15803d', label: 'Đã nhận phòng' },
                      checked_out: { bg: '#f3f4f6', text: '#374151', label: 'Đã trả phòng' },
                      cancelled: { bg: '#fee2e2', text: '#b91c1c', label: 'Đã hủy' },
                    };
                    return styles[status] || { bg: '#f1f5f9', text: '#475569', label: status };
                  };

                  const currentStatus = getStatusStyle(b.status);

                  return (
                    <tr 
                      key={b.id} 
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                    >
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>
                          {b.guests?.full_name || "Khách lẻ"}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#4f46e5' }}>
                          P.{b.rooms?.room_number || "---"}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: '#475569' }}>
                        {new Date(b.check_in_date).toLocaleDateString("vi-VN")}
                      </td>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: '#475569' }}>
                        {new Date(b.check_out_date).toLocaleDateString("vi-VN")}
                      </td>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            padding: '4px 12px',
                            fontSize: '11px',
                            fontWeight: 800,
                            borderRadius: '9999px',
                            textTransform: 'uppercase',
                            backgroundColor: currentStatus.bg,
                            color: currentStatus.text,
                            display: 'inline-block'
                          }}
                        >
                          {currentStatus.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
