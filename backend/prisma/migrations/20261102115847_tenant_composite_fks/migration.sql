/*
  Warnings:

  - A unique constraint covering the columns `[id,tenantId]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id,tenantId]` on the table `Staff` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_staffId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "Customer_id_tenantId_key" ON "Customer"("id", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_id_tenantId_key" ON "Staff"("id", "tenantId");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_customerId_tenantId_fkey" FOREIGN KEY ("customerId", "tenantId") REFERENCES "Customer"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_staffId_tenantId_fkey" FOREIGN KEY ("staffId", "tenantId") REFERENCES "Staff"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
