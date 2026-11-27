import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import type { Express } from "express";
import { createApp } from "../src/app.js";
import prisma from "../src/lib/prisma.js";
import { resetDb, createClinic, gql } from "./helpers.js";

describe("test setup", () => {
  let app: Express;

  beforeAll(async () => {
    ({ app } = await createApp()); // port açmadan app'i al
  });

  beforeEach(async () => {
    await resetDb(); // her test temiz başlar
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns an appointment from the user's own clinic", async () => {
    // Arrange
    const clinicA = await createClinic("clinic-a");

    // Act
    const res = await gql(
      app,
      clinicA.adminToken,
      `{ getAppointment(id: "${clinicA.appointment.id}") { id } }`,
    );

    // Assert
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.getAppointment.id).toBe(clinicA.appointment.id);
  });
});
