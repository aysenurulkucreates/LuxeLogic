import { myContext } from "../../context/context.js";
import { requireRole } from "../../lib/auth.js";
import { badInput, forbidden } from "../../lib/errors.js";

export const customerResolvers = {
  Query: {
    // customers
    myCustomers: async (
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
      const searchFilter = searchTerm
        ? {
            OR: [
              { name: { contains: cleanSearch, mode: "insensitive" as const } },
              {
                email: { contains: cleanSearch, mode: "insensitive" as const },
              },
            ],
          }
        : {};

      return await prisma.customer.findMany({
        where: {
          tenantId: me.tenantId,
          deletedAt: null,
          ...searchFilter,
        },
      });
    },
    getCustomer: async (
      _: any,
      { id }: { id: string },
      { prisma, user }: myContext,
    ) => {
      const me = requireRole(user, [
        "TENANT_ADMIN",
        "SUPER_ADMIN",
        "DOCTOR",
        "STAFF",
      ]);

      const customer = await prisma.customer.findFirst({
        where: {
          id: id,
          ...(me.role !== "SUPER_ADMIN" ? { tenantId: me.tenantId } : {}),
          deletedAt: null,
        },
      });

      return customer;
    },
  },
  Mutation: {
    // customers
    createCustomer: async (
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

      const targetTenantId =
        me.role === "SUPER_ADMIN" ? input.tenantId : me.tenantId;

      if (!targetTenantId) throw badInput("Target tenant ID is required!");

      const { name, email, phone } = input;

      try {
        const newCustomer = await prisma.customer.create({
          data: {
            name,
            email,
            phone,
            tenantId: targetTenantId,
          },
        });

        io.to(targetTenantId).emit("customer_created", newCustomer);

        return newCustomer;
      } catch (err: any) {
        if (err.code === "P2002") {
          throw badInput("This email address is already in use.");
        }
        console.error("Error creating customer:", err);
        throw new Error("Failed to create customer.");
      }
    },
    deleteCustomer: async (
      _: any,
      { id }: any,
      { prisma, user, io }: myContext,
    ) => {
      const me = requireRole(user, ["TENANT_ADMIN", "SUPER_ADMIN"]);

      const customer = await prisma.customer.findFirst({
        where: {
          id,
          ...(me.role !== "SUPER_ADMIN" ? { tenantId: me.tenantId } : {}),
          deletedAt: null,
        },
      });

      if (!customer) throw forbidden("Customer not found or access denied.");

      await prisma.customer.update({
        where: { id: customer.id },
        data: { deletedAt: new Date() },
      });

      io.to(customer.tenantId).emit("customer_deleted", id);

      return {
        deletedId: id,
        success: true,
        message: "Customer deleted",
      };
    },
    updateCustomer: async (
      _: any,
      { id, input }: any,
      { prisma, user, io }: myContext,
    ) => {
      const me = requireRole(user, [
        "TENANT_ADMIN",
        "DOCTOR",
        "STAFF",
        "SUPER_ADMIN",
      ]);

      const where = {
        id: id,
        ...(me.role !== "SUPER_ADMIN" ? { tenantId: me.tenantId } : {}),
        deletedAt: null,
      };

      const { name, email, phone } = input;
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;

      if (Object.keys(updateData).length === 0)
        throw badInput("No data sent to be updated.");

      const customer = await prisma.customer.findFirst({ where });

      if (!customer) {
        throw forbidden("Customer not found or access denied.");
      }

      try {
        const updatedCustomer = await prisma.customer.update({
          where: { id: id },
          data: updateData,
        });

        io.to(updatedCustomer.tenantId).emit(
          "customer_updated",
          updatedCustomer,
        );

        return updatedCustomer;
      } catch (error: any) {
        if (error.code === "P2002") {
          throw badInput("This email is already in use by another customer.");
        }
        console.error("Update error:", error);
        throw new Error("An error occurred during the update.");
      }
    },
  },
};
