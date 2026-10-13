import { myContext } from "../../context/context.js";
import { forbidden } from "../../lib/errors.js";

export const saleResolvers = {
  Query: {
    // sales
    mySales: async (
      _: any,
      { searchTerm }: any,
      { prisma, user }: myContext,
    ) => {
      if (!user) throw new Error("Not authenticated!");

      const cleanSearch = searchTerm?.trim();
      const searchFilter = cleanSearch
        ? {
            OR: [
              {
                product: {
                  name: { contains: cleanSearch, mode: "insensitive" as const },
                },
              },
              {
                customer: {
                  name: { contains: cleanSearch, mode: "insensitive" as const },
                },
              },
            ],
          }
        : {};

      return await prisma.sale.findMany({
        where: {
          ...(user.role === "SUPER_ADMIN" ? {} : { tenantId: user.tenantId }),
          ...searchFilter,
        },
        include: {
          product: true,
          customer: true,
          tenant: true,
        },
        orderBy: { createdAt: "desc" },
      });
    },
    getSale: async (
      _: any,
      { id }: { id: string },
      { prisma, user }: myContext,
    ) => {
      if (!user) return null;

      const sale = await prisma.sale.findFirst({
        where: {
          id: id,
          ...(user.role !== "SUPER_ADMIN" ? { tenantId: user.tenantId } : {}),
        },
        include: {
          product: true,
          customer: true,
          tenant: true,
        },
      });
      return sale;
    },
  },
  Mutation: {
    // sales
    createSale: async (
      _: any,
      { input }: any,
      { prisma, user, io }: myContext,
    ) => {
      if (!user) throw new Error("Authentication required.");

      const { quantity, totalPrice, customerId, productId } = input;

      const targetTenantId =
        user.role === "SUPER_ADMIN" ? input.tenantId : user.tenantId;

      if (!targetTenantId)
        throw new Error("Target tenant ID is required for this operation.");

      return await prisma.$transaction(async (tx: any) => {
        // A- ürünü sadece bu klinikte ara
        const product = await tx.product.findFirst({
          where: { id: productId, tenantId: targetTenantId },
        });

        if (!product) throw forbidden("product not found or access denied.");

        if (product.stock < quantity)
          throw new Error(
            `Insufficient stock! Only ${product.stock} left in storage`,
          );

        // müşteri gönderildiyse, bu klinikte ve silinmemiş olmalı.
        if (customerId) {
          const customer = await tx.customer.findFirst({
            where: {
              id: customerId,
              tenantId: targetTenantId,
              deletedAt: null,
            },
          });

          if (!customer) throw forbidden("Customer not found or access denied");
        }
        // satışı oluştur.
        const newSale = await tx.sale.create({
          data: {
            quantity,
            totalPrice,
            customerId,
            productId,
            tenantId: targetTenantId,
          },
          include: { product: true, customer: true, tenant: true },
        });

        // stoktan düş- ürün A adımında bu kliniğe ait olarak doğrulandı.
        await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: quantity } },
        });

        io.to(targetTenantId).emit("sale_created", newSale);

        return newSale;
      });
    },
    deleteSale: async (
      _: any,
      { id }: { id: string },
      { prisma, user, io }: myContext,
    ) => {
      if (!user) throw new Error("Authentication required.");

      // Silinecek satışı bulmamız lazım!
      // Neden? Çünkü hangi üründen kaç tane satıldığını bilmeden stoğu iade edemeyiz.
      const saleToDelete = await prisma.sale.findUnique({
        where: { id },
        include: { product: true }, // Ürün bilgisini de yanına alıyoruz
      });

      if (!saleToDelete) throw new Error("Sale record not found!");

      // 💎 Güvenlik: Başkasının satışını silemesin (Super Admin değilse)
      if (
        user.role !== "SUPER_ADMIN" &&
        saleToDelete.tenantId !== user.tenantId
      ) {
        throw new Error("You are not authorized to cancel this sale!");
      }

      try {
        // 💉 TRANSACTION: Ya satış silinir ve stok artar, ya da hiçbir şey olmaz!
        return await prisma.$transaction(async (tx: any) => {
          // A. Satışı veritabanından siliyoruz
          await tx.sale.delete({
            where: { id },
          });

          // B. STOKLARI GERİ İADE ET
          // Müşterinin aldığı miktarı (quantity) ürünün stoğuna geri ekliyoruz.
          await tx.product.update({
            where: { id: saleToDelete.productId },
            data: {
              stock: {
                increment: saleToDelete.quantity, // Stoğu miktar kadar ARTIRIR ✅
              },
            },
          });

          io.to(saleToDelete.tenantId).emit("sale_deleted", saleToDelete);

          // C. DeleteResponse Tipinde Cevap Dönüyoruz
          return {
            id: saleToDelete.id,
            success: true,
            message: `Sale cancelled successfully. ${saleToDelete.quantity} items returned to stock.`,
          };
        });
      } catch (error: any) {
        throw new Error(
          error.message ||
            "An unexpected error occurred during sale cancellation.",
        );
      }
    },
  },
};
