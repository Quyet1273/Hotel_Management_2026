import { useState, useEffect } from "react";
import { Toaster } from "./components/ui/sonner";

// Components
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
import ChatBot from "./components/chatBot.tsx";
// Context & API
import { SettingsProvider, useSettings } from "./context/SettingsContext.tsx";
import { authService } from "./services/authService.ts";

// UI & Icons
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
  ReceiptText,
  Box,
  CircleDollarSign,
  Receipt,
  ChevronDown,
} from "lucide-react";



// --- TYPES ---
type UserRole = "admin" | "manager" | "receptionist" | "housekeeping" | "staff";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  phone?: string;
  address?: string;
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
  | "roles"
  | "login"
  | "register";

// --- ROOT APP COMPONENT ---
export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
      <Toaster />
    </SettingsProvider>
  );
}

// --- MAIN CONTENT COMPONENT ---
function AppContent() {
  const { settings, t, loading: settingsLoading } = useSettings();

  // States
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isReceptionOpen, setIsReceptionOpen] = useState(true); // State cho Menu Dropdown Lễ Tân
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUser(user as User);
        setIsAuthenticated(true);
      } else {
        setActiveTab("login");
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };
    loadUser();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    if (result.success && result.user) {
      setIsAuthenticated(true);
      setCurrentUser(result.user as User);
      setActiveTab("dashboard");
    } else {
      alert("Đăng nhập thất bại: " + result.error);
    }
  };

  const handleRegister = async (formData: any) => {
    try {
      const result = await authService.register(formData);
      if (result.success) {
        setIsAuthenticated(true);
        setCurrentUser({
          id: "",
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          avatar: "",
          role: "receptionist",
        });
        alert("Đăng ký tài khoản thành công!");
        setActiveTab("dashboard");
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
    setActiveTab("login");
    setCurrentUser(null);
  };

  // --- LOGIC PHÂN QUYỀN VÀ LỌC MENU ---
  const getMenuTabs = () => {
    const allTabs = [
      {
        id: "dashboard" as Tab,
        label: t("sidebar.dashboard"),
        icon: Hotel,
        roles: ["admin", "manager", "receptionist", "staff"],
      },
      // Đã ẩn Bookings, Guests, Checkinout ở đây để đưa vào Dropdown
      {
        id: "services" as Tab,
        label: t("sidebar.service"),
        icon: Sparkles,
        roles: ["admin", "manager", "receptionist", "staff"],
      },
      {
        id: "employees" as Tab,
        label: t("sidebar.employee"),
        icon: UsersIcon,
        roles: ["admin", "manager", "receptionist", "staff"],
      },
      {
        id: "invoices" as Tab,
        label: t("sidebar.invoice"),
        icon: ReceiptText,
        roles: ["admin", "manager", "receptionist", "staff"],
      },
      {
        id: "inventory" as Tab,
        label: t("sidebar.inventory"),
        icon: Package,
        roles: ["admin", "manager", "receptionist", "staff"],
      },
      {
        id: "expenses" as Tab,
        label: t("sidebar.cost"),
        icon: Receipt,
        roles: ["admin", "manager"],
      },
      {
        id: "rooms" as Tab,
        label: t("sidebar.room"),
        icon: Bed,
        roles: ["admin", "manager", "receptionist", "staff"],
      },
      {
        id: "report" as Tab,
        label: t("sidebar.report"),
        icon: Box,
        roles: ["admin", "manager"],
      },
    ];
    return allTabs.filter((tab) => tab.roles.includes(currentUser?.role || ""));
  };

  const mainMenuTabs = getMenuTabs();
  const bottomMenuTabs = [
    { id: "profile" as Tab, label: t("sidebar.profile"), icon: UserCircle },
    { id: "settings" as Tab, label: t("sidebar.settings"), icon: SettingsIcon },
  ];

  if (isLoading || settingsLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return showLogin ? (
      <Login
        onLogin={handleLogin}
        onSwitchToRegister={() => setShowLogin(false)}
      />
    ) : (
      <Register
        onRegister={handleRegister}
        onSwitchToLogin={() => setShowLogin(true)}
      />
    );
  }

  const themeColors: Record<string, string> = {
    blue: "from-blue-600 to-blue-700 shadow-blue-600/30",
    purple: "from-purple-600 to-purple-700 shadow-purple-600/30",
    green: "from-green-600 to-green-700 shadow-green-600/30",
    red: "from-red-600 to-red-700 shadow-red-600/30",
    orange: "from-orange-500 to-orange-600 shadow-orange-500/30",
  };

  return (
    <>
    <Toaster position="top-right" richColors closeButton />
    <div
      className={`flex h-screen transition-colors duration-300 font-sans antialiased ${settings.theme === "dark" ? "bg-gray-900 text-white" : "bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50"} overflow-hidden`}
    >
      {/* --- SIDEBAR --- */}
      <aside
        className={`${isSidebarOpen ? "w-72" : "w-20"} bg-[#D1F4FA] dark:bg-gray-900 border-r border-gray-200/50 dark:border-gray-800 shadow-xl transition-all duration-300 flex flex-col`}
      >
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            {isSidebarOpen ? (
              <>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 bg-gradient-to-br ${themeColors[settings.primaryColor] || themeColors.blue} rounded-xl flex items-center justify-center shadow-lg`}
                  >
                    <Hotel className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    {/* Tăng độ đậm tiêu đề chính */}
                    <h1
                      className={`text-xl font-extrabold ${settings.theme === "dark" ? "text-white" : "text-gray-900"}`}
                    >
                      HotelPro
                    </h1>
                  </div>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-black/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-black/5 rounded-lg mx-auto"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {/* 1. Dashboard Tab */}
            {mainMenuTabs
              .filter((t) => t.id === "dashboard")
              .map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === tab.id ? `bg-gradient-to-r ${themeColors[settings.primaryColor] || themeColors.blue} text-white shadow-lg` : `${settings.theme === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-800 hover:bg-gray-100"}`}`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {/* Chuyển font-medium thành font-semibold */}
                    {isSidebarOpen && (
                      <span className="font-semibold text-[15px]">
                        {tab.label}
                      </span>
                    )}
                  </button>
                );
              })}

            {/* 2. Cụm Quầy Lễ Tân Dropdown - Đã tích hợp đa ngôn ngữ */}
            <div className="pt-2">
              <button
                onClick={() => {
                  if (!isSidebarOpen) setIsSidebarOpen(true);
                  setIsReceptionOpen(!isReceptionOpen);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                  isReceptionOpen && isSidebarOpen
                    ? "bg-blue-600/10 text-blue-700 font-bold"
                    : "text-gray-800 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <LogIn className="w-5 h-5 flex-shrink-0" />
                  {/* Sử dụng t() để dịch tiêu đề Quầy Lễ Tân */}
                  {isSidebarOpen && (
                    <span className="font-bold uppercase text-sm tracking-wider">
                      {t("sidebar.reception")}
                    </span>
                  )}
                </div>
                {isSidebarOpen && (
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-300 ${isReceptionOpen ? "" : "-rotate-90"}`}
                  />
                )}
              </button>

              {isReceptionOpen && isSidebarOpen && (
                <div className="mt-1 ml-4 border-l-2 border-blue-200 pl-2 space-y-1 animate-in slide-in-from-top-1">
                  {/* Các menu con cũng được bọc hàm t() */}
                  <button
                    onClick={() => setActiveTab("checkinout")}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[15px] font-semibold transition-all ${activeTab === "checkinout" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
                  >
                    <Bed size={16} /> <span>{t("sidebar.room")}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("guests")}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[15px] font-semibold transition-all ${activeTab === "guests" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
                  >
                    <Users size={16} /> <span>{t("sidebar.customer")}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("bookings")}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[15px] font-semibold transition-all ${activeTab === "bookings" ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
                  >
                    <Calendar size={16} /> <span>{t("sidebar.booking")}</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Các Tab còn lại */}
            {mainMenuTabs
              .filter((t) => t.id !== "dashboard")
              .map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === tab.id ? `bg-gradient-to-r ${themeColors[settings.primaryColor] || themeColors.blue} text-white shadow-lg` : `${settings.theme === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-800 hover:bg-gray-100"}`}`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {/* Đồng bộ font-semibold */}
                    {isSidebarOpen && (
                      <span className="font-semibold text-[15px]">
                        {tab.label}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-gray-200/50">
          <div className="space-y-1 mb-4">
            {bottomMenuTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === tab.id ? `bg-gradient-to-r ${themeColors[settings.primaryColor] || themeColors.blue} text-white shadow-lg` : `${settings.theme === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-800 hover:bg-gray-100"}`}`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {/* Đồng bộ font-semibold */}
                  {isSidebarOpen && (
                    <span className="font-semibold text-[15px]">
                      {tab.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {isSidebarOpen && (
            <div
              className={`p-4 rounded-xl border transition-colors ${settings.theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white/80 border-blue-200 backdrop-blur-sm shadow-sm"}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {currentUser?.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  {/* Tăng độ rõ nét của Tên và Email */}
                  <p className="text-[15px] font-bold text-gray-900 dark:text-white truncate">
                    {currentUser?.name}
                  </p>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
                    {currentUser?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all text-[15px] font-bold border border-red-200 shadow-sm"
              >
                <LogOut className="w-4 h-4" /> {t("sidebar.logout")}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
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
            {activeTab === "report" && <ReportDashboard />}
            {activeTab === "settings" && <Settings />}
            {activeTab === "profile" && currentUser && <Profile />}
            {activeTab === "roles" && <RolePermissionManagement />}
          </div>
          <ChatBot />
        </div>
      </main>
    </div>
    </>
    
  );
}
