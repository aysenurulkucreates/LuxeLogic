import { Db } from "../context/context.js";

type ConflictCheck = {
  tenantId: string;
  excludeId?: string; // güncellenen randevunun kendisiyle çakışmasın
  staffId: string;
  customerId: string;
  start: Date;
  end: Date;
};

// Aynı doktor ya da aynı müşteri için, bu saatle çakışan ve iptal edilmemiş bir randevu var mı?
export const findAppointmentConflict = (db: Db, c: ConflictCheck) =>
  db.appointment.findFirst({
    where: {
      tenantId: c.tenantId,
      ...(c.excludeId ? { id: { not: c.excludeId } } : {}),
      status: { not: "CANCELLED" },
      AND: [{ startTime: { lt: c.end } }, { endTime: { gt: c.start } }],
      OR: [{ staffId: c.staffId }, { customerId: c.customerId }],
    },
  });
