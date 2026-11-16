import { myContext } from "../../context/context.js";
import { assertDb, requireRole } from "../../lib/auth.js";
import { badInput, forbidden } from "../../lib/errors.js";
import { createSaleSchema } from "../../validation/sale.schema.js";
import { validate } from "../../validation/validate.js";

export const saleResolvers = {
  Query: {
    // sales
    mySales: async (_: any, { searchTerm }: any, { db, user }: myContext) => {
      const me = requireRole(user, [
        "TENANT_ADMIN",
        "DOCTOR",
        "STAFF",
        "SUPER_ADMIN",
      ]);
      assertDb(db);

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

      return await db.sale.findMany({
        where: { ...searchFilter },
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
      { db, user }: myContext,
    ) => {
      const me = requireRole(user, [
        "TENANT_ADMIN",
        "DOCTOR",
        "STAFF",
        "SUPER_ADMIN",
      ]);
      assertDb(db);

      const sale = await db.sale.findFirst({
        where: {
          id: id,
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
    createSale: async (_: any, { input }: any, { db, user, io }: myContext) => {
      const me = requireRole(user, [
        "TENANT_ADMIN",
        "DOCTOR",
        "STAFF",
        "SUPER_ADMIN",
      ]);
      assertDb(db);

      const { quantity, customerId, productId, tenantId } = validate(
        createSaleSchema,
        input,
      );

      const targetTenantId =
        me.role === "SUPER_ADMIN" ? input.tenantId : me.tenantId;

      if (!targetTenantId) throw badInput("Target tenant ID is required.");

      const newSale = await db.$transaction(async (tx) => {
        // A- ürünü sadece bu klinikte ara
        const product = await tx.product.findFirst({
          where: { id: productId, tenantId: targetTenantId },
        });

        if (!product) throw forbidden("Product not found or access denied.");

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

        const totalPrice = product.price.mul(quantity);
        if (totalPrice.gt(99_999_999))
          throw badInput("Sale total is too large.");

        const { count } = await tx.product.updateMany({
          where: {
            id: product.id,
            tenantId: targetTenantId,
            stock: { gte: quantity },
          },
          data: { stock: { decrement: quantity } },
        });

        if (count === 0)
          throw badInput(
            `Insufficient stock! Only ${product.stock} left in storage.`,
          );
        // satışı oluştur.
        return tx.sale.create({
          data: {
            quantity,
            totalPrice,
            customerId,
            productId,
            tenantId: targetTenantId,
          },
          include: { product: true, customer: true, tenant: true },
        });
      });

      io.to(targetTenantId).emit("sale_created", { id: newSale.id });

      return newSale;
    },
    deleteSale: async (
      _: any,
      { id }: { id: string },
      { db, user, io }: myContext,
    ) => {
      const me = requireRole(user, ["TENANT_ADMIN", "SUPER_ADMIN"]);
      assertDb(db);

      const sale = await db.sale.findFirst({
        where: {
          id,
        },
      });

      if (!sale) throw forbidden("Sale not found or access denied.");

      await db.$transaction(async (tx: any) => {
        await tx.sale.delete({ where: { id: sale.id } });

        await tx.product.update({
          where: { id: sale.productId },
          data: { stock: { increment: sale.quantity } },
        });
      });
      io.to(sale.tenantId).emit("sale_deleted", { id: sale.id });

      return {
        id: sale.id,
        success: true,
        message: `Sale cancelled. ${sale.quantity} items returned to stock`,
      };
    },
  },
};
