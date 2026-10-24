import { requireRole } from "../../lib/auth.js";
import { myContext } from "../../context/context.js";
import { badInput, forbidden } from "../../lib/errors.js";

export const appointmentResolvers = {
  Query: {
    //appointments
    myAppointments: async (
      _: any,
      { input = {} }: any,
      { prisma, user }: myContext,
    ) => {
      const me = requireRole(user, [
        "TENANT_ADMIN",
        "DOCTOR",
        "STAFF",
        "SUPER_ADMIN",
      ]);

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
            me.role === "SUPER_ADMIN" ? {} : { tenantId: me.tenantId },
            // Bir personel, arkadaşının randevusunu göremez!
            me.role === "DOCTOR" ? { staff: { userId: me.id } } : {},
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
      const me = requireRole(user, [
        "TENANT_ADMIN",
        "SUPER_ADMIN",
        "STAFF",
        "DOCTOR",
      ]);

      const appointment = await prisma.appointment.findFirst({
        where: {
          id: id,
          ...(me.role === "SUPER_ADMIN" ? {} : { tenantId: me.tenantId }),
          ...(me.role === "DOCTOR" ? { staff: { userId: me.id } } : {}),
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
      { prisma, io, user }: myContext,
    ) => {
      const me = requireRole(user, [
        "TENANT_ADMIN",
        "STAFF",
        "SUPER_ADMIN",
        "DOCTOR",
      ]);

      const { startTime, endTime, status, price, customerId } = input;
      let staffId = input.staffId;

      if (me.role === "DOCTOR") {
        const myStaff = await prisma.staff.findFirst({
          where: { userId: me.id, tenantId: me.tenantId, isActive: true },
        });
        if (!myStaff)
          throw forbidden("No staff record is linked to this account.");

        staffId = myStaff.id;
      }

      const rawTenantId =
        me.role === "SUPER_ADMIN" ? input.tenantId : me.tenantId;
      const targetTenantId =
        typeof rawTenantId === "object" ? rawTenantId.id : rawTenantId;

      if (!targetTenantId) {
        throw badInput("Target tenant ID is required.");
      }

      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          tenantId: targetTenantId,
          staffId,
          AND: [
            { startTime: { lt: new Date(endTime) } }, // lt: les than $startTime < input.endTime$
            { endTime: { gt: new Date(startTime) } }, // gt: greater than $endTime > input.startTime$
          ],
        },
      });

      if (existingAppointment)
        throw badInput(
          "The staff member already has an appointment at this time.",
        );

      const newApp = await prisma.appointment.create({
        data: {
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          price: price,
          status: status || "PENDING",
          notes: input.notes,
          tenant: { connect: { id: targetTenantId } },
          customer: { connect: { id: customerId } },
          staff: { connect: { id: staffId } },
        },
        include: {
          staff: true,
          customer: true,
          tenant: true,
        },
      });

      io.to(targetTenantId).emit("appointment_created", { id: newApp.id });

      return newApp;
    },
    deleteAppointment: async (
      _: any,
      { id }: any,
      { prisma, user, io }: myContext,
    ) => {
      const me = requireRole(user, ["TENANT_ADMIN", "SUPER_ADMIN"]);

      const where = {
        id: id,
        ...(me.role !== "SUPER_ADMIN" ? { tenantId: me.tenantId } : {}),
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
      const me = requireRole(user, [
        "TENANT_ADMIN",
        "DOCTOR",
        "STAFF",
        "SUPER_ADMIN",
      ]);

      const targetTenantId =
        me.role === "SUPER_ADMIN" ? input.tenantId : me.tenantId;

      const currentApp = await prisma.appointment.findFirst({
        where: {
          id,
          tenantId: targetTenantId,
          ...(me.role === "DOCTOR" ? { staff: { userId: me.id } } : {}),
        },
      });

      if (!currentApp)
        throw forbidden("Appointment not found or access denied.");

      const { startTime, endTime, status, staffId, customerId, notes, price } =
        input;

      if (
        me.role === "DOCTOR" &&
        staffId !== undefined &&
        staffId !== currentApp.staffId
      )
        throw forbidden("Doctors can only manage their own appointments");

      const updateData: any = {};

      if (startTime !== undefined) updateData.startTime = new Date(startTime);
      if (endTime !== undefined) updateData.endTime = new Date(endTime);
      if (price !== undefined) updateData.price = price;
      if (status !== undefined) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
      if (staffId !== undefined) updateData.staffId = staffId;
      if (customerId !== undefined) updateData.customerId = customerId;

      // çakışma kontrolü
      if (startTime || endTime || staffId || customerId) {
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

        if (conflict)
          throw badInput("This time clashes with another appointment.");
      }
      const updatedApp = await prisma.appointment.update({
        where: { id: id },
        data: updateData,
        include: {
          staff: true,
          customer: true,
          tenant: true,
        },
      });

      io.to(updatedApp.tenantId).emit("appointment_updated", {
        id: updatedApp.id,
      });

      return updatedApp;
    },
    updateAppointmentStatus: async (
      _: any,
      { id, status }: any,
      { prisma, user, io }: myContext,
    ) => {
      const me = requireRole(user, [
        "TENANT_ADMIN",
        "DOCTOR",
        "STAFF",
        "SUPER_ADMIN",
      ]);

      const appointment = await prisma.appointment.findFirst({
        where: {
          id,
          tenantId: me.tenantId,
          ...(me.role === "DOCTOR" ? { staff: { userId: me.id } } : {}),
        },
      });

      if (!appointment)
        throw forbidden("Appointment not found or access denied.");

      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: { status },
        include: { customer: true, staff: true },
      });

      io.to(updatedAppointment.tenantId).emit("appointment_status_updated", {
        id: updatedAppointment.id,
      });

      return updatedAppointment;
    },
  },
};
