import { useState, useEffect } from "react";
import { reportService } from "../services/reportDashboardService";
import { invoiceService } from "../services/invoiceService";
import { inventoryService } from "../services/inventoryservice";

import * as XLSX from "xlsx";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  BarChart,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Calendar, Download, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

// --- HELPERS: Format trục Y cho biểu đồ ---
const formatYAxis = (value: any): string => {
  const num = Number(value);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
  return String(num);
};

export function ReportDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"invoice" | "inventory">(
    "invoice",
  );
  const [appliedFilter, setAppliedFilter] = useState("30days");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [customType, setCustomType] = useState<"date" | "month">("date");

  // Reset trang về 1 mỗi khi đổi bộ lọc để tránh lỗi "trang trống"
  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFilter, selectedDate, activeTab]);

  // --- STATE STATS ĐẦY ĐỦ CÁC TRƯỜNG ---
  const [stats, setStats] = useState({
    revenue: 0,
    revenueTrend: 0,
    totalDiscount: 0,
    discountTrend: 0,
    actualRevenue: 0,
    actualRevenueTrend: 0,
    expense: 0,
    expenseTrend: 0,
    profit: 0,
    profitTrend: 0,
    occupancyRate: 0,
    occupancyTrend: 0,
    dirtyRooms: 0,
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [inventoryTransactions, setInventoryTransactions] = useState<any[]>([]);

  // --- FETCH DATA LOGIC ---
  useEffect(() => {
    const fetchMainData = async () => {
      setLoading(true);
      let start = new Date();
      let end = new Date();

      if (appliedFilter === "today") {
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
      } else if (appliedFilter === "7days") {
        start.setDate(end.getDate() - 7);
      } else if (appliedFilter === "30days") {
        start.setDate(end.getDate() - 30);
      } else if (appliedFilter === "custom") {
        start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(selectedDate);
        end.setHours(23, 59, 59, 999);
      }

      try {
        // 1. GỌI ĐÚNG - ĐỦ - ĐỀU CÁC SERVICE
        const [fin, room, time, invRes, stockRes] = await Promise.all([
          reportService.getFinancialStats(
            start.toISOString(),
            end.toISOString(),
          ),
          reportService.getRoomStats(),
          reportService.getFinancialTimeSeriesData(
            start.toISOString(),
            end.toISOString(),
          ),
          // Lấy Hóa đơn (Truyền đủ tham số)
          invoiceService.getInvoiceList(
            start.toISOString(),
            end.toISOString(),
            currentPage,
            pageSize,
          ),
          // Lấy Kho vật tư (Truyền đủ tham số)
          inventoryService.getTransactions(
            start.toISOString(),
            end.toISOString(),
            currentPage,
            pageSize,
          ),
        ]);

        // 2. CẬP NHẬT BIỂU ĐỒ VÀ KPI (Cái này chung cho cả 2 tab)
        setChartData(time.data || []);
        if (fin.success) {
          setStats({
            revenue: fin.data?.totalRevenue || 0,
            revenueTrend: fin.data?.revenueTrend || 0,
            totalDiscount: fin.data?.totalDiscount || 0,
            discountTrend: fin.data?.discountTrend || 0,
            actualRevenue: fin.data?.actualRevenue || 0,
            actualRevenueTrend: fin.data?.actualRevenueTrend || 0,
            expense: fin.data?.totalExpense || 0,
            expenseTrend: fin.data?.expenseTrend || 0,
            profit: fin.data?.profit || 0,
            profitTrend: fin.data?.profitTrend || 0,
            occupancyRate: room.data?.occupancyRate || 0,
            occupancyTrend: fin.data?.occupancyTrend || 0,
            dirtyRooms: room.data?.dirtyRooms || 0,
          });
        }

        // 3. CẬP NHẬT BẢNG DỮ LIỆU DỰA TRÊN TAB ĐANG MỞ
        if (activeTab === "invoice") {
          setInvoices(invRes.data || []);
          setTotalRecords(invRes.total || 0);
          // Reset data của tab kia để tránh nhầm lẫn (tùy chọn)
          setInventoryTransactions([]);
        } else {
          setInventoryTransactions(stockRes.data || []);
          setTotalRecords(stockRes.total || 0);
          setInvoices([]);
        }
      } catch (error) {
        console.error("Lỗi báo cáo:", error);
      }
      setLoading(false);
    };
    fetchMainData();
  }, [appliedFilter, selectedDate, activeTab, currentPage]);

  const handleExport = () => {
    const isInv = activeTab === "invoice";
    const data = isInv
      ? invoices.map((inv, i) => ({
          STT: i + 1,
          Ngày: new Date(inv.created_at).toLocaleDateString(),
          Khách: inv.guests?.full_name,
          "Tạm tính": inv.total_amount,
          "Giảm giá": inv.discount_amount || 0,
          "Thực thu": inv.total_amount - (inv.discount_amount || 0),
        }))
      : inventoryTransactions.map((ts, i) => ({
          STT: i + 1,
          Ngày: new Date(ts.created_at).toLocaleString(),
          "Vật tư": ts.item_name,
          "Số lượng": ts.quantity,
          Giá: ts.unit_price || ts.price,
        }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Báo Cáo");
    XLSX.writeFile(wb, `HotelPro_Report_${activeTab}.xlsx`);
  };

  if (loading)
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white/50 backdrop-blur-sm fixed inset-0 z-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-700 font-sans antialiased text-slate-800">
      {/* 1. HEADER */}
  {/* HEADER BANNER - ĐỒNG BỘ STYLE HOTELPRO */}
<div className="bg-[#D1F4FA] dark:bg-gray-800 rounded-[2rem] p-8 flex flex-wrap justify-between items-center shadow-sm border border-blue-100 dark:border-gray-700 gap-6">
  
  {/* BÊN TRÁI: ICON & TIÊU ĐỀ */}
  <div className="flex items-center gap-5">
    <div className="w-16 h-16 bg-blue-600/10 dark:bg-white/10 rounded-2xl flex items-center justify-center">
      <BarChart3 className="w-8 h-8 text-blue-700 dark:text-blue-400" />
    </div>
    <div>
      <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">
        Thống kê vận hành
      </h1>
      <p className="text-[10px] text-blue-600/60 dark:text-gray-400 font-bold italic mt-1">
        Cập nhật lúc: {new Date().toLocaleTimeString("vi-VN")}
      </p>
    </div>
  </div>

  {/* BÊN PHẢI: BỘ LỌC TỔNG */}
  <div className="flex flex-wrap items-center bg-white/50 dark:bg-gray-900/50 p-2 rounded-[1.5rem] border border-white dark:border-gray-700 shadow-inner gap-3">
    {/* Nút lọc nhanh */}
    <div className="flex gap-1 bg-gray-100/50 dark:bg-gray-800 p-1 rounded-xl">
      {["today", "7days", "30days", "custom"].map((opt) => (
        <button
          key={opt}
          onClick={() => {
            setAppliedFilter(opt);
            setCurrentPage(1);
          }}
          className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase transition-all ${
            appliedFilter === opt
              ? "bg-blue-600 text-white shadow-md shadow-blue-200"
              : "text-gray-500 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm"
          }`}
        >
          {opt === "today" ? "Hôm nay" : opt === "7days" ? "7 Ngày" : opt === "30days" ? "30 Ngày" : "Lịch"}
        </button>
      ))}
    </div>

    {/* PHẦN CHỌN LỊCH CHI TIẾT (Chỉ hiện khi chọn 'custom') */}
    {appliedFilter === "custom" && (
      <div className="flex items-center gap-2 px-2 border-l border-blue-200 dark:border-gray-600 animate-in fade-in slide-in-from-right duration-300">
        <select
          value={customType}
          onChange={(e) => {
            setCustomType(e.target.value as any);
            setSelectedDate(
              e.target.value === "month"
                ? new Date().toISOString().slice(0, 7)
                : new Date().toISOString().split("T")[0],
            );
          }}
          className="bg-white dark:bg-gray-800 border-none text-[10px] font-black uppercase outline-none focus:ring-2 ring-blue-500 rounded-xl px-3 py-2 text-blue-600 cursor-pointer shadow-sm"
        >
          <option value="date">Theo Ngày</option>
          <option value="month">Theo Tháng</option>
        </select>

        <input
          type={customType}
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setCurrentPage(1);
          }}
          className="bg-white dark:bg-gray-800 border-none text-[11px] font-black uppercase outline-none focus:ring-2 ring-blue-500 rounded-xl px-4 py-2 text-gray-700 dark:text-gray-200 shadow-sm"
        />
      </div>
    )}
  </div>
</div>

      {/* 2. KPI CARDS - Dàn 5 cột cực chuẩn */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Doanh thu"
          value={`${stats.revenue.toLocaleString()}đ`}
          trend={stats.revenueTrend}
        />
        <KpiCard
          title="Giảm giá"
          value={`${stats.totalDiscount.toLocaleString()}đ`}
          trend={stats.discountTrend}
          color="text-rose-500"
        />
        <KpiCard
          title="Thực thu"
          value={`${stats.actualRevenue.toLocaleString()}đ`}
          trend={stats.actualRevenueTrend}
          color="text-blue-700"
        />
        <KpiCard
          title="Chi phí"
          value={`${stats.expense.toLocaleString()}đ`}
          trend={stats.expenseTrend}
          color="text-slate-600"
        />
        <KpiCard
          title="Công suất"
          value={`${stats.occupancyRate}%`}
          trend={stats.occupancyTrend}
          color="text-emerald-600"
        />
      </div>

      {/* 3. BIỂU ĐỒ DIỄN BIẾN */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm h-80">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
            Diễn biến doanh thu & chi phí
          </p>
        </div>
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: "bold" }}
            />
            <YAxis
              tickFormatter={formatYAxis}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: "bold" }}
            />
            <RechartsTooltip
              contentStyle={{
                borderRadius: "16px",
                border: "none",
                boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={4}
              fill="url(#colorRev)"
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="#f43f5e"
              strokeWidth={4}
              fill="url(#colorExp)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 4. TABLE SECTION */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex p-1 bg-white border border-gray-100 rounded-2xl gap-1">
            <button
              onClick={() => setActiveTab("invoice")}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === "invoice" ? "bg-blue-600 text-white shadow-md" : "text-gray-400"}`}
            >
              Doanh thu phòng
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === "inventory" ? "bg-orange-600 text-white shadow-md" : "text-gray-400"}`}
            >
              Kho vật tư
            </button>
          </div>
          <button
            onClick={handleExport}
            className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-lg active:scale-95 transition-all"
          >
            <Download size={20} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                <th className="p-5">STT</th>
                <th className="p-5">Thời gian</th>
                <th className="p-5">
                  {activeTab === "invoice" ? "Khách hàng" : "Vật tư"}
                </th>
                {activeTab === "invoice" ? (
                  <>
                    <th className="p-5 text-right">Tạm tính</th>
                    <th className="p-5 text-right text-rose-500">Giảm giá</th>
                  </>
                ) : (
                  <>
                    <th className="p-5 text-center">Số lượng</th>
                    <th className="p-5 text-center">Đơn giá</th>
                  </>
                )}
                <th className="p-5 text-right">Thanh toán</th>
                <th className="p-5 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(activeTab === "invoice" ? invoices : inventoryTransactions).map(
                (item, i) => {
                  const isInv = activeTab === "inventory";
                  const isImport =
                    item.transaction_type?.toUpperCase() === "IN";
                  const unitPrice = item.price || item.unit_price || 0;

                  const discount = Number(item.discount_amount || 0);
                  const subTotal = Number(item.total_amount || 0);

                  // Tiền hiển thị ở cột cuối cùng
                  const finalAmount = isInv
                    ? isImport
                      ? Number(item.quantity || 0) * Number(unitPrice)
                      : 0
                    : subTotal - discount;

                  return (
                    <tr
                      key={i}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="p-5 font-bold text-gray-400">{i + 1}</td>
                      <td className="p-5 font-semibold text-gray-600">
                        {new Date(item.created_at).toLocaleString("vi-VN")}
                      </td>
                      <td className="p-5 font-black text-gray-900 uppercase">
                        {activeTab === "invoice"
                          ? item.guests?.full_name || "Khách lẻ"
                          : item.item_name ||
                            item.inventory_items?.name ||
                            item.name}
                      </td>

                      {/* CÁC CỘT DỮ LIỆU GIỮA */}
                      {activeTab === "invoice" ? (
                        <>
                          <td className="p-5 text-right font-bold text-gray-400">
                            {subTotal.toLocaleString()}đ
                          </td>
                          <td className="p-5 text-right font-bold text-rose-500">
                            -{discount.toLocaleString()}đ
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-5 text-center font-bold">
                            <span
                              className={
                                isImport ? "text-emerald-600" : "text-rose-600"
                              }
                            >
                              {isImport ? "+" : "-"}
                              {item.quantity}
                            </span>
                          </td>
                          <td className="p-5 text-center font-semibold text-gray-500">
                            {unitPrice > 0
                              ? `${unitPrice.toLocaleString()}đ`
                              : "-"}
                          </td>
                        </>
                      )}

                      {/* CỘT THANH TOÁN (THỰC THU / GIÁ TRỊ NHẬP) */}
                      <td className="p-5 text-right font-black text-blue-600 whitespace-nowrap">
                        {isInv && !isImport ? (
                          <span className="text-gray-300 font-normal italic text-[10px]">
                            Nội bộ
                          </span>
                        ) : (
                          `${finalAmount.toLocaleString()}đ`
                        )}
                      </td>

                      <td className="p-5 text-center">
                        <span
                          className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border whitespace-nowrap ${
                            activeTab === "invoice"
                              ? item.payment_method === "cash" ||
                                item.payment_method === "TRANSFER"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-rose-50 text-rose-600 border-rose-100"
                              : isImport
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-rose-50 text-rose-600 border-rose-100"
                          }`}
                        >
                          {activeTab === "invoice"
                            ? item.payment_method || "Đã thu"
                            : isImport
                              ? "Nhập kho"
                              : "Xuất kho"}
                        </span>
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
          {/* --- CHÈN ĐOẠN PHÂN TRANG VÀO ĐÂY --- */}
          <div className="p-5 border-t border-gray-50 flex items-center justify-between bg-white/50">
            <div className="flex flex-col">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Hiển thị {invoices.length} / {totalRecords} bản ghi
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="p-2.5 rounded-xl border border-gray-100 disabled:opacity-30 hover:bg-gray-50 transition-all text-[10px] font-black uppercase text-gray-600 active:scale-95"
              >
                Trước
              </button>

              <div className="flex items-center gap-1">
                <span className="px-4 py-2 text-[10px] font-black bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
                  Trang {currentPage}
                </span>
                <span className="text-[10px] font-black text-gray-400 mx-2 uppercase">
                  của {Math.ceil(totalRecords / pageSize)}
                </span>
              </div>

              <button
                disabled={currentPage * pageSize >= totalRecords}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="p-2.5 rounded-xl border border-gray-100 disabled:opacity-30 hover:bg-gray-50 transition-all text-[10px] font-black uppercase text-gray-600 active:scale-95"
              >
                Sau
              </button>
            </div>
          </div>
          {(activeTab === "invoice" ? invoices : inventoryTransactions)
            .length === 0 && (
            <div className="py-20 text-center text-gray-400 font-black uppercase tracking-widest">
              Không có dữ liệu báo cáo
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, trend, color = "text-gray-900" }: any) {
  const isUp = trend >= 0;
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">
        {title}
      </p>
      <h3 className={`text-xl font-black mb-3 ${color}`}>{value}</h3>
      <div
        className={`text-[10px] font-black px-2.5 py-1 rounded-full w-fit flex items-center gap-1 ${isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}
      >
        {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{" "}
        {Math.abs(trend)}%
      </div>
    </div>
  );
}
