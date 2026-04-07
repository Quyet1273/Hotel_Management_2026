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
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      <p className="font-bold text-slate-500">Đang tải dữ liệu kho vật tư...</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 pb-20 animate-in fade-in duration-500 font-sans antialiased">
      
      {/* HEADER BANNER - CHUẨN DESIGN GỐC */}
      <div className="bg-[#e0f2fe] rounded-[2rem] p-6 lg:p-8 flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-[#bae6fd] rounded-2xl flex items-center justify-center">
            <Package className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-[22px] md:text-[28px] font-black m-0 tracking-tight uppercase text-slate-900">
              QUẢN LÝ KHO VẬT TƯ
            </h1>
          </div>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-7 py-3.5 rounded-2xl font-bold text-[13px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
        >
          + THÊM DANH MỤC
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard 
          label="TỔNG MẶT HÀNG" 
          value={stats.totalItems} 
          icon={<Box size={28}/>} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50" 
        />
        <StatCard 
          label="SẮP HẾT HÀNG" 
          value={stats.lowStock} 
          icon={<AlertTriangle size={28}/>} 
          colorClass="text-rose-600" 
          bgClass="bg-rose-50" 
        />
        <StatCard 
          label="LỊCH SỬ GIAO DỊCH" 
          value={stats.recentTransactions} 
          icon={<History size={28}/>} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-50" 
        />
        <StatCard 
          label="GIÁ TRỊ KHO" 
          value={formatCurrency(stats.totalValue)} 
          icon={<TrendingUp size={28}/>} 
          colorClass="text-violet-600" 
          bgClass="bg-violet-50" 
        />
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-[2rem] border-2 border-slate-100 overflow-hidden shadow-sm">
        
        {/* TABS */}
        <div className="flex p-3 bg-slate-50 gap-3 border-b-2 border-slate-100">
          <button 
            onClick={() => setActiveTab("inventory")}
            className={`flex-1 py-4 px-6 rounded-2xl border-none cursor-pointer text-[13px] uppercase tracking-widest transition-all ${activeTab === "inventory" ? "font-black bg-white text-blue-600 shadow-sm border border-slate-200" : "font-extrabold bg-transparent text-slate-400 hover:text-slate-600"}`}
          >
            📦 TỒN KHO
          </button>
          <button 
            onClick={() => setActiveTab("transactions")}
            className={`flex-1 py-4 px-6 rounded-2xl border-none cursor-pointer text-[13px] uppercase tracking-widest transition-all ${activeTab === "transactions" ? "font-black bg-white text-blue-600 shadow-sm border border-slate-200" : "font-extrabold bg-transparent text-slate-400 hover:text-slate-600"}`}
          >
            🕒 LỊCH SỬ
          </button>
        </div>

        {activeTab === "inventory" ? (
          <div>
            {/* TOOLBAR KHO VẬT TƯ */}
            <div className="p-5 flex flex-col md:flex-row items-center gap-4 border-b-2 border-slate-100 bg-white">
              
              {/* Ô TÌM KIẾM */}
              <div className="relative flex-1 w-full max-w-md">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text" 
                  placeholder="Tìm tên vật tư..."
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-[48px] pl-11 pr-5 bg-slate-50 border-2 border-slate-100 rounded-xl text-[14px] font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                />
              </div>
              
              {/* BỘ LỌC DANH MỤC */}
              <div className="relative flex items-center h-[48px] bg-white border-2 border-slate-200 rounded-xl px-4 focus-within:border-blue-500 transition-all shadow-sm">
                <span className="text-[13px] font-bold text-slate-500 uppercase mr-2 shrink-0 pointer-events-none">
                  DANH MỤC:
                </span>
                <select
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-transparent text-[14px] font-black text-slate-700 uppercase outline-none cursor-pointer appearance-none min-w-[170px]"
                >
                  <option value="all">TẤT CẢ DANH MỤC</option>
                  <option value="amenities">TIỆN NGHI</option>
                  <option value="food">THỰC PHẨM</option>
                  <option value="beverage">ĐỒ UỐNG</option>
                  <option value="cleaning">VỆ SINH</option>
                  <option value="other">KHÁC</option>
                </select>
              </div>
            </div>

            {/* BẢNG TỒN KHO */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b-2 border-slate-100">
                  <tr>
                    <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-slate-500 tracking-widest whitespace-nowrap">Tên vật tư</th>
                    <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-slate-500 tracking-widest text-center whitespace-nowrap">Danh mục</th>
                    <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-slate-500 tracking-widest text-center whitespace-nowrap">Tồn kho</th>
                    <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-slate-500 tracking-widest text-right whitespace-nowrap">Đơn giá</th>
                    <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-slate-500 tracking-widest text-center whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => {
                    const isLow = (item.quantity_in_stock || 0) <= (item.min_quantity || 0);
                    return (
                      <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="font-extrabold text-[15px] text-slate-900 uppercase mb-0.5 whitespace-nowrap">{item.name}</div>
                          <div className="text-[12px] font-bold text-slate-500">Min: {item.min_quantity} {item.unit}</div>
                        </td>
                        <td className="px-6 py-5 text-center">
                           <span className="inline-block px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-black text-[11px] uppercase tracking-widest border border-slate-200 shadow-sm whitespace-nowrap">
                             {item.category}
                           </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`inline-block px-4 py-1.5 rounded-xl font-black text-[14px] border shadow-sm ${isLow ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-slate-50 text-slate-800 border-slate-200"}`}>
                            {item.quantity_in_stock || 0}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right font-black text-[15px] text-slate-800 whitespace-nowrap">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-6 py-5">
                           <div className="flex justify-center gap-2 opacity-100 lg:opacity-50 lg:group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setTransConfig({ item, type: "import" })} className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl border border-emerald-200 transition-all shadow-sm" title="Nhập kho">
                                <Upload size={16}/>
                              </button>
                              <button onClick={() => setTransConfig({ item, type: "export" })} className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl border border-rose-200 transition-all shadow-sm" title="Xuất kho">
                                <Download size={16}/>
                              </button>
                              <button onClick={() => setEditingItem(item)} className="p-2.5 bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white rounded-xl border border-amber-200 transition-all shadow-sm" title="Sửa thông tin">
                                <Edit3 size={16}/>
                              </button>
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredItems.length === 0 && (
                 <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                    <Box size={64} className="opacity-20" />
                    <p className="font-extrabold text-[14px] uppercase tracking-widest">Không có dữ liệu tồn kho.</p>
                 </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            {/* BẢNG LỊCH SỬ GIAO DỊCH */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b-2 border-slate-100">
                  <tr>
                    <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-slate-500 tracking-widest whitespace-nowrap">Thời gian</th>
                    <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-slate-500 tracking-widest whitespace-nowrap">Loại</th>
                    <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-slate-500 tracking-widest whitespace-nowrap">Vật tư</th>
                    <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-slate-500 tracking-widest text-center whitespace-nowrap">Số lượng</th>
                    <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-slate-500 tracking-widest whitespace-nowrap">Thông tin thêm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((t) => {
                    const isImport = t.transaction_type === "IN";
                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="font-extrabold text-[14px] text-slate-900 mb-0.5">{new Date(t.created_at).toLocaleDateString("vi-VN")}</div>
                          <div className="text-[12px] font-bold text-slate-400">{new Date(t.created_at).toLocaleTimeString("vi-VN")}</div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-block px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase tracking-wider border whitespace-nowrap ${isImport ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200"}`}>
                            {isImport ? "⬇ NHẬP KHO" : "⬆ XUẤT KHO"}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-extrabold text-[15px] text-slate-900 uppercase mb-0.5 whitespace-nowrap">{t.item_name}</div>
                          <div className="text-[12px] font-bold text-slate-400 uppercase">{t.category}</div>
                        </td>
                        <td className="px-6 py-5 text-center whitespace-nowrap">
                          <span className={`font-black text-[18px] ${isImport ? "text-emerald-600" : "text-rose-600"}`}>
                            {isImport ? "+" : "-"}{t.quantity}
                          </span>
                          <span className="text-[12px] font-bold text-slate-400 ml-1 uppercase">{t.unit}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-extrabold text-[13px] text-slate-700 mb-0.5 whitespace-nowrap">{t.supplier_name || "Nội bộ"}</div>
                          <div className="text-[12px] font-semibold text-slate-400 italic line-clamp-2">{t.note || "---"}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {transactions.length === 0 && (
                 <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                    <History size={64} className="opacity-20" />
                    <p className="font-extrabold text-[14px] uppercase tracking-widest">Chưa có giao dịch nào được ghi lại.</p>
                 </div>
              )}
            </div>
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

// --- HELPER: Thẻ Thống Kê (Stat Card) ---
function StatCard({ label, value, icon, colorClass, bgClass }: any) {
  return (
    <div className="bg-white rounded-[2rem] p-7 border-2 border-slate-100 shadow-sm flex flex-col gap-5 hover:border-blue-300 transition-all group">
      <div className="flex justify-between items-start">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform ${bgClass} ${colorClass}`}>
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