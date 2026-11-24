-- Aynı doktorun / aynı müşterinin aktif (iptal edilmemiş) randevuları üst üste binemez
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Appointment"
  ADD CONSTRAINT appointment_staff_no_overlap
  EXCLUDE USING gist ("staffId" WITH =, tsrange("startTime", "endTime") WITH &&)
  WHERE (status <> 'CANCELLED');

ALTER TABLE "Appointment"
  ADD CONSTRAINT appointment_customer_no_overlap
  EXCLUDE USING gist ("customerId" WITH =, tsrange("startTime", "endTime") WITH &&)
  WHERE (status <> 'CANCELLED');