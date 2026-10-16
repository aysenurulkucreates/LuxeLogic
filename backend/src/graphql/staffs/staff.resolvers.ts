import { myContext } from "../../context/context.js";
import { unauthenticated, forbidden, badInput } from "../../lib/errors.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const ASSIGNABLE_ROLES = ["TENANT_ADMIN", "DOCTOR", "NURSE", "STAFF"];

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
        where: {
          ...(user.role === "SUPER_ADMIN" ? {} : { tenantId: user.tenantId }),
          isActive: true,
          ...searchFilter,
        },
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
          isActive: true,
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
      if (!user) throw unauthenticated();

      if (user.role !== "TENANT_ADMIN" && user.role !== "SUPER_ADMIN")
        throw forbidden();

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

      if (user.role === "TENANT_ADMIN" && !ASSIGNABLE_ROLES.includes(role))
        throw forbidden("You can not assign this role");

      const targetTenantId =
        user.role === "SUPER_ADMIN" ? input.tenantId : user.tenantId;

      if (!targetTenantId) throw badInput("Trghet tenant ID is required!");

      // bu e-posta ile sisteme girş yapmış biri var mı
      const existingUser = await prisma.user.findFirst({ where: { email } });
      if (existingUser)
        throw badInput("This email is already registered to another user.");

      const tempPassword = crypto.randomBytes(9).toString("base64url");
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      try {
        const newStaff = await prisma.$transaction(async (tx: any) => {
          const newUser = await tx.user.create({
            data: {
              email,
              password: hashedPassword,
              role,
              tenantId: targetTenantId,
              profileImage: imageUrl || "",
            },
          });
          return tx.staff.create({
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
              userId: newUser.id,
            },
          });
        });
        io.to(targetTenantId).emit("staff_created", newStaff);
        return { staff: newStaff, tempPassword };
      } catch (err: any) {
        // iki ynetici aynı anda aynı e-postayı eklerse ikisi de ön kontrolü geçebilir.
        if (err.code === "p2002")
          throw badInput("This email is already registered to another user.");

        console.error("Error creating staff:", err);
        throw new Error("An unexpected error occured while creating staff");
      }
    },
    deleteStaff: async (
      _: any,
      { id }: any,
      { prisma, user, io }: myContext,
    ) => {
      if (!user) throw unauthenticated();

      // önce sahiplik, personeli kendi kliniğinde ara.
      const staff = await prisma.staff.findFirst({
        where: {
          id,
          ...(user.role !== "SUPER_ADMIN" ? { tenantId: user.tenantId } : {}),
        },
      });

      if (!staff) throw forbidden("Staff not found or access denied.");

      // silme yok, pasifleştir, randevlara dokunma
      await prisma.staff.update({
        where: { id: staff.id },
        data: { isActive: false },
      });

      io.to(staff.tenantId).emit("staff_deleted", id);

      return {
        deletedId: id,
        success: true,
        message: "Staff member deactivated",
      };
    },
    updateStaff: async (
      _: any,
      { id, input }: any,
      { prisma, user, io }: myContext,
    ) => {
      if (!user)
        throw new Error("You must be logged in to perform this action.");

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

      const staff = await prisma.staff.findFirst({ where });
      if (!staff) throw forbidden("Staff not found or access denied.");

      const emailChanged = email !== undefined && email !== staff.email;

      try {
        const updatedStaff = await prisma.$transaction(async (tx: any) => {
          if (emailChanged && staff.userId) {
            await tx.user.update({
              where: { id: staff.userId },
              data: { email },
            });
          }

          return tx.staff.update({
            where: { id },
            data: updateData,
          });
        });

        io.to(updatedStaff.tenantId).emit("staff_updated", updatedStaff);

        return updatedStaff;
      } catch (error: any) {
        if (error.code === "P2002")
          throw badInput("This email is already registered to another user.");

        console.error("Error updating staff:", error);
        throw new Error("An unexpected occured while updating staff");
      }
    },
  },
};
