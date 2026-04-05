import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Key,
  Shield,
  User,
  Loader2,
  Settings2,
  Users,
  ShieldAlert,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { roleService } from "../services/roleService";
import { toast } from "sonner";
import { Role, allPermissions } from "../types/role";

export function EmployeeManagement() {
  const [activeTab, setActiveTab] = useState<"employees" | "roles">(
    "employees",
  );
  const [isLoading, setIsLoading] = useState(true);

  // ================= STATE NHÂN VIÊN =================
  const [employees, setEmployees] = useState<any[]>([]);
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [empFormData, setEmpFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "staff",
  });

  // ================= STATE PHÂN QUYỀN =================
  const [roles, setRoles] = useState<Role[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  // State Quản lý Role (Tab 2)
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRolePreview, setSelectedRolePreview] = useState<string | null>(
    null,
  );
  const [roleFormData, setRoleFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });

  const modules = [...new Set(allPermissions.map((p) => p.module))];

  // ================= LOAD DATA =================
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    const [empsRes, rolesRes] = await Promise.all([
      roleService.getEmployees(),
      roleService.getRoles(),
    ]);
    if (empsRes.success) setEmployees(empsRes.data || []);
    if (rolesRes.success) setRoles(rolesRes.data || []);
    setIsLoading(false);
  };

  // ================= LOGIC TAB NHÂN VIÊN =================
  const handleEmpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingEmployee) {
        // --- CẬP NHẬT HỒ SƠ NHÂN VIÊN ---
        const { error } = await supabase
          .from("employees")
          .update({
            fullName: empFormData.name,
            email: empFormData.email,
            phone: empFormData.phone,
          })
          .eq("id", editingEmployee.id);

        if (error) throw error;
        toast.success("Cập nhật thông tin thành công");
      } else {
        // --- CẤP TÀI KHOẢN MỚI ---
        // Bước A: Tạo tài khoản đăng nhập (Auth)
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: empFormData.email,
            password: empFormData.password, // Mật khẩu quản lý tự đặt cho nhân viên
            options: {
              data: {
                full_name: empFormData.name,
                role: empFormData.role,
              },
            },
          },
        );

        if (authError) throw authError;

        // Bước B: Lưu hồ sơ vào DB dùng ID từ Auth để đồng bộ
        if (authData.user) {
          const { error: dbError } = await supabase.from("employees").insert([
            {
              id: authData.user.id, // RẤT QUAN TRỌNG: Dùng chung ID với Auth
              fullName: empFormData.name,
              email: empFormData.email,
              phone: empFormData.phone,
              role: empFormData.role,
              status: "active",
            },
          ]);

          if (dbError) throw dbError;
        }

        toast.success(`Đã cấp tài khoản cho nhân viên ${empFormData.name}`);
      }

      setShowEmpForm(false);
      loadInitialData(); // Load lại để cập nhật bảng danh sách
    } catch (error: any) {
      // Báo lỗi cụ thể nếu email trùng hoặc pass < 6 ký tự
      toast.error("Lỗi: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (empId: string, currentStatus: string) => {
    const result = await roleService.toggleEmployeeStatus(empId, currentStatus);
    if (result.success) loadInitialData();
  };

  const openAssignModal = (emp: any) => {
    setSelectedEmp(emp);
    setSelectedRoleId(emp.role || "");
    setShowAssignModal(true);
  };

  const handleAssignRoleSubmit = async () => {
    if (!selectedRoleId) return toast.error("Vui lòng chọn chức vụ!");
    setIsAssigning(true);
    const result = await roleService.updateEmployeeRole(
      selectedEmp.id,
      selectedRoleId,
    );
    setIsAssigning(false);
    if (result.success) {
      toast.success("Đã cập nhật quyền hạn");
      setShowAssignModal(false);
      loadInitialData();
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (confirm("Xóa nhân viên này?")) {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (!error) {
        toast.success("Đã xóa");
        loadInitialData();
      }
    }
  };

  // ================= LOGIC TAB VAI TRÒ =================
  const handleSaveRole = async () => {
    const roleId = editingRole
      ? editingRole.id
      : roleFormData.name.toLowerCase().replace(/\s+/g, "-");
    const result = await roleService.saveRole(roleId, roleFormData);
    if (result.success) {
      toast.success("Lưu vai trò thành công");
      setShowRoleModal(false);
      loadInitialData();
    }
  };

  const togglePermission = (permId: string) => {
    setRoleFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-blue-600 mb-2" /> Tải dữ liệu nhân
        sự...
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Quản Lý Nhân Sự & Phân Quyền
          </h2>
          <p className="text-gray-600">
            Quản lý hồ sơ nhân viên và cấu hình quyền truy cập hệ thống
          </p>
        </div>
        {activeTab === "employees" ? (
          <button
            onClick={() => {
              setEditingEmployee(null);
              setEmpFormData({
                name: "",
                email: "",
                phone: "",
                password: "",
                role: "staff",
              });
              setShowEmpForm(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={20} /> Thêm Nhân Viên
          </button>
        ) : (
          <button
            onClick={() => {
              setEditingRole(null);
              setRoleFormData({ name: "", description: "", permissions: [] });
              setShowRoleModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all"
          >
            <Plus size={20} /> Tạo Vai Trò
          </button>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("employees")}
          className={`pb-4 text-sm font-black tracking-widest uppercase transition-all ${activeTab === "employees" ? "border-b-4 border-blue-600 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
        >
          <div className="flex items-center gap-2">
            <Users size={18} /> Danh sách nhân sự
          </div>
        </button>
        <button
          onClick={() => setActiveTab("roles")}
          className={`pb-4 text-sm font-black tracking-widest uppercase transition-all ${activeTab === "roles" ? "border-b-4 border-blue-600 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
        >
          <div className="flex items-center gap-2">
            <Settings2 size={18} /> Cấu hình chức vụ
          </div>
        </button>
      </div>

      {/* TAB 1: DANH SÁCH NHÂN VIÊN */}
      {activeTab === "employees" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
              <tr>
                <th className="px-6 py-4">Nhân viên</th>
                <th className="px-6 py-4">Vai trò / Quyền</th>
                <th className="px-6 py-4">Liên hệ</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {employees.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {emp.fullName?.charAt(0) || "U"}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">
                          {emp.fullName}
                        </div>
                        <div className="text-xs text-gray-500">
                          @{emp.email.split("@")[0]}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {emp.roles ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
                        <Shield size={14} /> {emp.roles.name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold border border-rose-100">
                        <ShieldAlert size={14} /> Chưa cấp quyền
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {emp.email}
                    </div>
                    <div className="text-xs text-gray-500">
                      {emp.phone || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(emp.id, emp.status)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emp.status === "active" ? "bg-blue-600" : "bg-gray-300"}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emp.status === "active" ? "translate-x-6" : "translate-x-1"}`}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => openAssignModal(emp)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Gán quyền"
                    >
                      <Shield size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingEmployee(emp);
                        setEmpFormData({
                          name: emp.fullName,
                          email: emp.email,
                          phone: emp.phone,
                          password: "",
                          role: emp.role,
                        });
                        setShowEmpForm(true);
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      title="Sửa thông tin"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(emp.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                      title="Xóa"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: CẤU HÌNH VAI TRÒ */}
      {activeTab === "roles" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() =>
                setSelectedRolePreview(
                  selectedRolePreview === role.id ? null : role.id,
                )
              }
              className={`bg-white p-6 rounded-2xl border-2 transition-all cursor-pointer ${selectedRolePreview === role.id ? "border-blue-500 shadow-blue-100 shadow-xl" : "border-gray-100 hover:border-blue-200"}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-600 rounded-xl text-white">
                  <Shield size={24} />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingRole(role);
                    setRoleFormData({
                      name: role.name,
                      description: role.description || "",
                      permissions: [...(role.permissions || [])],
                    });
                    setShowRoleModal(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit size={14} />
                </button>
              </div>
              <h3 className="font-black text-gray-900">{role.name}</h3>
              <p className="text-xs text-gray-500 mt-2 line-clamp-2 h-8">
                {role.description}
              </p>
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between text-xs font-bold text-gray-400">
                <span>{role.userCount || 0} Nhân sự</span>
                <span className="text-blue-600">
                  {role.permissions?.length || 0} Quyền
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: THÔNG TIN CÁ NHÂN NHÂN VIÊN */}
      {showEmpForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[120] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center bg-blue-600 text-white font-black">
              <h3 className="text-lg uppercase tracking-widest">
                {editingEmployee ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
              </h3>
              <button
                onClick={() => setShowEmpForm(false)}
                className="hover:rotate-90 transition-transform"
              >
                <X />
              </button>
            </div>
            <form onSubmit={handleEmpSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">
                  Họ và tên *
                </label>
                <input
                  required
                  value={empFormData.name}
                  onChange={(e) =>
                    setEmpFormData({ ...empFormData, name: e.target.value })
                  }
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={empFormData.phone}
                  onChange={(e) =>
                    setEmpFormData({ ...empFormData, phone: e.target.value })
                  }
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                  placeholder="09xxx..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">
                  Email liên hệ *
                </label>
                <input
                  required
                  type="email"
                  value={empFormData.email}
                  onChange={(e) =>
                    setEmpFormData({ ...empFormData, email: e.target.value })
                  }
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                  placeholder="example@gmail.com"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">
                  Mật khẩu khởi tạo *
                </label>
                <input
                  required
                  type="password"
                  value={empFormData.password}
                  onChange={(e) =>
                    setEmpFormData({ ...empFormData, password: e.target.value })
                  }
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                  placeholder="Nhập ít nhất 6 ký tự..."
                />
                <p className="text-[10px] text-gray-400 mt-1 italic">
                  * Nhân viên sẽ dùng email và mật khẩu này để đăng nhập.
                </p>
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all mt-4"
              >
                {editingEmployee ? "Cập nhật ngay" : "Thêm vào hệ thống"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GÁN CHỨC VỤ NHANH */}
      {showAssignModal && selectedEmp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900">
                Phân Quyền Nhân Sự
              </h3>
              <button onClick={() => setShowAssignModal(false)}>
                <X />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-gray-50 p-4 rounded-2xl border">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                  Đang cấu hình cho
                </p>
                <p className="font-bold text-gray-900">
                  {selectedEmp.fullName}
                </p>
              </div>
              <div className="grid gap-3">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoleId(r.id)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${selectedRoleId === r.id ? "border-blue-600 bg-blue-50" : "border-gray-100 hover:border-blue-200"}`}
                  >
                    <p className="font-black text-gray-900 text-sm">{r.name}</p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      {r.permissions?.length} quyền hạn được gán
                    </p>
                  </button>
                ))}
              </div>
              <button
                onClick={handleAssignRoleSubmit}
                disabled={isAssigning}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 disabled:opacity-50"
              >
                {isAssigning ? "Đang lưu..." : "Xác nhận thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CẤU HÌNH CHI TIẾT QUYỀN */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gray-900 text-white">
              <h3 className="text-xl font-black uppercase tracking-tighter">
                {editingRole ? "Chỉnh sửa vai trò" : "Tạo vai trò mới"}
              </h3>
              <button onClick={() => setShowRoleModal(false)}>
                <X />
              </button>
            </div>
            <div className="p-8 overflow-y-auto space-y-8 bg-gray-50/30">
              <div className="grid grid-cols-2 gap-6">
                <input
                  value={roleFormData.name}
                  onChange={(e) =>
                    setRoleFormData({ ...roleFormData, name: e.target.value })
                  }
                  className="p-4 bg-white border border-gray-200 rounded-2xl font-bold outline-none focus:border-blue-500"
                  placeholder="Tên vai trò"
                />
                <input
                  value={roleFormData.description}
                  onChange={(e) =>
                    setRoleFormData({
                      ...roleFormData,
                      description: e.target.value,
                    })
                  }
                  className="p-4 bg-white border border-gray-200 rounded-2xl font-bold outline-none focus:border-blue-500"
                  placeholder="Mô tả chức năng"
                />
              </div>
              <div className="space-y-4">
                {modules.map((module) => (
                  <div
                    key={module}
                    className="bg-white border border-gray-100 p-6 rounded-2xl"
                  >
                    <h4 className="font-black text-gray-900 mb-4 uppercase text-xs tracking-widest text-blue-600 border-l-4 border-blue-600 pl-3">
                      {module}
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {allPermissions
                        .filter((p) => p.module === module)
                        .map((perm) => (
                          <label
                            key={perm.id}
                            className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${roleFormData.permissions.includes(perm.id) ? "border-blue-600 bg-blue-50" : "border-gray-50 hover:border-gray-200"}`}
                          >
                            <input
                              type="checkbox"
                              checked={roleFormData.permissions.includes(
                                perm.id,
                              )}
                              onChange={() => togglePermission(perm.id)}
                              className="mt-1 w-4 h-4 rounded text-blue-600"
                            />
                            <div>
                              <p className="font-bold text-sm text-gray-900">
                                {perm.name}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                {perm.description}
                              </p>
                            </div>
                          </label>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t bg-white flex justify-end gap-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-8 py-3 font-bold text-gray-500"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveRole}
                className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-100"
              >
                Lưu cấu hình vai trò
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
