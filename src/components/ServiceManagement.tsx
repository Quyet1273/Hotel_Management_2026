import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Coffee,
  Shirt,
  Sparkles,
  MoreHorizontal,
  LayoutGrid,
  List,
  Search,
  Package,
  CheckCircle2,
  AlertCircle,
  Briefcase, // Icon mới cho Header
} from "lucide-react";
import { serviceService, Service } from "../services/serviceService";
import { toast } from "sonner";

export function ServiceManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    unit: "",
    category: "food" as Service["category"],
    image_url: "",
    description: "",
  });

  const categories = [
    { value: "food", label: "Ăn uống", icon: Coffee, color: "bg-blue-500", light: "bg-blue-50", text: "text-blue-600" },
    { value: "laundry", label: "Giặt ủi", icon: Shirt, color: "bg-purple-500", light: "bg-purple-50", text: "text-purple-600" },
    { value: "spa", label: "Spa & Massage", icon: Sparkles, color: "bg-pink-500", light: "bg-pink-50", text: "text-pink-600" },
    { value: "other", label: "Khác", icon: MoreHorizontal, color: "bg-slate-500", light: "bg-slate-50", text: "text-slate-600" },
  ];

  useEffect(() => { loadServices(); }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await serviceService.getAllServices();
      setServices(data);
    } catch (error: any) {
      toast.error("Lỗi tải dữ liệu: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryInfo = (category: string) => {
    return categories.find((c) => c.value === category) || categories[3];
  };

  const resetForm = () => {
    setFormData({ name: "", price: 0, unit: "", category: "food", image_url: "", description: "" });
    setEditingService(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading("Đang xử lý...");
    try {
      if (editingService?.id) {
        await serviceService.updateService(editingService.id, { ...formData, is_active: editingService.is_active });
        toast.success("Cập nhật thành công!", { id: loadingToast });
      } else {
        await serviceService.createService({ ...formData, is_active: true });
        toast.success("Thêm dịch vụ mới thành công!", { id: loadingToast });
      }
      setShowForm(false);
      resetForm();
      loadServices();
    } catch (error: any) {
      toast.error("Lỗi: " + error.message, { id: loadingToast });
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      price: service.price,
      unit: service.unit,
      category: service.category,
      image_url: service.image_url || "",
      description: service.description || "",
    });
    setShowForm(true);
  };

  const handleToggleStatus = async (service: Service) => {
    if (!service.id) return;
    try {
      await serviceService.toggleActiveStatus(service.id, service.is_active);
      toast.success(`Đã ${service.is_active ? "ngừng bán" : "mở bán"} ${service.name}`);
      loadServices();
    } catch (error: any) {
      toast.error("Không thể thay đổi trạng thái");
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !window.confirm("Bạn có chắc muốn xóa dịch vụ này vĩnh viễn?")) return;
    try {
      await serviceService.deleteService(id);
      toast.success("Đã xóa dịch vụ");
      loadServices();
    } catch (error: any) {
      toast.error("Lỗi khi xóa: " + error.message);
    }
  };

  const filteredServices = services.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCategory === "all" || s.category === filterCategory;
    return matchSearch && matchCat;
  });

  if (loading)
    return <div className="p-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest text-xs">Đang tải danh mục dịch vụ...</div>;

  return (
 <div className="space-y-6 pb-20 animate-in fade-in duration-500 font-sans antialiased">
      
      {/* HEADER BANNER - ĐỒNG BỘ NỀN VÀ FONT */}
      <div className="bg-[#D1F4FA] dark:bg-gray-800 rounded-[2rem] p-8 flex flex-col md:flex-row gap-4 justify-between md:items-center shadow-sm border border-blue-100 dark:border-gray-700">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-600/10 dark:bg-white/10 rounded-2xl flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-blue-700 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">
              Danh Mục Dịch Vụ
            </h1>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-extrabold text-[13px] uppercase tracking-wider shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span>+ Thêm Dịch Vụ</span>
        </button>
      </div>

      {/* TOOLBAR & FILTERS - ĐỒNG BỘ UI SEARCH */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 flex flex-wrap items-center gap-4 shadow-sm">
        {/* Search */}
        <div className="flex-1 min-w-[250px] relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm tên dịch vụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900/80 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-2xl focus:border-blue-500 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-gray-800 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold outline-none text-[15px]"
          />
        </div>

        {/* Filter Category */}
       <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/80 px-4 py-2 rounded-2xl border-2 border-gray-200 dark:border-gray-600 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
  <span className="text-[12px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider shrink-0">Loại:</span>
  <select
    value={filterCategory}
    onChange={(e) => setFilterCategory(e.target.value)}
    className="bg-transparent border-none py-1.5 px-2 text-[13px] font-extrabold uppercase text-gray-700 dark:text-gray-200 outline-none cursor-pointer appearance-none text-center [text-align-last:center] min-w-[80px]"
  >
    <option value="all">Tất cả</option>
    {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
  </select>
</div>
        <div className="h-8 w-[2px] bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>

        {/* View Mode Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-900/80 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2.5 rounded-xl transition-all ${viewMode === "grid" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"}`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2.5 rounded-xl transition-all ${viewMode === "list" ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* DỮ LIỆU HIỂN THỊ */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {filteredServices.map((service) => {
            const cat = getCategoryInfo(service.category);
            return (
              <div
                key={service.id}
                className={`group bg-white dark:bg-gray-800 rounded-[2rem] border-2 border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-500/50 transition-all duration-300 ${!service.is_active ? "opacity-60 grayscale" : ""}`}
              >
                <div className="aspect-[16/10] relative overflow-hidden bg-gray-100 dark:bg-gray-900">
                  {service.image_url ? (
                    <img src={service.image_url} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className={`w-full h-full ${cat.color} flex items-center justify-center`}>
                      <cat.icon className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold uppercase tracking-widest text-white ${cat.color} shadow-md`}>
                      {cat.label}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-[16px] mb-1 truncate uppercase">{service.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-[20px] font-extrabold text-blue-600 dark:text-blue-400">{service.price.toLocaleString()}đ</span>
                    <span className="text-[13px] text-gray-500 dark:text-gray-400 font-bold">/{service.unit}</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t-2 border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => handleToggleStatus(service)}
                      className={`flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider transition-colors ${service.is_active ? "text-emerald-500" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"}`}
                    >
                      {service.is_active ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {service.is_active ? "Đang bán" : "Tạm ẩn"}
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(service)} className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all border border-blue-200 dark:border-blue-800/50">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(service.id)} className="p-2.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all border border-rose-200 dark:border-rose-800/50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] border-2 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b-2 border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-8 py-5 text-[12px] font-extrabold uppercase text-gray-500 dark:text-gray-400 tracking-widest whitespace-nowrap">Dịch vụ</th>
                  <th className="px-8 py-5 text-[12px] font-extrabold uppercase text-gray-500 dark:text-gray-400 tracking-widest whitespace-nowrap">Loại</th>
                  <th className="px-8 py-5 text-[12px] font-extrabold uppercase text-gray-500 dark:text-gray-400 tracking-widest whitespace-nowrap">Đơn giá</th>
                  <th className="px-8 py-5 text-[12px] font-extrabold uppercase text-gray-500 dark:text-gray-400 tracking-widest text-center whitespace-nowrap">Trạng thái</th>
                  <th className="px-8 py-5 text-[12px] font-extrabold uppercase text-gray-500 dark:text-gray-400 tracking-widest text-right whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredServices.map((s) => (
                  <tr key={s.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        {s.image_url ? (
                          <img src={s.image_url} className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-gray-600 shadow-sm" alt={s.name} />
                        ) : (
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getCategoryInfo(s.category).light} ${getCategoryInfo(s.category).text}`}>
                            <Package className="w-6 h-6 opacity-60" />
                          </div>
                        )}
                        <span className="font-extrabold text-gray-900 dark:text-white uppercase text-[14px]">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`inline-block px-3 py-1.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider ${getCategoryInfo(s.category).light} ${getCategoryInfo(s.category).text}`}>
                        {getCategoryInfo(s.category).label}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-[15px] font-extrabold text-blue-600 dark:text-blue-400">{s.price.toLocaleString()}đ</span>
                      <span className="text-gray-500 dark:text-gray-400 text-[12px] ml-1 font-bold">/{s.unit}</span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(s)}
                        className={`px-4 py-2 rounded-xl text-[11px] font-extrabold tracking-wider transition-all border-2 ${s.is_active ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50" : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600"}`}
                      >
                        {s.is_active ? "ĐANG BÁN" : "TẠM ẨN"}
                      </button>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-100 lg:opacity-60 lg:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(s)} className="p-2.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white rounded-xl border border-blue-200 dark:border-blue-800/50 shadow-sm transition-all">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(s.id)} className="p-2.5 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white rounded-xl border border-rose-200 dark:border-rose-800/50 shadow-sm transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-300 border border-gray-200 dark:border-gray-700">
            <div className="bg-blue-600 p-8 text-white relative">
              <h3 className="text-2xl font-extrabold uppercase tracking-tight">
                {editingService ? "Cập nhật dịch vụ" : "Thêm dịch vụ mới"}
              </h3>
              <p className="text-blue-100 text-[13px] mt-1 font-medium">Điền thông tin chi tiết dịch vụ vào bên dưới</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Tên dịch vụ</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900/80 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold outline-none transition-all"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Đơn giá (VNĐ)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900/80 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Đơn vị tính</label>
                    <input
                      type="text"
                      placeholder="vd: Lon, Kg, Lượt"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900/80 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold outline-none transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Phân loại</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900/80 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold outline-none transition-all appearance-none"
                    >
                      {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Ảnh (URL)</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900/80 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl font-extrabold uppercase text-[12px] tracking-wider hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-extrabold uppercase text-[12px] tracking-wider shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all active:scale-95"
                >
                  Lưu thông tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}