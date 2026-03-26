import { useState, useEffect } from 'react';
import {
  CircleDollarSign, Search, Calendar, Eye, X, Loader2, Star, Clock, ArrowRight,
  MapPin, LogIn, LogOut, CheckCircle2, History, UserCheck, Briefcase, Moon, CloudMoon, Sun
} from 'lucide-react';
import { payrollService, attendanceService } from '../services/payrollService';
// import { attendanceService } from '../services/attendanceService';
import { supabase } from '../lib/supabase'; // IMPORT SUPABASE ĐỂ CHECK SESSION
import { toast } from 'sonner';

export function PayrollManagement() {
  // === STATE TỔNG QUAN & AUTH ===
  const [activeTab, setActiveTab] = useState<'attendance' | 'payroll'>('attendance');
  
  // Lưu thông tin người đang đăng nhập
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(true);

  // === STATE CHO QUẢN LÝ LƯƠNG ===
  const [payroll, setPayroll] = useState<any[]>([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  // === STATE CHO CHẤM CÔNG ===
  const [currentTime, setCurrentTime] = useState(new Date());
  const [shifts, setShifts] = useState<any[]>([]);
  const [selectedShift, setSelectedShift] = useState("");
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  // ==========================================
  // 1. KIỂM TRA ĐĂNG NHẬP & PHÂN QUYỀN
  // ==========================================
  useEffect(() => {
    const checkAuth = async () => {
      setAuthLoading(true);
      try {
        // Lấy session từ Supabase
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // ID của user Auth chính là employee_id
          setCurrentEmployeeId(session.user.id);
          
          // Truy vấn thêm role từ bảng employees để phân quyền
          const { data: empData } = await supabase
            .from('employees')
            .select('role')
            .eq('id', session.user.id)
            .single();
            
          if (empData) {
            setCurrentUserRole(empData.role);
          }
        } else {
          toast.error("Vui lòng đăng nhập để sử dụng chức năng này.");
        }
      } catch (error) {
        console.error("Lỗi xác thực:", error);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Cập nhật đồng hồ mỗi giây
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ==========================================
  // 2. LOGIC CHẤM CÔNG NHÂN VIÊN
  // ==========================================
  const fetchAttendanceData = async () => {
    if (!currentEmployeeId) return;
    setLoadingAttendance(true);
    
    const shiftsRes = await attendanceService.getShifts();
    if (shiftsRes.success && shiftsRes.data) {
      setShifts(shiftsRes.data);
      if (shiftsRes.data.length > 0) setSelectedShift(shiftsRes.data[0].id);
    }

    const statusRes = await attendanceService.getTodayStatus(currentEmployeeId);
    if (statusRes.success) setTodayRecord(statusRes.data);

    const currentMonth = new Date().getMonth() + 1;
    const historyRes = await attendanceService.getMyHistory(currentEmployeeId, currentMonth, 2026);
    if (historyRes.success) setAttendanceHistory(historyRes.data || []);
    
    setLoadingAttendance(false);
  };

  useEffect(() => {
    if (activeTab === 'attendance' && currentEmployeeId) {
      fetchAttendanceData();
    }
  }, [activeTab, currentEmployeeId]);

  const handleCheckIn = async () => {
    if (!currentEmployeeId) return;
    const shift = shifts.find(s => s.id === selectedShift);
    if (!shift) return toast.error("Vui lòng chọn ca làm việc!");
    
    const res = await attendanceService.checkIn(currentEmployeeId, shift.id, shift.start_time);
    if (res.success) {
      toast.success("Bắt đầu ca thành công! Chúc bạn làm việc hiệu quả.");
      fetchAttendanceData();
    } else toast.error("Lỗi Check-in: " + res.error);
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return;
    const res = await attendanceService.checkOut(todayRecord.id, todayRecord.shifts.end_time);
    if (res.success) {
      toast.success("Kết thúc ca thành công! Nghỉ ngơi tốt nhé.");
      fetchAttendanceData();
    } else toast.error("Lỗi Check-out: " + res.error);
  };

  // ==========================================
  // 3. LOGIC QUẢN LÝ LƯƠNG
  // ==========================================
  const fetchPayrollData = async () => {
    setLoadingPayroll(true);
    const res = await payrollService.getPayrollByMonth(month, 2026);
    if (res.success) setPayroll(res.data || []);
    else toast.error("Không thể tải bảng lương: " + res.error);
    setLoadingPayroll(false);
  };

  useEffect(() => {
    if (activeTab === 'payroll' && currentEmployeeId) {
      fetchPayrollData();
    }
  }, [month, activeTab, currentEmployeeId]);

  const handlePaySalary = async (staff: any) => {
    const confirmPay = window.confirm(`Xác nhận thanh toán lương tháng ${month} cho ${staff.fullName}?\nSố tiền: ${formatCurrency(staff.total_salary)}`);
    if (!confirmPay) return;

    const res = await payrollService.processSalaryPayment({
      employee_id: staff.employee_id,
      fullName: staff.fullName,
      month: month,
      year: 2026,
      amount: staff.total_salary,
      work_days: staff.work_days
    });

    if (res.success) {
      toast.success(`Đã thanh toán lương cho ${staff.fullName} và tạo phiếu chi!`);
      fetchPayrollData();
    } else toast.error("Lỗi thanh toán: " + res.error);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const filteredPayroll = payroll.filter(p => p.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

  // ==========================================
  // MÀN HÌNH LOADING & CHẶN TRUY CẬP
  // ==========================================
  if (authLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={48} color="#4f46e5" />
        <p style={{ marginTop: '16px', color: '#64748b', fontWeight: 'bold' }}>Đang xác thực thông tin...</p>
      </div>
    );
  }

  if (!currentEmployeeId) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', backgroundColor: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
        <h2 style={{ color: '#ef4444', marginBottom: '8px' }}>Phiên đăng nhập không hợp lệ!</h2>
        <p style={{ color: '#64748b' }}>Vui lòng đăng nhập vào hệ thống để sử dụng tính năng Chấm công & Lương.</p>
      </div>
    );
  }

  // ==========================================
  // RENDER UI CHÍNH
  // ==========================================
  // Logic kiểm tra Quản lý (Có thể điều chỉnh mảng role này tùy theo DB của bác)
  const isManager = [ 'admin'].includes(currentUserRole.toLowerCase());

  return (
    <div style={{ paddingBottom: '40px', display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'sans-serif' }}>
      
      {/* HEADER CHUNG */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
        borderRadius: '2rem',
        padding: '32px',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.2)'
      }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '200px', height: '200px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative', zIndex: 10 }}>
          <div style={{ width: '56px', height: '56px', backgroundColor: 'rgba(255, 255, 255, 0.2)', backdropFilter: 'blur(10px)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 255, 255, 0.3)' }}>
            <UserCheck size={32} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, textTransform: 'uppercase' }}>Nhân Sự & Tiền Lương</h1>
            <p style={{ fontSize: '12px', color: '#e0e7ff', margin: '4px 0 0 0', opacity: 0.8 }}>Hệ thống quản lý tự động HotelPro</p>
          </div>
        </div>
      </div>

      {/* TABS ĐIỀU HƯỚNG (Chỉ hiện tab Bảng Lương nếu là Quản lý) */}
      <div style={{ display: 'flex', gap: '12px', backgroundColor: '#f1f5f9', padding: '6px', borderRadius: '16px', width: 'fit-content' }}>
        <button 
          onClick={() => setActiveTab('attendance')}
          style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: activeTab === 'attendance' ? '#ffffff' : 'transparent', color: activeTab === 'attendance' ? '#4f46e5' : '#64748b', boxShadow: activeTab === 'attendance' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none' }}
        >
          <Clock size={18} /> Chấm Công
        </button>
        
        {isManager && (
          <button 
            onClick={() => setActiveTab('payroll')}
            style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: activeTab === 'payroll' ? '#ffffff' : 'transparent', color: activeTab === 'payroll' ? '#4f46e5' : '#64748b', boxShadow: activeTab === 'payroll' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none' }}
          >
            <Briefcase size={18} /> Quản Lý Lương
          </button>
        )}
      </div>

      {/* ========================================= */}
      {/* TAB 1: GIAO DIỆN CHẤM CÔNG CỦA NHÂN VIÊN */}
      {/* ========================================= */}
      {activeTab === 'attendance' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          {/* KHU VỰC BẤM GIỜ (HERO) */}
          <div style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', borderRadius: '2rem', padding: '40px 24px', color: '#ffffff', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(37, 99, 235, 0.2)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
            <p style={{ fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8, margin: '0 0 10px 0' }}>
              {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <h1 style={{ fontSize: '64px', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '-2px', textShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
              {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0.9, marginBottom: '32px' }}>
              <MapPin size={16} /> <span style={{ fontSize: '14px' }}>HotelPro - Chi nhánh Trung tâm</span>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '1.5rem', color: '#1e293b', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', position: 'relative', zIndex: 10 }}>
              {loadingAttendance ? <p style={{ color: '#64748b' }}>Đang tải...</p> : !todayRecord ? (
                <>
                 <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px', display: 'block' }}>
                    Chọn ca làm việc hôm nay
                  </label>
                  
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
  {(shifts && shifts.length > 0 ? shifts : [
    { id: '79fab619-8d9b-4f13-8816-2c38f5a56c97', name: 'Ca sáng', start_time: '06:00:00', end_time: '14:00:00' },
    { id: '58863c42-d915-4828-acb9-75433c62ef53', name: 'Ca tối', start_time: '14:00:00', end_time: '22:00:00' },
    { id: '4c44b227-b880-4651-940a-496be6e82f12', name: 'Ca đêm', start_time: '22:00:00', end_time: '06:00:00' }
  ]).map((s) => {
    const isSelected = selectedShift === s.id;
    const isNight = s.name.toLowerCase().includes('đêm');
    const isEvening = s.name.toLowerCase().includes('tối') || s.name.toLowerCase().includes('chiều');
    
    // Đảm bảo không lỗi nếu start_time/end_time bị null
    const startTime = s.start_time?.slice(0, 5) || '--:--';
    const endTime = s.end_time?.slice(0, 5) || '--:--';

    return (
      <div 
        key={s.id}
        onClick={() => setSelectedShift(s.id)}
        style={{
          padding: '16px 8px',
          borderRadius: '16px',
          border: `2px solid ${isSelected ? '#10b981' : '#f1f5f9'}`,
          backgroundColor: isSelected ? '#ecfdf5' : '#ffffff',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          boxShadow: isSelected ? '0 10px 15px -3px rgba(16, 185, 129, 0.1)' : 'none',
          transform: isSelected ? 'translateY(-2px)' : 'none'
        }}
      >
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isSelected ? '#10b981' : '#f8fafc',
          color: isSelected ? '#ffffff' : '#94a3b8',
          transition: 'all 0.2s'
        }}>
          {isNight ? <Moon size={22} /> : isEvening ? <CloudMoon size={22} /> : <Sun size={22} />}
        </div>
        
        <div>
          <p style={{ 
            margin: 0, 
            fontSize: '14px', 
            fontWeight: '800', 
            color: isSelected ? '#065f46' : '#1e293b',
            whiteSpace: 'nowrap'
          }}>
            {s.name}
          </p>
          <p style={{ 
            margin: 0, 
            fontSize: '11px', 
            color: isSelected ? '#059669' : '#94a3b8', 
            fontWeight: '600',
            marginTop: '2px'
          }}>
            {startTime} - {endTime}
          </p>
        </div>
      </div>
    );
  })}
</div>
                  </div>
                  <button onClick={handleCheckIn} style={{ width: '100%', padding: '16px', background: 'linear-gradient(to right, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textTransform: 'uppercase' }}>
                    <LogIn size={20} /> Bắt đầu ca làm việc
                  </button>
                </>
              ) : !todayRecord.check_out ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#059669', marginBottom: '16px', fontWeight: 'bold' }}>
                    <CheckCircle2 size={20} /> Đã vào ca lúc {new Date(todayRecord.check_in).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Ca hiện tại: <strong>{todayRecord.shifts?.name}</strong></p>
                  <button onClick={handleCheckOut} style={{ width: '100%', padding: '16px', background: 'linear-gradient(to right, #f43f5e, #e11d48)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textTransform: 'uppercase' }}>
                    <LogOut size={20} /> Kết thúc ca (Tan làm)
                  </button>
                </>
              ) : (
                <div style={{ padding: '10px 0' }}>
                  <div style={{ width: '64px', height: '64px', backgroundColor: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><CheckCircle2 size={32} color="#10b981" /></div>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#0f172a' }}>Hoàn thành ngày công</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Check-out lúc {new Date(todayRecord.check_out).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
              )}
            </div>
          </div>

          {/* LỊCH SỬ CÁ NHÂN */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '1.5rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <History size={20} color="#4f46e5" />
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Lịch sử chấm công tháng này</h2>
            </div>
            <div style={{ padding: '16px' }}>
              {attendanceHistory.length === 0 ? <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>Chưa có dữ liệu.</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {attendanceHistory.map((log) => (
                    <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', backgroundColor: '#ffffff', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', lineHeight: 1 }}>{new Date(log.work_date).getDate()}</span>
                          <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8' }}>T{new Date(log.work_date).getMonth() + 1}</span>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{log.shifts?.name}</p>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{log.shifts?.start_time?.slice(0,5)} - {log.shifts?.end_time?.slice(0,5)}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '700' }}>
                          <span style={{ color: '#94a3b8', fontSize: '10px', marginRight: '4px' }}>VÀO:</span>
                          <span style={{ color: log.late_minutes > 0 ? '#f59e0b' : '#10b981' }}>{log.check_in ? new Date(log.check_in).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span>
                        </p>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '700' }}>
                          <span style={{ color: '#94a3b8', fontSize: '10px', marginRight: '4px' }}>RA:</span>
                          <span style={{ color: log.early_minutes > 0 ? '#f43f5e' : '#10b981' }}>{log.check_out ? new Date(log.check_out).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* TAB 2: GIAO DIỆN QUẢN LÝ LƯƠNG */}
      {/* ========================================= */}
      {activeTab === 'payroll' && isManager && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* TỔNG QUỸ LƯƠNG */}
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '1.5rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Tổng quỹ lương tháng {month}</p>
              <p style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: 0 }}>{formatCurrency(payroll.reduce((sum, p) => sum + p.total_salary, 0))}</p>
            </div>
            <div style={{ width: '64px', height: '64px', backgroundColor: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircleDollarSign size={32} color="#16a34a" />
            </div>
          </div>

          {/* FILTERS */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <div style={{ backgroundColor: '#ffffff', padding: '8px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={18} color="#4f46e5" />
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} style={{ border: 'none', outline: 'none', fontWeight: '700', color: '#334155', fontSize: '14px', cursor: 'pointer' }}>
                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>Tháng {i+1} / 2026</option>)}
              </select>
            </div>
            <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
              <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
              <input type="text" placeholder="Tìm tên nhân viên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 16px 12px 48px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', outline: 'none', fontSize: '14px', fontWeight: '600', color: '#1e293b', boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* BẢNG LƯƠNG */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '1.5rem', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    {['Nhân viên', 'Ngày công', 'Lương cơ bản', 'Chuyên cần', 'Thực lĩnh', 'Thao tác'].map((head, i) => (
                      <th key={i} style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingPayroll ? (
                    <tr><td colSpan={6} style={{ padding: '60px', textAlign: 'center' }}><Loader2 className="animate-spin" style={{ margin: '0 auto', color: '#4f46e5' }} size={32} /></td></tr>
                  ) : filteredPayroll.map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{p.fullName}</div>
                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#4f46e5', textTransform: 'uppercase' }}>{p.roleName}</div>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', backgroundColor: p.work_days >= 26 ? '#ecfdf5' : '#fffbeb', color: p.work_days >= 26 ? '#059669' : '#d97706' }}>
                          {p.work_days} <span style={{ opacity: 0.5 }}>/ 26</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', color: '#475569', fontWeight: '500' }}>{formatCurrency(p.base_salary)}</td>
                      <td style={{ padding: '16px 24px' }}>
                        {p.diligence_bonus > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: 'bold', fontSize: '12px' }}>
                            <Star size={12} fill="#059669" /> +{formatCurrency(p.diligence_bonus)}
                          </div>
                        ) : <span style={{ color: '#cbd5e1', fontSize: '11px' }}>Không đạt</span>}
                      </td>
                      <td style={{ padding: '16px 24px', fontWeight: '800', color: '#4f46e5', fontSize: '16px' }}>{formatCurrency(p.total_salary)}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button onClick={() => setSelectedStaff(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><Eye size={18} /></button>
                          <button onClick={() => handlePaySalary(p)} style={{ padding: '8px 16px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>Thanh toán</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MODAL CHI TIẾT */}
          {selectedStaff && (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
              <div style={{ backgroundColor: '#fff', borderRadius: '2rem', maxWidth: '600px', width: '100%', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <div style={{ padding: '24px', background: '#4f46e5', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Clock size={24} />
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px' }}>Nhật ký chấm công</h3>
                      <p style={{ margin: 0, fontSize: '10px', opacity: 0.8 }}>{selectedStaff.fullName} • Tháng {month}/2026</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedStaff(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                <div style={{ padding: '24px', overflowY: 'auto', backgroundColor: '#f8fafc', flex: 1 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>TỔNG CÔNG</p>
                      <p style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#10b981' }}>{selectedStaff.work_days}</p>
                    </div>
                    <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>ĐI MUỘN</p>
                      <p style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#f59e0b' }}>{selectedStaff.total_late}p</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedStaff.dailyLogs?.map((log: any, i: number) => (
                      <div key={i} style={{ backgroundColor: '#fff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', backgroundColor: '#f1f5f9', borderRadius: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: '900' }}>{new Date(log.date).getDate()}</span>
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>{log.shiftName}</p>
                            <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>{log.shiftTime}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'right' }}>
                          <div>
                            <span style={{ fontSize: '9px', color: '#cbd5e1', fontWeight: 'bold' }}>VÀO: </span>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: log.late > 0 ? '#f59e0b' : '#10b981' }}>{log.checkIn}</span>
                          </div>
                          <ArrowRight size={14} color="#e2e8f0" />
                          <div>
                            <span style={{ fontSize: '9px', color: '#cbd5e1', fontWeight: 'bold' }}>RA: </span>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: log.early > 0 ? '#f43f5e' : '#10b981' }}>{log.checkOut}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}