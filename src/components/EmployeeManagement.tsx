import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Key, Shield, User, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { roleService } from '../services/roleService';

export function EmployeeManagement() {
  // Thay thế mảng mock bằng state quản lý dữ liệu thật từ DB
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    username: '', // Username không có trong DB, ta sẽ giả lập từ email
    name: '',     // Map với cột fullName
    role: 'receptionist',
    email: '',
    phone: '',
  });

  // Giữ nguyên thiết lập màu sắc của bạn
  const roles = [
    { value: 'admin', label: 'Admin', color: 'red', icon: Shield },
    { value: 'manager', label: 'Quản lý', color: 'purple', icon: User },
    { value: 'receptionist', label: 'Lễ tân', color: 'blue', icon: User },
    { value: 'housekeeping', label: 'Buồng phòng', color: 'green', icon: User },
    { value: 'staff', label: 'Nhân viên', color: 'gray', icon: User }, // Thêm staff vì DB có
  ];

  const getRoleInfo = (role: string) => {
    return roles.find(r => r.value === role) || roles[2];
  };

  // 1. Tải dữ liệu khi vào trang
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setIsLoading(true);
    const result = await roleService.getEmployees();
    if (result.success && result.data) {
      setEmployees(result.data);
    } else {
      console.error('Lỗi tải dữ liệu:', result.error);
    }
    setIsLoading(false);
  };

  // 2. Xử lý Thêm / Cập nhật vào Database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingEmployee) {
        // --- CẬP NHẬT NHÂN VIÊN ---
        const { error } = await supabase
          .from('employees')
          .update({
            fullName: formData.name,
            role: formData.role,
            email: formData.email,
            phone: formData.phone,
          })
          .eq('id', editingEmployee.id);

        if (error) throw error;
        alert('Cập nhật thông tin thành công!');
      } else {
        // --- THÊM NHÂN VIÊN MỚI ---
        // Lưu ý: Việc thêm vào bảng 'employees' ở đây sẽ hiển thị lên UI, 
        // nhưng người dùng này chưa có mật khẩu trong Auth để đăng nhập. 
        // Sau này bạn có thể kết nối nó với supabase.auth.signUp nhé!
        const { error } = await supabase
          .from('employees')
          .insert([{
            fullName: formData.name,
            role: formData.role,
            email: formData.email,
            phone: formData.phone,
            status: 'active'
          }]);

        if (error) throw error;
        alert('Đã thêm nhân viên vào danh sách!');
      }

      setShowForm(false);
      setEditingEmployee(null);
      setFormData({ username: '', name: '', role: 'receptionist', email: '', phone: '' });
      loadEmployees(); // Tải lại bảng

    } catch (error: any) {
      alert('Đã có lỗi xảy ra: ' + error.message);
    }
  };

  // 3. Mở form chỉnh sửa
  const handleEdit = (employee: any) => {
    setEditingEmployee(employee);
    setFormData({
      username: employee.email.split('@')[0], // Lấy tạm prefix email làm username
      name: employee.fullName || '',
      role: employee.role || 'receptionist',
      email: employee.email || '',
      phone: employee.phone || '',
    });
    setShowForm(true);
  };

  // 4. Bật tắt trạng thái (Active/Inactive)
  const handleToggleStatus = async (employeeId: string, currentStatus: string) => {
    const result = await roleService.toggleEmployeeStatus(employeeId, currentStatus);
    if (result.success) {
      loadEmployees(); // Tải lại bảng nếu thành công
    } else {
      alert('Không thể cập nhật trạng thái: ' + result.error);
    }
  };

  // 5. Xóa nhân viên
  const handleDelete = async (employeeId: string) => {
    if (confirm('Bạn có chắc muốn xóa nhân viên này khỏi cơ sở dữ liệu?')) {
      const { error } = await supabase.from('employees').delete().eq('id', employeeId);
      if (error) {
        alert('Lỗi khi xóa (Có thể nhân viên đã có dữ liệu ràng buộc): ' + error.message);
      } else {
        alert('Đã xóa thành công!');
        loadEmployees();
      }
    }
  };

  const handleResetPassword = (email: string) => {
    alert(`Đã gửi link đặt lại mật khẩu cho email: ${email}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium">Đang tải dữ liệu nhân viên...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 text-2xl font-bold">Quản Lý Nhân Viên</h2>
          <p className="text-gray-600 mt-1">Tạo và phân quyền tài khoản nhân viên</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingEmployee(null);
            setFormData({ username: '', name: '', role: 'receptionist', email: '', phone: '' });
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/30 transition-all duration-200 hover:shadow-xl hover:scale-105 font-medium"
        >
          <Plus className="w-5 h-5" />
          Thêm Nhân Viên
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl">
              <h3 className="text-lg font-bold">
                {editingEmployee ? 'Chỉnh Sửa Nhân Viên' : 'Thêm Nhân Viên Mới'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên đăng nhập
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="VD: nguyenvan_a"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vai trò *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium"
                >
                  {editingEmployee ? 'Cập nhật' : 'Lưu nhân viên'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingEmployee(null);
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Table */}
      <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs text-gray-600 uppercase tracking-wider font-semibold">
                  Nhân viên
                </th>
                <th className="px-6 py-4 text-left text-xs text-gray-600 uppercase tracking-wider font-semibold">
                  Vai trò
                </th>
                <th className="px-6 py-4 text-left text-xs text-gray-600 uppercase tracking-wider font-semibold">
                  Liên hệ
                </th>
                <th className="px-6 py-4 text-left text-xs text-gray-600 uppercase tracking-wider font-semibold">
                  Ngày tạo
                </th>
                <th className="px-6 py-4 text-left text-xs text-gray-600 uppercase tracking-wider font-semibold">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-left text-xs text-gray-600 uppercase tracking-wider font-semibold">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Chưa có nhân viên nào trong hệ thống.
                  </td>
                </tr>
              ) : (
                employees.map((employee) => {
                  const roleInfo = getRoleInfo(employee.role);
                  // Xử lý an toàn cho tên hiển thị và ngày tháng
                  const displayName = employee.fullName || 'Chưa cập nhật tên';
                  const initial = displayName.charAt(0).toUpperCase();
                  const username = employee.email ? employee.email.split('@')[0] : 'user';
                  const dateStr = employee.created_at ? new Date(employee.created_at).toLocaleDateString('vi-VN') : 'N/A';

                  return (
                    <tr key={employee.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-semibold">
                            {initial}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{displayName}</p>
                            <p className="text-sm text-gray-500">@{username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 bg-${roleInfo.color}-100 text-${roleInfo.color}-700 rounded-full text-xs font-medium`}>
                          {roleInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{employee.email}</p>
                        <p className="text-sm text-gray-500">{employee.phone || 'Chưa cập nhật SĐT'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {dateStr}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={employee.status === 'active'}
                            onChange={() => handleToggleStatus(employee.id, employee.status)}
                            className="sr-only peer"
                            disabled={employee.role === 'admin'}
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                        </label>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(employee)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(employee.email)}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Đặt lại mật khẩu"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          {employee.role !== 'admin' && (
                            <button
                              onClick={() => handleDelete(employee.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}