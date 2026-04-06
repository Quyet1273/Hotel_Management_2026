import { useState, useEffect } from "react";
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
// Context & API
import { SettingsProvider, useSettings } from "./context/SettingsContext.tsx";
import { authService } from "./services/authService.ts";

// UI & Icons
import {
  Hotel, Bed, Calendar, Users, LogIn, Settings as SettingsIcon,
  UserCircle, LogOut, Menu, X, Package, UsersIcon, Sparkles,
  ReceiptText, Box, CircleDollarSign, Receipt,
} from "lucide-react";
import { Toaster } from "./components/ui/sonner.js";

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
  | "dashboard" | "rooms" | "bookings" | "guests" | "checkinout" | "services"
  | "employees" | "housekeeping" | "invoices" | "inventory" | "expenses"
  | "payroll" | "settings" | "report" | "profile" | "roles" | "login" | "register";

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

  // Logic States (Giữ nguyên của ông)
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUser(user as User);
        setIsAuthenticated(true); // Quan trọng: Có user thì set true để không bị nhảy trang Login
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
      setActiveTab("dashboard"); // Chuyển về dashboard sau login
    } else {
      alert("Đăng nhập thất bại: " + result.error);
    }
  };

  // Logic Xử lý Đăng ký (Y hệt bản gốc)
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

  // Logic Phân quyền Menu (Đã bọc t())
  const getMenuTabs = () => {
    const allTabs = [
      { id: "dashboard" as Tab, label: t('sidebar.dashboard'), icon: Hotel, roles: ["admin", "manager", "receptionist", "staff"] },
      { id: "bookings" as Tab, label: t('sidebar.booking'), icon: Calendar, roles: ["admin", "manager", "receptionist", "staff"] },
      { id: "guests" as Tab, label: t('sidebar.customer'), icon: Users, roles: ["admin", "manager", "receptionist", "staff"] },
      { id: "checkinout" as Tab, label: t('sidebar.reception'), icon: LogIn, roles: ["admin", "manager", "receptionist", "staff"] },
      { id: "services" as Tab, label: t('sidebar.service'), icon: Sparkles, roles: ["admin", "manager", "receptionist", "staff"] },
      { id: "employees" as Tab, label: t('sidebar.employee'), icon: UsersIcon, roles: ["admin", "manager", "receptionist", "staff"] },
      { id: "invoices" as Tab, label: t('sidebar.invoice'), icon: ReceiptText, roles: ["admin", "manager", "receptionist", "staff"] },
      { id: "inventory" as Tab, label: t('sidebar.inventory'), icon: Package, roles: ["admin", "manager", "receptionist", "staff"] },
      { id: "expenses" as Tab, label: t('sidebar.cost'), icon: Receipt, roles: ["admin", "manager"] },
      { id: "rooms" as Tab, label: t('sidebar.room'), icon: Bed, roles: ["admin", "manager", "receptionist", "staff"] },
      { id: "report" as Tab, label: t('sidebar.report'), icon: Box, roles: ["admin", "manager"] },
    ];
    return allTabs.filter((tab) => tab.roles.includes(currentUser?.role || ""));
  };

  const mainMenuTabs = getMenuTabs();
  const bottomMenuTabs = [
    { id: "profile" as Tab, label: t('sidebar.profile'), icon: UserCircle },
    { id: "settings" as Tab, label: t('sidebar.settings'), icon: SettingsIcon },
  ];

  // --- GATEKEEPER: CHẶN NHẢY TRANG ---
  if (isLoading || settingsLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return showLogin ? (
      <Login onLogin={handleLogin} onSwitchToRegister={() => setShowLogin(false)} />
    ) : (
      <Register onRegister={handleRegister} onSwitchToLogin={() => setShowLogin(true)} />
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
    <div className={`flex h-screen transition-colors duration-300 ${settings.theme === "dark" ? "bg-gray-900 text-white" : "bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50"} overflow-hidden`}>
      <aside className={`${isSidebarOpen ? "w-72" : "w-20"} bg-[#D1F4FA] dark:bg-gray-900 border-r border-gray-200/50 dark:border-gray-800 shadow-xl transition-all duration-300 flex flex-col`}>
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            {isSidebarOpen ? (
              <>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${themeColors[settings.primaryColor] || themeColors.blue} rounded-xl flex items-center justify-center shadow-lg`}>
                    <Hotel className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className={`text-lg font-bold ${settings.theme === "dark" ? "text-white" : "text-gray-900"}`}>HotelPro</h1>
                    <p className="text-xs text-gray-500">{t('')}</p>
                  </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </>
            ) : (
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors mx-auto"><Menu className="w-5 h-5" /></button>
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === tab.id ? `bg-gradient-to-r ${themeColors[settings.primaryColor] || themeColors.blue} text-white shadow-lg` : `${settings.theme === "dark" ? "text-gray-400 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isSidebarOpen && <span className="font-medium">{tab.label}</span>}
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === tab.id ? `bg-gradient-to-r ${themeColors[settings.primaryColor] || themeColors.blue} text-white shadow-lg` : `${settings.theme === "dark" ? "text-gray-400 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isSidebarOpen && <span className="font-medium">{tab.label}</span>}
                </button>
              );
            })}
          </div>

          {isSidebarOpen && (
            <div className={`p-4 rounded-xl border transition-colors ${settings.theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white/60 border-blue-100 backdrop-blur-sm"}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold">
                  {currentUser?.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{currentUser?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium border border-red-200 dark:border-red-800">
                <LogOut className="w-4 h-4" /> {t('sidebar.logout')}
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
            {activeTab === "report" && <ReportDashboard />}
            {activeTab === "settings" && <Settings />}
            {activeTab === "profile" && currentUser && <Profile />}
            {activeTab === "roles" && <RolePermissionManagement />}
          </div>
        </div>
      </main>
    </div>
  );
}