import { myContext } from "../../context/context.js";
import bcrypt from "bcryptjs";

export const staffResolvers = {
  Query: {
    // staff
    myStaff: async (
      _: any,
      { searchTerm }: any,
      { prisma, user }: myContext,
    ) => {
      if (!user) return null;

      const cleanSearch = searchTerm?.trim();
      const searchFilter = cleanSearch
        ? {
            OR: [
              { name: { contains: cleanSearch, mode: "insensitive" as const } },
              {
                email: { contains: cleanSearch, mode: "insensitive" as const },
              },
            ],
          }
        : {};

      return await prisma.staff.findMany({
        where: user.role === "SUPER_ADMIN" ? {} : { tenantId: user.tenantId },
        ...searchFilter,
      });
    },
    getStaff: async (
      _: any,
      { id }: { id: string },
      { prisma, user }: myContext,
    ) => {
      if (!user) return null;

      const staff = await prisma.staff.findFirst({
        where: {
          id: id,
          ...(user.role !== "SUPER_ADMIN" ? { tenantId: user.tenantId } : {}),
        },
      });

      return staff;
    },
  },
  Mutation: {
    //staff
    createStaff: async (
      _: any,
      { input }: any,
      { prisma, user, io }: myContext,
    ) => {
      if (!user) throw new Error("You must be logged in.");

      const {
        name,
        email,
        phone,
        expertise,
        workDays,
        isActive,
        imageUrl,
        bio,
        role,
      } = input;

      const targetTenantId =
        user.role === "SUPER_ADMIN" ? input.tenantId : user.tenantId;

      if (!targetTenantId) {
        throw new Error("Target tenant ID is required for this operation.");
      }

      try {
        // bu e-posta ile sisteme girş yapmış biri var mı
        const existingUser = await prisma.user.findFirst({ where: { email } });
        if (existingUser)
          throw new Error("This email is already registered to another user.");

        const hashedPassword = await bcrypt.hash("Staff123", 10);

        // sisteme girş yapması için user oluşturuyoruz.
        await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            role: role,
            tenantId: targetTenantId,
            profileImage: imageUrl || "",
          },
        });

        const newStaff = await prisma.staff.create({
          data: {
            name,
            email,
            phone,
            expertise,
            workDays,
            isActive,
            imageUrl,
            bio,
            role,
            tenantId: targetTenantId,
          },
        });

        io.to(targetTenantId).emit("staff_created", newStaff);

        return newStaff;
      } catch (err: any) {
        if (err.code === "P2002") {
          throw new Error(
            "This email is already registered to another staff member.",
          );
        }
        console.error("Error creating staff:", err);
        throw new Error("An unexpected error occurred while creating staff.");
      }
    },
    deleteStaff: async (
      _: any,
      { id }: any,
      { prisma, user, io }: myContext,
    ) => {
      if (!user) {
        throw new Error("You must be logged in to perform this action.");
      }

      const where = {
        id: id,
        ...(user.role !== "SUPER_ADMIN" ? { tenantId: user.tenantId } : {}),
      };

      try {
        await prisma.appointment.deleteMany({ where: { staffId: id } });

        const deleted = await prisma.staff.delete({ where });

        if (deleted.count === 0)
          throw new Error("Staff not found or you do not have permission.");

        io.to(deleted.tenantId).emit("staff_deleted", id);

        return {
          deletedId: id,
          success: true,
          message: "Staff member successfully deleted.",
        };
      } catch (err) {
        console.error("Error deleting staff:", err);
        throw new Error("Failed to delete staff.");
      }
    },
    updateStaff: async (
      _: any,
      { id, input }: any,
      { prisma, user, io }: myContext,
    ) => {
      if (!user) {
        throw new Error("You must be logged in to perform this action.");
      }

      const where = {
        id: id,
        ...(user.role !== "SUPER_ADMIN" ? { tenantId: user.tenantId } : {}),
      };

      const {
        name,
        email,
        phone,
        expertise,
        workDays,
        isActive,
        imageUrl,
        bio,
      } = input;
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (expertise !== undefined) updateData.expertise = expertise;
      if (workDays !== undefined) updateData.workDays = workDays;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (bio !== undefined) updateData.bio = bio;

      if (Object.keys(updateData).length === 0)
        throw new Error("No data sent to be updated.");

      try {
        const staff = await prisma.staff.findFirst({ where });

        if (!staff) throw new Error("Staff not found or access denied");

        const updatedStaff = await prisma.staff.update({
          where: { id: id },
          data: updateData,
        });

        io.to(updatedStaff.tenantId).emit("staff_updated", updatedStaff);

        return updatedStaff;
      } catch (error: any) {
        if (error.code === "P2002") {
          throw new Error(
            "This email is already in use by another staff member.",
          );
        }
      }
    },
  },
};
