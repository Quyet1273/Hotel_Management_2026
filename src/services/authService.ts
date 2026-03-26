import { supabase } from "../lib/supabase";

export const authService = {
  // HÀM ĐĂNG KÝ: Khớp với form Register.tsx
  register: async (formData: any) => {
    try {
      // B1: Đăng ký tài khoản vào hệ thống 
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // B2: Sau khi có user id, tạo bản ghi tương ứng trong bảng 'employees'
        const { error: dbError } = await supabase.from("employees").insert([
          {
            id: authData.user.id, // Rất quan trọng để liên kết Auth và Data
            fullName: formData.name, // Map từ 'name' ở UI sang 'fullName' ở DB
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            role: "receptionist", // Mặc định quyền lễ tân cho người mới
            status: "active",
            created_at: new Date().toISOString(),
          },
        ]);

        if (dbError) throw dbError;
        return { success: true };
      }
      return { success: false, error: "Không thể tạo tài khoản người dùng." };
    } catch (error: any) {
      console.error("Auth Register Error:", error.message);
      return { success: false, error: error.message };
    }
  },

  // HÀM ĐĂNG NHẬP
  login: async (email: string, password: string) => {
    try {
      // B1: Xác thực email/password qua Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // B2: Truy vấn thông tin chi tiết (Role, Tên) từ bảng 'employees'
      const { data: userData, error: dbError } = await supabase
        .from("employees")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (dbError) throw dbError;

      return {
        success: true,
        user: {
          name: userData.fullName,
          email: userData.email,
          avatar: userData.avatar_url || "",
          role: userData.role,
          phone: userData.phone,
          address: userData.address
        },
      };
    } catch (error: any) {
      console.error("Auth Login Error:", error.message);
      return { success: false, error: error.message };
    }
  },

  // HÀM ĐĂNG XUẤT
  logout: async () => {
    await supabase.auth.signOut();
  }
};