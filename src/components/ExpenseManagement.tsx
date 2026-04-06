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
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", paddingBottom: "2.5rem" }}>
      
      {/* HEADER - Đã thêm nút Xuất Excel */}
      <div
        style={{ 
          backgroundColor: "#e11d48", 
          borderRadius: "2rem", 
          padding: "2rem", 
          color: "#ffffff", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", position: "relative", zIndex: 10 }}>
          <div style={{ width: "4rem", height: "4rem", backgroundColor: "rgba(255, 255, 255, 0.2)", borderRadius: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Receipt style={{ width: "2rem", height: "2rem", color: "#ffffff" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.875rem", fontWeight: "900", margin: 0, letterSpacing: "-0.025em" }}>QUẢN LÝ CHI PHÍ</h1>
            <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: 0, fontSize: "0.875rem" }}>Theo dõi dòng tiền chi ra của HotelPro</p>
          </div>
        </div>

        {/* Nút Xuất Excel mới thêm */}
        <button 
          onClick={handleExportExcel}
          style={{ 
            backgroundColor: "#ffffff", color: "#e11d48", padding: "0.8rem 1.5rem", 
            borderRadius: "1.25rem", border: "none", fontWeight: "900", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "0.6rem", boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            zIndex: 20, fontSize: "0.85rem", textTransform: "uppercase"
          }}
        >
          <Download size={18} /> Xuất File Excel
        </button>
      </div>

      {/* STATS CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <StatCard
          icon={<TrendingDown />}
          label="TỔNG CHI"
          value={formatCurrency(stats.total)}
          iconColor="#e11d48"
          bgColor="#fff1f2"
        />
        <StatCard
          icon={<Calendar />}
          label="CHI THÁNG NÀY"
          value={formatCurrency(stats.thisMonth)}
          iconColor="#ea580c"
          bgColor="#fff7ed"
        />
        <StatCard
          icon={<Wallet />}
          label="TIỀN MẶT"
          value={formatCurrency(stats.cash)}
          iconColor="#059669"
          bgColor="#ecfdf5"
        />
        <StatCard
          icon={<CreditCard />}
          label="CHUYỂN KHOẢN"
          value={formatCurrency(stats.transfer)}
          iconColor="#2563eb"
          bgColor="#eff6ff"
        />
      </div>

      {/* TABLE SECTION */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "2rem", border: "1px solid #f3f4f6", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div style={{ padding: "1rem", backgroundColor: "rgba(249, 250, 251, 0.5)", borderBottom: "1px solid #f3f4f6" }}>
          <div style={{ position: "relative", maxWidth: "400px" }}>
            <Search style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", width: "1.25rem", height: "1.25rem", color: "#9ca3af" }} />
            <input
              type="text"
              placeholder="Tìm kiếm nội dung chi..."
              style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 3rem", borderRadius: "1rem", border: "1px solid #e5e7eb", outline: "none" }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <tr>
                <th style={{ padding: "1.25rem", fontSize: "0.75rem", fontWeight: "900", color: "#64748b", textTransform: "uppercase" }}>Thời gian</th>
                <th style={{ padding: "1.25rem", fontSize: "0.75rem", fontWeight: "900", color: "#64748b", textTransform: "uppercase" }}>Nội dung chi phí</th>
                <th style={{ padding: "1.25rem", fontSize: "0.75rem", fontWeight: "900", color: "#64748b", textTransform: "uppercase" }}>Danh mục</th>
                <th style={{ padding: "1.25rem", fontSize: "0.75rem", fontWeight: "900", color: "#64748b", textTransform: "uppercase" }}>Hình thức</th>
                <th style={{ padding: "1.25rem", fontSize: "0.75rem", fontWeight: "900", color: "#64748b", textTransform: "uppercase", textAlign: "right" }}>Số tiền</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "1.25rem" }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: "700", color: "#111827" }}>{new Date(exp.created_at).toLocaleDateString("vi-VN")}</div>
                    <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{new Date(exp.created_at).toLocaleTimeString("vi-VN")}</div>
                  </td>
                  <td style={{ padding: "1.25rem", fontSize: "0.875rem", fontWeight: "700", color: "#1f2937" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <ArrowDownRight style={{ width: "1rem", height: "1rem", color: "#e11d48" }} />
                      {exp.description}
                    </div>
                  </td>
                  <td style={{ padding: "1.25rem" }}>
                    <span style={{ padding: "0.25rem 0.75rem", backgroundColor: "#f3f4f6", color: "#4b5563", borderRadius: "0.5rem", fontSize: "0.75rem", fontWeight: "900" }}>
                      {exp.category === "inventory" ? "NHẬP KHO" : exp.category}
                    </span>
                  </td>
                  <td style={{ padding: "1.25rem", fontSize: "0.75rem", fontWeight: "700", color: "#4b5563" }}>
                    {exp.payment_method === "cash" ? "💵 Tiền mặt" : "💳 Chuyển khoản"}
                  </td>
                  <td style={{ padding: "1.25rem", textAlign: "right", fontSize: "1rem", fontWeight: "900", color: "#e11d48" }}>
                    {formatCurrency(exp.amount)}
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

function StatCard({ icon, label, value, iconColor, bgColor }: any) {
  return (
    <div style={{ 
      backgroundColor: "#ffffff", 
      borderRadius: "1.5rem", 
      padding: "1.5rem", 
      border: "1px solid #f3f4f6", 
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)" 
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div style={{ 
          width: "3rem", 
          height: "3rem", 
          borderRadius: "1rem", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          backgroundColor: bgColor, 
          color: iconColor 
        }}>
          {icon}
        </div>
        <span style={{ fontSize: "1.25rem", fontWeight: "900", color: "#111827" }}>
          {value}
        </span>
      </div>
      <p style={{ 
        fontSize: "0.75rem", 
        fontWeight: "800", 
        color: "#4b5563", 
        margin: 0, 
        textTransform: "uppercase", 
        letterSpacing: "0.05em" 
      }}>
        {label}
      </p>
    </div>
  );
}