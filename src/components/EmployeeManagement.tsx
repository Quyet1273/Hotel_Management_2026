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
  CalendarCheck,
  CircleDollarSign,
  UserCheck,
  MapPin,
  Sun,
  Moon,
  CloudMoon,
  LogIn,
  LogOut,
  CheckCircle2,
  History,
  Calendar,
  Search,
  Star,
  Eye,
  EyeOff,
  Clock,
  ArrowRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { roleService } from "../services/roleService";
import { attendanceService } from "../services/attendanceService";
import { payrollService } from "../services/payrollService";
// import {  PayrollManagement } from "./PayrollManagement";
import { toast } from "sonner";
import { Role, allPermissions } from "../types/role";

export function EmployeeManagement() {
  const [activeTab, setActiveTab] = useState<
    "employees" | "roles" | "payroll" | "attendance"
  >("employees");
  const [isLoading, setIsLoading] = useState(true);

  // =================1. STATE NHÂN VIÊN =================
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
  // =================2. STATE PHÂN QUYỀN =================
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
  // ==========3. State thông tin người dùng
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(
    null,
  );
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [authLoading, setAuthLoading] = useState(true);
  // ==========4  . State Chấm công
  const [currentTime, setCurrentTime] = useState(new Date());
  const [shifts, setShifts] = useState<any[]>([]);
  const [selectedShift, setSelectedShift] = useState("");
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // ===============5. State quản lý Lương
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [payroll, setPayroll] = useState<any[]>([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [searchTerm, setSearchTerm] = useState("");

  // Lọc bảng lương theo tên nhân viên
  const filteredPayroll = payroll.filter((p: any) =>
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
  // Kiểm tra nếu user hiện tại là admin để hiển thị nút thêm/sửa/xóa nhân viên và phân quyền
  const isManager = currentUserRole?.toLowerCase() === "admin";

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
  // hàm checkin, checkout
  const handleCheckIn = async () => {
    if (!currentEmployeeId) return;
    const shift = shifts.find((s) => s.id === selectedShift);
    if (!shift) return toast.error("Vui lòng chọn ca làm việc!");

    const res = await attendanceService.checkIn(
      currentEmployeeId,
      shift.id,
      shift.start_time,
    );
    if (res.success) {
      toast.success("Bắt đầu ca thành công! Chúc bạn làm việc hiệu quả.");
      fetchAttendanceData();
    } else toast.error("Lỗi Check-in: " + res.error);
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return;
    const res = await attendanceService.checkOut(
      todayRecord.id,
      todayRecord.shifts.end_time,
    );
    if (res.success) {
      toast.success("Kết thúc ca thành công! Nghỉ ngơi tốt nhé.");
      fetchAttendanceData();
    } else toast.error("Lỗi Check-out: " + res.error);
  };
  // hàm quản lý lương
  const handlePaySalary = async (staff: any) => {
    const confirmPay = window.confirm(
      `Xác nhận thanh toán lương tháng ${month} cho ${staff.fullName}?\nSố tiền: ${formatCurrency(staff.total_salary)}`,
    );
    if (!confirmPay) return;

    const res = await payrollService.processSalaryPayment({
      employee_id: staff.employee_id,
      fullName: staff.fullName,
      month: month,
      year: 2026,
      amount: staff.total_salary,
      work_days: staff.work_days,
    });

    if (res.success) {
      toast.success(
        `Đã thanh toán lương cho ${staff.fullName} và tạo phiếu chi!`,
      );
      fetchPayrollData();
    } else toast.error("Lỗi thanh toán: " + res.error);
  };

  // Hàm định dạng tiền tệ (cũng bê từ file kia sang)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
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
  // === LOGIC XÁC THỰC (Chạy 1 lần khi load trang) ===
  useEffect(() => {
    const checkAuth = async () => {
      setAuthLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentEmployeeId(session.user.id);
        const { data: empData } = await supabase
          .from("employees")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (empData) setCurrentUserRole(empData.role);
      }
      setAuthLoading(false);
    };
    checkAuth();
  }, []);

  // === LOGIC CHẤM CÔNG ===
  const getPayrollPeriod = (month: number, year: number) => {
    // Ngày bắt đầu: ngày 26 của tháng trước (tháng trong JS tính từ 0-11)
    const startDate = new Date(year, month - 2, 26);
    // Ngày kết thúc: ngày 25 của tháng hiện tại
    const endDate = new Date(year, month - 1, 25);

    return {
      startStr: startDate.toISOString().split("T")[0], // Định dạng YYYY-MM-DD
      endStr: endDate.toISOString().split("T")[0],
    };
  };
  const fetchAttendanceData = async () => {
    if (!currentEmployeeId) return;
    setLoadingAttendance(true);
    const shiftsRes = await attendanceService.getShifts();
    if (shiftsRes.success && shiftsRes.data) {
      // Thêm kiểm tra shiftsRes.data ở đây
      setShifts(shiftsRes.data);
      if (shiftsRes.data.length > 0) {
        setSelectedShift(shiftsRes.data[0].id);
      }
    } else {
      setShifts([]); // Fallback nếu không có data
    }
    const statusRes = await attendanceService.getTodayStatus(currentEmployeeId);
    if (statusRes.success) setTodayRecord(statusRes.data);

    const historyRes = await attendanceService.getMyHistory(
      currentEmployeeId,
      new Date().getMonth() + 1,
      2026,
    );
    if (historyRes.success) setAttendanceHistory(historyRes.data || []);
    setLoadingAttendance(false);
  };

  // === LOGIC chấm công từ 26 tháng trước đến 25 tháng này ===
  const fetchPayrollData = async () => {
    setLoadingPayroll(true);
    const year = 2026;
    const startDate = new Date(year, month - 2, 26).toISOString().split("T")[0];
    const endDate = new Date(year, month - 1, 25).toISOString().split("T")[0];

    const res = await payrollService.getPayrollByRange(startDate, endDate);

    if (res.success && res.data) {
      const mappedData = res.data.map((emp: any) => {
        const role = emp.roles?.[0] || emp.roles; 
        const baseSalary = Number(role?.base_salary || 0);
        const diligenceBonus = Number(role?.diligence_bonus || 0);
        
        // Lấy danh sách chấm công
        const logs = emp.attendance || [];
        const workDays = logs.length;
        
        // Tính tổng số phút đi muộn (Fix lỗi trống chỗ "ĐI MUỘN")
        const totalLate = logs.reduce((sum: number, log: any) => sum + (log.late_minutes || 0), 0);

        // Tính lương
        const calculatedSalary = Math.round((baseSalary / 26) * workDays);
        const totalSalary = calculatedSalary + (workDays >= 26 ? diligenceBonus : 0);

        return {
          employee_id: emp.id,
          fullName: emp.fullName,
          roleName: role?.name || "Nhân viên",
          base_salary: baseSalary,
          work_days: workDays,
          total_late: totalLate, // Truyền biến này vào để hiển thị
          diligence_bonus: workDays >= 26 ? diligenceBonus : 0,
          total_salary: totalSalary,
          // Map lại từng dòng log để Modal hiểu được
          dailyLogs: logs.map((l: any) => ({
            date: l.work_date, // Đổi từ work_date sang date
            checkIn: l.check_in ? new Date(l.check_in).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : "--:--",
            checkOut: l.check_out ? new Date(l.check_out).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : "--:--",
            late: l.late_minutes || 0,
            early: l.early_minutes || 0,
            shiftName: l.shifts?.name || "Ca làm việc"
          }))
        };
      });

      setPayroll(mappedData);
    }
    setLoadingPayroll(false);
  };
  // Tự động gọi data khi chuyển Tab
  useEffect(() => {
    if (activeTab === "attendance") fetchAttendanceData();
    if (activeTab === "payroll") fetchPayrollData();
  }, [activeTab, month, currentEmployeeId]);

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-blue-600 mb-2" /> Tải dữ liệu nhân
        sự...
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header quản lý nhân sự ============== */}
      <div
        style={{
          background: "linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)",
          borderRadius: "2rem",
          padding: "32px",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.2)",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UserCheck size={32} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "800", margin: 0 }}>
              QUẢN LÝ NHÂN SỰ & TIỀN LƯƠNG
            </h1>
            <p
              style={{
                fontSize: "12px",
                color: "#e0e7ff",
                margin: "4px 0 0 0",
                opacity: 0.8,
              }}
            >
              Hệ thống HotelPro - Chi nhánh Trung tâm
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-20 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("employees")}
          className={`pb-4 text-sm font-black tracking-widest uppercase transition-all ${activeTab === "employees" ? "border-b-4 border-blue-600 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
        >
          <div className="flex items-center gap-2">
            <Users size={18} /> Danh sách nhân sự
          </div>
        </button>
        <button
          style={{ marginLeft: "30px" }}
          onClick={() => setActiveTab("roles")}
          className={`pb-4 text-sm font-black tracking-widest uppercase transition-all ${activeTab === "roles" ? "border-b-4 border-blue-600 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
        >
          <div className="flex items-center ml-10 gap-2">
            <Settings2 size={18} /> Cấu hình chức vụ
          </div>
        </button>
        <button
          style={{ marginLeft: "30px" }}
          onClick={() => setActiveTab("attendance")}
          className={`pb-4 text-sm font-black tracking-widest uppercase transition-all ${activeTab === "attendance" ? "border-b-4 border-blue-600 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
        >
          <div className="flex items-center ml-10 gap-2">
            <CalendarCheck size={18} /> Chấm Công
          </div>
        </button>
        <button
          style={{ marginLeft: "30px" }}
          onClick={() => setActiveTab("payroll")}
          className={`pb-4 text-sm font-black tracking-widest uppercase transition-all ${activeTab === "payroll" ? "border-b-4 border-blue-600 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
        >
          <div className="flex items-center ml-10 gap-2">
            <CircleDollarSign size={18} /> Quản Lý Lương
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
      {/* TAB 3: CHẤM CÔNG */}
      {activeTab === "attendance" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "24px",
            maxWidth: "800px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          {activeTab === "attendance" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "24px",
                maxWidth: "800px",
                margin: "0 auto",
                width: "100%",
              }}
            >
              {/* KHU VỰC BẤM GIỜ (HERO) */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
                  borderRadius: "2rem",
                  padding: "40px 24px",
                  color: "#ffffff",
                  textAlign: "center",
                  boxShadow: "0 20px 25px -5px rgba(37, 99, 235, 0.2)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-50px",
                    left: "-50px",
                    width: "200px",
                    height: "200px",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "50%",
                  }}
                ></div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    opacity: 0.8,
                    margin: "0 0 10px 0",
                  }}
                >
                  {currentTime.toLocaleDateString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <h1
                  style={{
                    fontSize: "64px",
                    fontWeight: "900",
                    margin: "0 0 8px 0",
                    letterSpacing: "-2px",
                    textShadow: "0 4px 10px rgba(0,0,0,0.1)",
                  }}
                >
                  {currentTime.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </h1>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    opacity: 0.9,
                    marginBottom: "32px",
                  }}
                >
                  <MapPin size={16} />{" "}
                  <span style={{ fontSize: "14px" }}>
                    HotelPro - Chi nhánh Trung tâm
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: "#ffffff",
                    padding: "24px",
                    borderRadius: "1.5rem",
                    color: "#1e293b",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    position: "relative",
                    zIndex: 10,
                  }}
                >
                  {loadingAttendance ? (
                    <p style={{ color: "#64748b" }}>Đang tải...</p>
                  ) : !todayRecord ? (
                    <>
                      <div style={{ marginBottom: "24px", textAlign: "left" }}>
                        <label
                          style={{
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "#64748b",
                            textTransform: "uppercase",
                            marginBottom: "12px",
                            display: "block",
                          }}
                        >
                          Chọn ca làm việc hôm nay
                        </label>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: "12px",
                          }}
                        >
                          {(shifts && shifts.length > 0
                            ? shifts
                            : [
                                {
                                  id: "79fab619-8d9b-4f13-8816-2c38f5a56c97",
                                  name: "Ca sáng",
                                  start_time: "06:00:00",
                                  end_time: "14:00:00",
                                },
                                {
                                  id: "58863c42-d915-4828-acb9-75433c62ef53",
                                  name: "Ca tối",
                                  start_time: "14:00:00",
                                  end_time: "22:00:00",
                                },
                                {
                                  id: "4c44b227-b880-4651-940a-496be6e82f12",
                                  name: "Ca đêm",
                                  start_time: "22:00:00",
                                  end_time: "06:00:00",
                                },
                              ]
                          ).map((s) => {
                            const isSelected = selectedShift === s.id;
                            const isNight = s.name
                              .toLowerCase()
                              .includes("đêm");
                            const isEvening =
                              s.name.toLowerCase().includes("tối") ||
                              s.name.toLowerCase().includes("chiều");

                            // Đảm bảo không lỗi nếu start_time/end_time bị null
                            const startTime =
                              s.start_time?.slice(0, 5) || "--:--";
                            const endTime = s.end_time?.slice(0, 5) || "--:--";

                            return (
                              <div
                                key={s.id}
                                onClick={() => setSelectedShift(s.id)}
                                style={{
                                  padding: "16px 8px",
                                  borderRadius: "16px",
                                  border: `2px solid ${isSelected ? "#10b981" : "#f1f5f9"}`,
                                  backgroundColor: isSelected
                                    ? "#ecfdf5"
                                    : "#ffffff",
                                  cursor: "pointer",
                                  transition:
                                    "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                                  textAlign: "center",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: "8px",
                                  boxShadow: isSelected
                                    ? "0 10px 15px -3px rgba(16, 185, 129, 0.1)"
                                    : "none",
                                  transform: isSelected
                                    ? "translateY(-2px)"
                                    : "none",
                                }}
                              >
                                <div
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: isSelected
                                      ? "#10b981"
                                      : "#f8fafc",
                                    color: isSelected ? "#ffffff" : "#94a3b8",
                                    transition: "all 0.2s",
                                  }}
                                >
                                  {isNight ? (
                                    <Moon size={22} />
                                  ) : isEvening ? (
                                    <CloudMoon size={22} />
                                  ) : (
                                    <Sun size={22} />
                                  )}
                                </div>

                                <div>
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: "14px",
                                      fontWeight: "800",
                                      color: isSelected ? "#065f46" : "#1e293b",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {s.name}
                                  </p>
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: "11px",
                                      color: isSelected ? "#059669" : "#94a3b8",
                                      fontWeight: "600",
                                      marginTop: "2px",
                                    }}
                                  >
                                    {startTime} - {endTime}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <button
                        onClick={handleCheckIn}
                        style={{
                          width: "100%",
                          padding: "16px",
                          background:
                            "linear-gradient(to right, #10b981, #059669)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "12px",
                          fontSize: "16px",
                          fontWeight: "800",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          textTransform: "uppercase",
                        }}
                      >
                        <LogIn size={20} /> Bắt đầu ca làm việc
                      </button>
                    </>
                  ) : !todayRecord.check_out ? (
                    <>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          color: "#059669",
                          marginBottom: "16px",
                          fontWeight: "bold",
                        }}
                      >
                        <CheckCircle2 size={20} /> Đã vào ca lúc{" "}
                        {new Date(todayRecord.check_in).toLocaleTimeString(
                          "vi-VN",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#64748b",
                          marginBottom: "24px",
                        }}
                      >
                        Ca hiện tại: <strong>{todayRecord.shifts?.name}</strong>
                      </p>
                      <button
                        onClick={handleCheckOut}
                        style={{
                          width: "100%",
                          padding: "16px",
                          background:
                            "linear-gradient(to right, #f43f5e, #e11d48)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "12px",
                          fontSize: "16px",
                          fontWeight: "800",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          textTransform: "uppercase",
                        }}
                      >
                        <LogOut size={20} /> Kết thúc ca (Tan làm)
                      </button>
                    </>
                  ) : (
                    <div style={{ padding: "10px 0" }}>
                      <div
                        style={{
                          width: "64px",
                          height: "64px",
                          backgroundColor: "#ecfdf5",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 16px",
                        }}
                      >
                        <CheckCircle2 size={32} color="#10b981" />
                      </div>
                      <h3
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: "18px",
                          color: "#0f172a",
                        }}
                      >
                        Hoàn thành ngày công
                      </h3>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          color: "#64748b",
                        }}
                      >
                        Check-out lúc{" "}
                        {new Date(todayRecord.check_out).toLocaleTimeString(
                          "vi-VN",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* LỊCH SỬ CÁ NHÂN */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "1.5rem",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    padding: "20px 24px",
                    borderBottom: "1px solid #f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <History size={20} color="#4f46e5" />
                  <h2
                    style={{
                      fontSize: "16px",
                      fontWeight: "800",
                      color: "#1e293b",
                      margin: 0,
                    }}
                  >
                    Lịch sử chấm công tháng này
                  </h2>
                </div>
                <div style={{ padding: "16px" }}>
                  {attendanceHistory.length === 0 ? (
                    <p
                      style={{
                        textAlign: "center",
                        color: "#94a3b8",
                        padding: "20px",
                      }}
                    >
                      Chưa có dữ liệu.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {attendanceHistory.map((log) => (
                        <div
                          key={log.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "16px",
                            backgroundColor: "#f8fafc",
                            borderRadius: "16px",
                            border: "1px solid #f1f5f9",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "16px",
                            }}
                          >
                            <div
                              style={{
                                width: "48px",
                                height: "48px",
                                backgroundColor: "#ffffff",
                                borderRadius: "12px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "1px solid #e2e8f0",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "18px",
                                  fontWeight: "900",
                                  color: "#0f172a",
                                  lineHeight: 1,
                                }}
                              >
                                {new Date(log.work_date).getDate()}
                              </span>
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: "bold",
                                  color: "#94a3b8",
                                }}
                              >
                                T{new Date(log.work_date).getMonth() + 1}
                              </span>
                            </div>
                            <div>
                              <p
                                style={{
                                  margin: "0 0 2px 0",
                                  fontSize: "14px",
                                  fontWeight: "bold",
                                  color: "#1e293b",
                                }}
                              >
                                {log.shifts?.name}
                              </p>
                              <span
                                style={{ fontSize: "12px", color: "#64748b" }}
                              >
                                {log.shifts?.start_time?.slice(0, 5)} -{" "}
                                {log.shifts?.end_time?.slice(0, 5)}
                              </span>
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p
                              style={{
                                margin: "0 0 4px 0",
                                fontSize: "13px",
                                fontWeight: "700",
                              }}
                            >
                              <span
                                style={{
                                  color: "#94a3b8",
                                  fontSize: "10px",
                                  marginRight: "4px",
                                }}
                              >
                                VÀO:
                              </span>
                              <span
                                style={{
                                  color:
                                    log.late_minutes > 0
                                      ? "#f59e0b"
                                      : "#10b981",
                                }}
                              >
                                {log.check_in
                                  ? new Date(log.check_in).toLocaleTimeString(
                                      "vi-VN",
                                      { hour: "2-digit", minute: "2-digit" },
                                    )
                                  : "--:--"}
                              </span>
                            </p>
                            <p
                              style={{
                                margin: 0,
                                fontSize: "13px",
                                fontWeight: "700",
                              }}
                            >
                              <span
                                style={{
                                  color: "#94a3b8",
                                  fontSize: "10px",
                                  marginRight: "4px",
                                }}
                              >
                                RA:
                              </span>
                              <span
                                style={{
                                  color:
                                    log.early_minutes > 0
                                      ? "#f43f5e"
                                      : "#10b981",
                                }}
                              >
                                {log.check_out
                                  ? new Date(log.check_out).toLocaleTimeString(
                                      "vi-VN",
                                      { hour: "2-digit", minute: "2-digit" },
                                    )
                                  : "--:--"}
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* TAB 4: QUẢN LÝ LƯƠNG */}
      {activeTab === "payroll" && isManager && (
        <div>
          {/* Code quản lý lương */}
          <div
            style={{
              backgroundColor: "#ffffff",
              padding: "24px",
              borderRadius: "1.5rem",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#64748b",
                  margin: "0 0 8px 0",
                  textTransform: "uppercase",
                }}
              >
                Tổng quỹ lương tháng {month}
              </p>
              <p
                style={{
                  fontSize: "32px",
                  fontWeight: "900",
                  color: "#0f172a",
                  margin: 0,
                }}
              >
                {formatCurrency(
                  payroll.reduce((sum, p) => sum + p.total_salary, 0),
                )}
              </p>
            </div>
            <div
              style={{
                width: "64px",
                height: "64px",
                backgroundColor: "#f0fdf4",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircleDollarSign size={32} color="#16a34a" />
            </div>
          </div>

          {/* FILTERS */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              alignItems: "center",
              flexWrap: "wrap",
              backgroundColor: "#f8fafc",
              padding: "12px",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "8px 16px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Calendar size={18} color="#4f46e5" />
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                style={{
                  border: "none",
                  outline: "none",
                  fontWeight: "700",
                  color: "#334155",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Tháng {i + 1} / 2026
                  </option>
                ))}
              </select>
            </div>
            <div style={{ position: "relative", flex: 1, minWidth: "250px" }}>
              <Search
                style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
                size={18}
              />
              <input
                type="text"
                placeholder="Tìm tên nhân viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 48px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  outline: "none",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1e293b",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* BẢNG LƯƠNG */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "1.5rem",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                }}
              >
                <thead
                  style={{
                    backgroundColor: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <tr>
                    {[
                      "Nhân viên",
                      "Ngày công",
                      "Lương cơ bản",
                      "Chuyên cần",
                      "Thực lĩnh",
                      "Thao tác",
                    ].map((head, i) => (
                      <th
                        key={i}
                        style={{
                          padding: "16px 24px",
                          fontSize: "11px",
                          fontWeight: "bold",
                          color: "#94a3b8",
                          textTransform: "uppercase",
                        }}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingPayroll ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={{ padding: "60px", textAlign: "center" }}
                      >
                        <Loader2
                          className="animate-spin"
                          style={{ margin: "0 auto", color: "#4f46e5" }}
                          size={32}
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredPayroll.map((p, idx) => (
                      <tr
                        key={idx}
                        style={{ borderBottom: "1px solid #f1f5f9" }}
                      >
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ fontWeight: "bold", color: "#1e293b" }}>
                            {p.fullName}
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              fontWeight: "bold",
                              color: "#4f46e5",
                              textTransform: "uppercase",
                            }}
                          >
                            {p.roleName}
                          </div>
                        </td>
                        <td
                          style={{ padding: "16px 24px", textAlign: "center" }}
                        >
                          <div
                            style={{
                              display: "inline-block",
                              padding: "4px 12px",
                              borderRadius: "20px",
                              fontSize: "12px",
                              fontWeight: "bold",
                              backgroundColor:
                                p.work_days >= 26 ? "#ecfdf5" : "#fffbeb",
                              color: p.work_days >= 26 ? "#059669" : "#d97706",
                            }}
                          >
                            {p.work_days}{" "}
                            <span style={{ opacity: 0.5 }}>/ 26</span>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "16px 24px",
                            color: "#475569",
                            fontWeight: "500",
                          }}
                        >
                          {formatCurrency(p.base_salary)}
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          {p.diligence_bonus > 0 ? (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                color: "#059669",
                                fontWeight: "bold",
                                fontSize: "12px",
                              }}
                            >
                              <Star size={12} fill="#059669" /> +
                              {formatCurrency(p.diligence_bonus)}
                            </div>
                          ) : (
                            <span
                              style={{ color: "#cbd5e1", fontSize: "11px" }}
                            >
                              Không đạt
                            </span>
                          )}
                        </td>
                        <td
                          style={{
                            padding: "16px 24px",
                            fontWeight: "800",
                            color: "#4f46e5",
                            fontSize: "16px",
                          }}
                        >
                          {formatCurrency(p.total_salary)}
                        </td>
                        <td
                          style={{ padding: "16px 24px", textAlign: "right" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: "8px",
                            }}
                          >
                            <button
                              onClick={() => setSelectedStaff(p)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "#64748b",
                              }}
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handlePaySalary(p)}
                              style={{
                                padding: "8px 16px",
                                backgroundColor: "#4f46e5",
                                color: "#fff",
                                border: "none",
                                borderRadius: "10px",
                                fontSize: "10px",
                                fontWeight: "bold",
                                cursor: "pointer",
                                textTransform: "uppercase",
                              }}
                            >
                              Thanh toán
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MODAL CHI TIẾT */}
          {selectedStaff && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.4)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "16px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "2rem",
                  maxWidth: "600px",
                  width: "100%",
                  maxHeight: "85vh",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                }}
              >
                <div
                  style={{
                    padding: "24px",
                    background: "#4f46e5",
                    color: "#fff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <Clock size={24} />
                    <div>
                      <h3 style={{ margin: 0, fontSize: "18px" }}>
                        Nhật ký chấm công
                      </h3>
                      <p style={{ margin: 0, fontSize: "10px", opacity: 0.8 }}>
                        {selectedStaff.fullName} • Tháng {month}/2026
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStaff(null)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>
                <div
                  style={{
                    padding: "24px",
                    overflowY: "auto",
                    backgroundColor: "#f8fafc",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                      marginBottom: "24px",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "#fff",
                        padding: "16px",
                        borderRadius: "16px",
                        border: "1px solid #e2e8f0",
                        textAlign: "center",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 4px 0",
                          fontSize: "10px",
                          color: "#94a3b8",
                          fontWeight: "bold",
                        }}
                      >
                        TỔNG CÔNG
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "24px",
                          fontWeight: "900",
                          color: "#10b981",
                        }}
                      >
                        {selectedStaff.work_days}
                      </p>
                    </div>
                    <div
                      style={{
                        backgroundColor: "#fff",
                        padding: "16px",
                        borderRadius: "16px",
                        border: "1px solid #e2e8f0",
                        textAlign: "center",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 4px 0",
                          fontSize: "10px",
                          color: "#94a3b8",
                          fontWeight: "bold",
                        }}
                      >
                        ĐI MUỘN
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "24px",
                          fontWeight: "900",
                          color: "#f59e0b",
                        }}
                      >
                        {selectedStaff.total_late}p
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    {selectedStaff.dailyLogs?.map((log: any, i: number) => (
                      <div
                        key={i}
                        style={{
                          backgroundColor: "#fff",
                          padding: "12px 16px",
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              backgroundColor: "#f1f5f9",
                              borderRadius: "10px",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <span
                              style={{ fontSize: "14px", fontWeight: "900" }}
                            >
                              {new Date(log.date).getDate()}
                            </span>
                          </div>
                          <div>
                            <p
                              style={{
                                margin: 0,
                                fontSize: "12px",
                                fontWeight: "bold",
                              }}
                            >
                              {log.shiftName}
                            </p>
                            <p
                              style={{
                                margin: 0,
                                fontSize: "10px",
                                color: "#94a3b8",
                              }}
                            >
                              {log.shiftTime}
                            </p>
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            textAlign: "right",
                          }}
                        >
                          <div>
                            <span
                              style={{
                                fontSize: "9px",
                                color: "#cbd5e1",
                                fontWeight: "bold",
                              }}
                            >
                              VÀO:{" "}
                            </span>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: log.late > 0 ? "#f59e0b" : "#10b981",
                              }}
                            >
                              {log.checkIn}
                            </span>
                          </div>
                          <ArrowRight size={14} color="#e2e8f0" />
                          <div>
                            <span
                              style={{
                                fontSize: "9px",
                                color: "#cbd5e1",
                                fontWeight: "bold",
                              }}
                            >
                              RA:{" "}
                            </span>
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: log.early > 0 ? "#f43f5e" : "#10b981",
                              }}
                            >
                              {log.checkOut}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
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
      {/* Modal 4: QUẢN LÝ LƯƠNG  */}
      {selectedStaff && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "2rem",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "85vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                padding: "24px",
                background: "#4f46e5",
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px", fontWeight: "bold" }}
              >
                <Clock size={24} />
                <div>
                  <h2 style={{ margin: 0, fontSize: "28px",  }}>
                    Nhật ký chấm công
                  </h2>
                  <p style={{ margin: 0, fontSize: "15px", opacity: 0.8 }}>
                    {selectedStaff.fullName} • Tháng {month}/2026
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStaff(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div
              style={{
                padding: "24px",
                overflowY: "auto",
                backgroundColor: "#f8fafc",
                flex: 1,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#0d7575",
                    padding: "16px",
                    borderRadius: "16px",
                    border: "1px solid #02ffab",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "20px",
                      color: "#02ffab",
                      fontWeight: "bold",
                    }}
                  >
                    TỔNG CÔNG
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "24px",
                      fontWeight: "900",
                      color: "#02ffab",
                    }}
                  >
                    {selectedStaff.work_days}
                  </p>
                </div>
                <div
                  style={{
                    backgroundColor: "#f6ec37",
                    padding: "16px",
                    borderRadius: "16px",
                    border: "1px solid #fb0000",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "20px",
                      color: "#ff0000",
                      fontWeight: "bold",
                    }}
                  >
                    ĐI MUỘN
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "24px",
                      fontWeight: "900",
                      color: "#f50b0b",
                    }}
                  >
                    {selectedStaff.total_late}p
                  </p>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {selectedStaff.dailyLogs?.map((log: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      backgroundColor: "#fff",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          backgroundColor: "#f1f5f9",
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span style={{ fontSize: "14px", fontWeight: "900" }}>
                          {new Date(log.date).getDate()}
                        </span>
                      </div>
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        >
                          {log.shiftName}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "10px",
                            color: "#94a3b8",
                          }}
                        >
                          {log.shiftTime}
                        </p>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        textAlign: "right",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: "9px",
                            color: "#2486ff",
                            fontWeight: "bold",
                          }}
                        >
                          VÀO:{" "}
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: log.late > 0 ? "#ffa200" : "#10b981",
                          }}
                        >
                          {log.checkIn}
                        </span>
                      </div>
                      <ArrowRight size={14} color="#f0ece2" />
                      <div>
                        <span
                          style={{
                            fontSize: "9px",
                            color: "#cbd5e1",
                            fontWeight: "bold",
                          }}
                        >
                          RA:{" "}
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: log.early > 0 ? "#f43f5e" : "#10b981",
                          }}
                        >
                          {log.checkOut}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
