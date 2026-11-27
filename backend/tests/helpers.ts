import request from "supertest";
import jwt from "jsonwebtoken";
import type { Express } from "express";
import prisma from "../src/lib/prisma.js";

// Her testten önce: bütün tabloları boşalt.
// Sıra önemli: önce başka tablolara bağlı olanlar (çocuklar), en son Tenant.
export async function resetDb() {
  await prisma.$transaction([
    prisma.sale.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.product.deleteMany(),
    prisma.staff.deleteMany(), // Staff, User'a bağlı → User'dan önce
    prisma.user.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.tenant.deleteMany(),
  ]);
}

// signin ile aynı şekilde token üretir; getUserFromToken sadece userId'yi kullanıp
// kullanıcıyı veritabanından yüklüyor, yani kullanıcı gerçekten var olmalı.
export function tokenFor(user: {
  id: string;
  role: string;
  tenantId: string | null;
}) {
  return jwt.sign(
    { userId: user.id, role: user.role, tenantId: user.tenantId },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" },
  );
}

// Bir klinik ve içinde: yönetici, doktor (kullanıcı + personel kaydı), müşteri, randevu.
// slug her klinikte farklı olmalı (Tenant.slug ve User.email unique).
export async function createClinic(slug: string) {
  const tenant = await prisma.tenant.create({
    data: { name: `Clinic ${slug}`, slug },
  });

  const admin = await prisma.user.create({
    data: {
      email: `admin@${slug}.test`,
      password: "not-used-in-tests", // token'la giriyoruz, şifre kontrol edilmiyor
      role: "TENANT_ADMIN",
      tenantId: tenant.id,
    },
  });

  const doctorUser = await prisma.user.create({
    data: {
      email: `doctor@${slug}.test`,
      password: "not-used-in-tests",
      role: "DOCTOR",
      tenantId: tenant.id,
    },
  });

  const doctor = await prisma.staff.create({
    data: {
      tenantId: tenant.id,
      name: "Selin Aydın",
      email: `doctor@${slug}.test`,
      phone: "5550000000",
      expertise: "Aesthetics",
      workDays: ["MON", "TUE"],
      role: "DOCTOR",
      userId: doctorUser.id,
    },
  });

  const customer = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      name: "Deniz Kaya",
      email: `deniz@${slug}.test`,
      phone: "5551111111",
    },
  });

  const appointment = await prisma.appointment.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      staffId: doctor.id,
      startTime: new Date("2027-01-10T10:00:00Z"),
      endTime: new Date("2027-01-10T10:30:00Z"),
      price: 500,
    },
  });

  return {
    tenant,
    admin,
    doctorUser,
    doctor,
    customer,
    appointment,
    adminToken: tokenFor(admin),
    doctorToken: tokenFor(doctorUser),
  };
}

// GraphQL isteği: her zaman POST /graphql, sonuç body.data ya da body.errors içinde.
export function gql(app: Express, token: string, query: string) {
  return request(app)
    .post("/graphql")
    .set("Authorization", `Bearer ${token}`)
    .send({ query });
}
