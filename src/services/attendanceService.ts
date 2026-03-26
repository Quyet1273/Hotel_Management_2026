import { supabase } from '../lib/supabase';

/**
 * UTILS: Xử lý thời gian chuẩn Việt Nam
 */
const helpers = {
  // 1. Lấy chuỗi YYYY-MM-DD theo giờ Việt Nam chính xác (Không lệch do UTC)
  getVNDateString: (date: Date = new Date()) => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(date);
  },

  // 2. Chuyển chuỗi "HH:mm:ss" thành Date object theo ngày làm việc
  parseTimeToDate: (timeStr: string, baseDate: Date) => {
    const [h, m, s] = timeStr.split(':').map(Number);
    const d = new Date(baseDate);
    d.setHours(h, m, s || 0, 0);
    return d;
  }
};

/**
 * SERVICE CHẤM CÔNG (Full Logic Chuẩn Chuyên Nghiệp)
 */
export const attendanceService = {
  
  // 1. Lấy danh sách các ca làm việc (để nhân viên chọn tay)
  async getShifts() {
    try {
      // Sắp xếp ca theo giờ bắt đầu tăng dần
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .order('start_time');
      
      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // 2. Lấy trạng thái chấm công hôm nay của nhân viên
  // (Dùng để giao diện biết đang ở Trạng thái 1 hay Trạng thái 2)
  async getTodayStatus(employeeId: string) {
    try {
      const today = helpers.getVNDateString();
      const { data, error } = await supabase
        .from('attendance')
        .select('*, shifts(id, name, start_time, end_time)')
        .eq('employee_id', employeeId)
        .eq('work_date', today)
        .maybeSingle(); // Lấy 1 bản ghi nếu đã check-in
      
      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // 3. Thực hiện CHECK-IN (Bản gia cố ca đêm & múi giờ)
  async checkIn(employeeId: string, shiftId: string, shiftStartTime: string) {
    try {
      const now = new Date();
      let workDate = helpers.getVNDateString(now);
      
      const [shiftH] = shiftStartTime.split(':').map(Number);
      let expectedStart = helpers.parseTimeToDate(shiftStartTime, now);

      // --- NGHIỆP VỤ CA ĐÊM: QUAN TRỌNG ---
      // Nếu check-in vào rạng sáng (00h - 05h) cho một ca bắt đầu từ tối hôm trước (vd: 22h)
      if (now.getHours() < 6 && shiftH >= 20) {
        // Lùi mốc thời gian kỳ vọng lại 1 ngày
        expectedStart.setDate(expectedStart.getDate() - 1);
        // Ghi nhận ngày làm việc (work_date) là ngày hôm trước
        workDate = helpers.getVNDateString(expectedStart);
      }

      // --- LOGIC TÍNH PHÚT ĐI MUỘN ---
      // Chỉ tính muộn nếu đến sau giờ bắt đầu
      const lateMinutes = now > expectedStart 
        ? Math.floor((now.getTime() - expectedStart.getTime()) / 60000) 
        : 0;

      // --- INSERT VÀO DATABASE ---
      const { data, error } = await supabase
        .from('attendance')
        .insert([{
          employee_id: employeeId,
          shift_id: shiftId,
          work_date: workDate,
          check_in: now.toISOString(),
          late_minutes: lateMinutes,
          status: 'present'
        }])
        .select().single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // 4. Thực hiện CHECK-OUT (Bản gia cố ca đêm)
  async checkOut(attendanceId: string, shiftEndTime: string) {
    try {
      const now = new Date();
      
      // Lấy thông tin check-in để biết work_date chính xác
      const { data: att } = await supabase
        .from('attendance')
        .select('check_in')
        .eq('id', attendanceId)
        .single();
      
      if (!att) throw new Error("Không tìm thấy dữ liệu check-in.");

      const checkInTime = new Date(att.check_in);
      const [endH, endM] = shiftEndTime.split(':').map(Number);
      let expectedEnd = new Date(checkInTime);
      expectedEnd.setHours(endH, endM, 0, 0);

      // --- LOGIC CA ĐÊM: QUAN TRỌNG ---
      // Nếu ca làm việc xuyên đêm (Giờ ra < Giờ vào) -> Giờ ra phải thuộc ngày hôm sau
      if (endH < checkInTime.getHours()) {
        expectedEnd.setDate(expectedEnd.getDate() + 1);
      }

      // --- LOGIC TÍNH PHÚT VỀ SỚM ---
      const earlyMinutes = now < expectedEnd 
        ? Math.floor((expectedEnd.getTime() - now.getTime()) / 60000) 
        : 0;

      const { error } = await supabase
        .from('attendance')
        .update({ 
          check_out: now.toISOString(), 
          early_minutes: earlyMinutes 
        })
        .eq('id', attendanceId);

      return { success: !error, error: error?.message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // 5. Lấy lịch sử chấm công tháng này
  async getMyHistory(employeeId: string, month: number, year: number) {
    const start = `${year}-${month.toString().padStart(2, '0')}-01`;
    // Tính ngày cuối tháng động
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;

    const { data, error } = await supabase
      .from('attendance')
      .select('*, shifts(id, name, start_time, end_time)')
      .eq('employee_id', employeeId)
      .gte('work_date', start).lte('work_date', end)
      .order('work_date', { ascending: false });
    
    return { success: !error, data, error: error?.message };
  }
};