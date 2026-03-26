import { useState } from "react";
import { Dashboard } from "./components/Dashboard.js";
import { RoomManagement } from "./components/RoomManagement.js";
import { BookingManagement } from "./components/BookingManagement.js";
import { GuestManagement } from "./components/GuestManagement.js";
import { CheckInOut } from "./components/CheckInOut.js";
import { Settings } from "./components/Settings.js";
import { Profile } from "./components/Profile.js";
import { Login } from "./components/Login.js";
import { Register } from "./components/Register.js";
import { ServiceManagement } from "./components/ServiceManagement.js";
import { EmployeeManagement } from "./components/EmployeeManagement.js";
import { HousekeepingManagement } from "./components/HousekeepingManagement.js";
import { RolePermissionManagement } from "./components/RolePermissionManagement.js";
import { InvoiceManagement } from "./components/InvoiceManagement.js";
import { InventoryManagement } from "./components/InventoryManagement.tsx";
import { ExpenseManagement } from "./components/ExpenseManagement.tsx";
import { PayrollManagement } from "./components/PayrollManagement.tsx";
import { ReportDashboard } from "./components/ReportDashboard.tsx";
// api
import { authService } from "./services/authService.ts";
import {
  Hotel,
  Bed,
  Calendar,
  Users,
  LogIn,
  Settings as SettingsIcon,
  UserCircle,
  LogOut,
  Menu,
  X,
  Package,
  UsersIcon,
  Sparkles,
  Shield,
  ReceiptText,
  Box,
  CircleDollarSign,
  Receipt,
} from "lucide-react";
import { Toaster } from "./components/ui/sonner.js";

// ĐỊNH NGHĨA LẠI KIỂU DỮ LIỆU ĐỂ ĂN KHỚP VỚI DATABASE VÀ UI
type UserRole = "admin" | "manager" | "receptionist" | "housekeeping" | "staff";

interface User {
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  phone?: string; // Thêm để nhận từ form Register
  address?: string; // Thêm để nhận từ form Register
}

