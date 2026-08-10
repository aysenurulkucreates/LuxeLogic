import { myContext } from "../../context/context.js";

export const appointmentResolvers = {
  Query: {
    //appointments
    myAppointments: async (
      _: any,
      { input = {} }: any,
      { prisma, user }: myContext,
    ) => {
      if (!user) return null;

      const cleanSearch = input.searchTerm?.trim();
      const searchFilter = cleanSearch
        ? {
            OR: [
              {
                customer: {
                  name: { contains: cleanSearch, mode: "insensitive" as const },
                },
              },
              {
                customer: {
                  email: {
                    contains: cleanSearch,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                customer: {
                  phone: {
                    contains: cleanSearch,
                  },
                },
              },
              {
                notes: { contains: cleanSearch, mode: "insensitive" as const },
              },
            ],
          }
        : {};

      return await prisma.appointment.findMany({
        where: {
          AND: [
            user.role === "SUPER_ADMIN" ? {} : { tenantId: user.tenantId },
            // Bir personel, arkadaşının randevusunu göremez!
            user.role === "DOCTOR" ? { staffId: user.id } : {},
            searchFilter,
          ],
        },
        orderBy: {
          startTime: "asc",
        },
        include: {
          customer: true,
          staff: true,
        },
        take: 50,
      });
    },
    getAppointment: async (
      _: any,
      { id }: { id: string },
      { prisma, user }: myContext,
    ) => {
      if (!user) return null;

      const appointment = await prisma.appointment.findFirst({
        where: {
          id: id,
          ...(user.role === "SUPER_ADMIN" ? {} : { tenantId: user.tenantId }),
        },
        include: { customer: true, staff: true },
      });
      return appointment;
    },
  },

  Mutation: {
    // appointments
    createAppointment: async (
      _: any,
      { input }: any,
      { prisma, user, io }: myContext,
    ) => {
      if (!user) return null;

      const { startTime, endTime, status, price, customerId, staffId } = input;

      const rawTenantId =
        user.role === "SUPER_ADMIN" ? input.tenantId : user.tenantId;
      const targetTenantId =
        typeof rawTenantId === "object" ? rawTenantId.id : rawTenantId;

      if (!targetTenantId) {
        throw new Error("Target tenant ID is required for this operation.");
      }

      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          tenantId: targetTenantId,
          staffId: input.staffId,
          AND: [
            { startTime: { lt: new Date(endTime) } }, // lt: les than $startTime < input.endTime$
            { endTime: { gt: new Date(startTime) } }, // gt: greater than $endTime > input.startTime$
          ],
        },
      });

      if (existingAppointment)
        throw new Error(
          "The staff already have an appointment at these times.",
        );

      const newApp = await prisma.appointment.create({
        data: {
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          price: input.price,
          status: status || "PENDING",
          notes: input.notes,
          tenant: { connect: { id: targetTenantId } },
          customer: { connect: { id: input.customerId } },
          staff: { connect: { id: input.staffId } },
        },
        include: {
          staff: true,
          customer: true,
          tenant: true,
        },
      });

      io.to(targetTenantId).emit("appointment_created", newApp);

      return newApp;
    },
    deleteAppointment: async (
      _: any,
      { id }: any,
      { prisma, user, io }: myContext,
    ) => {
      if (!user) return null;

      const where = {
        id: id,
        ...(user.role !== "SUPER_ADMIN" ? { tenantId: user.tenantId } : {}),
      };

      try {
        const deleted = await prisma.appointment.deleteMany({ where });

        if (deleted.count === 0)
          return {
            success: false,
            message: "Appointment not found or access denied.",
            deletedId: null,
          };

        io.to(deleted.tenantId).emit("appointment_deleted", id);

        return {
          success: true,
          message: "Appointment successfully deleted.",
          deletedId: id,
        };
      } catch (err) {
        console.error("Error deleting appointment:", err);
        return {
          success: false,
          message: "Unexpected error occured.",
          deletedId: null,
        };
      }
    },
    updateAppointment: async (
      _: any,
      { id, input }: any,
      { prisma, user, io }: myContext,
    ) => {
      if (!user) return null;

      const targetTenantId =
        user.role === "SUPER_ADMIN" ? input.tenantId : user.tenantId;

      const currentApp = await prisma.appointment.findFirst({
        where: { id, tenantId: targetTenantId },
      });

      if (!currentApp)
        throw new Error("Appointment not found or access denied.");

      const { startTime, endTime, status, staffId, customerId, notes, price } =
        input;
      const updateData: any = {};

      if (startTime !== undefined) updateData.startTime = new Date(startTime);
      if (endTime !== undefined) updateData.endTime = new Date(endTime);
      if (price !== undefined) updateData.price = price;
      if (status !== undefined) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
      if (staffId !== undefined) updateData.staffId = staffId;
      if (customerId !== undefined) updateData.customerId = customerId;

      // çakışma kontrolü
      if (startTime || endTime || staffId) {
        const checkStart = updateData.startTime || currentApp.startTime;
        const checkEnd = updateData.endTime || currentApp.endTime;
        const checkStaff = updateData.staffId || currentApp.staffId;
        const checkCustomer = updateData.customerId || currentApp.customerId;

        const conflict = await prisma.appointment.findFirst({
          where: {
            tenantId: targetTenantId,
            id: { not: id },
            AND: [
              { startTime: { lt: checkEnd } },
              { endTime: { gt: checkStart } },
            ],
            OR: [{ staffId: checkStaff }, { customerId: checkCustomer }],
          },
        });

        if (conflict) throw new Error("It clashes with another appointment.");

        const updatedApp = await prisma.appointment.update({
          where: { id: id },
          data: updateData,
          include: {
            staff: true,
            customer: true,
            tenant: true,
          },
        });

        io.to(updatedApp.tenantId).emit("appointment_updated", updatedApp);

        return updatedApp;
      }
    },
    updateAppointmentStatus: async (
      _: any,
      { id, status }: any,
      { prisma, user, io }: myContext,
    ) => {
      if (!user) throw new Error("Authenticated required!");

      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: { status },
        include: { customer: true, staff: true },
      });

      io.to(updatedAppointment.tenantId).emit(
        "appointment_status_updated",
        updatedAppointment,
      );

      return updatedAppointment;
    },
  },
};
