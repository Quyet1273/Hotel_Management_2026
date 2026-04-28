import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { settingsService, SettingsState,  } from '../services/settingsService';

// --- 1. BỘ TỪ ĐIỂN ĐẦY ĐỦ (Dùng cho hàm t) ---
export const translations: any = {
  vi: {
    sidebar: {
      dashboard: "Tổng Quan", booking: "Đặt Phòng", customer: "Khách Hàng", reception: "Quầy Lễ Tân",
      service: "Dịch Vụ", employee: "Nhân Viên", invoice: "Hóa Đơn", inventory: "Kho Vật Tư",
      cost: "Chi Phí", room: "Phòng", report: "Báo Cáo", profile: "Hồ Sơ", settings: "Cài Đặt", logout: "Đăng xuất"
    },
    inventory: {
      title: "QUẢN LÝ KHO VẬT TƯ", subtitle: "Kiểm soát xuất nhập tồn cho HotelPro", add_category: "THÊM DANH MỤC",
      total_items: "TỔNG MẶT HÀNG", out_of_stock: "SẮP HẾT HÀNG", history_log: "LỊCH SỬ GIAO DỊCH",
      inventory_value: "GIÁ TRỊ KHO", tab_stock: "TỒN KHO", tab_history: "LỊCH SỬ", search_placeholder: "Tìm tên vật tư...",
      filter_all: "Tất cả danh mục", col_name: "TÊN VẬT TƯ", col_category: "DANH MỤC", col_stock: "TỒN KHO",
      col_price: "ĐƠN GIÁ", col_action: "THAO TÁC", min_stock: "Min:",
      items: { toothbrush: "Bàn chải đánh răng", razor_kit: "Dao cạo râu", unit_pcs: "Cái", unit_set: "Bộ" },
      categories: { amenities: "AMENITIES" }
    },
    booking: {
      title: "Quản Lý Đặt Phòng", subtitle: "Dữ liệu từ hệ thống", btn_add: "Đặt Phòng Mới", search_placeholder: "Tìm mã...",
      filter_status: "Tất cả trạng thái", col_id: "MÃ BOOKING", col_customer: "KHÁCH HÀNG", col_room: "PHÒNG",
      col_time: "THỜI GIAN", col_total: "TỔNG TIỀN", col_status: "TRẠNG THÁI", col_action: "THAO TÁC",
      btn_detail: "Chi tiết", btn_checkout: "Trả phòng",
      tab_pending: "CHỜ DUYỆT", tab_checkin: "NHẬN PHÒNG", tab_checkout: "TRẢ PHÒNG", // Đưa về đúng chỗ
      housekeeping_title: "BUỒNG PHÒNG", housekeeping_subtitle: "Quản lý vệ sinh",
      dirty_rooms: "PHÒNG BẨN", cleaning_rooms: "ĐANG DỌN", clean_status: "SẠCH SẼ 100%", clean_desc: "Không có phòng cần dọn."
    },
    service: {
      title: "DANH MỤC DỊCH VỤ", subtitle: "Quản lý menu ăn uống, giặt ủi và các tiện ích HotelPro", btn_add: "THÊM DỊCH VỤ",
      search_placeholder: "Tìm tên dịch vụ...", filter_all: "Tất cả", status_selling: "ĐANG BÁN", status_hidden: "TẠM ẨN",
      cat_food: "ĂN UỐNG", cat_spa: "SPA & MASSAGE", cat_laundry: "GIẶT ỦI", cat_other: "KHÁC",
      items: {
        orange_juice: "NƯỚC CAM TƯƠI", sauna: "XÔNG HƠI", tiger_beer: "BIA TIGER / 333", g7_coffee: "CÀ PHÊ G7 3IN1",
        energy_drink: "NƯỚC TĂNG LỰC", condom: "BAO CAO SU DUREX", lipton_tea: "TRÀ LIPTON/COZY", peanuts: "ĐẬU PHỘNG TÂN TÂN",
        coca_cola: "COCA COLA", chips: "SNACK KHOAI TÂY LAYS", heineken: "BIA HEINEKEN", sausage: "XÚC XÍCH VISSAN",
        fried_rice: "CƠM RANG", laundry_service: "GIẶT SẤY LẤY LIỀN", massage_oil: "MASSAGE TINH DẦU", noodles: "MÌ TÔM TRỨNG", lavie: "NƯỚC KHOÁNG LAVIE"
      },
      unit_glass: "Cốc", unit_turn: "Lượt", unit_can: "Lon", unit_pack: "Tần", unit_plate: "Đĩa", unit_bag: "Gói", unit_piece: "Cái", unit_kg: "Kg", unit_session: "Suất", unit_bowl: "Tô", unit_bottle: "Chai"
    },
    employee: {
      title: "QUẢN LÝ NHÂN SỰ & TIỀN LƯƠNG", subtitle: "Hệ thống HotelPro - Chi nhánh Trung tâm", tab_list: "DANH SÁCH NHÂN SỰ",
      tab_roles: "CẤU HÌNH CHỨC VỤ", tab_attendance: "CHẤM CÔNG", tab_payroll: "QUẢN LÝ LƯƠNG", col_employee: "NHÂN VIÊN",
      col_role: "VAI TRÒ / QUYỀN", col_contact: "LIÊN HỆ", col_status: "TRẠNG THÁI", col_action: "THAO TÁC",
      roles: { admin: "Quản Trị Viên", staff: "Nhân Viên", receptionist: "Lễ Tân" }, search_placeholder: "Tìm kiếm nhân viên...", active_status: "Đang hoạt động", inactive_status: "Ngừng hoạt động"
    },
    invoice: {
      title: "LỊCH SỬ HÓA ĐƠN", subtitle: "Quản lý doanh thu và tra cứu thanh toán", btn_export: "XUẤT BÁO CÁO EXCEL",
      total_revenue: "TỔNG DOANH THU", cash_invoices: "HÓA ĐƠN TIỀN MẶT", transfer_invoices: "HÓA ĐƠN CHUYỂN KHOẢN", total_transactions: "TỔNG GIAO DỊCH",
      search_placeholder: "Tìm theo tên khách hoặc số điện thoại...", col_id: "MÃ HĐ", col_customer: "KHÁCH HÀNG", col_room: "PHÒNG",
      col_total: "TỔNG CỘNG", col_payment: "THANH TOÁN", col_time: "THỜI GIAN", col_detail: "CHI TIẾT", method_cash: "TIỀN MẶT", method_transfer: "CHUYỂN KHOẢN"
    },
    cost: {
      title: "QUẢN LÝ CHI PHÍ", subtitle: "Theo dõi dòng tiền chi ra của HotelPro", total_cost: "TỔNG CHI", monthly_cost: "CHI THÁNG NÀY",
      cash_payment: "TIỀN MẶT", transfer_payment: "CHUYỂN KHOẢN", search_placeholder: "Tìm kiếm nội dung chi...",
      col_time: "THỜI GIAN", col_content: "NỘI DUNG CHI PHÍ", col_category: "DANH MỤC", col_method: "HÌNH THỨC", col_amount: "SỐ TIỀN",
      import_goods: "Nhập hàng", inventory_import: "NHẬP KHO", no_note: "Không có ghi chú", method_cash: "Tiền mặt", method_transfer: "Chuyển khoản"
    },
    room: {
      title: "QUẢN LÝ PHÒNG", subtitle: "Quản lý sơ đồ phòng, trạng thái và thiết lập giá HotelPro", btn_add: "THÊM PHÒNG MỚI",
      filter_label: "BỘ LỌC", filter_status: "TRẠNG THÁI:", filter_type: "LOẠI PHÒNG:", all: "Tất cả", room_name: "PHÒNG",
      floor: "TẦNG", status_available: "TRỐNG", status_occupied: "CÓ KHÁCH", label_type: "LOẠI", label_capacity: "SỨC CHỨA",
      label_price: "GIÁ THUÊ", price_unit: "ĐÊM", guest_unit: "khách", type_single: "Đơn", type_double: "Đôi", btn_edit: "SỬA"
    },
    profile: {
      btn_edit: "Chỉnh sửa", status_active: "Đang hoạt động", board_of_directors: "Ban Giám Đốc", personal_info_title: "Thông Tin Cá Nhân",
      full_name: "Họ và tên", email: "Email", phone: "Số điện thoại", address: "Địa chỉ", stats_title: "Thống Kê Khách Sạn",
      total_bookings: "Tổng đặt phòng", guests_served: "Khách đã phục vụ", avg_rating: "Đánh giá trung bình", api_note: "*Số liệu thống kê tạm thời chưa kết nối API",
      other_info_title: "Thông Tin Khác", permissions: "Quyền hạn", employee_id: "Mã nhân viên (ID)", status: "Trạng thái"
    },
    settings: {
      general_title: "Cài Đặt Chung", language_label: "Ngôn ngữ", theme_label: "Giao diện (Theme)", theme_light: "Sáng", theme_dark: "Tối",
      notification_title: "Thông Báo", email_notif: "Thông báo Email", email_desc: "Nhận báo cáo qua mail cá nhân", push_notif: "Thông báo đẩy",
      push_desc: "Nhận trên trình duyệt web", booking_notif: "Đặt phòng", booking_desc: "Nhắc nhở khách mới", sound_notif: "Âm thanh",
      security_title: "Bảo Mật", change_password: "Đổi mật khẩu", two_factor: "Xác thực 2 bước", login_devices: "Thiết bị đăng nhập",
      appearance_title: "Giao Diện", primary_color: "Màu chủ đạo"
    }
  },
  en: {
    sidebar: {
      dashboard: "Dashboard", booking: "Booking", customer: "Customers", reception: "Reception",
      service: "Services", employee: "Employees", invoice: "Invoices", inventory: "Inventory",
      cost: "Costs", room: "Rooms", report: "Reports", profile: "Profile", settings: "Settings", logout: "Logout"
    },
    inventory: {
      title: "INVENTORY MANAGEMENT", subtitle: "Stock control", add_category: "ADD CATEGORY", // Sửa btn_add_category -> add_category
      total_items: "TOTAL ITEMS", out_of_stock: "LOW STOCK", history_log: "HISTORY",
      inventory_value: "VALUE", tab_stock: "STOCK", tab_history: "HISTORY", search_placeholder: "Search...",
      filter_all: "All", col_name: "NAME", col_category: "CATEGORY", col_stock: "STOCK",
      col_price: "PRICE", col_action: "ACTIONS", min_stock: "Min:",
      items: { toothbrush: "Toothbrush", razor_kit: "Razor", unit_pcs: "Pcs", unit_set: "Set" },
      categories: { amenities: "AMENITIES" }
    },
    booking: {
      title: "Booking Management", subtitle: "System data", btn_add: "New Booking", search_placeholder: "Search...",
      filter_status: "All Statuses", col_id: "ID", col_customer: "CUSTOMER", col_room: "ROOM",
      col_time: "TIME", col_total: "TOTAL", col_status: "STATUS", col_action: "ACTIONS",
      btn_detail: "Details", btn_checkout: "Check-out",
      tab_pending: "PENDING", tab_checkin: "CHECK-IN", tab_checkout: "CHECK-OUT",
      housekeeping_title: "HOUSEKEEPING", housekeeping_subtitle: "Manage cleaning",
      dirty_rooms: "DIRTY", cleaning_rooms: "CLEANING", clean_status: "100% CLEAN", clean_desc: "No rooms to clean."
    },
    service: {
      title: "SERVICE CATEGORY", subtitle: "Manage F&B menu, laundry, and HotelPro utilities", btn_add: "ADD SERVICE",
      search_placeholder: "Search service...", filter_all: "All", status_selling: "AVAILABLE", status_hidden: "HIDDEN",
      cat_food: "F&B", cat_spa: "SPA & MASSAGE", cat_laundry: "LAUNDRY", cat_other: "OTHERS",
      items: {
        orange_juice: "FRESH ORANGE JUICE", sauna: "SAUNA", tiger_beer: "TIGER BEER / 333", g7_coffee: "G7 COFFEE 3IN1",
        energy_drink: "ENERGY DRINK", condom: "DUREX CONDOMS", lipton_tea: "LIPTON/COZY TEA", peanuts: "TAN TAN PEANUTS",
        coca_cola: "COCA COLA", chips: "LAYS POTATO CHIPS", heineken: "HEINEKEN BEER", sausage: "VISSAN SAUSAGE",
        fried_rice: "FRIED RICE", laundry_service: "EXPRESS LAUNDRY", massage_oil: "ESSENTIAL OIL MASSAGE", noodles: "NOODLES WITH EGG", lavie: "MINERAL WATER"
      },
      unit_glass: "Glass", unit_turn: "Turn", unit_can: "Can", unit_pack: "Pack", unit_plate: "Plate", unit_bag: "Bag", unit_piece: "Pcs", unit_kg: "Kg", unit_session: "Session", unit_bowl: "Bowl", unit_bottle: "Bottle"
    },
    employee: {
      title: "HR & PAYROLL MANAGEMENT", subtitle: "HotelPro System - Central Branch", tab_list: "EMPLOYEE LIST",
      tab_roles: "ROLE CONFIGURATION", tab_attendance: "ATTENDANCE", tab_payroll: "PAYROLL", col_employee: "EMPLOYEE",
      col_role: "ROLE / PERMISSION", col_contact: "CONTACT", col_status: "STATUS", col_action: "ACTIONS",
      roles: { admin: "Administrator", staff: "Staff", receptionist: "Receptionist" }, search_placeholder: "Search...", active_status: "Active", inactive_status: "Inactive"
    },
    invoice: {
      title: "INVOICE HISTORY", subtitle: "Revenue management and payment lookup", btn_export: "EXPORT EXCEL",
      total_revenue: "TOTAL REVENUE", cash_invoices: "CASH INVOICES", transfer_invoices: "TRANSFER INVOICES", total_transactions: "TOTAL TRANSACTIONS",
      search_placeholder: "Search by guest name or phone...", col_id: "INV ID", col_customer: "CUSTOMER", col_room: "ROOM",
      col_total: "TOTAL", col_payment: "PAYMENT", col_time: "TIME", col_detail: "DETAILS", method_cash: "CASH", method_transfer: "TRANSFER"
    },
    cost: {
      title: "COST MANAGEMENT", subtitle: "Track cash outflows", total_cost: "TOTAL COST", monthly_cost: "THIS MONTH",
      cash_payment: "CASH", transfer_payment: "TRANSFER", search_placeholder: "Search expenditure...",
      col_time: "TIME", col_content: "CONTENT", col_category: "CATEGORY", col_method: "METHOD", col_amount: "AMOUNT",
      import_goods: "Import goods", inventory_import: "INVENTORY", no_note: "No notes", method_cash: "Cash", method_transfer: "Bank Transfer"
    },
    room: {
      title: "ROOM MANAGEMENT", subtitle: "Manage room map and prices", btn_add: "ADD ROOM", filter_label: "FILTER",
      filter_status: "STATUS:", filter_type: "TYPE:", all: "All", room_name: "ROOM", floor: "FLOOR",
      status_available: "AVAILABLE", status_occupied: "OCCUPIED", label_type: "TYPE", label_capacity: "CAPACITY",
      label_price: "PRICE", price_unit: "NIGHT", guest_unit: "guests", type_single: "Single", type_double: "Double", btn_edit: "EDIT"
    },
    profile: {
      btn_edit: "Edit", status_active: "Active", board_of_directors: "Board of Directors", personal_info_title: "Personal Information",
      full_name: "Full Name", email: "Email", phone: "Phone", address: "Address", stats_title: "Hotel Statistics",
      total_bookings: "Total Bookings", guests_served: "Guests Served", avg_rating: "Avg Rating", api_note: "*Not connected to API",
      other_info_title: "Other Info", permissions: "Permissions", employee_id: "Employee ID", status: "Status"
    },
    settings: {
      general_title: "General Settings", language_label: "Language", theme_label: "Appearance", theme_light: "Light", theme_dark: "Dark",
      notification_title: "Notifications", email_notif: "Email Notifications", email_desc: "Receive via personal email", push_notif: "Push Notifications",
      push_desc: "Receive on browser", booking_notif: "Bookings", booking_desc: "New guest reminders", sound_notif: "Sound",
      security_title: "Security", change_password: "Change password", two_factor: "2FA", login_devices: "Login devices",
      appearance_title: "Appearance", primary_color: "Primary Color"
    }
  }
};

