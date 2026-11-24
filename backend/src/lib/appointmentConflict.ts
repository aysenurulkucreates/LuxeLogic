import { Db } from "../context/context.js";

type ConflictCheck = {
  tenantId: string;
  excludeId?: string; // güncellenen randevunun kendisiyle çakışmasın
  staffId: string;
  customerId: string;
  start: Date;
  end: Date;
};

// hatanın içinde olabilecek alanlar (sadece kullandıklarımız)
type DbErrorInfo = {
  cause?: unknown;
  originalCode?: string;
  originalMessage?: string;
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

// Çakışma kısıtı (exclusion constraint) hatası mı? Öyleyse hangisi: doktor mu, müşteri mi?
// Prisma 23P01'i tanımadığı için ona özel bir kod (P2002 gibi) vermiyor;
// PostgreSQL'in kodu hatanın içindeki "cause"ta geliyor. O yüzden cause'ları sırayla geziyoruz.
export const getOverlapTarget = (err: unknown): "staff" | "customer" | null => {
  let current = err as DbErrorInfo | undefined;

  for (let i = 0; i < 5 && current; i++) {
    if (current.originalCode === "23P01") {
      const message = current.originalMessage ?? "";
      if (message.includes("appointment_staff_no_overlap")) return "staff";
      if (message.includes("appointment_customer_no_overlap"))
        return "customer";
    }
    current = current.cause as DbErrorInfo | undefined; // bir kat içeri in
  }

  return null; // bizim kısıtımız değil
};
