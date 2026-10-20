import { myContext } from "../../context/context.js";
import { requireRole } from "../../lib/auth.js";
import { badInput, forbidden } from "../../lib/errors.js";

export const saleResolvers = {
  Query: {
    // sales
    mySales: async (
      _: any,
      { searchTerm }: any,
      { prisma, user }: myContext,
    ) => {
      const me = requireRole(user, [
        "TENANT_ADMIN",
        "DOCTOR",
        "STAFF",
        "SUPER_ADMIN",
      ]);

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
          ...(me.role === "SUPER_ADMIN" ? {} : { tenantId: me.tenantId }),
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
      const me = requireRole(user, [
        "TENANT_ADMIN",
        "DOCTOR",
        "STAFF",
        "SUPER_ADMIN",
      ]);

      const sale = await prisma.sale.findFirst({
        where: {
          id: id,
          ...(me.role !== "SUPER_ADMIN" ? { tenantId: me.tenantId } : {}),
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
      const me = requireRole(user, [
        "TENANT_ADMIN",
        "DOCTOR",
        "STAFF",
        "SUPER_ADMIN",
      ]);

      const { quantity, totalPrice, customerId, productId } = input;

      const targetTenantId =
        me.role === "SUPER_ADMIN" ? input.tenantId : me.tenantId;

      if (!targetTenantId) throw badInput("Target tenant ID is required.");

      const newSale = await prisma.$transaction(async (tx: any) => {
        // A- ürünü sadece bu klinikte ara
        const product = await tx.product.findFirst({
          where: { id: productId, tenantId: targetTenantId },
        });

        if (!product) throw forbidden("product not found or access denied.");

        if (product.stock < quantity)
          throw badInput(
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
        const sale = await tx.sale.create({
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
        return sale;
      });
      io.to(targetTenantId).emit("sale_created", newSale);

      return newSale;
    },
    deleteSale: async (
      _: any,
      { id }: { id: string },
      { prisma, user, io }: myContext,
    ) => {
      const me = requireRole(user, ["TENANT_ADMIN", "SUPER_ADMIN"]);

      const sale = await prisma.sale.findFirst({
        where: {
          id,
          ...(me.role !== "SUPER_ADMIN" ? { tenantId: me.tenantId } : {}),
        },
      });

      if (!sale) throw forbidden("Sale not found or access denied.");

      await prisma.$transaction(async (tx: any) => {
        await tx.sale.delete({ where: { id: sale.id } });

        await tx.product.update({
          where: { id: sale.productId },
          data: { stock: { increment: sale.quantity } },
        });
      });
      io.to(sale.tenantId).emit("sale_deleted", sale);

      return {
        id: sale.id,
        success: true,
        message: `Sale cancelled. ${sale.quantity} items returned to stock`,
      };
    },
  },
};
