import { useState, useEffect, useMemo } from "react";
import { 
  ReceiptText, Search, Download, Loader2, CreditCard,
  Banknote, Calendar, Eye, X, User, Home, Info, TrendingUp
} from "lucide-react";
import { invoiceService } from "../services/invoiceService";
import * as XLSX from 'xlsx'; // Yêu cầu đã cài đặt: npm install xlsx

export function InvoiceManagement() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    const result = await invoiceService.getInvoiceList();
    if (result.success && result.data) {
      setInvoices(result.data);
    }
    setIsLoading(false);
  };

  // Logic tìm kiếm theo tên hoặc số điện thoại
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const guestName = (invoice.guests?.full_name || "").toLowerCase();
      const guestPhone = invoice.guests?.phone || "";
      const searchLower = searchTerm.toLowerCase();
      return guestName.includes(searchLower) || guestPhone.includes(searchTerm);
    });
  }, [invoices, searchTerm]);

  // Format tiền tệ
  const formatCurrency = (num: number) => 
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num || 0);

  // --- LOGIC XUẤT EXCEL CHUẨN ---
  const handleExportExcel = () => {
    if (filteredInvoices.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    // Làm phẳng dữ liệu để Excel đọc được
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachHoaDon");

    // Định dạng độ rộng cột
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

  if (isLoading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", flexDirection: "column", gap: "1rem" }}>
      <Loader2 style={{ width: "3rem", height: "3rem", color: "#2563eb" }} className="animate-spin" />
      <p style={{ color: "#64748b", fontWeight: "700" }}>Đang tải dữ liệu hóa đơn...</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", paddingBottom: "3rem" }}>
      
      {/* HEADER BANNER */}
      <div style={{ 
        backgroundColor: "#2563eb", borderRadius: "2rem", padding: "2.5rem", color: "#ffffff",
        display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.3)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ width: "4.5rem", height: "4.5rem", backgroundColor: "rgba(255, 255, 255, 0.2)", borderRadius: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255, 255, 255, 0.3)" }}>
            <ReceiptText style={{ width: "2.25rem", height: "2.25rem", color: "#ffffff" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "2.25rem", fontWeight: "900", margin: 0, letterSpacing: "-0.025em" }}>LỊCH SỬ HÓA ĐƠN</h1>
            <p style={{ color: "rgba(255, 255, 255, 0.85)", margin: 0, fontWeight: "600", fontSize: "1rem" }}>Quản lý doanh thu và tra cứu thanh toán</p>
          </div>
        </div>
        <button 
          onClick={handleExportExcel}
          style={{ backgroundColor: "#ffffff", color: "#2563eb", padding: "1rem 2rem", borderRadius: "1.25rem", border: "none", fontWeight: "900", cursor: "pointer", textTransform: "uppercase", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.75rem", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
        >
          <Download size={20} /> Xuất Báo Cáo Excel
        </button>
      </div>

      {/* STATS CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
        <StatCard label="TỔNG DOANH THU" value={formatCurrency(stats.totalRevenue)} icon={<TrendingUp size={28}/>} color="#2563eb" bgColor="#eff6ff" />
        <StatCard label="HÓA ĐƠN TIỀN MẶT" value={stats.cash} icon={<Banknote size={28}/>} color="#059669" bgColor="#ecfdf5" />
        <StatCard label="HÓA ĐƠN CHUYỂN KHOẢN" value={stats.transfer} icon={<CreditCard size={28}/>} color="#7c3aed" bgColor="#f5f3ff" />
        <StatCard label="TỔNG GIAO DỊCH" value={stats.count} icon={<ReceiptText size={28}/>} color="#ea580c" bgColor="#fff7ed" />
      </div>

      {/* SEARCH & TABLE */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "2rem", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
        <div style={{ padding: "1.5rem", backgroundColor: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ position: "relative", maxWidth: "450px" }}>
            <Search style={{ position: "absolute", left: "1.25rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} size={20} />
            <input
              type="text" placeholder="Tìm theo tên khách hoặc số điện thoại..."
              style={{ width: "100%", padding: "1rem 1.25rem 1rem 3.5rem", borderRadius: "1.5rem", border: "2px solid #e5e7eb", outline: "none", color: "#111827", fontWeight: "700", fontSize: "0.95rem", transition: "border-color 0.2s" }}
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              <tr>
                <th style={thStyle}>Mã HĐ</th>
                <th style={thStyle}>Khách hàng</th>
                <th style={{...thStyle, textAlign: "center"}}>Phòng</th>
                <th style={{...thStyle, textAlign: "right"}}>Tổng cộng</th>
                <th style={{...thStyle, textAlign: "center"}}>Thanh toán</th>
                <th style={{...thStyle, textAlign: "right"}}>Thời gian</th>
                <th style={{...thStyle, textAlign: "center"}}>Chi tiết</th>
              </tr>
            </thead>
            <tbody style={{ color: "#111827" }}>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: "1px solid #f1f5f9" }} className="hover:bg-slate-50 transition-colors">
                  <td style={{ padding: "1.25rem", fontFamily: "monospace", color: "#64748b", fontWeight: "700", fontSize: "0.85rem" }}>#{inv.id.substring(0,6).toUpperCase()}</td>
                  <td style={{ padding: "1.25rem" }}>
                    <div style={{ fontWeight: "800", color: "#111827", fontSize: "0.95rem" }}>{inv.guests?.full_name || "Khách vãng lai"}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600" }}>{inv.guests?.phone || "---"}</div>
                  </td>
                  <td style={{ padding: "1.25rem", textAlign: "center" }}>
                    <span style={{ padding: "0.4rem 0.8rem", borderRadius: "0.75rem", backgroundColor: "#f1f5f9", fontWeight: "900", fontSize: "11px", color: "#1e293b", border: "1px solid #e2e8f0" }}>
                      P.{inv.rooms?.room_number || "---"}
                    </span>
                  </td>
                  <td style={{ padding: "1.25rem", textAlign: "right", fontWeight: "900", color: "#2563eb", fontSize: "1rem" }}>{formatCurrency(inv.total_amount)}</td>
                  <td style={{ padding: "1.25rem", textAlign: "center" }}>
                    <span style={badgeStyle(inv.payment_method === 'cash' ? '#059669' : '#7c3aed', inv.payment_method === 'cash' ? '#ecfdf5' : '#f5f3ff')}>
                      {inv.payment_method === 'cash' ? '💵 TIỀN MẶT' : '💳 CHUYỂN KHOẢN'}
                    </span>
                  </td>
                  <td style={{ padding: "1.25rem", textAlign: "right" }}>
                    <div style={{ fontSize: "13px", fontWeight: "800", color: "#334155" }}>{new Date(inv.created_at).toLocaleDateString("vi-VN")}</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600" }}>{new Date(inv.created_at).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td style={{ padding: "1.25rem", textAlign: "center" }}>
                    <button 
                      onClick={() => setSelectedInvoice(inv)} 
                      style={{ padding: "0.6rem", borderRadius: "0.75rem", border: "none", cursor: "pointer", backgroundColor: "#eff6ff", color: "#2563eb", transition: "transform 0.1s" }}
                    >
                      <Eye size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredInvoices.length === 0 && (
            <div style={{ padding: "6rem", textAlign: "center", color: "#94a3b8", fontWeight: "700", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <ReceiptText size={48} style={{ opacity: 0.2 }} />
              <p>Không tìm thấy dữ liệu hóa đơn nào phù hợp.</p>
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

// --- MODAL CHI TIẾT (Inline CSS) ---
function DetailModal({ invoice, onClose, formatCurrency }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", backdropFilter: "blur(6px)" }}>
      <div style={{ backgroundColor: "#ffffff", borderRadius: "2.5rem", width: "100%", maxWidth: "550px", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)", border: "1px solid #e5e7eb" }}>
        
        <div style={{ backgroundColor: "#2563eb", padding: "1.75rem 2rem", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <ReceiptText size={28} />
            <h3 style={{ margin: 0, fontWeight: "900", fontSize: "1.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>CHI TIẾT HÓA ĐƠN</h3>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255, 255, 255, 0.15)", border: "none", color: "#fff", cursor: "pointer", borderRadius: "0.75rem", padding: "0.5rem", display: "flex" }}>
            <X size={24}/>
          </button>
        </div>

        <div style={{ padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          <DetailRow icon={<User size={18}/>} label="Khách hàng" value={invoice.guests?.full_name} />
          <DetailRow icon={<Home size={18}/>} label="Phòng" value={`P.${invoice.rooms?.room_number}`} />
          
          <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "0.5rem 0" }} />
          
          <DetailRow label="Tiền thuê phòng" value={formatCurrency(invoice.room_total)} isAmount />
          <DetailRow label="Dịch vụ bổ sung" value={formatCurrency(invoice.service_total)} isAmount />
          
          <div style={{ marginTop: "1rem", padding: "1.5rem", backgroundColor: "#eff6ff", borderRadius: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #dbeafe" }}>
             <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#2563eb" }}>
                <Info size={20} />
                <span style={{ fontWeight: "900", fontSize: "1.1rem" }}>TỔNG CỘNG</span>
             </div>
             <span style={{ color: "#2563eb", fontWeight: "900", fontSize: "1.5rem", letterSpacing: "-0.02em" }}>{formatCurrency(invoice.total_amount)}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", padding: "0 0.5rem" }}>
             <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: invoice.payment_method === 'cash' ? '#059669' : '#7c3aed' }} />
             <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#64748b" }}>
                Thanh toán qua: <span style={{ color: "#1e293b", textTransform: "uppercase" }}>{invoice.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</span>
             </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper: Hàng chi tiết trong Modal
function DetailRow({ icon, label, value, isAmount }: any) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#64748b" }}>
        {icon}
        <span style={{ fontWeight: "700", fontSize: "0.9rem" }}>{label}:</span>
      </div>
      <span style={{ fontWeight: "800", color: isAmount ? "#334155" : "#111827", fontSize: isAmount ? "1rem" : "0.95rem" }}>{value}</span>
    </div>
  );
}

// --- STYLE HELPERS ---
const thStyle: any = { 
  padding: "1.25rem", fontSize: "0.75rem", fontWeight: "900", 
  color: "#475569", textTransform: "uppercase", letterSpacing: "0.15em" 
};

const badgeStyle = (color: string, bg: string) => ({ 
  padding: "0.5rem 1rem", borderRadius: "0.75rem", fontSize: "10px", 
  fontWeight: "900", backgroundColor: bg, color: color, 
  border: `1px solid ${color}30`, letterSpacing: "0.05em" 
});

function StatCard({ label, value, icon, color, bgColor }: any) {
  return (
    <div style={{ 
      backgroundColor: "#ffffff", borderRadius: "1.75rem", padding: "1.75rem", 
      border: "1px solid #f1f5f9", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
      display: "flex", flexDirection: "column", gap: "1.25rem"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "1.1rem", backgroundColor: bgColor, color: color, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 15px -3px ${color}20` }}>
          {icon}
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "1.5rem", fontWeight: "900", color: "#111827", letterSpacing: "-0.02em" }}>{value}</span>
        </div>
      </div>
      <p style={{ fontSize: "0.75rem", fontWeight: "800", color: "#64748b", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</p>
    </div>
  );
}