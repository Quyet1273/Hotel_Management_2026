import { useState, useEffect, useMemo } from "react";
import { 
  ReceiptText, Search, Download, Loader2, CreditCard,
  Banknote, Eye, X, User, Home, Info, TrendingUp
} from "lucide-react";
// Đảm bảo đường dẫn import này khớp với project của bác
import { invoiceService } from "../services/invoiceService";
import * as XLSX from 'xlsx';

export function InvoiceManagement() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPayment, setFilterPayment] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const result = await invoiceService.getInvoiceList();
      if (result.success && result.data) {
        setInvoices(result.data);
      }
    } catch (error) {
      console.error("Lỗi khi tải hóa đơn:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Logic tìm kiếm kết hợp lọc theo phương thức thanh toán
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      // 1. Kiểm tra điều kiện tìm kiếm (Tên / SĐT)
      const guestName = (invoice.guests?.full_name || "").toLowerCase();
      const guestPhone = invoice.guests?.phone || "";
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = guestName.includes(searchLower) || guestPhone.includes(searchTerm);

      // 2. Kiểm tra điều kiện bộ lọc thanh toán
      const matchesPayment = filterPayment === "all" || invoice.payment_method === filterPayment;

      // Trả về true nếu thỏa mãn CẢ HAI điều kiện
      return matchesSearch && matchesPayment;
    });
  }, [invoices, searchTerm, filterPayment]);

  // Format tiền tệ
  const formatCurrency = (num: number) => 
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);

  // Logic Xuất Excel
  const handleExportExcel = () => {
    if (filteredInvoices.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    const dataToExport = filteredInvoices.map((inv) => ({
      "Mã Hóa Đơn": inv.id.substring(0, 8).toUpperCase(),
      "Khách Hàng": inv.guests?.full_name || "Khách vãng lai",
      "Số Điện Thoại": inv.guests?.phone || "N/A",
      "Phòng": inv.rooms?.room_number || "---",
      "Tiền Phòng": inv.room_total,
      "Tiền Dịch Vụ": inv.service_total,
      "Tổng Cộng": inv.total_amount,
      "Thanh Toán": inv.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản',
      "Thời Gian": new Date(inv.created_at).toLocaleString("vi-VN"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh_Sach_Hoa_Don");

    worksheet["!cols"] = [
      { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 10 }, 
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }
    ];

    XLSX.writeFile(workbook, `Bao_Cao_Hoa_Don_${new Date().toLocaleDateString('vi-VN')}.xlsx`);
  };

  // Thống kê nhanh
  const stats = {
    totalRevenue: invoices.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0),
    count: invoices.length,
    cash: invoices.filter(i => i.payment_method === 'cash').length,
    transfer: invoices.filter(i => i.payment_method !== 'cash').length,
  };

  // === CHÚ Ý: Mọi return phải nằm TRONG hàm InvoiceManagement ===
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="font-bold text-slate-500">Đang tải dữ liệu hóa đơn...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-20 animate-in fade-in duration-500 font-sans antialiased">
      
      {/* HEADER BANNER */}
      {/* HEADER BANNER - CHUẨN DESIGN GỐC */}
      <div className="bg-[#e0f2fe] rounded-[2rem] p-6 lg:p-8 flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-[#bae6fd] rounded-2xl flex items-center justify-center">
            <ReceiptText className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-[22px] md:text-[28px] font-black m-0 tracking-tight uppercase text-slate-900">
              LỊCH SỬ HÓA ĐƠN
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
          label="TỔNG DOANH THU" 
          value={formatCurrency(stats.totalRevenue)} 
          icon={<TrendingUp size={28}/>} 
          colorClass="text-blue-600 dark:text-blue-400" 
          bgClass="bg-blue-50 dark:bg-blue-900/30" 
        />
        <StatCard 
          label="HÓA ĐƠN TIỀN MẶT" 
          value={stats.cash} 
          icon={<Banknote size={28}/>} 
          colorClass="text-emerald-600 dark:text-emerald-400" 
          bgClass="bg-emerald-50 dark:bg-emerald-900/30" 
        />
        <StatCard 
          label="HÓA ĐƠN CHUYỂN KHOẢN" 
          value={stats.transfer} 
          icon={<CreditCard size={28}/>} 
          colorClass="text-violet-600 dark:text-violet-400" 
          bgClass="bg-violet-50 dark:bg-violet-900/30" 
        />
        <StatCard 
          label="TỔNG GIAO DỊCH" 
          value={stats.count} 
          icon={<ReceiptText size={28}/>} 
          colorClass="text-orange-600 dark:text-orange-400" 
          bgClass="bg-orange-50 dark:bg-orange-900/30" 
        />
      </div>

      {/* SEARCH & TABLE */}
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        
      {/* Toolbar Cập nhật (Căn giữa 2 ô, bằng nhau tuyệt đối) */}
        <div className="p-5 flex flex-col md:flex-row items-center gap-4 border-b-2 border-slate-100 bg-white">
          
          {/* Ô TÌM KIẾM */}
          <div className="relative flex-1 w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="text" 
              placeholder="Tìm theo tên khách hoặc số điện thoại..."
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-[48px] pl-11 pr-5 bg-slate-50 border-2 border-slate-100 rounded-xl text-[14px] font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
            />
          </div>
          
          {/* BỘ LỌC */}
          <div className="relative flex items-center h-[48px] bg-white border-2 border-slate-200 rounded-xl px-4 focus-within:border-blue-500 transition-all shadow-sm">
            <span className="text-[13px] font-bold text-slate-500 uppercase mr-2 shrink-0 pointer-events-none">
              LOẠI:
            </span>
            <select
              value={filterPayment} 
              onChange={(e) => setFilterPayment(e.target.value)}
              className="bg-transparent text-[14px] font-black text-slate-700 uppercase outline-none cursor-pointer appearance-none min-w-[130px]"
            >
              <option value="all">TẤT CẢ</option>
              <option value="cash">TIỀN MẶT</option>
              <option value="transfer">CHUYỂN KHOẢN</option>
              <option value="card">QUẸT THẺ</option>
            </select>
          </div>
          
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b-2 border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-gray-500 dark:text-gray-400 tracking-widest whitespace-nowrap">Mã HĐ</th>
                <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-gray-500 dark:text-gray-400 tracking-widest whitespace-nowrap">Khách hàng</th>
                <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-gray-500 dark:text-gray-400 tracking-widest text-center whitespace-nowrap">Phòng</th>
                <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-gray-500 dark:text-gray-400 tracking-widest text-right whitespace-nowrap">Tổng cộng</th>
                <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-gray-500 dark:text-gray-400 tracking-widest text-center whitespace-nowrap">Thanh toán</th>
                <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-gray-500 dark:text-gray-400 tracking-widest text-right whitespace-nowrap">Thời gian</th>
                <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-gray-500 dark:text-gray-400 tracking-widest text-center whitespace-nowrap">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
  {filteredInvoices.map((inv) => (
    <tr key={inv.id} className="hover:bg-blue-50/50 transition-colors group">
      <td className="px-6 py-5 font-mono text-[13px] font-extrabold text-slate-500 uppercase">
        #{inv.id.substring(0, 6)}
      </td>
      <td className="px-6 py-5">
        <div className="font-extrabold text-[15px] text-slate-900 uppercase mb-0.5 whitespace-nowrap">
          {inv.guests?.full_name || "Khách vãng lai"}
        </div>
        <div className="text-[12px] font-bold text-slate-500">
          {inv.guests?.phone || "---"}
        </div>
      </td>
      <td className="px-6 py-5 text-center">
        <span className="inline-block px-3 py-1.5 rounded-xl bg-slate-100 font-black text-[13px] text-slate-800 border border-slate-200 shadow-sm">
          P.{inv.rooms?.room_number || "---"}
        </span>
      </td>
      <td className="px-6 py-5 text-right font-black text-blue-600 text-[16px] whitespace-nowrap">
        {formatCurrency(inv.total_amount)}
      </td>
      
      {/* CỘT THANH TOÁN ĐÃ CHỈNH SỬA (3 LOẠI) */}
      <td className="px-6 py-5 text-center">
        {inv.payment_method === 'cash' && (
          <span className="inline-block px-4 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider border whitespace-nowrap bg-emerald-50 text-emerald-600 border-emerald-200">
            💵 TIỀN MẶT
          </span>
        )}
        {inv.payment_method === 'transfer' && (
          <span className="inline-block px-4 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider border whitespace-nowrap bg-violet-50 text-violet-600 border-violet-200">
            🏦 CHUYỂN KHOẢN
          </span>
        )}
        {inv.payment_method === 'card' && (
          <span className="inline-block px-4 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider border whitespace-nowrap bg-blue-50 text-blue-600 border-blue-200">
            💳 QUẸT THẺ
          </span>
        )}
        {!['cash', 'transfer', 'card'].includes(inv.payment_method) && (
          <span className="inline-block px-4 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider border whitespace-nowrap bg-slate-50 text-slate-600 border-slate-200">
            {inv.payment_method || 'KHÁC'}
          </span>
        )}
      </td>

      <td className="px-6 py-5 text-right whitespace-nowrap">
        <div className="text-[14px] font-extrabold text-slate-700 mb-0.5">
          {new Date(inv.created_at).toLocaleDateString("vi-VN")}
        </div>
        <div className="text-[12px] font-bold text-slate-400">
          {new Date(inv.created_at).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
        </div>
      </td>
      <td className="px-6 py-5 text-center">
        <button 
          onClick={() => setSelectedInvoice(inv)} 
          className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm opacity-100 lg:opacity-60 lg:group-hover:opacity-100"
        >
          <Eye size={18} />
        </button>
      </td>
    </tr>
  ))}
</tbody>
          </table>
          {filteredInvoices.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-gray-400 dark:text-gray-500">
              <ReceiptText size={64} className="opacity-20" />
              <p className="font-extrabold text-[14px] uppercase tracking-widest">Không tìm thấy dữ liệu hóa đơn nào phù hợp.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CHI TIẾT */}
      {selectedInvoice && (
        <DetailModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} formatCurrency={formatCurrency} />
      )}
    </div>
  );
}
// === ĐÂY LÀ DẤU NGOẶC NHỌN ĐÓNG HÀM CHÍNH (Đừng xóa nhé) ===

// --- HELPER COMPONENTS (Nằm ngoài hàm chính) ---

function DetailModal({ invoice, onClose, formatCurrency }: any) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-[550px] overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in duration-300">
        
        {/* Modal Header */}
        <div className="bg-blue-600 p-7 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <ReceiptText size={28} />
            <h3 className="m-0 font-black text-xl uppercase tracking-wider">Chi tiết hóa đơn</h3>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
            <X size={20}/>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 flex flex-col gap-5">
          <DetailRow icon={<User size={18}/>} label="Khách hàng" value={invoice.guests?.full_name || "Khách vãng lai"} />
          <DetailRow icon={<Home size={18}/>} label="Phòng" value={`P.${invoice.rooms?.room_number || "---"}`} />
          
          <div className="h-[2px] bg-gray-100 dark:bg-gray-700 my-2 rounded-full" />
          
          <DetailRow label="Tiền thuê phòng" value={formatCurrency(invoice.room_total)} isAmount />
          <DetailRow label="Dịch vụ bổ sung" value={formatCurrency(invoice.service_total)} isAmount />
          
          {/* Total Box */}
          <div className="mt-4 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex justify-between items-center border-2 border-blue-100 dark:border-blue-800/50">
             <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                <Info size={24} />
                <span className="font-black text-[18px] uppercase tracking-wider">Tổng cộng</span>
             </div>
             <span className="text-blue-600 dark:text-blue-400 font-black text-3xl tracking-tighter">
               {formatCurrency(invoice.total_amount)}
             </span>
          </div>

          {/* Payment Method Note */}
          <div className="flex items-center gap-3 mt-2 px-2">
             <div className={`w-3 h-3 rounded-full shadow-sm ${invoice.payment_method === 'cash' ? 'bg-emerald-500' : 'bg-violet-500'}`} />
             <span className="text-[13px] font-extrabold text-gray-500 dark:text-gray-400">
                Thanh toán qua: <span className="text-gray-900 dark:text-white uppercase ml-1">{invoice.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</span>
             </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value, isAmount }: any) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
        {icon}
        <span className="font-extrabold text-[14px] uppercase tracking-wider">{label}:</span>
      </div>
      <span className={`font-black ${isAmount ? "text-[16px] text-gray-700 dark:text-gray-300" : "text-[15px] text-gray-900 dark:text-white"}`}>
        {value}
      </span>
    </div>
  );
}

function StatCard({ label, value, icon, colorClass, bgClass }: any) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-7 border-2 border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-5 hover:border-blue-300 dark:hover:border-blue-500/50 transition-all group">
      <div className="flex justify-between items-start">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform ${bgClass} ${colorClass}`}>
          {icon}
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</span>
        </div>
      </div>
      <p className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 m-0 uppercase tracking-widest">
        {label}
      </p>
    </div>
  );
}