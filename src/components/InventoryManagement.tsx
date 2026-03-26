import { useState, useEffect } from "react";
import {
  Package,
  Plus,
  AlertTriangle,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Box,
  History,
  Loader2,
  Upload,
  Download,
  Edit3,
  Trash2,
} from "lucide-react";
import { inventoryService } from "../services/inventoryservice";
import { AddItemModal } from "../modal/addItemModal";
import { TransactionModal } from "../modal/TransactionModal";
import { EditItemModal } from "../modal/EditItemModal"; // Cần tạo thêm file này
import { toast } from "sonner";

export function InventoryManagement() {
  const [items, setItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"inventory" | "transactions">(
    "inventory",
  );

  // Modal Control
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [transConfig, setTransConfig] = useState<{
    item: any;
    type: "import" | "export";
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [itemsRes, transRes] = await Promise.all([
      inventoryService.getItems(),
      inventoryService.getTransactions(),
    ]);
    // Lọc lấy các mặt hàng chưa bị xóa (is_active !== false)
    if (itemsRes.success) {
      setItems(itemsRes.data?.filter((i: any) => i.is_active !== false) || []);
    }
    if (transRes.success) setTransactions(transRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Xử lý Xóa vật tư (Soft Delete)
  const handleDeleteItem = async (id: string, name: string) => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn ngừng sử dụng vật tư "${name}"? Dữ liệu lịch sử vẫn sẽ được giữ lại.`,
      )
    ) {
      const res = await inventoryService.deleteItem(id);
      if (res.success) {
        toast.success("Đã ngừng sử dụng vật tư");
        fetchData();
      } else {
        toast.error("Lỗi: " + res.error);
      }
    }
  };

  // Helpers
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);

  const getCategoryBadge = (category: string) => {
    const styles: any = {
      amenities: "bg-purple-50 text-purple-700 border-purple-200",
      food: "bg-amber-50 text-amber-700 border-amber-200",
      beverage: "bg-blue-50 text-blue-700 border-blue-200",
      cleaning: "bg-emerald-50 text-emerald-700 border-emerald-200",
      other: "bg-gray-50 text-gray-700 border-gray-200",
    };
    const labels: any = {
      amenities: "Tiện nghi",
      food: "Thực phẩm",
      beverage: "Đồ uống",
      cleaning: "Vệ sinh",
      other: "Khác",
    };
    return (
      <span
        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${styles[category] || styles.other}`}
      >
        {labels[category] || category}
      </span>
    );
  };

  const filteredItems = items.filter((item) => {
    const matchSearch = (item?.name || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchCategory =
      filterCategory === "all" || item.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const lowStockItems = items.filter(
    (item) => (item.quantity_in_stock || 0) <= (item.min_quantity || 0),
  );

  const stats = {
    totalItems: items.length,
    lowStock: lowStockItems.length,
    totalValue: items.reduce(
      (sum, item) => sum + (item.quantity_in_stock || 0) * (item.price || 0),
      0,
    ),
    recentTransactions: transactions.filter(
      (t) =>
        new Date(t.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).length,
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* HEADER */}
      <div className="bg-blue-600 rounded-[2rem] shadow-xl p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* ĐÃ SỬA: Bỏ relative và z-10 ở dòng dưới này */}
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
            <Package className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-1">
              Quản Lý Kho Vật Tư
            </h1>
            <p className="text-blue-100 text-sm font-medium">
              Kiểm soát xuất nhập tồn cho HotelPro
            </p>
          </div>
        </div>

        {/* ĐÃ SỬA: Bỏ relative và z-10 ở class của button này luôn */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-white text-blue-600 rounded-2xl hover:bg-blue-50 font-black uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95"
        >
          <Plus className="w-4 h-4" /> Thêm Danh Mục
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Box />}
          label="Tổng mặt hàng"
          value={stats.totalItems}
          color="blue"
        />
        <StatCard
          icon={<AlertTriangle />}
          label="Sắp hết hàng"
          value={stats.lowStock}
          color="rose"
        />
        <StatCard
          icon={<History />}
          label="Giao dịch tuần"
          value={stats.recentTransactions}
          color="emerald"
        />
        <StatCard
          icon={<TrendingUp />}
          label="Giá trị kho"
          value={formatCurrency(stats.totalValue)}
          color="purple"
          isCurrency
        />
      </div>

      {/* MAIN CONTENT TABLE */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex p-2 gap-2 bg-gray-50/50 border-b border-gray-100">
          <TabButton
            active={activeTab === "inventory"}
            onClick={() => setActiveTab("inventory")}
            icon={<Package />}
            label="Tồn kho"
          />
          <TabButton
            active={activeTab === "transactions"}
            onClick={() => setActiveTab("transactions")}
            icon={<History />}
            label="Lịch sử"
          />
        </div>

        {activeTab === "inventory" ? (
          <div className="p-0">
            <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm tên vật tư..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-2xl outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="md:w-64 pl-4 pr-10 py-3 bg-gray-50 border rounded-2xl outline-none appearance-none"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">Tất cả danh mục</option>
                <option value="amenities">Tiện nghi</option>
                <option value="food">Thực phẩm</option>
                <option value="beverage">Đồ uống</option>
                <option value="cleaning">Vệ sinh</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-y text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  <tr>
                    <th className="p-5 pl-8">Tên vật tư</th>
                    <th className="p-5 text-center">Danh mục</th>
                    <th className="p-5 text-center">Tồn kho</th>
                    <th className="p-5 text-right">Đơn giá</th>
                    <th className="p-5 text-center pr-8">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredItems.map((item) => {
                    const isLow =
                      (item.quantity_in_stock || 0) <= (item.min_quantity || 0);
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-blue-50/30 transition-colors group"
                      >
                        <td className="p-5 pl-8 font-bold text-gray-900">
                          <div className="flex items-center gap-2">
                            {isLow && (
                              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            )}
                            {item.name}
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium">
                            Min: {item.min_quantity} {item.unit}
                          </div>
                        </td>
                        <td className="p-5 text-center">
                          {getCategoryBadge(item.category)}
                        </td>
                        <td className="p-5 text-center font-black">
                          <span
                            className={`px-3 py-1.5 rounded-xl ${isLow ? "bg-rose-100 text-rose-700" : "bg-gray-100 text-gray-800"}`}
                          >
                            {item.quantity_in_stock || 0}
                          </span>
                        </td>
                        <td className="p-5 text-right font-black">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="p-5 pr-8">
                          <div className="flex justify-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() =>
                                setTransConfig({ item, type: "import" })
                              }
                              title="Nhập kho"
                              className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                            >
                              <Upload size={16} />
                            </button>
                            <button
                              onClick={() =>
                                setTransConfig({ item, type: "export" })
                              }
                              title="Xuất kho"
                              className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => setEditingItem(item)}
                              title="Sửa"
                              className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteItem(item.id, item.name)
                              }
                              title="Ngừng sử dụng"
                              className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
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
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b text-[10px] text-slate-400 font-black uppercase tracking-widest">
                <tr>
                  <th className="p-5 pl-8">Thời gian</th>
                  <th className="p-5">Loại</th>
                  <th className="p-5">Vật tư</th>
                  <th className="p-5 text-center">Số lượng</th>
                  <th className="p-5">Thông tin thêm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((t, idx) => {
                  const isImport = t.transaction_type === "IN";
                  const date = new Date(t.created_at);
                  return (
                    <tr
                      key={t.id || idx}
                      className="hover:bg-gray-50 transition-all"
                    >
                      <td className="p-5 pl-8">
                        <div className="text-sm font-bold">
                          {date.toLocaleDateString("vi-VN")}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {date.toLocaleTimeString("vi-VN")}
                        </div>
                      </td>
                      <td className="p-5">
                        <span
                          className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${isImport ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}
                        >
                          {isImport ? "Nhập kho" : "Xuất kho"}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="font-bold text-gray-900 text-sm">
                          {t.item_name}
                        </div>
                        <div className="text-[10px] text-gray-400 italic">
                          {t.category}
                        </div>
                      </td>
                      <td
                        className={`p-5 text-center font-black text-base ${isImport ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {isImport ? "+" : "-"}
                        {t.quantity}{" "}
                        <span className="text-[10px] text-gray-400 font-normal ml-1">
                          {t.unit}
                        </span>
                      </td>
                      <td className="p-5">
                        <div className="text-xs font-bold text-gray-600">
                          {t.supplier_name || "Nội bộ"}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[150px]">
                          {t.note || "---"}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALS */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchData}
      />

      <TransactionModal
        isOpen={!!transConfig}
        onClose={() => setTransConfig(null)}
        onSuccess={fetchData}
        item={transConfig?.item}
        type={transConfig?.type || "import"}
      />

      {/* EDIT MODAL */}
      <EditItemModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSuccess={fetchData}
        item={editingItem}
      />
    </div>
  );
}

// Sub-components nội bộ để code chính ngắn hơn
function StatCard({ icon, label, value, color, isCurrency }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600",
    rose: "bg-rose-50 text-rose-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}
        >
          {icon}
        </div>
        <span className={`text-3xl font-black ${isCurrency ? "text-xl" : ""}`}>
          {value}
        </span>
      </div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
        {label}
      </p>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-2xl transition-all border ${active ? "text-blue-600 bg-blue-50 border-blue-100 shadow-sm font-black scale-[1.02]" : "text-gray-400 bg-transparent border-transparent hover:bg-white font-bold"}`}
    >
      {icon} <span className="text-sm uppercase tracking-tight">{label}</span>
    </button>
  );
}
