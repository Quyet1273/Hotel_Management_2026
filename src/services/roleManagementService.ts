import { supabase } from '../lib/supabase';

export const roleManagementService = {
  // ================= 1. QUẢN LÝ VAI TRÒ (ROLES) =================
  async getRoles() {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async saveRole(roleId: string, payload: { name: string; description: string; permissions: string[] }, isNew: boolean) {
    try {
      // Dùng upsert để tạo mới hoặc cập nhật.
      const { data, error } = await supabase
        .from('roles')
        .upsert([{ 
          id: roleId, 
          name: payload.name, 
          description: payload.description, 
          permissions: payload.permissions 
        }])
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async deleteRole(roleId: string) {
    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      // Lỗi này thường xảy ra nếu role này đang được gán cho nhân viên (dính khóa ngoại)
      return { success: false, error: error.message };
    }
  },

  // ================= 2. QUẢN LÝ QUYỀN NHÂN VIÊN =================
  async getEmployeesWithRoles() {
    try {
      // Lấy nhân viên
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (empError) throw empError;

      // Lấy roles để map tên
      const { data: roles, error: roleError } = await supabase
        .from('roles')
        .select('id, name');

      if (roleError) throw roleError;

      // Ghép tên Role vào nhân viên cho UI dễ hiển thị
      const employeesWithRoles = employees.map(emp => ({
        ...emp,
        role_info: roles.find(r => r.id === emp.role) || null
      }));

      return { success: true, data: employeesWithRoles };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async assignRoleToEmployee(employeeId: string, roleId: string) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update({ role: roleId }) // Cập nhật cột role của nhân viên
        .eq('id', employeeId)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};