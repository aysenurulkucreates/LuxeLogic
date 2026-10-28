import { Prisma } from "@prisma/client";

// tenantId si olan ve kliniğe kilitlenecek modeller.
const SCOPED_MODELS = new Set([
  "Customer",
  "Staff",
  "Product",
  "Appointment",
  "Sale",
]);

const WHERE_OPERATIONS = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
]);

export const tenantScope = (tenantId: string) =>
  Prisma.defineExtension({
    name: "tenantScope",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (SCOPED_MODELS.has(model) && WHERE_OPERATIONS.has(operation)) {
            const scoped = args as { where?: object };
            // tenantId en sonda: istemciden gelen bir tenantId olsa bile bizimki kazanır.
            scoped.where = { ...scoped.where, tenantId };
          }
          return query(args);
        },
      },
    },
  });
