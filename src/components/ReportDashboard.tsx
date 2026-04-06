import { useState, useEffect } from "react";
import { reportService } from "../services/reportDashboardService";
import { roomService, Room } from "../services/roomService";
import { checkInOutService } from "../services/checkInOutService";
import { invoiceService } from "../services/invoiceService";
import { inventoryService } from "../services/inventoryservice";

import * as XLSX from 'xlsx';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
} from "recharts";
import { 
  AlertCircle, DollarSign, TrendingUp, TrendingDown, 
  Calendar, Filter, Receipt, Download, PackageOpen 
} from "lucide-react";

// --- HELPERS ---
const formatYAxis = (value: any): string => {
  const num = Number(value);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
  return String(num);
};

export function ReportDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"invoice" | "inventory">("invoice"); // Tab mặc định

  // States dữ liệu
  const [filterOption, setFilterOption] = useState("30days");
  const [appliedFilter, setAppliedFilter] = useState("30days");
  const [stats, setStats] = useState({ revenue: 0, revenueTrend: 0, expense: 0, expenseTrend: 0, profit: 0, profitTrend: 0, occupancyRate: 0, occupancyTrend: 0, dirtyRooms: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [inventoryTransactions, setInventoryTransactions] = useState<any[]>([]);

  // Fetch data KPI & Biểu đồ
  useEffect(() => {
    const fetchMainData = async () => {
      setLoading(true);
      const end = new Date(); const start = new Date();
      if (appliedFilter === "today") start.setHours(0,0,0,0);
      else if (appliedFilter === "7days") start.setDate(end.getDate() - 7);
      else start.setDate(end.getDate() - 30);

      const [fin, room, time, inv, stock] = await Promise.all([
        reportService.getFinancialStats(start.toISOString(), end.toISOString()),
        reportService.getRoomStats(),
        reportService.getFinancialTimeSeriesData(start.toISOString(), end.toISOString()),
        invoiceService.getInvoiceList(),
        inventoryService.getTransactions()
      ]);

      setStats({
        revenue: fin.data?.totalRevenue || 0, revenueTrend: fin.data?.revenueTrend || 0,
        expense: fin.data?.totalExpense || 0, expenseTrend: fin.data?.expenseTrend || 0,
        profit: fin.data?.profit || 0, profitTrend: fin.data?.profitTrend || 0,
        occupancyRate: room.data?.occupancyRate || 0, occupancyTrend: fin.data?.occupancyTrend || 0,
        dirtyRooms: room.data?.dirtyRooms || 0,
      });
      setChartData(time.data || []);
      setInvoices(inv.data || []);
      setInventoryTransactions(stock.data || []);
      setLoading(false);
    };
    fetchMainData();
  }, [appliedFilter]);

  // Export Excel
  const handleExport = () => {
    const isInv = activeTab === "invoice";
    const data = isInv ? invoices.map((inv, i) => ({ "STT": i + 1, "Mã": inv.id?.substring(0,8), "Ngày": new Date(inv.created_at).toLocaleDateString(), "Khách": inv.guests?.full_name, "Tổng": inv.total_amount }))
                     : inventoryTransactions.map((ts, i) => ({ "STT": i + 1, "Ngày": new Date(ts.created_at).toLocaleString(), "Loại": ts.transaction_type, "Vật tư": ts.item_name || ts.inventory_items?.name, "Tổng": ts.total_amount }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Báo Cáo");
    XLSX.writeFile(wb, `Bao_Cao_${activeTab}.xlsx`);
  };

  if (loading) return <div className="p-10 text-center animate-pulse font-bold">ĐANG TẢI...</div>;

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h2 className="text-2xl font-black text-gray-900">Báo Cáo Thống Kê</h2>
        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm gap-2 text-sm font-bold">
          {["today", "7days", "30days"].map((opt) => (
            <button key={opt} onClick={() => setAppliedFilter(opt)} className={`px-4 py-1.5 rounded-xl transition-all ${appliedFilter === opt ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-500"}`}>
              {opt === "today" ? "Hôm nay" : opt === "7days" ? "7 ngày" : "30 ngày"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Doanh thu" value={`${(stats.revenue/1000).toLocaleString()}k`} trend={stats.revenueTrend} />
        <KpiCard title="Lợi nhuận" value={`${(stats.profit/1000).toLocaleString()}k`} trend={stats.profitTrend} />
        <KpiCard title="Chi phí" value={`${(stats.expense/1000).toLocaleString()}k`} trend={stats.expenseTrend} />
        <KpiCard title="Công suất" value={`${stats.occupancyRate}%`} trend={stats.occupancyTrend} />
      </div>

      {/* BIỂU ĐỒ */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" hide />
            <YAxis tickFormatter={formatYAxis} tick={{fontSize: 10}} axisLine={false} />
            <RechartsTooltip />
            <Area type="monotone" dataKey="revenue" name="Thu" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
            <Area type="monotone" dataKey="expense" name="Chi" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* TABS CHỌN BẢNG */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex p-1 bg-gray-100 rounded-xl gap-1">
            <button onClick={() => setActiveTab("invoice")} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "invoice" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              <Receipt size={16} /> Doanh thu phòng
            </button>
            {/* <button onClick={() => setActiveTab("inventory")} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "inventory" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              <PackageOpen size={16} /> Xuất / Nhập kho
            </button> */}
          </div>
          <button onClick={handleExport} className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">
            <Download size={20} />
          </button>
        </div>

        <div className="overflow-x-auto ">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-gray-50 shadow-sm text-blackcase text-[3x] font-black tracking-widest">
              <tr>
                <th className="p-4">STT</th>
                <th className="p-4">Thời gian</th>
                <th className="p-4">{activeTab === "invoice" ? "Khách hàng" : "Vật tư"}</th>
                <th className="p-4 text-right">Tổng tiền</th>
                <th className="p-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(activeTab === "invoice" ? invoices : inventoryTransactions).map((item, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-4 text-black">{i + 1}</td>
                  <td className="p-4 font-medium text-gray-600">{new Date(item.created_at).toLocaleDateString("vi-VN")}</td>
                  <td className="p-4 font-bold text-gray-800">{activeTab === "invoice" ? item.guests?.full_name : (item.item_name || item.inventory_items?.name)}</td>
                  <td className="p-4 text-right font-black text-gray-900">{item.total_amount?.toLocaleString()}đ</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.payment_method || item.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {item.payment_method || (item.payment_status === 'paid' ? 'Đã trả' : 'Nợ')}
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

function KpiCard({ title, value, trend }: any) {
  const isUp = trend >= 0;
  return (
    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{title}</p>
      <h3 className="text-xl font-black text-gray-900 mb-2">{value}</h3>
      <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
        {isUp ? '↑' : '↓'} {Math.abs(trend)}%
      </div>
    </div>
  );
}