type Tab =
  | "dashboard"
  | "rooms"
  | "bookings"
  | "guests"
  | "checkinout"
  | "services"
  | "employees"
  | "housekeeping"
  | "invoices"
  | "inventory"
  | "expenses"
  | "payroll"
  | "settings"
  | "report"
  | "profile"
  | "roles";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Khởi tạo currentUser với kiểu User đã định nghĩa
  const [currentUser, setCurrentUser] = useState<User>({
    name: "Nguyễn Văn A",
    email: "admin@hotel.com",
    avatar:
      "https://images.unsplash.com/photo-1655249481446-25d575f1c054?q=80&w=1080",
    role: "admin",
  });

  // HÀM XỬ LÝ ĐĂNG NHẬP (Tạm thời giữ Mock, có thể thay bằng authService.login sau)
  const handleLogin = async (email: string, password: string) => {
    const result = await authService.login(email, password);

    if (result.success && result.user) {
      setIsAuthenticated(true);
      // result.user lúc này đã có thông tin thật từ Database
      setCurrentUser(result.user as User);
    } else {
      // Bạn có thể dùng toast hoặc alert để báo lỗi
      alert("Đăng nhập thất bại: " + result.error);
    }
  };

  // HÀM XỬ LÝ ĐĂNG KÝ (Đã sửa lỗi phone, address và role)
  const handleRegister = async (formData: any) => {
    try {
      // Gọi service để lưu vào Supabase
      const result = await authService.register(formData);

      if (result.success) {
        setIsAuthenticated(true);

        setCurrentUser({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          avatar: "",
          role: "receptionist", // Mặc định gán role có quyền xem menu cơ bản
        });

        alert("Đăng ký tài khoản thành công!");
      } else {
        alert("Lỗi đăng ký: " + result.error);
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Có lỗi hệ thống, vui lòng thử lại sau.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowLogin(true);
    setActiveTab("dashboard");
  };

  if (!isAuthenticated) {
    if (showLogin) {
      return (
        <Login
          onLogin={handleLogin}
          onSwitchToRegister={() => setShowLogin(false)}
        />
      );
    } else {
      return (
        <Register
          onRegister={handleRegister}
          onSwitchToLogin={() => setShowLogin(true)}
        />
      );
    }
  }

  // Phân quyền Menu dựa trên role
  const getMenuTabs = () => {
    const allTabs = [
      {
        id: "dashboard" as Tab,
        label: "Tổng Quan",
        icon: Hotel,
        roles: ["admin", "manager", "receptionist", "staff"],
      },
      {
        id: "rooms" as Tab,
        label: "Phòng",
        icon: Bed,
        roles: ["admin", "manager", "receptionist", "staff"],
      },
      {
        id: "bookings" as Tab,
        label: "Đặt Phòng",
        icon: Calendar,
        roles: ["admin", "manager", "receptionist", "staff"],
      },
      {
        id: "guests" as Tab,
        label: "Khách Hàng",
        icon: Users,
        roles: ["admin", "manager", "receptionist", "staff"],
      },
      {
        id: "checkinout" as Tab,
        label: "Nhận/Trả Phòng",
        icon: LogIn,
        roles: ["admin", "manager", "receptionist", "staff"],
      },
      {
        id: "services" as Tab,
        label: "Dịch Vụ",
        icon: Sparkles,
        roles: ["admin", "manager", "receptionist", "staff"],
      },
      {
        id: "employees" as Tab,
        label: "Nhân Viên",
        icon: UsersIcon,
        roles: ["admin", "manager", "receptionist", "staff"],
      },
      {
        id: "roles" as Tab,
        label: "Phân Quyền",
        icon: Shield,
        roles: ["admin", "receptionist", "staff"],
      },
      {
        id: "invoices" as Tab,
        label: "Hóa Đơn",
        icon: ReceiptText,
        roles: ["admin", "manager", "receptionist", "staff"],
      },
      {
        id: "inventory" as Tab,
        label: "Kho Vật Tư",
        icon: Package,
        roles: ["admin", "manager", "receptionist", "staff"],
      },
      {
        id: "expenses" as Tab,
        label: "Chi Phí",
        icon: Receipt,
        roles: ["admin", "manager"],
      },
      {
        id: "payroll" as Tab,
        label: " Bảng Lương",
        icon: CircleDollarSign,
        roles: ["admin", "manager"],
      },
      {
        id: "housekeeping" as Tab,
        label: "Buồng Phòng",
        icon: Package,
        roles: ["admin", "manager", "housekeeping"],
      },
      {
        id: "report" as Tab,
        label: "Báo Cáo",
        icon: Box,
        roles: ["admin", "manager"],
      }
    ];

    return allTabs.filter((tab) => tab.roles.includes(currentUser.role));
  };

  const mainMenuTabs = getMenuTabs();
  const bottomMenuTabs = [
    { id: "profile" as Tab, label: "Hồ Sơ", icon: UserCircle },
    { id: "settings" as Tab, label: "Cài Đặt", icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${isSidebarOpen ? "w-72" : "w-20"} bg-[#D1F4FA] border-r border-gray-200/50 shadow-xl transition-all duration-300 flex flex-col`}
      >
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            {isSidebarOpen ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <Hotel className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">
                      HotelPro
                    </h1>
                    <p className="text-xs text-gray-500">Quản lý khách sạn</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors mx-auto"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {mainMenuTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  title={!isSidebarOpen ? tab.label : ""}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isSidebarOpen && (
                    <span className="font-medium">{tab.label}</span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200/50">
          <div className="space-y-1 mb-4">
            {bottomMenuTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isSidebarOpen && (
                    <span className="font-medium">{tab.label}</span>
                  )}
                </button>
              );
            })}
          </div>

          {isSidebarOpen && (
            <div className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-200 shadow-md"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium border border-red-200"
              >
                <LogOut className="w-4 h-4" /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === "dashboard" && <Dashboard />}
            {activeTab === "rooms" && <RoomManagement />}
            {activeTab === "bookings" && <BookingManagement />}
            {activeTab === "guests" && <GuestManagement />}
            {activeTab === "checkinout" && <CheckInOut />}
            {activeTab === "services" && <ServiceManagement />}
            {activeTab === "employees" && <EmployeeManagement />}
            {activeTab === "housekeeping" && <HousekeepingManagement />}
            {activeTab === "invoices" && <InvoiceManagement />}
            {activeTab === "inventory" && <InventoryManagement />}
            {activeTab === "expenses" && <ExpenseManagement />}
            {activeTab === "payroll" && <PayrollManagement />}
            {activeTab === "report" && <ReportDashboard />}
            {activeTab === "settings" && <Settings />}
            {activeTab === "profile" && (
              <Profile
                user={currentUser}
                onUpdateUser={(user) =>
                  setCurrentUser({ ...user, role: currentUser.role })
                }
              />
            )}
            {activeTab === "roles" && <RolePermissionManagement />}
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
