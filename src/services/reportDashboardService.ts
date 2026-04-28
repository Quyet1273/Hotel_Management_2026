import { supabase } from "../lib/supabase";
import {
  eachDayOfInterval,
  format,
  parseISO,
  differenceInDays,
  subDays,
  startOfDay,
  endOfDay,
  eachHourOfInterval,
  isSameDay
} from "date-fns";
import { useState } from "react";
import { vi } from "date-fns/locale";

export const reportService = {
// 1. Lấy chỉ số Tài chính (Đã thêm Giảm giá & Thực thu)
  async getFinancialStats(startDate: string, endDate: string) {
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const daysDiff = differenceInDays(end, start) + 1;

      const prevEndDate = start.toISOString();
      const prevStartDate = subDays(start, daysDiff).toISOString();
      // Reset trang về 1 mỗi khi đổi bộ lọc để tránh lỗi "trang trống"

      const [currInv, currExp, currBook, prevInv, prevExp, prevBook, roomsCount] = await Promise.all([
        // Thêm select discount_amount vào đây
        supabase.from("invoices").select("total_amount, discount_amount").gte("created_at", startDate).lte("created_at", endDate),
        supabase.from("expenses").select("amount").gte("created_at", startDate).lte("created_at", endDate),
        supabase.from("bookings").select("id").gte("check_in_date", startDate).lte("check_in_date", endDate),
        supabase.from("invoices").select("total_amount, discount_amount").gte("created_at", prevStartDate).lt("created_at", prevEndDate),
        supabase.from("expenses").select("amount").gte("created_at", prevStartDate).lt("created_at", prevEndDate),
        supabase.from("bookings").select("id").gte("check_in_date", prevStartDate).lt("check_in_date", prevEndDate),
        supabase.from("rooms").select("id", { count: "exact", head: true }),
      ]);

      const totalRooms = roomsCount.count || 1;

      // Tính toán số liệu kỳ hiện tại
      const totalRevenue = currInv.data?.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0) || 0;
      const totalDiscount = currInv.data?.reduce((sum, inv) => sum + (Number(inv.discount_amount) || 0), 0) || 0;
      const actualRevenue = totalRevenue - totalDiscount; // Doanh thu thực sau giảm giá
      const totalExpense = currExp.data?.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0;
      const occupancyRate = Number((((currBook.data?.length || 0) / (totalRooms * daysDiff)) * 100).toFixed(1));

      // Tính toán số liệu kỳ trước (để so sánh Trend)
      const prevRevenue = prevInv.data?.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0) || 0;
      const prevDiscount = prevInv.data?.reduce((sum, inv) => sum + (Number(inv.discount_amount) || 0), 0) || 0;
      const prevActualRevenue = prevRevenue - prevDiscount;
      const prevExpense = prevExp.data?.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0;
      const prevOccupancy = Number((((prevBook.data?.length || 0) / (totalRooms * daysDiff)) * 100).toFixed(1));

      const calcTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Number((((current - previous) / previous) * 100).toFixed(1));
      };

      return {
        success: true,
        data: {
          totalRevenue, // Doanh thu tạm tính
          revenueTrend: calcTrend(totalRevenue, prevRevenue),
          totalDiscount, // Tổng tiền giảm giá
          discountTrend: calcTrend(totalDiscount, prevDiscount),
          actualRevenue, // Thực thu
          actualRevenueTrend: calcTrend(actualRevenue, prevActualRevenue),
          totalExpense,
          expenseTrend: calcTrend(totalExpense, prevExpense),
          profit: actualRevenue - totalExpense, // Lợi nhuận tính trên thực thu
          profitTrend: calcTrend(actualRevenue - totalExpense, prevActualRevenue - prevExpense),
          occupancyRate,
          occupancyTrend: calcTrend(occupancyRate, prevOccupancy),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
  

  // 2. Trạng thái phòng (Giữ nguyên)
  async getRoomStats() {
    try {
      const { data: rooms, error } = await supabase.from("rooms").select("status");
      if (error) throw error;
      const totalRooms = rooms?.length || 0;
      const occupiedRooms = rooms?.filter((r) => r.status === "occupied").length || 0;
      const dirtyRooms = rooms?.filter((r) => r.status === "dirty" || r.status === "cleaning").length || 0;
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
      return { success: true, data: { totalRooms, occupiedRooms, dirtyRooms, occupancyRate } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // 4. NÂNG CẤP: Lấy dữ liệu biểu đồ (Tự động chuyển đổi Ngày/Giờ)
  async getFinancialTimeSeriesData(startDateISO: string, endDateISO: string) {
    try {
      const start = parseISO(startDateISO);
      const end = parseISO(endDateISO);
      const isTodayView = isSameDay(start, end);

      const [invRes, expRes] = await Promise.all([
        supabase.from("invoices").select("total_amount, created_at").gte("created_at", startDateISO).lte("created_at", endDateISO),
        supabase.from("expenses").select("amount, created_at").gte("created_at", startDateISO).lte("created_at", endDateISO),
      ]);

      const dataMap = new Map();

      if (isTodayView) {
        // CHẾ ĐỘ THEO GIỜ: Tạo 24 mốc giờ cho biểu đồ "Hôm nay"
        const hours = eachHourOfInterval({ start: startOfDay(start), end: endOfDay(start) });
        hours.forEach((hour) => {
          const hourLabel = format(hour, "HH:00");
          dataMap.set(hourLabel, { name: hourLabel, revenue: 0, expense: 0 });
        });

        invRes.data?.forEach((inv) => {
          const hourKey = format(parseISO(inv.created_at), "HH:00");
          if (dataMap.has(hourKey)) dataMap.get(hourKey).revenue += Number(inv.total_amount) || 0;
        });

        expRes.data?.forEach((exp) => {
          const hourKey = format(parseISO(exp.created_at), "HH:00");
          if (dataMap.has(hourKey)) dataMap.get(hourKey).expense += Number(exp.amount) || 0;
        });
      } else {
        // CHẾ ĐỘ THEO NGÀY: Giữ nguyên logic cũ cho 7/30 ngày
        const datesInRange = eachDayOfInterval({ start, end });
        datesInRange.forEach((date) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const dateDisplay = format(date, "dd/MM", { locale: vi });
          dataMap.set(dateStr, { name: dateDisplay, revenue: 0, expense: 0 });
        });

        invRes.data?.forEach((inv) => {
          const dateKey = inv.created_at.split("T")[0];
          if (dataMap.has(dateKey)) dataMap.get(dateKey).revenue += Number(inv.total_amount) || 0;
        });

        expRes.data?.forEach((exp) => {
          const dateKey = exp.created_at.split("T")[0];
          if (dataMap.has(dateKey)) dataMap.get(dateKey).expense += Number(exp.amount) || 0;
        });
      }

      return { success: true, data: Array.from(dataMap.values()) };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

};