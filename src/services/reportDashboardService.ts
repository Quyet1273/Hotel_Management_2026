import { supabase } from "../lib/supabase";
import {
  eachDayOfInterval,
  format,
  parseISO,
  differenceInDays,
  subDays,
} from "date-fns";
import { vi } from "date-fns/locale";

export const reportService = {
  // 1. NÂNG CẤP: Lấy chỉ số Tài chính & Hiệu suất (Occupancy, ADR)
  async getFinancialStats(startDate: string, endDate: string) {
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      // Tính số ngày chênh lệch để lùi kỳ trước chính xác (ví dụ chọn 7 ngày thì lùi đúng 7 ngày)
      const daysDiff = differenceInDays(end, start) + 1;

      const prevEndDate = start.toISOString();
      const prevStartDate = subDays(start, daysDiff).toISOString();

      // Query song song dữ liệu 2 kỳ: Invoices (Doanh thu), Expenses (Chi phí), Bookings (Công suất)
      const [
        currInv,
        currExp,
        currBook,
        prevInv,
        prevExp,
        prevBook,
        roomsCount,
      ] = await Promise.all([
        supabase
          .from("invoices")
          .select("total_amount")
          .gte("created_at", startDate)
          .lte("created_at", endDate),
        supabase
          .from("expenses")
          .select("amount")
          .gte("created_at", startDate)
          .lte("created_at", endDate),
        supabase
          .from("bookings")
          .select("id")
          .gte("check_in_date", startDate)
          .lte("check_in_date", endDate),
        supabase
          .from("invoices")
          .select("total_amount")
          .gte("created_at", prevStartDate)
          .lt("created_at", prevEndDate),
        supabase
          .from("expenses")
          .select("amount")
          .gte("created_at", prevStartDate)
          .lt("created_at", prevEndDate),
        supabase
          .from("bookings")
          .select("id")
          .gte("check_in_date", prevStartDate)
          .lt("check_in_date", prevEndDate),
        supabase.from("rooms").select("id", { count: "exact", head: true }),
      ]);

      const totalRooms = roomsCount.count || 1;

      // Tính toán kỳ hiện tại
      const totalRevenue =
        currInv.data?.reduce(
          (sum, inv) => sum + (Number(inv.total_amount) || 0),
          0,
        ) || 0;
      const totalExpense =
        currExp.data?.reduce(
          (sum, exp) => sum + (Number(exp.amount) || 0),
          0,
        ) || 0;
      const occupancyRate = Number(
        (
          ((currBook.data?.length || 0) / (totalRooms * daysDiff)) *
          100
        ).toFixed(1),
      );

      // Tính toán kỳ trước
      const prevRevenue =
        prevInv.data?.reduce(
          (sum, inv) => sum + (Number(inv.total_amount) || 0),
          0,
        ) || 0;
      const prevExpense =
        prevExp.data?.reduce(
          (sum, exp) => sum + (Number(exp.amount) || 0),
          0,
        ) || 0;
      const prevOccupancy = Number(
        (
          ((prevBook.data?.length || 0) / (totalRooms * daysDiff)) *
          100
        ).toFixed(1),
      );

      // Hàm tính % tăng trưởng
      const calcTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Number((((current - previous) / previous) * 100).toFixed(1));
      };

      return {
        success: true,
        data: {
          totalRevenue,
          revenueTrend: calcTrend(totalRevenue, prevRevenue),
          totalExpense,
          expenseTrend: calcTrend(totalExpense, prevExpense),
          profit: totalRevenue - totalExpense,
          profitTrend: calcTrend(
            totalRevenue - totalExpense,
            prevRevenue - prevExpense,
          ),
          occupancyRate,
          occupancyTrend: calcTrend(occupancyRate, prevOccupancy),
          bookingCount: currBook.data?.length || 0,
          bookingTrend: calcTrend(
            currBook.data?.length || 0,
            prevBook.data?.length || 0,
          ),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // 2. GIỮ NGUYÊN: Lấy trạng thái phòng thời gian thực (Real-time snapshot)
  async getRoomStats() {
    try {
      const { data: rooms, error } = await supabase
        .from("rooms")
        .select("status");
      if (error) throw error;
      const totalRooms = rooms?.length || 0;
      const occupiedRooms =
        rooms?.filter((r) => r.status === "occupied").length || 0;
      const dirtyRooms =
        rooms?.filter((r) => r.status === "dirty" || r.status === "cleaning")
          .length || 0;
      const occupancyRate =
        totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
      return {
        success: true,
        data: { totalRooms, occupiedRooms, dirtyRooms, occupancyRate },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // 3. BỔ SUNG: Lấy giao dịch có lọc theo ngày (Để đồng bộ với nút Áp dụng)
  async getRecentTransactions(startDate?: string, endDate?: string) {
    try {
      let invQuery = supabase
        .from("invoices")
        .select("id, total_amount, created_at, guests(full_name)")
        .order("created_at", { ascending: false })
        .limit(10);
      let expQuery = supabase
        .from("expenses")
        .select("id, amount, description, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (startDate && endDate) {
        invQuery = invQuery
          .gte("created_at", startDate)
          .lte("created_at", endDate);
        expQuery = expQuery
          .gte("created_at", startDate)
          .lte("created_at", endDate);
      }

      const [invoices, expenses] = await Promise.all([invQuery, expQuery]);

      const combined = [
        ...(invoices.data?.map((i: any) => ({
          id: i.id,
          type: "INCOME",
          title: `Hóa đơn: ${i.guests?.full_name || "Khách lẻ"}`,
          amount: Number(i.total_amount) || 0,
          date: i.created_at,
        })) || []),
        ...(expenses.data?.map((e: any) => ({
          id: e.id,
          type: "EXPENSE",
          title: e.description || "Chi phí",
          amount: Number(e.amount) || 0,
          date: e.created_at,
        })) || []),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8);

      return { success: true, data: combined };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // 4. Lấy dữ liệu Dòng tiền chi tiết theo từng ngày (Dùng để vẽ AreaChart)
  async getFinancialTimeSeriesData(startDateISO: string, endDateISO: string) {
    try {
      // Lấy data thu và chi trong khoảng thời gian
      const [invRes, expRes] = await Promise.all([
        supabase
          .from("invoices")
          .select("total_amount, created_at")
          .gte("created_at", startDateISO)
          .lte("created_at", endDateISO),
        supabase
          .from("expenses")
          .select("amount, created_at")
          .gte("created_at", startDateISO)
          .lte("created_at", endDateISO),
      ]);

      if (invRes.error) throw invRes.error;
      if (expRes.error) throw expRes.error;

      // Tạo một dải ngày liên tục để đảm bảo biểu đồ không bị đứt quãng
      const datesInRange = eachDayOfInterval({
        start: parseISO(startDateISO),
        end: parseISO(endDateISO),
      });

      const dailyDataMap = new Map();
      datesInRange.forEach((date) => {
        const dateStr = format(date, "yyyy-MM-dd"); // Key để map trùng ngày
        const dateDisplay = format(date, "dd/MM", { locale: vi }); // Nhãn trục X
        dailyDataMap.set(dateStr, {
          name: dateDisplay,
          revenue: 0,
          expense: 0,
        });
      });

      // Cộng dồn Doanh thu vào đúng ngày
      invRes.data?.forEach((inv) => {
        const dateKey = inv.created_at.split("T")[0];
        if (dailyDataMap.has(dateKey)) {
          const current = dailyDataMap.get(dateKey);
          current.revenue += Number(inv.total_amount) || 0;
        }
      });

      // Cộng dồn Chi phí vào đúng ngày
      expRes.data?.forEach((exp) => {
        const dateKey = exp.created_at.split("T")[0];
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
  },
};
