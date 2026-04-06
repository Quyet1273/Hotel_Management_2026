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
  // HÀM LẤY USER ĐANG ĐĂNG NHẬP (Dùng cho Profile và giữ Login)
  getCurrentUser: async () => {
    try {
      // B1: Lấy session từ Auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) return null;

      // B2: Lấy thông tin chi tiết từ bảng employees
      const { data: userData, error: dbError } = await supabase
        .from("employees")
        .select("*, role_info:roles(name, description)") // Join luôn để lấy tên Role cho đẹp
        .eq("id", authUser.id)
        .single();

      if (dbError) throw dbError;

      return {
        id: authUser.id, // Rất quan trọng để truyền vào Profile
        name: userData.fullName,
        email: userData.email,
        avatar: userData.avatar_url || "",
        role: userData.role,
        phone: userData.phone,
        address: userData.address,
        position: userData.role_info?.name || "Nhân viên"
      };
    } catch (error) {
      console.error("Get Current User Error:", error);
      return null;
    }
  },
  // Cập nhật thông tin cơ bản của Profile
  updateProfile: async (userId: string, payload: { name: string; phone: string; address: string; avatar?: string }) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          fullName: payload.name,
          phone: payload.phone,
          address: payload.address,
          ...(payload.avatar && { avatar_url: payload.avatar }) // Chỉ cập nhật avatar nếu có
        })
        .eq('id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error("Update Profile Error:", error.message);
      return { success: false, error: error.message };
    }
  },
  // hàm cập nhật avatar mới (Dùng cho Profile)
uploadAvatar: async (userId: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      return { success: true, url: data.publicUrl };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
  // HÀM ĐĂNG XUẤT
  logout: async () => {
    await supabase.auth.signOut();
  }
};