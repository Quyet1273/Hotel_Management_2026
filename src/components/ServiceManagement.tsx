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
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      
      {/* HEADER BANNER - CHUẨN STYLE HOTELPRO */}
      <div style={{ 
        backgroundColor: "#2563eb", borderRadius: "2rem", padding: "2rem", color: "#ffffff",
        display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 15px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ width: "4rem", height: "4rem", backgroundColor: "rgba(255, 255, 255, 0.2)", borderRadius: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Briefcase style={{ width: "2rem", height: "2rem", color: "#ffffff" }} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.875rem", fontWeight: "900", margin: 0, textTransform: "uppercase" }}>DANH MỤC DỊCH VỤ</h1>
            <p style={{ color: "rgba(255, 255, 255, 0.8)", margin: 0 }}>Quản lý menu ăn uống, giặt ủi và các tiện ích HotelPro</p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          style={{ backgroundColor: "#ffffff", color: "#2563eb", padding: "0.8rem 1.5rem", borderRadius: "1rem", border: "none", fontWeight: "900", cursor: "pointer", textTransform: "uppercase", fontSize: "0.75rem" }}
        >
          + Thêm Dịch Vụ
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white rounded-[1.5rem] border border-gray-100 p-4 flex flex-wrap items-center gap-4 shadow-sm">
        {/* Search - Đã fix lệch icon */}
        <div className="flex-1 min-w-[200px] relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm tên dịch vụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        {/* Filter Category */}
        <div className="flex items-center gap-2 bg-gray-50/50 px-4 py-2 rounded-xl border border-gray-100">
          <span className="text-[20px] font-black text-gray-400 uppercase">Loại:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-transparent border-none text-sm font-bold text-gray-600 outline-none cursor-pointer"
          >
            <option value="all">Tất cả</option>
            {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div className="h-8 w-[1px] bg-gray-100 hidden sm:block"></div>

        {/* View Mode Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white shadow-sm text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
          >
            <List className="w-4 h-4" />
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
                className={`group bg-white rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 ${!service.is_active ? "opacity-70 grayscale" : ""}`}
              >
                <div className="aspect-[16/10] relative overflow-hidden bg-gray-100">
                  {service.image_url ? (
                    <img src={service.image_url} alt={service.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className={`w-full h-full ${cat.color} flex items-center justify-center`}>
                      <cat.icon className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-white ${cat.color} shadow-lg`}>
                      {cat.label}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-black text-gray-900 text-lg mb-1 truncate uppercase">{service.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-2xl font-black text-blue-600">{service.price.toLocaleString()}đ</span>
                    <span className="text-xs text-gray-400 font-bold">/{service.unit}</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <button
                      onClick={() => handleToggleStatus(service)}
                      className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-wider transition-colors ${service.is_active ? "text-green-500" : "text-gray-400 hover:text-gray-600"}`}
                    >
                      {service.is_active ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      {service.is_active ? "Đang bán" : "Tạm ẩn"}
                    </button>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(service)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-100">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(service.id)} className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all border border-rose-100">
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
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Dịch vụ</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Loại</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest">Đơn giá</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Trạng thái</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredServices.map((s) => (
                <tr key={s.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      {s.image_url ? (
                        <img src={s.image_url} className="w-10 h-10 rounded-xl object-cover border border-gray-100 shadow-sm" alt={s.name} />
                      ) : (
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getCategoryInfo(s.category).light} ${getCategoryInfo(s.category).text}`}>
                          <Package className="w-5 h-5 opacity-50" />
                        </div>
                      )}
                      <span className="font-bold text-gray-900 uppercase text-sm">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${getCategoryInfo(s.category).light} ${getCategoryInfo(s.category).text}`}>
                      {getCategoryInfo(s.category).label}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="font-black text-blue-600">{s.price.toLocaleString()}đ</span>
                    <span className="text-gray-400 text-[10px] ml-1 font-bold">/{s.unit}</span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <button
                      onClick={() => handleToggleStatus(s)}
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all border ${s.is_active ? "bg-green-50 text-green-600 border-green-100" : "bg-gray-50 text-gray-400 border-gray-100"}`}
                    >
                      {s.is_active ? "ACTIVE" : "HIDDEN"}
                    </button>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-all">
                      <button onClick={() => handleEdit(s)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl border border-blue-100 shadow-sm">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-xl border border-rose-100 shadow-sm">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* FORM MODAL - GIỮ NGUYÊN LOGIC */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-blue-600 p-8 text-white relative">
              <h3 className="text-2xl font-black uppercase tracking-tighter">
                {editingService ? "Cập nhật dịch vụ" : "Thêm dịch vụ mới"}
              </h3>
              <p className="text-blue-100 text-xs mt-1 font-medium">Điền thông tin chi tiết dịch vụ vào bên dưới</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Tên dịch vụ</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold outline-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Đơn giá (VNĐ)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Đơn vị tính</label>
                    <input
                      type="text"
                      placeholder="vd: Lon, Kg, Lượt"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Phân loại</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold outline-none"
                    >
                      {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Ảnh minh họa (URL)</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-4 bg-rose-50 text-rose-500 rounded-2xl font-black uppercase text-xs hover:bg-rose-100 transition-all border border-rose-100"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95"
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