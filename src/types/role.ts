export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

// Danh sách toàn bộ quyền trong hệ thống
export const allPermissions: Permission[] = [
  // Dashboard
  { id: 'dashboard.view', name: 'Xem Dashboard', description: 'Xem tổng quan và báo cáo', module: 'Dashboard' },
  { id: 'dashboard.export', name: 'Xuất Báo Cáo', description: 'Xuất dữ liệu và báo cáo', module: 'Dashboard' },
  // Rooms
  { id: 'rooms.view', name: 'Xem Phòng', description: 'Xem danh sách phòng', module: 'Quản Lý Phòng' },
  { id: 'rooms.create', name: 'Tạo Phòng', description: 'Thêm phòng mới', module: 'Quản Lý Phòng' },
  { id: 'rooms.edit', name: 'Sửa Phòng', description: 'Chỉnh sửa thông tin phòng', module: 'Quản Lý Phòng' },
  { id: 'rooms.delete', name: 'Xóa Phòng', description: 'Xóa phòng khỏi hệ thống', module: 'Quản Lý Phòng' },
  // Bookings
  { id: 'bookings.view', name: 'Xem Đặt Phòng', description: 'Xem danh sách đặt phòng', module: 'Đặt Phòng' },
  { id: 'bookings.create', name: 'Tạo Đặt Phòng', description: 'Tạo đặt phòng mới', module: 'Đặt Phòng' },
  { id: 'bookings.edit', name: 'Sửa Đặt Phòng', description: 'Chỉnh sửa đặt phòng', module: 'Đặt Phòng' },
  { id: 'bookings.cancel', name: 'Hủy Đặt Phòng', description: 'Hủy đặt phòng', module: 'Đặt Phòng' },
  // Guests
  { id: 'guests.view', name: 'Xem Khách Hàng', description: 'Xem thông tin khách hàng', module: 'Khách Hàng' },
  { id: 'guests.create', name: 'Tạo Khách Hàng', description: 'Thêm khách hàng mới', module: 'Khách Hàng' },
  { id: 'guests.edit', name: 'Sửa Khách Hàng', description: 'Chỉnh sửa thông tin khách hàng', module: 'Khách Hàng' },
  { id: 'guests.delete', name: 'Xóa Khách Hàng', description: 'Xóa khách hàng', module: 'Khách Hàng' },
  // Check-in/out
  { id: 'checkin.perform', name: 'Thực Hiện Check-in', description: 'Check-in khách', module: 'Nhận/Trả Phòng' },
  { id: 'checkout.perform', name: 'Thực Hiện Check-out', description: 'Check-out khách', module: 'Nhận/Trả Phòng' },
  // Services
  { id: 'services.view', name: 'Xem Dịch Vụ', description: 'Xem danh sách dịch vụ', module: 'Dịch Vụ' },
  { id: 'services.create', name: 'Tạo Dịch Vụ', description: 'Thêm dịch vụ mới', module: 'Dịch Vụ' },
  { id: 'services.edit', name: 'Sửa Dịch Vụ', description: 'Chỉnh sửa dịch vụ', module: 'Dịch Vụ' },
  { id: 'services.delete', name: 'Xóa Dịch Vụ', description: 'Xóa dịch vụ', module: 'Dịch Vụ' },
  // Employees
  { id: 'employees.view', name: 'Xem Nhân Viên', description: 'Xem danh sách nhân viên', module: 'Nhân Viên' },
  { id: 'employees.create', name: 'Tạo Nhân Viên', description: 'Thêm nhân viên mới', module: 'Nhân Viên' },
  { id: 'employees.edit', name: 'Sửa Nhân Viên', description: 'Chỉnh sửa thông tin nhân viên', module: 'Nhân Viên' },
  { id: 'employees.delete', name: 'Xóa Nhân Viên', description: 'Xóa nhân viên', module: 'Nhân Viên' },
  // Housekeeping
  { id: 'housekeeping.view', name: 'Xem Buồng Phòng', description: 'Xem danh sách công việc', module: 'Buồng Phòng' },
  { id: 'housekeeping.assign', name: 'Phân Công', description: 'Phân công công việc', module: 'Buồng Phòng' },
  { id: 'housekeeping.complete', name: 'Hoàn Thành', description: 'Đánh dấu hoàn thành', module: 'Buồng Phòng' },
  // Settings & Roles
  { id: 'settings.view', name: 'Xem Cài Đặt', description: 'Xem cài đặt hệ thống', module: 'Hệ Thống' },
  { id: 'settings.edit', name: 'Sửa Cài Đặt', description: 'Thay đổi cài đặt', module: 'Hệ Thống' },
  { id: 'roles.manage', name: 'Quản Lý Phân Quyền', description: 'Quản lý vai trò và quyền', module: 'Hệ Thống' },
];