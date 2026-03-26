import { useState, useEffect } from "react";
import {
  Receipt,
  Search,
  Filter,
  TrendingDown,
  Calendar,
  CreditCard,
  Wallet,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import { expenseService } from "../services/expenseService";

export function ExpenseManagement() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const res = await expenseService.getExpenses();
    if (res.success) setExpenses(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);

  // Tính toán thống kê
  const stats = {
    total: expenses.reduce((sum, e) => sum + e.amount, 0),
    thisMonth: expenses
      .filter(
        (e) => new Date(e.created_at).getMonth() === new Date().getMonth(),
      )
      .reduce((sum, e) => sum + e.amount, 0),
    cash: expenses
      .filter((e) => e.payment_method === "cash")
      .reduce((sum, e) => sum + e.amount, 0),
    transfer: expenses
      .filter((e) => e.payment_method === "transfer")
      .reduce((sum, e) => sum + e.amount, 0),
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-rose-600 animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* HEADER - Dùng màu Rose/Red cho phần Chi phí để phân biệt với màu Blue của Kho */}
      <div
        style={{ backgroundColor: "#e11d48" }} // Đây là mã màu tương đương bg-rose-600
        className="rounded-[2rem] shadow-xl p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative"
      >
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
            <Receipt className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-1 text-white">
              Quản Lý Chi Phí
            </h1>
            <p className="text-white/80 text-sm font-medium">
              Theo dõi dòng tiền chi ra của HotelPro
            </p>
          </div>
        </div>

        {/* Đồ họa trang trí cho Pro (tùy chọn) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingDown />}
          label="Tổng chi"
          value={formatCurrency(stats.total)}
          color="rose"
        />
        <StatCard
          icon={<Calendar />}
          label="Chi tháng này"
          value={formatCurrency(stats.thisMonth)}
          color="orange"
        />
        <StatCard
          icon={<Wallet />}
          label="Tiền mặt"
          value={formatCurrency(stats.cash)}
          color="emerald"
        />
        <StatCard
          icon={<CreditCard />}
          label="Chuyển khoản"
          value={formatCurrency(stats.transfer)}
          color="blue"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row gap-4 bg-gray-50/30">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm nội dung chi..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl outline-none focus:border-rose-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b text-[10px] text-slate-400 font-black uppercase tracking-widest">
              <tr>
                <th className="p-5 pl-8">Thời gian</th>
                <th className="p-5">Nội dung chi phí</th>
                <th className="p-5">Danh mục</th>
                <th className="p-5">Hình thức</th>
                <th className="p-5 text-right pr-8">Số tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {expenses
                .filter((e) =>
                  e.description
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
                )
                .map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-rose-50/30 transition-colors group"
                  >
                    <td className="p-5 pl-8">
                      <div className="text-sm font-bold text-gray-900">
                        {new Date(exp.created_at).toLocaleDateString("vi-VN")}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {new Date(exp.created_at).toLocaleTimeString("vi-VN")}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <ArrowDownRight className="w-4 h-4 text-rose-500" />
                        {exp.description}
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-200">
                        {exp.category === "inventory"
                          ? "Nhập kho"
                          : exp.category}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                        {exp.payment_method === "cash" ? (
                          <Wallet size={14} className="text-emerald-500" />
                        ) : (
                          <CreditCard size={14} className="text-blue-500" />
                        )}
                        {exp.payment_method === "cash"
                          ? "Tiền mặt"
                          : "Chuyển khoản"}
                      </div>
                    </td>
                    <td className="p-5 text-right pr-8">
                      <span className="text-base font-black text-rose-600">
                        {formatCurrency(exp.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {expenses.length === 0 && (
            <div className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">
              Chưa có dữ liệu hóa đơn chi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-components giống hệt bên Inventory để đồng bộ giao diện
function StatCard({ icon, label, value, color }: any) {
  const colors: any = {
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
  };
  return (
    <div
      className={`bg-white rounded-3xl p-6 border ${colors[color]} shadow-sm`}
    >
      <div className="flex justify-between items-start mb-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color].replace("border-", "bg-").split(" ")[0]}`}
        >
          {icon}
        </div>
        <span className="text-xl font-black">{value}</span>
      </div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
        {label}
      </p>
    </div>
  );
}
