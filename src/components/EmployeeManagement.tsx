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
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans antialiased">
      
      {/* HEADER QUẢN LÝ NHÂN SỰ - CHUẨN TAILWIND */}
      <div className="bg-[#D1F4FA] dark:bg-gray-800 rounded-[2rem] p-8 flex flex-col md:flex-row gap-4 justify-between md:items-center shadow-sm border border-blue-100 dark:border-gray-700">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-600/10 dark:bg-white/10 rounded-2xl flex items-center justify-center">
            <UserCheck className="w-8 h-8 text-blue-700 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">
              Quản Lý Nhân Sự & Tiền Lương
            </h1>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex flex-wrap gap-x-8 gap-y-4 border-b-2 border-gray-100 dark:border-gray-700 mb-6 px-2">
        <button
          onClick={() => setActiveTab("employees")}
          className={`pb-4 text-[13px] font-extrabold tracking-widest uppercase transition-all flex items-center gap-2 relative ${activeTab === "employees" ? "text-blue-600 dark:text-blue-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
        >
          <Users size={18} /> Danh sách nhân sự
          {activeTab === "employees" && <div className="absolute bottom-[-2px] left-0 w-full h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab("roles")}
          className={`pb-4 text-[13px] font-extrabold tracking-widest uppercase transition-all flex items-center gap-2 relative ${activeTab === "roles" ? "text-blue-600 dark:text-blue-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
        >
          <Settings2 size={18} /> Cấu hình chức vụ
          {activeTab === "roles" && <div className="absolute bottom-[-2px] left-0 w-full h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          className={`pb-4 text-[13px] font-extrabold tracking-widest uppercase transition-all flex items-center gap-2 relative ${activeTab === "attendance" ? "text-blue-600 dark:text-blue-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
        >
          <CalendarCheck size={18} /> Chấm Công
          {activeTab === "attendance" && <div className="absolute bottom-[-2px] left-0 w-full h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
        </button>
        <button
          onClick={() => setActiveTab("payroll")}
          className={`pb-4 text-[13px] font-extrabold tracking-widest uppercase transition-all flex items-center gap-2 relative ${activeTab === "payroll" ? "text-blue-600 dark:text-blue-400" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}
        >
          <CircleDollarSign size={18} /> Quản Lý Lương
          {activeTab === "payroll" && <div className="absolute bottom-[-2px] left-0 w-full h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
        </button>
      </div>

      {/* TAB 1: DANH SÁCH NHÂN VIÊN */}
      {activeTab === "employees" && (
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] border-2 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b-2 border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-gray-500 dark:text-gray-400 tracking-widest">Nhân viên</th>
                  <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-gray-500 dark:text-gray-400 tracking-widest">Vai trò / Quyền</th>
                  <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-gray-500 dark:text-gray-400 tracking-widest">Liên hệ</th>
                  <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-gray-500 dark:text-gray-400 tracking-widest text-center">Trạng thái</th>
                  <th className="px-6 py-5 text-[11px] font-extrabold uppercase text-gray-500 dark:text-gray-400 tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-lg shadow-inner">
                          {emp.fullName?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className="font-extrabold text-[15px] text-gray-900 dark:text-white uppercase">
                            {emp.fullName}
                          </div>
                          <div className="text-[12px] font-bold text-gray-500 dark:text-gray-400">
                            @{emp.email.split("@")[0]}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {emp.roles ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-xl text-[12px] font-extrabold border border-blue-200 dark:border-blue-800/50 uppercase tracking-wider">
                          <Shield size={14} /> {emp.roles.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-[12px] font-extrabold border border-rose-200 dark:border-rose-800/50 uppercase tracking-wider">
                          <ShieldAlert size={14} /> Chưa cấp quyền
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[13px] font-extrabold text-gray-900 dark:text-white mb-0.5">
                        {emp.email}
                      </div>
                      <div className="text-[12px] font-bold text-gray-500 dark:text-gray-400">
                        {emp.phone || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(emp.id, emp.status)}
                        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${emp.status === "active" ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${emp.status === "active" ? "translate-x-7" : "translate-x-1"}`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-100 md:opacity-60 md:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openAssignModal(emp)} className="p-2.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white rounded-xl border border-blue-200 dark:border-blue-800/50 transition-all" title="Gán quyền">
                          <Shield size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingEmployee(emp);
                            setEmpFormData({ name: emp.fullName, email: emp.email, phone: emp.phone, password: "", role: emp.role });
                            setShowEmpForm(true);
                          }}
                          className="p-2.5 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl border border-gray-200 dark:border-gray-600 transition-all" title="Sửa thông tin"
                        >
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDeleteEmployee(emp.id)} className="p-2.5 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white rounded-xl border border-rose-200 dark:border-rose-800/50 transition-all" title="Xóa">
                          <Trash2 size={16} />
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

      {/* TAB 2: CẤU HÌNH VAI TRÒ */}
      {activeTab === "roles" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => setSelectedRolePreview(selectedRolePreview === role.id ? null : role.id)}
              className={`bg-white dark:bg-gray-800 p-6 rounded-[2rem] border-2 transition-all cursor-pointer group ${selectedRolePreview === role.id ? "border-blue-500 shadow-xl shadow-blue-500/10 dark:shadow-blue-900/20" : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500/50"}`}
            >
              <div className="flex justify-between items-start mb-5">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl text-white flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                  <Shield size={24} />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingRole(role);
                    setRoleFormData({ name: role.name, description: role.description || "", permissions: [...(role.permissions || [])] });
                    setShowRoleModal(true);
                  }}
                  className="p-2.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white rounded-xl border border-blue-100 dark:border-blue-800/50 transition-all"
                >
                  <Edit size={16} />
                </button>
              </div>
              <h3 className="font-extrabold text-[16px] text-gray-900 dark:text-white uppercase tracking-tight">{role.name}</h3>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 h-10 font-medium">
                {role.description || "Chưa có mô tả"}
              </p>
              <div className="mt-5 pt-4 border-t-2 border-gray-100 dark:border-gray-700 flex justify-between text-[11px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                <span>{role.userCount || 0} Nhân sự</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {role.permissions?.length || 0} Quyền
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: CHẤM CÔNG */}
      {activeTab === "attendance" && (
        <div className="max-w-3xl mx-auto w-full space-y-6">
          {/* KHU VỰC BẤM GIỜ (HERO) */}
          <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-[2.5rem] py-10 px-6 text-white text-center shadow-xl relative overflow-hidden">
            <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
            
            <p className="text-[12px] font-extrabold uppercase tracking-widest opacity-80 mb-2">
              {currentTime.toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
            <h1 className="text-5xl md:text-6xl font-black mb-3 tracking-tighter drop-shadow-lg">
              {currentTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </h1>
            <div className="flex items-center justify-center gap-2 opacity-90 mb-10 font-bold text-[13px]">
              <MapPin size={16} /> <span>HotelPro - Chi nhánh Trung tâm</span>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] text-gray-900 dark:text-white shadow-2xl relative z-10 mx-auto w-full">
              {loadingAttendance ? (
                <p className="text-gray-500 dark:text-gray-400 font-bold animate-pulse">Đang tải dữ liệu...</p>
              ) : !todayRecord ? (
                <>
                  <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-left mb-4">
                    Chọn ca làm việc hôm nay
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    {(shifts && shifts.length > 0 ? shifts : [
                      { id: "1", name: "Ca sáng", start_time: "06:00:00", end_time: "14:00:00" },
                      { id: "2", name: "Ca tối", start_time: "14:00:00", end_time: "22:00:00" },
                      { id: "3", name: "Ca đêm", start_time: "22:00:00", end_time: "06:00:00" },
                    ]).map((s) => {
                      const isSelected = selectedShift === s.id;
                      const isNight = s.name.toLowerCase().includes("đêm");
                      const isEvening = s.name.toLowerCase().includes("tối") || s.name.toLowerCase().includes("chiều");
                      return (
                        <div
                          key={s.id}
                          onClick={() => setSelectedShift(s.id)}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 text-center ${isSelected ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md shadow-emerald-500/10 scale-105" : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-emerald-200 dark:hover:border-emerald-800"}`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isSelected ? "bg-emerald-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"}`}>
                            {isNight ? <Moon size={20} /> : isEvening ? <CloudMoon size={20} /> : <Sun size={20} />}
                          </div>
                          <div>
                            <p className={`text-[14px] font-black uppercase whitespace-nowrap ${isSelected ? "text-emerald-700 dark:text-emerald-400" : "text-gray-900 dark:text-white"}`}>
                              {s.name}
                            </p>
                            <p className={`text-[11px] font-bold mt-1 ${isSelected ? "text-emerald-600 dark:text-emerald-500" : "text-gray-500 dark:text-gray-400"}`}>
                              {s.start_time?.slice(0, 5) || "--:--"} - {s.end_time?.slice(0, 5) || "--:--"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={handleCheckIn}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest text-[14px] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
                  >
                    <LogIn size={20} /> Bắt đầu ca làm việc
                  </button>
                </>
              ) : !todayRecord.check_out ? (
                <div className="py-2">
                  <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-[16px] mb-2">
                    <CheckCircle2 size={24} /> Đã vào ca lúc {new Date(todayRecord.check_in).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <p className="text-[14px] text-gray-500 dark:text-gray-400 font-bold mb-8">
                    Ca hiện tại: <span className="text-gray-900 dark:text-white font-black uppercase">{todayRecord.shifts?.name}</span>
                  </p>
                  <button
                    onClick={handleCheckOut}
                    className="w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-2xl font-black uppercase tracking-widest text-[14px] flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30 transition-all active:scale-95"
                  >
                    <LogOut size={20} /> Kết thúc ca (Tan làm)
                  </button>
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 size={40} className="text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-2">Hoàn thành ngày công</h3>
                  <p className="text-[14px] font-bold text-gray-500 dark:text-gray-400">
                    Check-out lúc: {new Date(todayRecord.check_out).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* LỊCH SỬ CÁ NHÂN */}
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="p-6 border-b-2 border-gray-100 dark:border-gray-700 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-900/50">
              <History className="text-blue-600 dark:text-blue-400" size={24} />
              <h2 className="text-[16px] font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">
                Lịch sử chấm công tháng này
              </h2>
            </div>
            <div className="p-6">
              {attendanceHistory.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 font-bold py-10 text-[14px]">Chưa có dữ liệu.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {attendanceHistory.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-xl flex flex-col items-center justify-center border border-gray-200 dark:border-gray-600 shadow-sm">
                          <span className="text-[20px] font-black text-gray-900 dark:text-white leading-none">
                            {new Date(log.work_date).getDate()}
                          </span>
                          <span className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase mt-1">
                            T{new Date(log.work_date).getMonth() + 1}
                          </span>
                        </div>
                        <div>
                          <p className="text-[15px] font-extrabold text-gray-900 dark:text-white uppercase mb-0.5">
                            {log.shifts?.name}
                          </p>
                          <span className="text-[12px] font-bold text-gray-500 dark:text-gray-400">
                            {log.shifts?.start_time?.slice(0, 5)} - {log.shifts?.end_time?.slice(0, 5)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col gap-1">
                        <p className="text-[13px] font-extrabold flex items-center justify-end gap-2">
                          <span className="text-gray-400 text-[10px] uppercase">Vào:</span>
                          <span className={log.late_minutes > 0 ? "text-amber-500" : "text-emerald-500"}>
                            {log.check_in ? new Date(log.check_in).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                          </span>
                        </p>
                        <p className="text-[13px] font-extrabold flex items-center justify-end gap-2">
                          <span className="text-gray-400 text-[10px] uppercase">Ra:</span>
                          <span className={log.early_minutes > 0 ? "text-rose-500" : "text-emerald-500"}>
                            {log.check_out ? new Date(log.check_out).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
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

      {/* TAB 4: QUẢN LÝ LƯƠNG */}
      {activeTab === "payroll" && isManager && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border-2 border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm gap-4">
            <div>
              <p className="text-[12px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                Tổng quỹ lương tháng {month}
              </p>
              <p className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                {formatCurrency(payroll.reduce((sum, p) => sum + p.total_salary, 0))}
              </p>
            </div>
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center shrink-0">
              <CircleDollarSign size={32} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>

          {/* FILTERS PAYROLL */}
          <div className="flex flex-wrap items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-[2rem] border-2 border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
              <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="bg-transparent border-none outline-none font-extrabold text-[14px] text-gray-700 dark:text-gray-200 cursor-pointer appearance-none"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Tháng {i + 1} / 2026</option>
                ))}
              </select>
            </div>
            <div className="relative flex-1 min-w-[250px]">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm tên nhân viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-[14px] font-bold text-gray-900 dark:text-white transition-all shadow-sm"
              />
            </div>
          </div>

          {/* BẢNG LƯƠNG */}
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b-2 border-gray-200 dark:border-gray-700">
                  <tr>
                    {["Nhân viên", "Ngày công", "Lương cơ bản", "Chuyên cần", "Thực lĩnh", "Thao tác"].map((head, i) => (
                      <th key={i} className={`px-6 py-5 text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap ${i === 1 ? 'text-center' : i === 5 ? 'text-right' : ''}`}>
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {loadingPayroll ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <Loader2 className="animate-spin mx-auto text-blue-600 dark:text-blue-400 mb-3" size={32} />
                        <p className="text-[12px] font-extrabold text-gray-400 uppercase tracking-widest">Đang tải dữ liệu...</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPayroll.map((p, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-extrabold text-[15px] text-gray-900 dark:text-white uppercase mb-0.5 whitespace-nowrap">{p.fullName}</div>
                          <div className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{p.roleName}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={`inline-block px-4 py-1.5 rounded-xl text-[13px] font-black border ${p.work_days >= 26 ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50" : "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50"}`}>
                            {p.work_days} <span className="opacity-50 text-[11px]">/ 26</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[14px] font-extrabold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {formatCurrency(p.base_salary)}
                        </td>
                        <td className="px-6 py-4">
                          {p.diligence_bonus > 0 ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-black text-[13px] whitespace-nowrap">
                              <Star size={14} className="fill-emerald-600 dark:fill-emerald-400" /> + {formatCurrency(p.diligence_bonus)}
                            </div>
                          ) : (
                            <span className="text-[12px] font-bold text-gray-400 dark:text-gray-500">Không đạt</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-[16px] font-black text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {formatCurrency(p.total_salary)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-100 md:opacity-60 md:group-hover:opacity-100 transition-all">
                            <button onClick={() => setSelectedStaff(p)} className="p-2.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl border border-gray-200 dark:border-gray-600 transition-all">
                              <Eye size={16} />
                            </button>
                            <button onClick={() => handlePaySalary(p)} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all shadow-md active:scale-95 whitespace-nowrap">
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
        </div>
      )}

      {/* ----------------- CÁC MODALS DƯỚI NÀY GIỮ NGUYÊN LOGIC, CHỈ FORMAT UI ----------------- */}

      {/* MODAL 1: THÔNG TIN CÁ NHÂN NHÂN VIÊN */}
      {showEmpForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[120] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300 border border-gray-200 dark:border-gray-700">
            <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
              <h3 className="text-xl font-extrabold uppercase tracking-tight">
                {editingEmployee ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
              </h3>
              <button onClick={() => setShowEmpForm(false)} className="hover:rotate-90 transition-transform"><X /></button>
            </div>
            <form onSubmit={handleEmpSubmit} className="p-8 space-y-5">
               {/* Giữ nguyên các thẻ input, chỉ thêm class Tailwind focus-ring */}
               <div>
                <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Họ và tên *</label>
                <input required value={empFormData.name} onChange={(e) => setEmpFormData({ ...empFormData, name: e.target.value })} className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900/80 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold outline-none transition-all" placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Số điện thoại</label>
                <input type="tel" value={empFormData.phone} onChange={(e) => setEmpFormData({ ...empFormData, phone: e.target.value })} className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900/80 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold outline-none transition-all" placeholder="09xxx..." />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Email liên hệ *</label>
                <input required type="email" value={empFormData.email} onChange={(e) => setEmpFormData({ ...empFormData, email: e.target.value })} className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900/80 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold outline-none transition-all" placeholder="example@gmail.com" />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Mật khẩu khởi tạo *</label>
                <input required type="password" value={empFormData.password} onChange={(e) => setEmpFormData({ ...empFormData, password: e.target.value })} className="w-full px-5 py-3.5 bg-gray-50 dark:bg-gray-900/80 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold outline-none transition-all" placeholder="Nhập ít nhất 6 ký tự..." />
                <p className="text-[11px] font-semibold text-gray-400 mt-2 ml-1">* Nhân viên sẽ dùng email và mật khẩu này để đăng nhập.</p>
              </div>
              <button type="submit" className="w-full py-4 mt-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-extrabold uppercase tracking-widest text-[13px] shadow-lg shadow-blue-500/30 transition-all active:scale-95">
                {editingEmployee ? "Cập nhật ngay" : "Thêm vào hệ thống"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GÁN CHỨC VỤ NHANH */}
      {showAssignModal && selectedEmp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300 border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b-2 border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">Phân Quyền Nhân Sự</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><X /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                <p className="text-[11px] font-extrabold text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-1">Đang cấu hình cho</p>
                <p className="text-[16px] font-black text-gray-900 dark:text-white uppercase">{selectedEmp.fullName}</p>
              </div>
              <div className="grid gap-3 max-h-[40vh] overflow-y-auto pr-2">
                {roles.map((r) => (
                  <button key={r.id} onClick={() => setSelectedRoleId(r.id)} className={`p-5 rounded-2xl border-2 text-left transition-all ${selectedRoleId === r.id ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500" : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-gray-800"}`}>
                    <p className={`font-extrabold uppercase text-[13px] ${selectedRoleId === r.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>{r.name}</p>
                    <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mt-1">{r.permissions?.length} quyền hạn được gán</p>
                  </button>
                ))}
              </div>
              <button onClick={handleAssignRoleSubmit} disabled={isAssigning} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-extrabold uppercase tracking-widest text-[13px] shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 active:scale-95">
                {isAssigning ? "Đang lưu..." : "Xác nhận thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CẤU HÌNH CHI TIẾT QUYỀN */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-300 border border-gray-200 dark:border-gray-700">
            <div className="p-8 border-b border-gray-700 bg-gray-900 text-white flex justify-between items-center shrink-0">
              <h3 className="text-xl font-extrabold uppercase tracking-tight">{editingRole ? "Chỉnh sửa vai trò" : "Tạo vai trò mới"}</h3>
              <button onClick={() => setShowRoleModal(false)} className="hover:rotate-90 transition-transform"><X /></button>
            </div>
            <div className="p-8 overflow-y-auto space-y-8 bg-gray-50 dark:bg-gray-900/50 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Tên vai trò</label>
                    <input value={roleFormData.name} onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })} className="w-full px-5 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-2xl font-bold text-[14px] text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="VD: Lễ tân, Quản lý..." />
                </div>
                <div>
                    <label className="block text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1">Mô tả chức năng</label>
                    <input value={roleFormData.description} onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })} className="w-full px-5 py-3.5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-2xl font-bold text-[14px] text-gray-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="Mô tả chức năng chính..." />
                </div>
              </div>
              <div className="space-y-6">
                {modules.map((module) => (
                  <div key={module} className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 p-6 rounded-[2rem]">
                    <h4 className="font-extrabold text-gray-900 dark:text-white mb-5 uppercase text-[12px] tracking-widest border-l-4 border-blue-600 pl-3">
                      {module}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {allPermissions.filter((p) => p.module === module).map((perm) => (
                        <label key={perm.id} className={`flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${roleFormData.permissions.includes(perm.id) ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-500" : "border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500"}`}>
                          <input type="checkbox" checked={roleFormData.permissions.includes(perm.id)} onChange={() => togglePermission(perm.id)} className="mt-1 w-4.5 h-4.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <div>
                            <p className="font-extrabold text-[13px] uppercase text-gray-900 dark:text-white">{perm.name}</p>
                            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-1">{perm.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end gap-4 shrink-0">
              <button onClick={() => setShowRoleModal(false)} className="px-8 py-3.5 font-extrabold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-[13px] uppercase tracking-wider">Hủy bỏ</button>
              <button onClick={handleSaveRole} className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-[13px] uppercase tracking-wider shadow-lg shadow-blue-500/30 transition-all active:scale-95">Lưu cấu hình</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: NHẬT KÝ CHẤM CÔNG CHI TIẾT */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[130] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in duration-300 border border-gray-200 dark:border-gray-700">
            <div className="p-8 bg-blue-600 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <Clock size={28} />
                <div>
                  <h2 className="m-0 text-2xl font-black uppercase tracking-tight">Nhật ký chấm công</h2>
                  <p className="m-0 text-[13px] font-medium opacity-90 mt-1">{selectedStaff.fullName} • Tháng {month}/2026</p>
                </div>
              </div>
              <button onClick={() => setSelectedStaff(null)} className="hover:rotate-90 transition-transform"><X size={24} /></button>
            </div>
            
            <div className="p-8 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 flex-1">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/30 p-5 rounded-[1.5rem] border-2 border-emerald-200 dark:border-emerald-800/50 text-center">
                  <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">TỔNG CÔNG</p>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{selectedStaff.work_days}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/30 p-5 rounded-[1.5rem] border-2 border-amber-200 dark:border-amber-800/50 text-center">
                  <p className="text-[11px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-1">ĐI MUỘN</p>
                  <p className="text-3xl font-black text-amber-600 dark:text-amber-500">{selectedStaff.total_late}p</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {selectedStaff.dailyLogs?.map((log: any, i: number) => (
                  <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 flex justify-between items-center hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center justify-center border border-gray-200 dark:border-gray-700">
                        <span className="text-[16px] font-black text-gray-900 dark:text-white">{new Date(log.date).getDate()}</span>
                      </div>
                      <div>
                        <p className="text-[13px] font-extrabold text-gray-900 dark:text-white uppercase mb-0.5">{log.shiftName}</p>
                        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400">{log.shiftTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-0.5">Vào:</span>
                        <span className={`text-[14px] font-black ${log.late > 0 ? "text-amber-500" : "text-emerald-500"}`}>{log.checkIn}</span>
                      </div>
                      <ArrowRight size={14} className="text-gray-300 dark:text-gray-600" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-0.5">Ra:</span>
                        <span className={`text-[14px] font-black ${log.early > 0 ? "text-rose-500" : "text-emerald-500"}`}>{log.checkOut}</span>
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
