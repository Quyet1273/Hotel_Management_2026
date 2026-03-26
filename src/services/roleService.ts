import { supabase } from '../lib/supabase';
import { Role } from '../types/role';

export const roleService = {
  // 1. Lấy danh sách Roles kèm số lượng user (Giữ nguyên logic cực xịn của m)
  getRoles: async (): Promise<{ success: boolean; data?: Role[]; error?: string }> => {
    try {
      const { data: rolesData, error: rolesError } = await supabase.from('roles').select('*');
      if (rolesError) throw rolesError;

      const { data: employeesData, error: employeesError } = await supabase.from('employees').select('role');
      if (employeesError) throw employeesError;

      // Đếm số lượng nhân viên theo role
      const userCountMap = employeesData.reduce((acc: any, emp) => {
        if (emp.role) acc[emp.role] = (acc[emp.role] || 0) + 1;
        return acc;
      }, {});

      const formattedRoles: Role[] = rolesData.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        permissions: r.permissions || [],
        userCount: userCountMap[r.id] || 0,
      }));

      // Sắp xếp admin lên đầu, các role khác xếp theo tên
      formattedRoles.sort((a, b) => a.id === 'admin' ? -1 : b.id === 'admin' ? 1 : a.name.localeCompare(b.name));

      return { success: true, data: formattedRoles };
    } catch (error: any) {
      console.error('Lỗi fetchRoles:', error.message);
      return { success: false, error: error.message };
    }
  },

  // 2. Thêm mới hoặc cập nhật Role
  saveRole: async (roleId: string, roleData: { name: string; description: string; permissions: string[] }) => {
    try {
      const payload = {
        id: roleId,
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
      };

      const { error } = await supabase.from('roles').upsert([payload]);
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Lỗi saveRole:', error.message);
      return { success: false, error: error.message };
    }
  },

  // 3. Xóa Role (Đã fix thêm check thủ công cho DB chưa có khóa ngoại)
  deleteRole: async (roleId: string) => {
    try {
      // Vì DB của m chưa có Khóa Ngoại (Foreign Key), lỗi 23503 sẽ không tự bắn ra.
      // T phải check thủ công xem có nhân viên nào đang dùng role này không trước khi xóa.
      const { count, error: countError } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('role', roleId);

      if (countError) throw countError;
      if (count && count > 0) {
        return { success: false, error: 'Không thể xóa! Đang có nhân viên sử dụng vai trò này.' };
      }

      const { error } = await supabase.from('roles').delete().eq('id', roleId);
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      console.error('Lỗi deleteRole:', error.message);
      return { success: false, error: error.message };
    }
  },

  // 4. Lấy danh sách nhân viên thực tế từ bảng employees (ĐÃ FIX LỖI JOIN BẰNG JAVASCRIPT)
  getEmployees: async () => {
    try {
      // Gọi song song 2 bảng để tránh lỗi Supabase Join khi chưa có Foreign Key
      const [empRes, roleRes] = await Promise.all([
        supabase.from('employees')
          .select('id, fullName, email, phone, role, status, created_at')
          .order('created_at', { ascending: false }),
        supabase.from('roles')
          .select('id, name')
      ]);

      if (empRes.error) throw empRes.error;
      if (roleRes.error) throw roleRes.error;

      // Ghép tên Role vào nhân viên bằng Javascript
      const rolesMap = new Map(roleRes.data.map((r: any) => [r.id, r]));
      const data = empRes.data.map((emp: any) => {
        const roleData = rolesMap.get(emp.role) || null;
        return {
          ...emp,
          roles: roleData, // Trả về `roles` để tương thích code giao diện
          role_info: roleData // Trả về thêm `role_info` dự phòng
        };
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('Lỗi getEmployees:', error.message);
      return { success: false, error: error.message };
    }
  },

  // 5. Hàm mới: Gán Role cho nhân viên (Cần thiết cho giao diện UI)
  // 5. Cập nhật mã Role cho nhân viên (BẢN CHỐNG LỪA ĐẢO)
  updateEmployeeRole: async (employeeId: string, roleId: string) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update({ role: roleId })
        .eq('id', employeeId)
        .select(); // BẮT BUỘC có .select() để bắt Supabase nhả data về

      if (error) throw error;

      // NẾU DATA RỖNG -> Tức là bị RLS chặn ngầm, cập nhật 0 dòng
      if (!data || data.length === 0) {
        return { success: false, error: 'Update xịt! Bị RLS chặn ngầm ở bảng employees.' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('LỖI UPDATE EMP ROLE:', error);
      return { success: false, error: error.message };
    }
  },

  // 6. Cập nhật trạng thái nhân viên (Active/Inactive)
  toggleEmployeeStatus: async (employeeId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const { error } = await supabase
        .from('employees')
        .update({ status: newStatus })
        .eq('id', employeeId);

      if (error) throw error;
      return { success: true, newStatus };
    } catch (error: any) {
      console.error('Lỗi toggleStatus:', error.message);
      return { success: false, error: error.message };
    }
  }
};