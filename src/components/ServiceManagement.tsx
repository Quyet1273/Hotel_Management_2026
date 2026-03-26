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

  // Định nghĩa màu sắc và icon cho từng loại dịch vụ
  const categories = [
    {
      value: "food",
      label: "Ăn uống",
      icon: Coffee,
      color: "bg-blue-500",
      light: "bg-blue-50",
      text: "text-blue-600",
    },
    {
      value: "laundry",
      label: "Giặt ủi",
      icon: Shirt,
      color: "bg-purple-500",
      light: "bg-purple-50",
      text: "text-purple-600",
    },
    {
      value: "spa",
      label: "Spa & Massage",
      icon: Sparkles,
      color: "bg-pink-500",
      light: "bg-pink-50",
      text: "text-pink-600",
    },
    {
      value: "other",
      label: "Khác",
      icon: MoreHorizontal,
      color: "bg-slate-500",
      light: "bg-slate-50",
      text: "text-slate-600",
    },
  ];

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      // Lưu ý: Đảm bảo trong serviceService.getAllServices() KHÔNG có .eq('is_active', true)
      // để trang quản lý thấy được cả đồ đã ẩn.
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
    setFormData({
      name: "",
      price: 0,
      unit: "",
      category: "food",
      image_url: "",
      description: "",
    });
    setEditingService(null);
  };

  // Xử lý Thêm / Sửa
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading("Đang xử lý...");
    try {
      if (editingService?.id) {
        await serviceService.updateService(editingService.id, {
          ...formData,
          is_active: editingService.is_active, // Giữ nguyên trạng thái cũ
        });
        toast.success("Cập nhật thành công!", { id: loadingToast });
      } else {
        await serviceService.createService({
          ...formData,
          is_active: true,
        });
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
      toast.success(
        `Đã ${service.is_active ? "ngừng bán" : "mở bán"} ${service.name}`,
      );
      loadServices();
    } catch (error: any) {
      toast.error("Không thể thay đổi trạng thái");
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !window.confirm("Bạn có chắc muốn xóa dịch vụ này vĩnh viễn?"))
      return;
    try {
      await serviceService.deleteService(id);
      toast.success("Đã xóa dịch vụ");
      loadServices();
    } catch (error: any) {
      toast.error("Lỗi khi xóa: " + error.message);
    }
  };

  // Lọc dữ liệu hiển thị
  const filteredServices = services.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = filterCategory === "all" || s.category === filterCategory;
    return matchSearch && matchCat;
  });

  if (loading)
    return (
      <div className="p-20 text-center animate-pulse text-gray-400">
        Đang tải danh mục dịch vụ...
      </div>
    );

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Bộ lọc */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter">
            DANH MỤC DỊCH VỤ
          </h2>
          <p className="text-gray-500 text-sm font-medium italic">
            Quản lý menu ăn uống và tiện ích khách sạn
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-48">
            {/* Icon dùng z-10 để luôn nổi lên trên */}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10 pointer-events-none" />

            <input
              type="text"
              placeholder="Tìm dịch vụ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              // Ép padding trực tiếp bằng style để không thằng CSS nào đè được
              style={{ paddingLeft: "40px" }}
              className="w-full pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          {/* Filter Category */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả loại</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <div className="h-8 w-[1px] bg-gray-100 mx-2 hidden sm:block"></div>

          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-white shadow-sm text-blue-600" : "text-gray-400"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg ${viewMode === "list" ? "bg-white shadow-sm text-blue-600" : "text-gray-400"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-100"
          >
            <Plus className="w-5 h-5" /> THÊM MỚI
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {filteredServices.map((service) => {
            const cat = getCategoryInfo(service.category);
            return (
              <div
                key={service.id}
                className={`group bg-white rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-blue-100 transition-all duration-500 ${!service.is_active ? "opacity-70 grayscale" : ""}`}
              >
                {/* ĐÃ SỬA: Thay h-44 bằng aspect-[16/10] để khóa tỷ lệ khung hình chuẩn */}
                <div className="aspect-[16/10] relative overflow-hidden bg-gray-100">
                  {service.image_url ? (
                    <img
                      src={service.image_url}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div
                      className={`w-full h-full ${cat.color} flex items-center justify-center`}
                    >
                      <cat.icon className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-white ${cat.color} shadow-lg`}
                    >
                      {cat.label}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-black text-gray-900 text-lg mb-1 truncate uppercase">
                    {service.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-2xl font-black text-blue-600">
                      {service.price.toLocaleString()}đ
                    </span>
                    <span className="text-xs text-gray-400 font-bold">
                      /{service.unit}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <button
                      onClick={() => handleToggleStatus(service)}
                      className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-wider ${service.is_active ? "text-green-500" : "text-gray-400"}`}
                    >
                      {service.is_active ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      {service.is_active ? "Đang bán" : "Tạm ẩn"}
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(service)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
                      >
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
        /* List View (Table) */
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">
                  Dịch vụ
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">
                  Loại
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">
                  Đơn giá
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400">
                  Trạng thái
                </th>
                <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredServices.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  {/* ĐÃ SỬA: Thêm Thumbnail ảnh nhỏ bên cạnh tên dịch vụ cho List View */}
                  <td className="px-8 py-5 font-bold text-gray-900">
                    <div className="flex items-center gap-3">
                      {s.image_url ? (
                        <img
                          src={s.image_url}
                          className="w-10 h-10 rounded-xl object-cover border border-gray-100"
                          alt={s.name}
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${getCategoryInfo(s.category).light} ${getCategoryInfo(s.category).text}`}
                        >
                          <Package className="w-5 h-5 opacity-50" />
                        </div>
                      )}
                      {s.name}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${getCategoryInfo(s.category).light} ${getCategoryInfo(s.category).text}`}
                    >
                      {getCategoryInfo(s.category).label}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="font-black text-blue-600">
                      {s.price.toLocaleString()}đ
                    </span>
                    <span className="text-gray-400 text-[10px] ml-1">
                      /{s.unit}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <button
                      onClick={() => handleToggleStatus(s)}
                      className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${s.is_active ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                    >
                      {s.is_active ? "ACTIVE" : "INACTIVE"}
                    </button>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => handleEdit(s)}
                        className="p-2 text-blue-600 hover:bg-white rounded-lg shadow-sm"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-2 text-rose-600 hover:bg-white rounded-lg shadow-sm"
                      >
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

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-blue-600 p-8 text-white relative">
              <button
                onClick={() => setShowForm(false)}
                className="absolute right-6 top-6 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
              ></button>
              <h3 className="text-2xl font-black uppercase tracking-tighter">
                {editingService ? "Cập nhật dịch vụ" : "Thêm dịch vụ mới"}
              </h3>
              <p className="text-blue-100 text-xs mt-1">
                Điền thông tin chi tiết dịch vụ vào bên dưới
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">
                    Tên dịch vụ
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">
                      Đơn giá (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: Number(e.target.value),
                        })
                      }
                      className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">
                      Đơn vị tính
                    </label>
                    <input
                      type="text"
                      placeholder="vd: Lon, Kg, Lượt"
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData({ ...formData, unit: e.target.value })
                      }
                      className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">
                      Phân loại
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value as any,
                        })
                      }
                      className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold"
                    >
                      {categories.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">
                      Ảnh minh họa (URL)
                    </label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={formData.image_url}
                      onChange={(e) =>
                        setFormData({ ...formData, image_url: e.target.value })
                      }
                      className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-4 bg-red-50 text-gray-400 rounded-2xl font-black uppercase text-xs hover:bg-red-100 transition-all"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
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
