import { useState, useEffect, useMemo } from "react";
import {
  Receipt, Search, TrendingDown, Calendar, CreditCard,
  Wallet, ArrowDownRight, Loader2, Download // Thêm icon Download
} from "lucide-react";
import { expenseService } from "../services/expenseService";
import * as XLSX from "xlsx"; // Import thư viện Excel

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

  // Logic lọc dữ liệu dùng chung cho cả bảng và Excel
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) =>
      (e.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [expenses, searchTerm]);

  // --- CHỨC NĂNG XUẤT EXCEL ---
  const handleExportExcel = () => {
    if (filteredExpenses.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    const dataToExport = filteredExpenses.map((exp) => ({
      "Thời Gian": new Date(exp.created_at).toLocaleString("vi-VN"),
      "Nội Dung Chi Phí": exp.description,
      "Danh Mục": exp.category === "inventory" ? "NHẬP KHO" : exp.category,
      "Hình Thức": exp.payment_method === "cash" ? "Tiền mặt" : "Chuyển khoản",
      "Số Tiền": Number(exp.amount) || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Chi_Phi");

    // Căn độ rộng cột cho đẹp
    worksheet["!cols"] = [{ wch: 20 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

    XLSX.writeFile(workbook, `Bao_Cao_Chi_Phi_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`);
  };

  const stats = {
    total: expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    thisMonth: expenses
      .filter((e) => {
        const d = new Date(e.created_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    cash: expenses.filter((e) => e.payment_method === "cash").reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    transfer: expenses.filter((e) => e.payment_method === "transfer").reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
  };

  if (loading)
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: "5rem" }}>
        <Loader2 style={{ width: "2.5rem", height: "2.5rem", color: "#e11d48" }} className="animate-spin" />
      </div>
    );

 return (
    <div className="flex flex-col gap-6 pb-20 animate-in fade-in duration-500 font-sans antialiased">
      
      {/* HEADER BANNER - CHUẨN DESIGN GỐC */}
      <div className="bg-[#e0f2fe] rounded-[2rem] p-6 lg:p-8 flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-[#bae6fd] rounded-2xl flex items-center justify-center">
            <Receipt className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-[22px] md:text-[28px] font-black m-0 tracking-tight uppercase text-slate-900">
              QUẢN LÝ CHI PHÍ
            </h1>
          </div>
        </div>
        <button 
          onClick={handleExportExcel}
          className="bg-blue-600 hover:bg-blue-700 text-white px-7 py-3.5 rounded-2xl font-bold text-[13px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
        >
          <Download size={18} strokeWidth={2.5} /> XUẤT BÁO CÁO EXCEL
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          icon={<TrendingDown size={28}/>}
          label="TỔNG CHI"
          value={formatCurrency(stats.total)}
          iconColor="text-rose-600"
          bgColor="bg-rose-50"
        />
        <StatCard
          icon={<Calendar size={28}/>}
          label="CHI THÁNG NÀY"
          value={formatCurrency(stats.thisMonth)}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
        />
        <StatCard
          icon={<Wallet size={28}/>}
          label="TIỀN MẶT"
          value={formatCurrency(stats.cash)}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
        />
        <StatCard
          icon={<CreditCard size={28}/>}
          label="CHUYỂN KHOẢN"
          value={formatCurrency(stats.transfer)}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-[2rem] border-2 border-slate-100 overflow-hidden shadow-sm">
        
        {/* TOOLBAR */}
        <div className="p-5 flex flex-col md:flex-row items-center gap-4 border-b-2 border-slate-100 bg-white">
          <div className="relative flex-1 w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm nội dung chi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-[48px] pl-11 pr-5 bg-slate-50 border-2 border-slate-100 rounded-xl text-[14px] font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
            />
          </div>
        </div>

        {/* BẢNG DỮ LIỆU */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b-2 border-slate-100">
              <tr>
                <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-slate-500 tracking-widest whitespace-nowrap">Thời gian</th>
                <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-slate-500 tracking-widest whitespace-nowrap">Nội dung chi phí</th>
                <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-slate-500 tracking-widest text-center whitespace-nowrap">Danh mục</th>
                <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-slate-500 tracking-widest text-center whitespace-nowrap">Hình thức</th>
                <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-slate-500 tracking-widest text-right whitespace-nowrap">Số tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="font-extrabold text-[14px] text-slate-900 mb-0.5">
                      {new Date(exp.created_at).toLocaleDateString("vi-VN")}
                    </div>
                    <div className="text-[12px] font-bold text-slate-500">
                      {new Date(exp.created_at).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 font-extrabold text-[15px] text-slate-900 whitespace-nowrap">
                      <ArrowDownRight className="w-4 h-4 text-rose-600 shrink-0" />
                      {exp.description}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="inline-block px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-black text-[11px] uppercase tracking-widest border border-slate-200 shadow-sm whitespace-nowrap">
                      {exp.category === "inventory" ? "NHẬP KHO" : exp.category}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {exp.payment_method === 'cash' ? (
                      <span className="inline-block px-4 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider border whitespace-nowrap bg-emerald-50 text-emerald-600 border-emerald-200">
                        💵 TIỀN MẶT
                      </span>
                    ) : (
                      <span className="inline-block px-4 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider border whitespace-nowrap bg-violet-50 text-violet-600 border-violet-200">
                        🏦 CHUYỂN KHOẢN
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right font-black text-rose-600 text-[16px] whitespace-nowrap">
                    {formatCurrency(exp.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredExpenses.length === 0 && (
             <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                <Receipt className="w-16 h-16 opacity-20" />
                <p className="font-extrabold text-[14px] uppercase tracking-widest">Không tìm thấy khoản chi nào.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ĐÃ ĐỒNG BỘ ---
function StatCard({ icon, label, value, iconColor, bgColor }: any) {
  return (
    <div className="bg-white rounded-[2rem] p-7 border-2 border-slate-100 shadow-sm flex flex-col gap-5 hover:border-blue-300 transition-all group">
      <div className="flex justify-between items-start">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform ${bgColor} ${iconColor}`}>
          {icon}
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-slate-900 tracking-tighter">{value}</span>
        </div>
      </div>
      <p className="text-[11px] font-extrabold text-slate-500 m-0 uppercase tracking-widest">
        {label}
      </p>
    </div>
  );
}