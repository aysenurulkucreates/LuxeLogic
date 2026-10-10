import { myContext } from "../../context/context.js";
import { forbidden, unauthenticated } from "../../lib/errors.js";

export const customerResolvers = {
  Query: {
    // customers
    myCustomers: async (
      _: any,
      { searchTerm }: any,
      { prisma, user }: myContext,
    ) => {
      if (!user) throw unauthenticated();

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

      if (user.role === "SUPER_ADMIN") {
        return await prisma.customer.findMany({
          where: {
            tenantId: user.tenantId,
            ...searchFilter,
          },
        });
      }

      const allowedRoles = ["TENANT_ADMIN", "DOCTOR", "STAFF", "NURSE"];

      if (allowedRoles.includes(user.role)) {
        return await prisma.customer.findMany({
          where: {
            tenantId: user.tenantId,
            deletedAt: null,
            ...searchFilter,
          },
        });
      }
      throw new Error("You do not have permission to view this list..");
    },
    getCustomer: async (
      _: any,
      { id }: { id: string },
      { prisma, user }: myContext,
    ) => {
      if (!user) return null;

      const customer = await prisma.customer.findFirst({
        where: {
          id: id,
          ...(user.role !== "SUPER_ADMIN" ? { tenantId: user.tenantId } : {}),
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
      if (!user)
        throw new Error("You must be logged in to perform this action.");

      const targetTenantId =
        user.role === "SUPER_ADMIN" ? input.tenantId : user.tenantId;

      if (!targetTenantId) throw new Error("Target tenant ID is required!");

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
          throw new Error("This email address is already in use.");
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
      if (!user) throw unauthenticated();

      const customer = await prisma.customer.findFirst({
        where: {
          id,
          ..._(user.role !== "SUPER_ADMIN" ? { tenantId: user.tenantId } : {}),
          deletedAt: null,
        },
      });

      if (!customer) throw forbidden("Customer not found or access denied.");

      await prisma.customer.update({
        where: { id: customer.id },
        data: { deletedAt: new Date() },
      });

      io.to(customer.tenantId).emir("customer_deleted", id);

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
      if (!user) throw new Error("You must be logged in.");

      const where = {
        id: id,
        ...(user.role !== "SUPER_ADMIN" ? { tenantId: user.tenantId } : {}),
      };

      const { name, email, phone } = input;
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;

      if (Object.keys(updateData).length === 0)
        throw new Error("No data sent to be updated.");

      try {
        const customer = await prisma.customer.findFirst({ where });

        if (!customer) {
          throw new Error("Customer not found or access denied.");
        }

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
          throw new Error("This email is already in use by another customer.");
        }
        console.error("Update error:", error);
        throw new Error("An error occurred during the update.");
      }
    },
  },
};
