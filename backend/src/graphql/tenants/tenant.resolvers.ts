import { myContext } from "../../context/context.js";
import { requireRole } from "../../lib/auth.js";
import { badInput } from "../../lib/errors.js";

export const tenantResolvers = {
  Query: {},
  Mutation: {
    createTenant: async (
      _: any,
      { input }: any,
      { prisma, user }: myContext,
    ) => {
      requireRole(user, ["SUPER_ADMIN"]);

      const { name, slug } = input;
      const cleanSlug = String(slug ?? "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-");

      if (!name?.trim() || !cleanSlug)
        throw badInput("Clinic name and URL identifier are required.");

      try {
        return await prisma.tenant.create({
          data: {
            name: name.trim(),
            slug: cleanSlug,
          },
        });
      } catch (err: any) {
        if (err.code === "P2002") {
          throw badInput(
            "This slug (URL identifier) is already in use by another tenant.",
          );
        }
        console.error("Create Tenant Error:", err);
        throw new Error("Failed to create tenant.");
      }
    },
  },
};
