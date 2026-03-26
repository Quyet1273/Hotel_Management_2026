import { useState, useEffect, useMemo } from 'react';
// Lưu ý: Nếu tên file service của bác là reportDashboardService.ts thì đổi lại đường dẫn nhé
import { reportService } from '../services/reportDashboardService';
import { roomService, Room } from '../services/roomService';
import { checkInOutService } from '../services/checkInOutService';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { AlertCircle, Zap, DollarSign, TrendingUp, Bed } from 'lucide-react';

// FIX 1: Định nghĩa rõ tham số là 'any' và kết quả trả về luôn là 'string'
const formatYAxis = (value: any): string => {
  const num = Number(value);
  if (isNaN(num)) return String(value);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
  return String(num); // Bắt buộc bọc trong String()
};

export function ReportDashboard() {
  // 1. STATES
  const [loading, setLoading] = useState(true);
  
  // State của Báo cáo dòng tiền
  const [stats, setStats] = useState({ revenue: 0, expense: 0, profit: 0, occupancyRate: 0, dirtyRooms: 0 });
  const [chartData, setChartData] = useState<any[]>([]); 
  const [transactions, setTransactions] = useState<any[]>([]);

  // State của 4 Pie Charts
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  // Khoảng thời gian mặc định: 30 ngày
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  // 2. FETCH DATA
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();

      // Gọi API song song
      const [financialRes, roomStatsRes, transRes, timeSeriesRes, roomsRes, checkInOutRes] = await Promise.all([
        reportService.getFinancialStats(startISO, endISO),
        reportService.getRoomStats(),
        reportService.getRecentTransactions(),
        reportService.getFinancialTimeSeriesData(startISO, endISO),
        roomService.getAllRooms(),
        checkInOutService.getCheckInOutList()
      ]);

      // Set data Dòng tiền
      setStats({
        revenue: financialRes.data?.totalRevenue || 0,
        expense: financialRes.data?.totalExpense || 0,
        profit: financialRes.data?.profit || 0,
        occupancyRate: roomStatsRes.data?.occupancyRate || 0,
        dirtyRooms: roomStatsRes.data?.dirtyRooms || 0
      });
      setTransactions(transRes.data || []);
      setChartData(timeSeriesRes.data || []);

      // Set data Pie Charts
      if (roomsRes.success) setRooms(roomsRes.data || []);
      if (checkInOutRes.success) setBookings(checkInOutRes.data || []);

      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  // 3. XỬ LÝ DỮ LIỆU CHO 4 PIE CHARTS
  const filteredBookings = useMemo(() => {
    const fromStr = startDate.toISOString().split("T")[0];
    const toStr = endDate.toISOString().split("T")[0];
    return bookings.filter((b) => {
      if (!b.check_in_date) return false;
      const checkInDate = b.check_in_date.split("T")[0];
      return checkInDate >= fromStr && checkInDate <= toStr;
    });
  }, [bookings]);

  // a. Doanh thu theo loại phòng
  const revenueByRoomTypeMap: Record<string, number> = {};
  filteredBookings.forEach((b) => {
    if (b.status === "checked_in" || b.status === "checked_out") {
      const type = b.rooms?.room_type === "single" ? "Phòng Đơn"
        : b.rooms?.room_type === "double" ? "Phòng Đôi"
        : b.rooms?.room_type === "suite" ? "Suite"
        : b.rooms?.room_type === "deluxe" ? "Deluxe" : "Khác";
      revenueByRoomTypeMap[type] = (revenueByRoomTypeMap[type] || 0) + (Number(b.total_amount) || 0);
    }
  });
  const roomTypeColors: Record<string, string> = { "Phòng Đơn": "#93c5fd", "Phòng Đôi": "#c4b5fd", Suite: "#fcd34d", Deluxe: "#f9a8d4", Khác: "#cbd5e1" };
  const revenueByRoomType = Object.keys(revenueByRoomTypeMap).map(key => ({ name: key, value: revenueByRoomTypeMap[key], color: roomTypeColors[key] })).filter(item => item.value > 0);

  // b. Trạng thái phòng hiện tại
  const availableRooms = rooms.filter((r) => r.status === "available").length;
  const occupiedRooms = rooms.filter((r) => r.status === "occupied").length;
  const roomStatusData = [
    { name: "Trống", value: availableRooms, color: "#86efac" },
    { name: "Đang ở", value: occupiedRooms, color: "#f87171" },
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
  const serviceRevenue = Object.keys(serviceRevenueMap).map(key => ({ name: key, value: serviceRevenueMap[key] })).filter(item => item.value > 0);

  // 4. RENDER
  if (loading) return <div className="p-10 text-center text-gray-500 animate-pulse">Đang tải toàn bộ dữ liệu thống kê...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Báo Cáo & Thống Kê Tổng Hợp</h2>
        <p className="text-gray-600">Dữ liệu 30 ngày gần đây</p>
      </div>

      {/* --- PHẦN 1: KPI CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KpiCard title="Tổng Doanh Thu" value={stats.revenue} color="text-emerald-600" icon={DollarSign} />
        <KpiCard title="Tổng Chi Phí" value={stats.expense} color="text-rose-600" icon={Zap} />
        <KpiCard title="Lợi Nhuận Gộp" value={stats.profit} color="text-blue-600" icon={TrendingUp} />
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm font-medium">Công Suất Phòng</p>
          <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{stats.occupancyRate}%</h3>
        </div>
      </div>

      {/* --- PHẦN 2: AREA CHART DÒNG TIỀN --- */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Biến động Dòng Tiền Thu - Chi</h3>
        <div className="h-80 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
                {/* FIX 2: Để value là kiểu any thay vì number */}
                <RechartsTooltip 
                  contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                  formatter={(value: any) => `${Number(value).toLocaleString('vi-VN')} đ`} 
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }} />
                <Area type="monotone" dataKey="revenue" name="Doanh Thu" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                <Area type="monotone" dataKey="expense" name="Chi Phí" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="flex justify-center h-full text-gray-400">Chưa có dữ liệu giao dịch</div>}
        </div>
      </div>

      {/* --- PHẦN 3: 4 PIE CHARTS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Doanh thu theo loại phòng */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '1.5rem', border: '1px solid rgba(229,231,235,0.5)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(229,231,235,0.5)', background: 'linear-gradient(to right, #eff6ff, #eef2ff)' }}>
            <div className="flex items-center gap-3">
              <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'linear-gradient(to bottom right, #3b82f6, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={24} color="#ffffff" />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>Doanh Thu Theo Loại Phòng</h2>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Phân bố doanh thu thực tế</p>
              </div>
            </div>
          </div>
          <div style={{ padding: '24px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={revenueByRoomType} cx="50%" cy="50%" labelLine={false} label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={100} dataKey="value">
                  {revenueByRoomType.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                {/* FIX 2 Tương tự cho PieChart tooltip */}
                <RechartsTooltip formatter={(value: any) => [`${Number(value).toLocaleString("vi-VN")}₫`, "Doanh thu"]} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Trạng thái phòng hiện tại */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '1.5rem', border: '1px solid rgba(229,231,235,0.5)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(229,231,235,0.5)', background: 'linear-gradient(to right, #f0fdf4, #ecfdf5)' }}>
            <div className="flex items-center gap-3">
              <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: 'linear-gradient(to bottom right, #22c55e, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bed size={24} color="#ffffff" />
              </div>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>Trạng Thái Phòng</h2>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Tổng số {rooms.length} phòng hiện tại</p>
              </div>
            </div>
          </div>
          <div style={{ padding: '24px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={roomStatusData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={100} dataKey="value">
                  {roomStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip formatter={(value: any) => [`${value} phòng`, "Số lượng"]} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Cơ cấu Loại phòng */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '1.5rem', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', margin: 0, textTransform: 'uppercase' }}>Cơ Cấu Loại Phòng</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0', fontWeight: 500 }}>Phân bố theo số lượng thực tế</p>
          </div>
          <div style={{ padding: '24px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={roomTypeData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={90} dataKey="value">
                  {roomTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip formatter={(value: any) => [`${value} phòng`, "Số lượng"]} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Doanh thu dịch vụ */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '1.5rem', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', margin: 0, textTransform: 'uppercase' }}>Doanh Thu Dịch Vụ</h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0', fontWeight: 500 }}>Phân bố doanh thu từ các order dịch vụ</p>
          </div>
          <div style={{ padding: '24px' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={serviceRevenue} cx="50%" cy="50%" labelLine={false} label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={90} dataKey="value">
                  {serviceRevenue.map((entry, index) => <Cell key={`cell-${index}`} fill={serviceColors[index % serviceColors.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value: any) => [`${Number(value).toLocaleString("vi-VN")}₫`, "Doanh thu"]} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* --- PHẦN 4: GIAO DỊCH GẦN ĐÂY --- */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <h3 className="p-5 font-bold border-b text-gray-900 text-lg">Dòng tiền gần đây (Thu / Chi)</h3>
        <div className="divide-y divide-gray-50">
          {transactions.length > 0 ? transactions.map((trx, i) => (
            <div key={i} className="p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trx.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {trx.type === 'INCOME' ? <DollarSign size={20} /> : <Zap size={20} />}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{trx.title}</p>
                  <p className="text-xs text-gray-500">{new Date(trx.date).toLocaleString('vi-VN')}</p>
                </div>
              </div>
              <div className={`font-bold text-lg ${trx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trx.type === 'INCOME' ? '+' : '-'}{trx.amount.toLocaleString()} đ
              </div>
            </div>
          )) : <div className="p-10 text-center text-gray-500">Chưa có giao dịch nào.</div>}
        </div>
      </div>
    </div>
  );
}

// Component con KPI Card
function KpiCard({ title, value, color, icon: Icon }: { title: string, value: number, color: string, icon: any }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 text-gray-500">
        <Icon size={18} />
        <p className="text-sm font-medium">{title}</p>
      </div>
      <h3 className={`text-3xl font-extrabold mt-2 ${color}`}>
        {value.toLocaleString()} đ
      </h3>
    </div>
  );
}