import { supabase } from '../lib/supabase';

/**
 * UTILS: Xử lý thời gian chuẩn Việt Nam
 */
const helpers = {
  // Lấy chuỗi YYYY-MM-DD chuẩn VN
  getVNDateString: (date: Date = new Date()) => {
    return new Intl.DateTimeFormat('en-CA', { 
      timeZone: 'Asia/Ho_Chi_Minh' 
    }).format(date);
  },

  // Chuyển "HH:mm:ss" thành Date object theo ngày chỉ định
  parseTimeToDate: (timeStr: string, baseDate: Date) => {
    const [h, m, s] = timeStr.split(':').map(Number);
    const d = new Date(baseDate);
    d.setHours(h, m, s || 0, 0);
    return d;
  }
};

/**
 * SERVICE CHẤM CÔNG
 */
export const attendanceService = {
  // 1. Lấy danh sách ca làm việc
  async getShifts() {
    const { data, error } = await supabase.from('shifts').select('*').order('start_time');
    return { success: !error, data, error: error?.message };
  },

  // 2. TỰ ĐỘNG GỢI Ý CA LÀM VIỆC (Auto-select logic)
  autoSelectShift(shifts: any[]) {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Tìm ca phù hợp nhất (Giờ hiện tại gần giờ bắt đầu ca nhất trong khoảng +/- 3h)
    return shifts.find(shift => {
      const [shiftH] = shift.start_time.split(':').map(Number);
      // Xử lý ca đêm (ví dụ ca bắt đầu lúc 22h, giờ hiện tại 23h hoặc 01h sáng)
      if (shiftH >= 20 && (currentHour >= 20 || currentHour <= 4)) return true;
      // Các ca ngày thường
      return Math.abs(currentHour - shiftH) <= 3;
    })?.id || (shifts.length > 0 ? shifts[0].id : "");
  },

  // 3. Kiểm tra trạng thái hôm nay
  async getTodayStatus(employeeId: string) {
    try {
      const today = helpers.getVNDateString();
      const { data, error } = await supabase
        .from('attendance')
        .select('*, shifts(name, start_time, end_time)')
        .eq('employee_id', employeeId)
        .eq('work_date', today)
        .maybeSingle();
      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // 4. CHECK-IN (Bản gia cố ca đêm & đi muộn)
  async checkIn(employeeId: string, shiftId: string, shiftStartTime: string) {
    try {
      const now = new Date();
      let workDate = helpers.getVNDateString(now);
      
      const [shiftH] = shiftStartTime.split(':').map(Number);
      let expectedStart = helpers.parseTimeToDate(shiftStartTime, now);

      // Nghiệp vụ ca đêm: Nếu check-in lúc rạng sáng cho ca tối hôm trước
      if (now.getHours() < 6 && shiftH >= 20) {
        expectedStart.setDate(expectedStart.getDate() - 1);
        workDate = helpers.getVNDateString(expectedStart);
      }

      // Tính phút đi muộn
      const lateMinutes = now > expectedStart 
        ? Math.floor((now.getTime() - expectedStart.getTime()) / 60000) 
        : 0;

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

  // 5. CHECK-OUT (Tính phút về sớm)
  async checkOut(attendanceId: string, shiftEndTime: string) {
    try {
      const now = new Date();
      const { data: att } = await supabase.from('attendance')
        .select('check_in').eq('id', attendanceId).single();
      
      if (!att) throw new Error("Không tìm thấy dữ liệu check-in.");

      const checkInTime = new Date(att.check_in);
      const [endH, endM] = shiftEndTime.split(':').map(Number);
      let expectedEnd = new Date(checkInTime);
      expectedEnd.setHours(endH, endM, 0, 0);

      // Nếu ca xuyên đêm (Giờ ra < Giờ vào) -> Giờ ra thuộc ngày hôm sau
      if (endH < checkInTime.getHours()) {
        expectedEnd.setDate(expectedEnd.getDate() + 1);
      }

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

  async getMyHistory(employeeId: string, month: number, year: number) {
    const start = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;

    const { data, error } = await supabase
      .from('attendance')
      .select('*, shifts(name, start_time, end_time)')
      .eq('employee_id', employeeId)
      .gte('work_date', start).lte('work_date', end)
      .order('work_date', { ascending: false });
    
    return { success: !error, data, error: error?.message };
  }
};

/**
 * SERVICE QUẢN LÝ LƯƠNG
 */
export const payrollService = {
  async getPayrollByMonth(month: number, year: number) {
    try {
      // Lấy NV & Role (Lương, thưởng)
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, fullName, roles!inner(name, base_salary, diligence_bonus)')
        .eq('status', 'active');
      if (empError) throw empError;

      // Tính phạm vi tháng
      const start = `${year}-${month.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const end = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;

      // Lấy toàn bộ chấm công trong tháng
      const { data: attendance, error: attError } = await supabase
        .from('attendance')
        .select('*, shifts(name, start_time, end_time)')
        .gte('work_date', start).lte('work_date', end);
      if (attError) throw attError;

      // Map dữ liệu tính lương
      const processed = employees.map(emp => {
        const staffAtt = attendance.filter(a => a.employee_id === emp.id);
        const workDays = staffAtt.filter(a => a.status === 'present').length;
        const role: any = emp.roles;
        
        // Bonus nếu >= 26 ngày công
        const bonus = workDays >= 26 ? (role.diligence_bonus || 0) : 0;
        const totalSalary = Math.round(((role.base_salary || 0) / 26 * workDays) + bonus);

        return {
          employee_id: emp.id,
          fullName: emp.fullName,
          roleName: role.name,
          work_days: workDays,
          total_salary: totalSalary,
          base_salary: role.base_salary,
          diligence_bonus: bonus,
          dailyLogs: staffAtt.map(a => ({
             date: a.work_date,
             shiftName: a.shifts?.name,
             checkIn: a.check_in,
             checkOut: a.check_out,
             late: a.late_minutes,
             early: a.early_minutes
          })).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        };
      });

      return { success: true, data: processed };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  async processSalaryPayment(payload: any) {
    try {
      // 1. Lưu bảng lương (Status: paid)
      const { data: pData, error: pErr } = await supabase
        .from('payrolls')
        .upsert([{
          employee_id: payload.employee_id,
          month: `${payload.year}-${payload.month.toString().padStart(2, '0')}`,
          total_salary: payload.amount,
          working_days: payload.work_days,
          status: 'paid',
          paid_date: new Date().toISOString()
        }]).select().single();

      if (pErr) throw pErr;

      // 2. Tạo phiếu chi tự động để kế toán theo dõi dòng tiền
      await supabase.from('expenses').insert([{
        description: `Chi lương tháng ${payload.month}/${payload.year} - Nhân viên: ${payload.fullName}`,
        amount: payload.amount,
        category: 'salary',
        payment_method: 'transfer',
        ref_id: pData.id
      }]);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
  getPayrollByRange: async (startDate: string, endDate: string) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        id,
        fullName,
        roles (name, base_salary, diligence_bonus),
        attendance (work_date, check_in, check_out, late_minutes, early_minutes)
      `)
      // Lọc các ngày chấm công nằm trong khoảng 26 -> 25
      .gte('attendance.work_date', startDate)
      .lte('attendance.work_date', endDate);

    if (error) throw error;
    
    // Logic tính toán lương dựa trên data trả về...
    return { success: true, data: data }; 
  } catch (error: any) {
    return { success: false, error: error.message };
  }
},
};