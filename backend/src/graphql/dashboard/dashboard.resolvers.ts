import { myContext } from "../../context/context.js";

export const dashboardResolvers = {
  Query: {
    // dashboard istatistik
    getDashboardStats: async (_: any, __: any, { prisma, user }: myContext) => {
      if (!user) throw new Error("Unauthorized. Please login first.");

      const tenantId = user.tenantId;
      const isAdmin = user.role === "SUPER_ADMIN";
      const whereFilter = isAdmin ? {} : { tenantId };

      try {
        const [
          customers,
          staff,
          products,
          appointments,
          appointmentSum,
          salesCount,
          salesSum,
        ] = await Promise.all([
          prisma.customer.count({ where: whereFilter }),
          prisma.staff.count({ where: whereFilter }),
          prisma.product.count({ where: whereFilter }),
          prisma.appointment.count({ where: whereFilter }),

          prisma.appointment.aggregate({
            _sum: { price: true },
            where: { ...whereFilter, status: "COMPLETED" },
          }),

          // 💉 SATIŞ ADEDİ DİKİŞİ
          prisma.sale.count({ where: whereFilter }),

          // 💎 SATIŞ GELİRİ DİKİŞİ (Sales Revenue) 💎
          prisma.sale.aggregate({
            _sum: { totalPrice: true },
            where: whereFilter,
          }),
        ]);

        // 2. ADIM: Veriyi temizle (NaN/Null korumalı) 🩺
        const totalAppRevenue = Number(appointmentSum._sum?.price) || 0;
        const totalProductRevenue = Number(salesSum._sum?.totalPrice) || 0; // 💉 Satış cirosu

        return {
          customerCount: customers,
          staffCount: staff,
          productCount: products,
          appointmentCount: appointments,

          // 💎 FRONTEND'E GİDEN GELİŞMİŞ VERİLER 💎
          appointmentRevenue: totalAppRevenue,
          productRevenue: totalProductRevenue, // Artık 0 değil, pırlanta gibi dolu! ✅
          totalRevenue: totalAppRevenue + totalProductRevenue, // Toplam Klinik Cirosu 💰

          // İstersen satış adedini de dönebilirsin
          salesCount: salesCount,
        };
      } catch (error) {
        console.error("Dashboard Stats Error:", error);
        throw new Error("Failed to fetch clinic statistics.");
      }
    },
    getRecentCustomers: async (
      _: any,
      __: any,
      { user, prisma }: myContext,
    ) => {
      if (!user) throw new Error("Unauthorized.");

      // Sadece kendi kliniğine ait son 3 müşteriyi, kayıt tarihine göre dizip getiriyoruz.
      return await prisma.customer.findMany({
        where: user.role === "SUPER_ADMIN" ? {} : { tenantId: user.tenantId },
        orderBy: { createdAt: "desc" },
        take: 3,
      });
    },
  },
};
