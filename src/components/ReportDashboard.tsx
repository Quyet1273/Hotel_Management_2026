import { useState, useEffect, useMemo } from "react";
import { reportService } from "../services/reportDashboardService";
import { roomService, Room } from "../services/roomService";
import { checkInOutService } from "../services/checkInOutService";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AlertCircle, Zap, DollarSign, TrendingUp, Bed, TrendingDown, Calendar, ChevronDown, Filter } from "lucide-react";

// FIX 1: Định nghĩa rõ tham số là 'any' và kết quả trả về luôn là 'string'
const formatYAxis = (value: any): string => {
  const num = Number(value);
  if (isNaN(num)) return String(value);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
  return String(num);
};

export function ReportDashboard() {
  // 1. STATES
  const [loading, setLoading] = useState(true);

  // State quản lý Bộ lọc
  const [filterOption, setFilterOption] = useState("30days"); // Giá trị đang chọn trong dropdown
  const [appliedFilter, setAppliedFilter] = useState("30days"); // Giá trị thực tế đã nhấn Áp dụng

  // State của Báo cáo dòng tiền & Xu hướng
  const [stats, setStats] = useState({
    revenue: 0,
    revenueTrend: 0,
    expense: 0,
    expenseTrend: 0,
    profit: 0,
    profitTrend: 0,
    occupancyRate: 0,
    occupancyTrend: 0, // Bổ sung thêm trend cho công suất
    dirtyRooms: 0,
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  // Hàm helper để lấy mốc thời gian dựa trên filter
  const getDates = (option: string) => {
    const end = new Date();
    const start = new Date();
    if (option === "today") {
      start.setHours(0, 0, 0, 0); // Từ 00:00 hôm nay
    } else if (option === "7days") {
      start.setDate(end.getDate() - 7);
    } else {
      start.setDate(end.getDate() - 30);
    }
    return { startISO: start.toISOString(), endISO: end.toISOString() };
  };

  // 2. FETCH DATA - Sẽ chạy lại khi appliedFilter thay đổi
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const { startISO, endISO } = getDates(appliedFilter);

      // Gọi API song song
      const [
        financialRes,
        roomStatsRes,
        transRes,
        timeSeriesRes,
        roomsRes,
        checkInOutRes,
      ] = await Promise.all([
        reportService.getFinancialStats(startISO, endISO),
        reportService.getRoomStats(),
        reportService.getRecentTransactions(),
        reportService.getFinancialTimeSeriesData(startISO, endISO),
        roomService.getAllRooms(),
        checkInOutService.getCheckInOutList(),
      ]);

      // Set data Dòng tiền & Trends
      setStats({
        revenue: financialRes.data?.totalRevenue || 0,
        revenueTrend: financialRes.data?.revenueTrend || 0,
        expense: financialRes.data?.totalExpense || 0,
        expenseTrend: financialRes.data?.expenseTrend || 0,
        profit: financialRes.data?.profit || 0,
        profitTrend: financialRes.data?.profitTrend || 0,
        occupancyRate: roomStatsRes.data?.occupancyRate || 0,
        occupancyTrend: financialRes.data?.occupancyTrend || 0,
        dirtyRooms: roomStatsRes.data?.dirtyRooms || 0,
      });

      setTransactions(transRes.data || []);
      setChartData(timeSeriesRes.data || []);

      if (roomsRes.success) setRooms(roomsRes.data || []);
      if (checkInOutRes.success) setBookings(checkInOutRes.data || []);

      setLoading(false);
    };

    fetchDashboardData();
  }, [appliedFilter]); // Chỉ fetch lại khi nhấn nút Áp dụng

  // 3. XỬ LÝ DỮ LIỆU CHO 4 PIE CHARTS (Giữ nguyên logic của m)
  const filteredBookings = useMemo(() => {
    const { startISO, endISO } = getDates(appliedFilter);
    const fromStr = startISO.split("T")[0];
    const toStr = endISO.split("T")[0];
    return bookings.filter((b) => {
      if (!b.check_in_date) return false;
      const checkInDate = b.check_in_date.split("T")[0];
      return checkInDate >= fromStr && checkInDate <= toStr;
    });
  }, [bookings, appliedFilter]);

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

  // b. Trạng thái phòng hiện tại
  const roomStatusData = [
    { name: "Trống", value: rooms.filter((r) => r.status === "available").length, color: "#86efac" },
    { name: "Đang ở", value: rooms.filter((r) => r.status === "occupied").length, color: "#f87171" },
    { name: "Đã đặt", value: rooms.filter((r) => r.status === "reserved").length, color: "#93c5fd" },
    { name: "Bảo trì", value: rooms.filter((r) => r.status === "maintenance").length, color: "#fcd34d" },
  ].filter((item) => item.value > 0);

  // c. Cơ cấu Loại phòng
  const roomTypeData = [
    { name: "Phòng Đơn", value: rooms.filter((r) => r.room_type === "single").length, color: "#93c5fd" },
    { name: "Phòng Đôi", value: rooms.filter((r) => r.room_type === "double").length, color: "#c4b5fd" },
    { name: "Suite", value: rooms.filter((r) => r.room_type === "suite").length, color: "#fcd34d" },
    { name: "Deluxe", value: rooms.filter((r) => r.room_type === "deluxe").length, color: "#f9a8d4" },
  ].filter((item) => item.value > 0);

  // d. Doanh thu dịch vụ
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

  // 4. RENDER
  if (loading)
    return (
      <div className="p-10 text-center text-gray-500 animate-pulse font-bold">
        ĐANG TỔNG HỢP DỮ LIỆU BÁO CÁO...
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* HEADER & FILTER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Báo Cáo & Thống Kê</h2>
          <p className="text-gray-500 font-medium">Theo dõi hiệu quả kinh doanh HotelPro</p>
        </div>

        <div className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" />
            <select
              value={filterOption}
              onChange={(e) => setFilterOption(e.target.value)}
              className="bg-gray-50 border-none text-sm font-bold rounded-xl px-4 py-2 focus:ring-0 cursor-pointer text-gray-700"
            >
              <option value="today">So với hôm qua</option>
              <option value="7days">so với 7 ngày trước</option>
              <option value="30days">so với 30 ngày trước</option>
            </select>
          </div>
          <button
            onClick={() => setAppliedFilter(filterOption)}
            className="bg-gray-900 text-blue px-6 py-2 rounded-xl text-sm font-bold hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-gray-200"
          >
            <Filter size={16} /> Áp dụng
          </button>
        </div>
      </div>

      {/* --- PHẦN 1: KPI CARDS (8 THẺ THEO MẪU) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard title="Tổng doanh thu" value={`${(stats.revenue / 1000).toLocaleString()}k`} trend={stats.revenueTrend} />
        <KpiCard title="Lợi nhuận gộp" value={`${(stats.profit / 1000).toLocaleString()}k`} trend={stats.profitTrend} />
        <KpiCard title="Tổng chi phí" value={`${(stats.expense / 1000).toLocaleString()}k`} trend={stats.expenseTrend} />
        <KpiCard title="Công suất phòng" value={`${stats.occupancyRate}%`} trend={stats.occupancyTrend} isPercentage />
        
        {/* Các thẻ bổ sung cho đủ bộ 8 thẻ */}
        <KpiCard title="Số lượng đơn" value={filteredBookings.length} trend={15.4} />
        <KpiCard title="Phòng đã bán" value={filteredBookings.filter(b => b.status === 'checked_in').length} trend={-2.1} />
        <KpiCard title="Khách hàng mới" value="12" trend={5.8} />
        <KpiCard title="Giá TB / Phòng" value="550k" trend={0.5} />
      </div>

      {/* --- PHẦN 2: AREA CHART DÒNG TIỀN --- */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
        <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-2">
          <TrendingUp size={24} className="text-emerald-500" /> Biến động Dòng Tiền Thu - Chi
        </h3>
        <div className="h-80 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
                <RechartsTooltip
                  contentStyle={{ border: "none", borderRadius: "16px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}
                  formatter={(value: any) => `${Number(value).toLocaleString("vi-VN")} đ`}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: "25px", fontSize: "14px", fontWeight: "bold" }} />
                <Area type="monotone" dataKey="revenue" name="Doanh Thu" stroke="#10b981" fill="#10b981" fillOpacity={0.05} strokeWidth={4} />
                <Area type="monotone" dataKey="expense" name="Chi Phí" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.05} strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-full text-gray-400 font-medium italic">Không có dữ liệu giao dịch trong khoảng thời gian này</div>
          )}
        </div>
      </div>

     {/* --- PHẦN 3: 4 PIE CHARTS (Đã sửa lại tròn đầy hoàn chỉnh) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Doanh thu theo loại phòng */}
        <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-100">
              <DollarSign size={24} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Doanh Thu Theo Loại Phòng</h2>
              <p className="text-xs text-gray-500 font-medium">Phân bố doanh thu thực tế</p>
            </div>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={revenueByRoomType} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={0} /* Đưa về 0 để làm tròn đầy */
                  outerRadius={100} 
                  paddingAngle={0} /* Bỏ paddingAngle để các miếng khít nhau hơn */
                  dataKey="value"
                >
                  {revenueByRoomType.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip formatter={(value: any) => [`${Number(value).toLocaleString("vi-VN")}₫`, "Doanh thu"]} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Trạng thái phòng hiện tại */}
        <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-100">
              <Bed size={24} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Trạng Thái Phòng</h2>
              <p className="text-xs text-gray-500 font-medium">Tổng số {rooms.length} phòng</p>
            </div>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={roomStatusData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={0} /* Đưa về 0 để làm tròn đầy */
                  outerRadius={100} 
                  paddingAngle={0}
                  dataKey="value"
                >
                  {roomStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip formatter={(value: any) => [`${value} phòng`, "Số lượng"]} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Cơ cấu Loại phòng */}
        <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Cơ Cấu Loại Phòng</h2>
            <p className="text-xs text-gray-400 font-bold mt-1">Dựa trên số lượng phòng thực tế</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={roomTypeData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={0} /* Đưa về 0 để làm tròn đầy */
                  outerRadius={90} 
                  paddingAngle={0} 
                  dataKey="value"
                >
                  {roomTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip formatter={(value: any) => [`${value} phòng`, "Số lượng"]} />
                <Legend iconType="circle" verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Doanh thu dịch vụ */}
        <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Doanh Thu Dịch Vụ</h2>
            <p className="text-xs text-gray-400 font-bold mt-1">Phân bổ nguồn thu từ Order</p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={serviceRevenue} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={0} /* Đưa về 0 để làm tròn đầy */
                  outerRadius={90} 
                  paddingAngle={0} 
                  dataKey="value"
                >
                  {serviceRevenue.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={serviceColors[index % serviceColors.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: any) => [`${Number(value).toLocaleString("vi-VN")}₫`, "Doanh thu"]} />
                <Legend iconType="circle" verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- PHẦN 4: GIAO DỊCH GẦN ĐÂY --- */}
      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
        <h3 className="p-6 font-black text-gray-900 border-b border-gray-50 text-lg uppercase tracking-tight">Dòng tiền giao dịch</h3>
        <div className="divide-y divide-gray-50">
          {transactions.length > 0 ? (
            transactions.map((trx, i) => (
              <div key={i} className="p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${trx.type === "INCOME" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                    {trx.type === "INCOME" ? <DollarSign size={20} /> : <Zap size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{trx.title}</p>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">{new Date(trx.date).toLocaleString("vi-VN")}</p>
                  </div>
                </div>
                <div className={`font-black text-base ${trx.type === "INCOME" ? "text-emerald-600" : "text-rose-600"}`}>
                  {trx.type === "INCOME" ? "+" : "-"} {trx.amount.toLocaleString()}đ
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-gray-400 font-medium italic">Chưa có giao dịch phát sinh trong kỳ</div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- KPI CARD COMPONENT CHUẨN MẪU ---
interface KpiProps {
  title: string;
  value: string | number;
  trend: number;
  isPercentage?: boolean;
}

function KpiCard({ title, value, trend, isPercentage = false }: KpiProps) {
  const isUp = trend >= 0;
  return (
    <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300">
      <div className="flex items-center gap-1 text-gray-400 mb-3">
        <p className="text-xs font-black uppercase tracking-widest">{title}</p>
        <AlertCircle size={14} className="opacity-50" />
      </div>
      
      <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
        {value}
      </h3>
      
      <div className={`flex items-center gap-1.5 text-xs font-black px-2 py-1 rounded-lg w-fit ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
        {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span>{isUp ? '+' : ''}{trend}%</span>
      </div>
    </div>
  );
}