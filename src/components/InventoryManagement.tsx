import { useState, useEffect } from "react";
import {
  Package, Plus, AlertTriangle, Search, TrendingUp,
  Box, History, Loader2, Upload, Download, Edit3, Trash2,
} from "lucide-react";
import { inventoryService } from "../services/inventoryservice";
import { AddItemModal } from "../modal/addItemModal";
import { TransactionModal } from "../modal/TransactionModal";
import { EditItemModal } from "../modal/EditItemModal";
import { toast } from "sonner";

export function InventoryManagement() {
  const [items, setItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"inventory" | "transactions">("inventory");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [transConfig, setTransConfig] = useState<{ item: any; type: "import" | "export"; } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [itemsRes, transRes] = await Promise.all([
      inventoryService.getItems(),
      inventoryService.getTransactions(),
    ]);
    if (itemsRes.success) {
      setItems(itemsRes.data?.filter((i: any) => i.is_active !== false) || []);
    }
    if (transRes.success) setTransactions(transRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

  const filteredItems = items.filter((item) => {
    const matchSearch = (item?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === "all" || item.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const stats = {
    totalItems: items.length,
    lowStock: items.filter(i => (i.quantity_in_stock || 0) <= (i.min_quantity || 0)).length,
    totalValue: items.reduce((sum, i) => sum + (Number(i.quantity_in_stock) || 0) * (Number(i.price) || 0), 0),
    recentTransactions: transactions.length,
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: "5rem" }}>
      <Loader2 style={{ width: "3rem", height: "3rem", color: "#2563eb" }} className="animate-spin" />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", paddingBottom: "3rem" }}>
      
      {/* HEADER BANNER */}
      <div style={{ 
        backgroundColor: "#2563eb", borderRadius: "2rem", padding: "2rem", color: "#ffffff",
        display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 15px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ width: "4rem", height: "4rem", backgroundColor: "rgba(255, 255, 255, 0.2)", borderRadius: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Package style={{ width: "2rem", height: "2rem", color: "#ffffff" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.875rem", fontWeight: "900", margin: 0 }}>QUẢN LÝ KHO VẬT TƯ</h1>
            <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: 0 }}>Kiểm soát xuất nhập tồn cho HotelPro</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{ backgroundColor: "#ffffff", color: "#2563eb", padding: "0.8rem 1.5rem", borderRadius: "1rem", border: "none", fontWeight: "900", cursor: "pointer", textTransform: "uppercase", fontSize: "0.75rem" }}
        >
          + Thêm Danh Mục
        </button>
      </div>

      {/* STATS CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
        <StatCard label="TỔNG MẶT HÀNG" value={stats.totalItems} icon={<Box />} color="#2563eb" bgColor="#eff6ff" />
        <StatCard label="SẮP HẾT HÀNG" value={stats.lowStock} icon={<AlertTriangle />} color="#e11d48" bgColor="#fff1f2" />
        <StatCard label="LỊCH SỬ GIAO DỊCH" value={stats.recentTransactions} icon={<History />} color="#059669" bgColor="#ecfdf5" />
        <StatCard label="GIÁ TRỊ KHO" value={formatCurrency(stats.totalValue)} icon={<TrendingUp />} color="#7c3aed" bgColor="#f5f3ff" />
      </div>

      {/* TABLE SECTION */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "2rem", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        {/* TABS */}
        <div style={{ display: "flex", padding: "0.5rem", backgroundColor: "#f9fafb", gap: "0.5rem", borderBottom: "1px solid #e5e7eb" }}>
          <button 
            onClick={() => setActiveTab("inventory")}
            style={{ 
                flex: 1, padding: "1rem", borderRadius: "1.25rem", border: "none", cursor: "pointer",
                fontWeight: activeTab === "inventory" ? "900" : "700",
                backgroundColor: activeTab === "inventory" ? "#ffffff" : "transparent",
                color: activeTab === "inventory" ? "#2563eb" : "#94a3b8",
                boxShadow: activeTab === "inventory" ? "0 4px 6px rgba(0,0,0,0.05)" : "none"
            }}
          >
            📦 TỒN KHO
          </button>
          <button 
            onClick={() => setActiveTab("transactions")}
            style={{ 
                flex: 1, padding: "1rem", borderRadius: "1.25rem", border: "none", cursor: "pointer",
                fontWeight: activeTab === "transactions" ? "900" : "700",
                backgroundColor: activeTab === "transactions" ? "#ffffff" : "transparent",
                color: activeTab === "transactions" ? "#2563eb" : "#94a3b8",
                boxShadow: activeTab === "transactions" ? "0 4px 6px rgba(0,0,0,0.05)" : "none"
            }}
          >
            🕒 LỊCH SỬ
          </button>
        </div>

        {activeTab === "inventory" ? (
          <div>
            <div style={{ padding: "1.25rem", display: "flex", gap: "1rem" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} size={18} />
                <input
                  type="text" placeholder="Tìm tên vật tư..."
                  style={{ width: "100%", padding: "0.85rem 1rem 0.85rem 3rem", borderRadius: "1.25rem", border: "1px solid #e5e7eb", outline: "none", color: "#111827", fontWeight: "700" }}
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                style={{ padding: "0.85rem 1rem", borderRadius: "1.25rem", border: "1px solid #e5e7eb", color: "#111827", fontWeight: "700", outline: "none", backgroundColor: "#fff" }}
                value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">Tất cả danh mục</option>
                <option value="amenities">Tiện nghi</option>
                <option value="food">Thực phẩm</option>
                <option value="beverage">Đồ uống</option>
                <option value="cleaning">Vệ sinh</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <tr>
                    <th style={thStyle}>Tên vật tư</th>
                    <th style={{...thStyle, textAlign: "center"}}>Danh mục</th>
                    <th style={{...thStyle, textAlign: "center"}}>Tồn kho</th>
                    <th style={{...thStyle, textAlign: "right"}}>Đơn giá</th>
                    <th style={{...thStyle, textAlign: "center"}}>Thao tác</th>
                  </tr>
                </thead>
                <tbody style={{ color: "#111827" }}>
                  {filteredItems.map((item) => {
                    const isLow = (item.quantity_in_stock || 0) <= (item.min_quantity || 0);
                    return (
                      <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "1.25rem" }}>
                          <div style={{ fontWeight: "800", color: "#111827" }}>{item.name}</div>
                          <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: "600" }}>Min: {item.min_quantity} {item.unit}</div>
                        </td>
                        <td style={{ padding: "1.25rem", textAlign: "center" }}>
                           <span style={badgeStyle("#475569", "#f1f5f9")}>{item.category.toUpperCase()}</span>
                        </td>
                        <td style={{ padding: "1.25rem", textAlign: "center" }}>
                          <span style={{ 
                            padding: "0.5rem 1rem", borderRadius: "0.75rem", fontWeight: "900",
                            backgroundColor: isLow ? "#fef2f2" : "#f3f4f6",
                            color: isLow ? "#dc2626" : "#1e293b"
                          }}>
                            {item.quantity_in_stock || 0}
                          </span>
                        </td>
                        <td style={{ padding: "1.25rem", textAlign: "right", fontWeight: "800" }}>{formatCurrency(item.price)}</td>
                        <td style={{ padding: "1.25rem", textAlign: "center" }}>
                           <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                              <button onClick={() => setTransConfig({ item, type: "import" })} style={actionBtnStyle("#10b981")}><Upload size={14}/></button>
                              <button onClick={() => setTransConfig({ item, type: "export" })} style={actionBtnStyle("#f43f5e")}><Download size={14}/></button>
                              <button onClick={() => setEditingItem(item)} style={actionBtnStyle("#f59e0b")}><Edit3 size={14}/></button>
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <tr>
                  <th style={thStyle}>Thời gian</th>
                  <th style={thStyle}>Loại</th>
                  <th style={thStyle}>Vật tư</th>
                  <th style={{...thStyle, textAlign: "center"}}>Số lượng</th>
                  <th style={thStyle}>Thông tin thêm</th>
                </tr>
              </thead>
              <tbody style={{ color: "#111827" }}>
                {transactions.map((t) => {
                  const isImport = t.transaction_type === "IN";
                  return (
                    <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "1.25rem" }}>
                        <div style={{ fontWeight: "700", fontSize: "0.875rem" }}>{new Date(t.created_at).toLocaleDateString("vi-VN")}</div>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>{new Date(t.created_at).toLocaleTimeString("vi-VN")}</div>
                      </td>
                      <td style={{ padding: "1.25rem" }}>
                        <span style={badgeStyle(isImport ? "#059669" : "#dc2626", isImport ? "#ecfdf5" : "#fef2f2")}>
                          {isImport ? "NHẬP KHO" : "XUẤT KHO"}
                        </span>
                      </td>
                      <td style={{ padding: "1.25rem" }}>
                        <div style={{ fontWeight: "800", color: "#1f2937" }}>{t.item_name}</div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", fontStyle: "italic" }}>{t.category}</div>
                      </td>
                      <td style={{ padding: "1.25rem", textAlign: "center" }}>
                        <span style={{ fontWeight: "900", fontSize: "1.125rem", color: isImport ? "#059669" : "#dc2626" }}>
                          {isImport ? "+" : "-"}{t.quantity}
                        </span>
                        <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "4px" }}>{t.unit}</span>
                      </td>
                      <td style={{ padding: "1.25rem" }}>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>{t.supplier_name || "Nội bộ"}</div>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>{t.note || "---"}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {transactions.length === 0 && (
               <div style={{ padding: "5rem", textAlign: "center", color: "#94a3b8", fontWeight: "700" }}>Chưa có giao dịch nào được ghi lại.</div>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}
      <AddItemModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={fetchData} />
      <TransactionModal isOpen={!!transConfig} onClose={() => setTransConfig(null)} onSuccess={fetchData} item={transConfig?.item} type={transConfig?.type || "import"} />
      <EditItemModal isOpen={!!editingItem} onClose={() => setEditingItem(null)} onSuccess={fetchData} item={editingItem} />
    </div>
  );
}

// STYLES
const thStyle: any = { padding: "1.25rem", fontSize: "0.75rem", fontWeight: "900", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" };
const badgeStyle = (color: string, bg: string) => ({ padding: "0.35rem 0.7rem", borderRadius: "0.5rem", fontSize: "10px", fontWeight: "900", backgroundColor: bg, color: color, border: `1px solid ${color}20` });
const actionBtnStyle = (color: string) => ({ backgroundColor: `${color}15`, color: color, padding: "0.6rem", borderRadius: "0.75rem", border: "none", cursor: "pointer", display: "flex", alignItems: "center" });

function StatCard({ label, value, icon, color, bgColor }: any) {
  return (
    <div style={{ backgroundColor: "#ffffff", borderRadius: "1.5rem", padding: "1.5rem", border: "1px solid #f3f4f6", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "1rem", backgroundColor: bgColor, color: color, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
        <span style={{ fontSize: "1.5rem", fontWeight: "900", color: "#111827" }}>{value}</span>
      </div>
      <p style={{ fontSize: "0.75rem", fontWeight: "800", color: "#64748b", margin: 0, letterSpacing: "0.05em" }}>{label}</p>
    </div>
  );
}