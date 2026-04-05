import { useState, useEffect } from "react";
import {
  Shield,
  Users,
  Edit,
  Trash2,
  Plus,
  X,
  Check,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Role, allPermissions } from "../types/role";
import { roleService } from "../services/roleService";

export function RolePermissionManagement() {
  const [activeTab, setActiveTab] = useState<"employees" | "roles">(
    "employees",
  );
  const [isLoading, setIsLoading] = useState(true);

  // ================= STATE CHO TAB NHÂN VIÊN =================
  const [employees, setEmployees] = useState<any[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  // ================= STATE CHO TAB VAI TRÒ =================
  const [roles, setRoles] = useState<Role[]>([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });

  const modules = [...new Set(allPermissions.map((p) => p.module))];

  // Gọi dữ liệu từ Supabase khi vừa vào trang
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    const [rolesRes, empsRes] = await Promise.all([
      roleService.getRoles(),
      roleService.getEmployees(),
    ]);

    if (rolesRes.success && rolesRes.data) setRoles(rolesRes.data);
    else if (!rolesRes.success)
      toast.error("Lỗi tải danh sách vai trò: " + rolesRes.error);

    if (empsRes.success && empsRes.data) setEmployees(empsRes.data);
    else if (!empsRes.success)
      toast.error("Lỗi tải danh sách nhân viên: " + empsRes.error);

    setIsLoading(false);
  };

  // ================= LOGIC NHÂN VIÊN =================
  const openAssignForm = (emp: any) => {
    setSelectedEmp(emp);
    setSelectedRoleId(emp.role || "");
    setShowAssignModal(true);
  };

  const handleAssignRole = async () => {
    if (!selectedRoleId) return toast.error("Vui lòng chọn chức vụ!");
    setIsAssigning(true);
    const result = await roleService.updateEmployeeRole(
      selectedEmp.id,
      selectedRoleId,
    );
    setIsAssigning(false);

    if (result.success) {
      toast.success(
        `Đã cập nhật quyền cho ${selectedEmp.fullName || selectedEmp.name}`,
      );
      setShowAssignModal(false);
      loadAllData();
    } else {
      toast.error("Lỗi khi gán quyền: " + result.error);
    }
  };

  // ================= LOGIC VAI TRÒ =================
  const handleCreateRole = () => {
    setEditingRole(null);
    setFormData({ name: "", description: "", permissions: [] });
    setShowRoleModal(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || "",
      permissions: [...(role.permissions || [])],
    });
    setShowRoleModal(true);
  };

  const handleSaveRole = async () => {
    setIsSavingRole(true);
    const roleId = editingRole
      ? editingRole.id
      : formData.name
          .toLowerCase()
          .trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "-")
          .replace(/[^\w-]+/g, "");

    const result = await roleService.saveRole(roleId, formData);
    setIsSavingRole(false);

    if (result.success) {
      toast.success(
        editingRole ? "Cập nhật thành công!" : "Tạo vai trò thành công!",
      );
      setShowRoleModal(false);
      loadAllData();
    } else {
      toast.error("Lỗi khi lưu vai trò: " + result.error);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (
      confirm(
        "Bạn có chắc muốn xóa vai trò này? Hệ thống sẽ báo lỗi nếu vai trò đang được gán cho nhân viên.",
      )
    ) {
      const result = await roleService.deleteRole(roleId);
      if (result.success) {
        toast.success("Đã xóa vai trò!");
        if (selectedRole === roleId) setSelectedRole(null);
        loadAllData();
      } else {
        toast.error(result.error);
      }
    }
  };

  const togglePermission = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const toggleAllPermissionsInModule = (module: string) => {
    const modulePermissions = allPermissions
      .filter((p) => p.module === module)
      .map((p) => p.id);
    const allSelected = modulePermissions.every((p) =>
      formData.permissions.includes(p),
    );

    setFormData((prev) => {
      if (allSelected) {
        // Bỏ chọn tất cả
        return {
          ...prev,
          permissions: prev.permissions.filter(
            (p) => !modulePermissions.includes(p),
          ),
        };
      } else {
        // Chọn tất cả (dùng Set để tránh trùng lặp quyền)
        const newPermissions = [
          ...new Set([...prev.permissions, ...modulePermissions]),
        ];
        return { ...prev, permissions: newPermissions };
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium">
          Đang tải dữ liệu phân quyền...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Quản Lý Nhân Viên & Phân Quyền
          </h2>
          <p className="text-gray-600 mt-1">
            Quản lý vai trò và quyền truy cập hệ thống
          </p>
        </div>
        {activeTab === "roles" && (
          <button
            onClick={handleCreateRole}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-600/30"
          >
            <Plus className="w-5 h-5" />
            Tạo Vai Trò Mới
          </button>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("employees")}
          className={`pb-3 px-4 font-bold uppercase text-sm tracking-widest transition-all ${activeTab === "employees" ? "border-b-4 border-blue-600 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
        >
          Danh sách nhân sự
        </button>
        <button
          onClick={() => setActiveTab("roles")}
          className={`pb-3 px-4 font-bold uppercase text-sm tracking-widest transition-all ${activeTab === "roles" ? "border-b-4 border-blue-600 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
        >
          Cấu hình chức vụ
        </button>
      </div>

      {/* ================= NỘI DUNG TAB 1: DANH SÁCH NHÂN SỰ ================= */}
      {activeTab === "employees" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
              <tr>
                <th className="px-6 py-4">Nhân viên</th>
                <th className="px-6 py-4">Chức vụ (Quyền)</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {employees.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-blue-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">
                      {emp.fullName || emp.name}
                    </div>
                    <div className="text-sm text-gray-500">{emp.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    {emp.roles ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold border border-blue-100">
                        <Shield className="w-4 h-4" /> {emp.roles.name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-sm font-bold border border-rose-100">
                        <ShieldAlert className="w-4 h-4" /> Chưa cấp quyền
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openAssignForm(emp)}
                      className="px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 border border-blue-100 hover:bg-blue-600 hover:text-white hover:shadow-md active:scale-95 transition-all duration-200 rounded-lg"
                    >
                      Phân Quyền
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= NỘI DUNG TAB 2: QUẢN LÝ VAI TRÒ ================= */}
      {activeTab === "roles" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`bg-white rounded-xl p-6 shadow-lg border-2 transition-all cursor-pointer ${
                  selectedRole === role.id
                    ? "border-blue-500 shadow-blue-200"
                    : "border-gray-200 hover:border-blue-300 hover:shadow-xl"
                }`}
                onClick={() =>
                  setSelectedRole(selectedRole === role.id ? null : role.id)
                }
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  {role.id !== "admin" && (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRole(role);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(role.id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="font-bold text-gray-900 mb-2">{role.name}</h3>
                <p className="text-sm text-gray-600 mb-4 h-10 line-clamp-2">
                  {role.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{role.userCount} người dùng</span>
                  </div>
                  <div className="text-sm font-medium text-blue-600">
                    {role.permissions?.length || 0} quyền
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Role Permissions */}
          {selectedRole && (
            <div className="bg-white rounded-xl shadow-lg p-6 animate-in slide-in-from-top-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Chi Tiết Quyền -{" "}
                {roles.find((r) => r.id === selectedRole)?.name}
              </h3>

              <div className="space-y-6">
                {modules.map((module) => {
                  const modulePermissions = allPermissions.filter(
                    (p) => p.module === module,
                  );
                  const selectedPermissions =
                    roles.find((r) => r.id === selectedRole)?.permissions || [];
                  const hasPermissions = modulePermissions.some((p) =>
                    selectedPermissions.includes(p.id),
                  );

                  if (!hasPermissions) return null;

                  return (
                    <div
                      key={module}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <h4 className="font-bold text-gray-900 mb-3">{module}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {modulePermissions.map((permission) => {
                          const hasPermission = selectedPermissions.includes(
                            permission.id,
                          );
                          if (!hasPermission) return null;

                          return (
                            <div
                              key={permission.id}
                              className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-100"
                            >
                              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  {permission.name}
                                </p>
                                <p className="text-xs text-gray-600 truncate">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL 1: CẤP QUYỀN NHÂN SỰ (BẢN CHỐNG ĐẠN) ================= */}
      {showAssignModal && selectedEmp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-blue-600 flex items-center gap-2">
                <Users className="w-5 h-5" /> Cấp quyền nhân sự
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 bg-gray-50/30">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Đang thao tác cho</label>
                <div className="font-bold text-gray-800 text-base">{selectedEmp.email}</div>
              </div>

              <div>
                <label htmlFor="roleSelect" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                  Chọn chức vụ
                </label>
                
                <select
                  id="roleSelect"
                  name="roleSelect"
                  /* Ép giá trị: Nếu selectedRoleId không tồn tại trong list roles, tự ép về rỗng "" để hiện placeholder */
                  value={roles.some(r => r.id === selectedRoleId) ? selectedRoleId : ""}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-sm hover:border-blue-400 transition-all"
                >
                  <option value="" disabled>-- Vui lòng chọn chức vụ --</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>

                {/* Nếu list role trống rỗng, báo lỗi đỏ luôn */}
                {roles.length === 0 && (
                  <p className="text-xs text-red-500 mt-2 font-medium">⚠️ Chưa có chức vụ nào hoặc lỗi tải dữ liệu!</p>
                )}
              </div>

              <button
                onClick={handleAssignRole}
                disabled={isAssigning || !selectedRoleId || !roles.some(r => r.id === selectedRoleId)}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md shadow-blue-200 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAssigning ? <Loader2 className="w-5 h-5 animate-spin" /> : 'XÁC NHẬN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: TẠO/SỬA VAI TRÒ (CHUẨN ẢNH image_7dcd03.png) ================= */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingRole ? "Chỉnh Sửa Vai Trò" : "Tạo Vai Trò Mới"}
              </h3>
              <button
                onClick={() => setShowRoleModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
              <div className="space-y-8">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Tên Vai Trò *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="VD: Nhân viên kế toán"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Mô Tả
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="Mô tả ngắn về vai trò"
                    />
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-4">
                    Phân Quyền ({formData.permissions.length} quyền được chọn)
                  </label>

                  <div className="space-y-4">
                    {modules.map((module) => {
                      const modulePermissions = allPermissions.filter(
                        (p) => p.module === module,
                      );
                      const allSelected = modulePermissions.every((p) =>
                        formData.permissions.includes(p.id),
                      );

                      return (
                        <div
                          key={module}
                          className="border border-gray-200 rounded-xl p-5 bg-white"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-gray-900">
                              {module}
                            </h4>
                            <button
                              onClick={() =>
                                toggleAllPermissionsInModule(module)
                              }
                              className={`text-sm font-medium px-4 py-1.5 rounded-full transition-colors ${
                                allSelected
                                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {modulePermissions.map((permission) => {
                              const isSelected = formData.permissions.includes(
                                permission.id,
                              );

                              return (
                                <label
                                  key={permission.id}
                                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                    isSelected
                                      ? "border-blue-500 bg-blue-50/50"
                                      : "border-gray-100 hover:border-blue-300 hover:bg-gray-50"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() =>
                                      togglePermission(permission.id)
                                    }
                                    className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-sm">
                                      {permission.name}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {permission.description}
                                    </p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-5 border-t border-gray-200 bg-white flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveRole}
                disabled={isSavingRole || !formData.name}
                className="px-8 py-2.5 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isSavingRole ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : editingRole ? (
                  "Cập Nhật"
                ) : (
                  "Lưu Vai Trò"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
