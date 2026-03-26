import { supabase } from '../lib/supabase';
import { eachDayOfInterval, format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

export const reportService = {
  // 1. Lấy chỉ số Tài chính (Doanh thu, Chi phí, Lợi nhuận) trong khoảng thời gian
  async getFinancialStats(startDate: string, endDate: string) {
    try {
      // Tính Tổng Doanh Thu từ hóa đơn (invoices)
      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('total_amount')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (invError) throw invError;
      const totalRevenue = invoices?.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0) || 0;

      // Tính Tổng Chi Phí (expenses)
      const { data: expenses, error: expError } = await supabase
        .from('expenses')
        .select('amount')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (expError) throw expError;
      const totalExpense = expenses?.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0;

      // Lợi nhuận gộp
      const profit = totalRevenue - totalExpense;

      return { success: true, data: { totalRevenue, totalExpense, profit } };
    } catch (error: any) {
      console.error("Lỗi getFinancialStats:", error.message);
      return { success: false, error: error.message };
    }
  },

  // 2. Lấy Công suất phòng & Tình trạng phòng hiện tại
  async getRoomStats() {
    try {
      const { data: rooms, error } = await supabase
        .from('rooms')
        .select('status');

      if (error) throw error;

      const totalRooms = rooms?.length || 0;
      const occupiedRooms = rooms?.filter(r => r.status === 'occupied').length || 0;
      const dirtyRooms = rooms?.filter(r => r.status === 'dirty' || r.status === 'cleaning').length || 0;
      
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      return { 
        success: true, 
        data: { totalRooms, occupiedRooms, dirtyRooms, occupancyRate } 
      };
    } catch (error: any) {
      console.error("Lỗi getRoomStats:", error.message);
      return { success: false, error: error.message };
    }
  },

  // 3. Lấy 5 Giao dịch Thu/Chi mới nhất để hiện lên Dashboard
  async getRecentTransactions() {
    try {
      // Lấy 5 hóa đơn mới nhất (Thu)
      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('id, total_amount, created_at, guests(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      if (invError) throw invError;

      // Lấy 5 khoản chi mới nhất (Chi)
      const { data: expenses, error: expError } = await supabase
        .from('expenses')
        .select('id, amount, description, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (expError) throw expError;

      // Gộp 2 mảng, format chung 1 kiểu và sắp xếp theo ngày gần nhất
      const combined = [
        ...(invoices?.map((i: any) => {
          // Ép kiểu (i: any) và check mảng để chiều lòng TypeScript
          const guestName = Array.isArray(i.guests) 
            ? i.guests[0]?.full_name 
            : i.guests?.full_name;

          return {
            id: i.id,
            type: 'INCOME',
            title: `Hóa đơn: ${guestName || 'Khách lẻ'}`,
            amount: Number(i.total_amount) || 0,
            date: i.created_at
          };
        }) || []),
        ...(expenses?.map((e: any) => ({
          id: e.id,
          type: 'EXPENSE',
          title: e.description || 'Chi phí',
          amount: Number(e.amount) || 0,
          date: e.created_at
        })) || [])
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

      return { success: true, data: combined };
    } catch (error: any) {
      console.error("Lỗi getRecentTransactions:", error.message);
      return { success: false, error: error.message };
    }
  },

  // 4. Lấy dữ liệu Dòng tiền chi tiết theo từng ngày (Dùng để vẽ AreaChart)
  async getFinancialTimeSeriesData(startDateISO: string, endDateISO: string) {
    try {
      // Lấy data thu và chi trong khoảng thời gian
      const [invRes, expRes] = await Promise.all([
        supabase
          .from('invoices')
          .select('total_amount, created_at')
          .gte('created_at', startDateISO)
          .lte('created_at', endDateISO),
        supabase
          .from('expenses')
          .select('amount, created_at')
          .gte('created_at', startDateISO)
          .lte('created_at', endDateISO)
      ]);

      if (invRes.error) throw invRes.error;
      if (expRes.error) throw expRes.error;

      // Tạo một dải ngày liên tục để đảm bảo biểu đồ không bị đứt quãng
      const datesInRange = eachDayOfInterval({
        start: parseISO(startDateISO),
        end: parseISO(endDateISO)
      });

      const dailyDataMap = new Map();
      datesInRange.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd'); // Key để map trùng ngày
        const dateDisplay = format(date, 'dd/MM', { locale: vi }); // Nhãn trục X
        dailyDataMap.set(dateStr, { name: dateDisplay, revenue: 0, expense: 0 });
      });

      // Cộng dồn Doanh thu vào đúng ngày
      invRes.data?.forEach(inv => {
        const dateKey = inv.created_at.split('T')[0];
        if (dailyDataMap.has(dateKey)) {
          const current = dailyDataMap.get(dateKey);
          current.revenue += Number(inv.total_amount) || 0;
        }
      });

      // Cộng dồn Chi phí vào đúng ngày
      expRes.data?.forEach(exp => {
        const dateKey = exp.created_at.split('T')[0];
        if (dailyDataMap.has(dateKey)) {
          const current = dailyDataMap.get(dateKey);
          current.expense += Number(exp.amount) || 0;
        }
      });

      // Chuyển Map thành mảng cho Recharts
      const chartData = Array.from(dailyDataMap.values());
      return { success: true, data: chartData };
    } catch (error: any) {
      console.error("Lỗi getFinancialTimeSeriesData:", error.message);
      return { success: false, error: error.message };
    }
  }
};