interface SettingsContextType {
  settings: SettingsState;
  updateSettings: (newSettings: Partial<SettingsState>) => Promise<void>;
  t: (path: string) => string;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  // State khởi tạo mặc định chắc chắn có language: 'vi'
  const [settings, setSettings] = useState<any>({ 
    language: 'vi', 
    theme: 'light', 
    primaryColor: 'blue',
    notifications: { email: true, push: true, bookingAlerts: true }
  });
  const [loading, setLoading] = useState(true);

  // 1. Init: Lấy dữ liệu từ Supabase và MERGE
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const res = await settingsService.getUserSettings(user.id);
          if (res.success && res.data) {
            setSettings((prev: any) => ({
              ...prev,
              ...res.data,
              // Nếu trong DB thiếu field language thì vẫn giữ 'vi' của prev
              language: res.data.language || prev.language || 'vi' 
            }));
          }
        }
      } catch (err) {
        console.error("Settings Init Error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // 2. Update: Lưu cả State và Database
  const updateSettings = async (newSettings: Partial<SettingsState>) => {
    setSettings((prev: any) => {
      const updated = { ...prev, ...newSettings };
      
      // Lưu vào Supabase (async)
      const syncDb = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await settingsService.saveUserSettings(user.id, updated as SettingsState);
        }
      };
      syncDb();

      return updated;
    });
  };

  // 3. Hàm dịch t: Chống lỗi undefined language
  const t = useCallback((path: string): string => {
    const keys = path.split('.');
    const currentLang = settings.language || 'vi';
    let result = translations[currentLang];
    
    for (const key of keys) {
      if (result && result[key] !== undefined) {
        result = result[key];
      } else {
        // Trả về path để dễ debug xem key nào đang bị thiếu hoặc sai chỗ
        console.warn(`Translation missing: ${path} in [${currentLang}]`);
        return path; 
      }
    }
    return result;
  }, [settings.language]); // Chỉ tính toán lại khi language thay đổi

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, t, loading }}>
      {!loading && children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};