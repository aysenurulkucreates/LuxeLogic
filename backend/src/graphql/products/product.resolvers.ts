import { validate } from "../../validation/validate.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../../validation/product.schema.js";
import { myContext } from "../../context/context.js";
import { assertDb, requireRole } from "../../lib/auth.js";
import { badInput, forbidden } from "../../lib/errors.js";

export const productResolvers = {
  Query: {
    myProducts: async (
      _: any,
      { searchTerm }: any,
      { db, user }: myContext,
    ) => {
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
              { name: { contains: cleanSearch, mode: "insensitive" as const } },
              {
                category: {
                  contains: cleanSearch,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {};

      return await db.product.findMany({ where: searchFilter });
    },
    getProduct: async (
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

      const product = await db.product.findFirst({
        where: {
          id: id,
        },
      });

      return product;
    },
  },
  Mutation: {
    createProduct: async (
      _: any,
      { input }: any,
      { db, user, io }: myContext,
    ) => {
      const me = requireRole(user, ["TENANT_ADMIN", "SUPER_ADMIN"]);
      assertDb(db);

      const targetTenantId =
        me.role === "SUPER_ADMIN" ? input.tenantId : me.tenantId;

      if (!targetTenantId) throw badInput("Target tenant ID is required!");

      const { name, price, category, stock } = validate(
        createProductSchema,
        input,
      );

      try {
        const newProduct = await db.product.create({
          data: {
            name,
            price,
            category,
            stock,
            tenantId: targetTenantId,
          },
        });

        io.to(targetTenantId).emit("product_created", newProduct);

        return newProduct;
      } catch (err) {
        console.error("Error creating product:", err);
        throw new Error("Failed to create product.");
      }
    },
    deleteProduct: async (_: any, { id }: any, { db, user, io }: myContext) => {
      const me = requireRole(user, ["TENANT_ADMIN", "SUPER_ADMIN"]);
      assertDb(db);

      const product = await db.product.findFirst({
        where: {
          id,
        },
      });

      if (!product) throw forbidden("Product not found or access denied.");

      const usageCount = await db.sale.count({ where: { productId: id } });

      if (usageCount > 0)
        throw badInput("This product has sales and cannot be deleted.");

      await db.product.delete({ where: { id: product.id } });

      io.to(product.tenantId).emit("product_deleted", id);

      return { deletedId: id, success: true, message: "Product deleted" };
    },
    updateProduct: async (
      _: any,
      { id, input }: any,
      { db, user, io }: myContext,
    ) => {
      const me = requireRole(user, ["TENANT_ADMIN", "SUPER_ADMIN"]);
      assertDb(db);

      const updateData = validate(updateProductSchema, input);

      const product = await db.product.findFirst({
        where: {
          id,
        },
      });

      if (!product) throw forbidden("Product not found or access denied.");

      try {
        const updatedProduct = await db.product.update({
          where: { id: product.id },
          data: updateData,
        });

        io.to(updatedProduct.tenantId).emit("product_updated", updatedProduct);

        return updatedProduct;
      } catch (err) {
        console.error("Error updating product:", err);
        throw new Error("Failed to update product.");
      }
    },
  },
};
