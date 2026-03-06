import bcrypt from "bcryptjs";
import { GraphQLError } from "graphql";
import jwt from "jsonwebtoken";

interface myContext {
  user?: {
    id: string;
    email: string;
    tenantId: string;
    role: string;
  };
  prisma: any;
}

export const resolvers = {
  Query: {
    me: async (_: any, args: any, { prisma, user }: myContext) => {
      if (!user) {
        return null;
      }

      const foundUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { tenant: true },
      });

      if (!foundUser) {
        throw new Error(
          "The session is invalid or the user has been deleted from the database.",
        );
      }

      return foundUser;
    },
    // users
    getUser: async (
      _: any,
      { id }: { id: string },
      { prisma, user }: myContext,
    ) => {
      if (!user) return null;
      return await prisma.user.findUnique({
        where: { id: id },
      });
    },
    users: async (_: any, __: any, { prisma, user }: myContext) => {
      if (!user) {
        throw new Error("You must log in to view this list.");
      }

      if (user.role === "SUPER_ADMIN") {
        return await prisma.user.findMany();
      }

      if (user.role === "TENANT_ADMIN") {
        return await prisma.user.findMany({
          where: {
            tenantId: user.tenantId,
          },
        });
      }
      throw new Error("You do not have permission to view this list..");
    },
    // customers
    myCustomers: async (
      _: any,
      { searchTerm }: any,
      { prisma, user }: myContext,
    ) => {
      if (!user) {
        throw new Error("You must log in to view this list.");
      }
      const cleanSearch = searchTerm?.trim();
      const searchFilter = searchTerm
        ? {
            OR: [
              { name: { contains: cleanSearch, mode: "insensitive" as const } },
              {
                email: { contains: cleanSearch, mode: "insensitive" as const },
              },
            ],
          }
        : {};

      if (user.role === "SUPER_ADMIN") {
        return await prisma.customer.findMany({
          where: searchFilter,
        });
      }

      const allowedRoles = ["TENANT_ADMIN", "DOCTOR", "STAFF"];
      if (allowedRoles.includes(user.role)) {
        return await prisma.customer.findMany({
          where: {
            tenantId: user.tenantId,
            ...searchFilter,
          },
        });
      }
      throw new Error("You do not have permission to view this list..");
    },
    getCustomer: async (
      _: any,
      { id }: { id: string },
      { prisma, user }: myContext,
    ) => {
      if (!user) return null;

      const customer = await prisma.customer.findFirst({
        where: {
          id: id,
          ...(user.role !== "SUPER_ADMIN" ? { tenantId: user.tenantId } : {}),
        },
      });

      return customer;
    },
    // products
    myProducts: async (
      _: any,
      { searchTerm }: any,
      { prisma, user }: myContext,
    ) => {
      if (!user || !user.tenantId) {
        throw new Error("Authentication required: No tenant context found.");
      }

      const cleanSearch = searchTerm?.trim();
      const searchFilter = cleanSearch
        ? {
            OR: [
              { name: { contains: cleanSearch, mode: "insensitive" as const } },
              {
                category: {
                  contains: cleanSearch,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {};

      if (user.role === "SUPER_ADMIN") {
        return await prisma.product.findMany({
          where: searchFilter,
        });
      }

      const allowedRoles = ["TENANT_ADMIN", "DOCTOR", "STAFF"];
      if (allowedRoles.includes(user.role)) {
        return await prisma.product.findMany({
          where: {
            tenantId: user.tenantId,
            ...searchFilter,
          },
        });
      }
      throw new Error("You do not have permission to view this list..");
    },
    getProduct: async (
      _: any,
      { id }: { id: string },
      { prisma, user }: myContext,
    ) => {
      if (!user) return null;

      const product = await prisma.product.findFirst({
        where: {
          id: id,
          ...(user.role !== "SUPER_ADMIN" ? { tenantId: user.tenantId } : {}),
        },
      });

      return product;
    },
    // staff
    myStaff: async (
      _: any,
      { searchTerm }: any,
      { prisma, user }: myContext,
    ) => {
      if (!user || !user.tenantId) {
        throw new Error("Authentication required: No tenant context found.");
      }

      const cleanSearch = searchTerm?.trim();
      const searchFilter = cleanSearch
        ? {
            OR: [
              { name: { contains: cleanSearch, mode: "insensitive" as const } },
              {
                expertise: {
                  contains: cleanSearch,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {};

      if (user.role === "SUPER_ADMIN") {
        return await prisma.staff.findMany({
          where: searchFilter,
        });
      }

      if (user.role === "TENANT_ADMIN") {
        if (!user.tenantId) {
          throw new Error("Tenant ID is required for this role.");
        }

        return await prisma.staff.findMany({
          where: {
            tenantId: user.tenantId,
            ...searchFilter,
          },
        });
      }

      throw new Error("Unauthorized access.");
    },
    getStaff: async (
      _: any,
      { id }: { id: string },
      { prisma, user }: myContext,
    ) => {
      if (!user) return null;

      const staff = await prisma.staff.findFirst({
        where: {
          id: id,
          ...(user.role !== "SUPER_ADMIN" ? { tenantId: user.tenantId } : {}),
        },
      });

      return staff;
    },
    // dashboard istatistik
    getDashboardStats: async (_: any, __: any, { prisma, user }: myContext) => {
      if (!user) throw new Error("Unauthorized. Please login first.");

      const tenantId = user.tenantId;
      const isAdmin = user.role === "SUPER_ADMIN";

      const whereFilter = isAdmin ? {} : { tenantId };

      try {
        const [customers, staff, products] = await Promise.all([
          prisma.customer.count({ where: whereFilter }),
          prisma.staff.count({ where: whereFilter }),
          prisma.product.count({ where: whereFilter }),
        ]);

        return {
          customerCount: customers,
          staffCount: staff,
          productCount: products,
          appointmentCount: 0,
        };
      } catch (error) {
        console.error("Dashboard Stats Error:", error);
        throw new Error("Failed to fetch clinic statistics.");
      }
    },
    getRecentCustomers: async (
      _: any,
      __: any,
      { user, prisma }: myContext,
    ) => {
      if (!user) throw new Error("Unauthorized.");

      // Sadece kendi kliniğine ait son 3 müşteriyi, kayıt tarihine göre dizip getiriyoruz.
      return await prisma.customer.findMany({
        where: user.role === "SUPER_ADMIN" ? {} : { tenantId: user.tenantId },
        orderBy: { createdAt: "desc" }, // En son eklenen en üstte! ✨
        take: 3, // Sadece 3 tane yeterli, Luxe vizyonu kalabalık sevmez. 😉
      });
    },
  },
  Mutation: {
    createTenant: async (
      _: any,
      { input }: any,
      { prisma, user }: myContext,
    ) => {
      if (!user || user.role !== "SUPER_ADMIN") {
        throw new Error("Only the Super Admin can create a new tenant.");
      }

      const { name, slug } = input;
      const cleanSlug = slug.toLowerCase().trim().replace(/\s+/g, "-");

      try {
        return await prisma.tenant.create({
          data: {
            name,
            slug: cleanSlug,
          },
        });
      } catch (err: any) {
        if (err.code === "P2002") {
          throw new Error(
            "This slug (URL identifier) is already in use by another tenant.",
          );
        }
        console.error("Create Tenant Error:", err);
        throw new Error("Failed to create tenant.");
      }
    },
    signup: async (
      _: any,
      { credentials, tenantName, slug }: any,
      { prisma, user }: myContext,
    ) => {
      const existingUser = await prisma.user.findUnique({
        where: { email: credentials.email },
      });

      if (existingUser) {
        throw new Error("This email is already registered");
      }
      const hashedPsw = await bcrypt.hash(credentials.password, 10);

      const newTenant = await prisma.tenant.create({
        data: {
          name: tenantName,
          slug: slug,
          users: {
            create: {
              email: credentials.email,
              password: hashedPsw,
              role: "TENANT_ADMIN",
            },
          },
        },
        include: {
          users: true,
        },
      });

      const createdUser = newTenant.users[0];

      const token = jwt.sign(
        {
          userId: createdUser.id,
          role: createdUser.role,
          tenantId: newTenant.id,
        },
        "supersecretkey",
        { expiresIn: "3d" },
      );

      return {
        token,
        user: createdUser,
      };
    },
    signin: async (
      _: any,
      { credentials }: any,
      { prisma, user }: myContext,
    ) => {
      const foundUser = await prisma.user.findUnique({
        where: {
          email: credentials.email,
        },
      });
      if (!foundUser) {
        throw new Error("Incorrect email or password!");
      }

      const isValid = await bcrypt.compare(
        credentials.password,
        foundUser.password,
      );
      if (!isValid) {
        throw new Error("Uncorrect email or password!");
      }

      const token = jwt.sign(
        {
          userId: foundUser.id,
          role: foundUser.role,
          tenantId: foundUser.tenantId,
        },
        "supersecretkey",
        { expiresIn: "3d" },
      );

      return { token, user: foundUser };
    },
    updateUser: async (_: any, { input }: any, { prisma, user }: myContext) => {
      if (!user) throw new Error("You must login first.");

      const { email, password } = input;
      const updateData: any = {};

      if (email !== undefined) updateData.email = email;

      if (password !== undefined && password.trim().length > 0) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error("No data provided for update.");
      }

      try {
        return await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      } catch (error: any) {
        if (error.code === "P2002") {
          throw new Error("This email address is already in use.");
        }
        console.error("User update error:", error);
        throw new Error("Update failed.");
      }
    },
    // customers
    createCustomer: async (
      _: any,
      { input }: any,
      { prisma, user }: myContext,
    ) => {
      if (!user)
        throw new Error("You must be logged in to perform this action.");

      const targetTenantId =
        user.role === "SUPER_ADMIN" ? input.tenantId : user.tenantId;

      if (!targetTenantId) throw new Error("Target tenant ID is required!");

      const { name, email, phone } = input;

      try {
        const newCustomer = await prisma.customer.create({
          data: {
            name,
            email,
            phone,
            tenantId: targetTenantId,
          },
        });
        return newCustomer;
      } catch (err: any) {
        if (err.code === "P2002") {
          throw new Error("This email address is already in use.");
        }
        console.error("Error creating customer:", err);
        throw new Error("Failed to create customer.");
      }
    },
    deleteCustomer: async (
      _: any,
      { id }: any,
      { prisma, user }: myContext,
    ) => {
      if (!user)
        throw new Error("You must be logged in to perform this action.");

      const where = {
        id: id,
        ...(user.role !== "SUPER_ADMIN" ? { tenantId: user.tenantId } : {}),
      };

      try {
        const deleted = await prisma.customer.deleteMany({ where });

        if (deleted.count === 0)
          throw new Error("Customer not found or you do not have permission.");
        return { id };
      } catch (err) {
        console.error("Error deleting customer:", err);
        throw new Error("Failed to delete customer.");
      }
    },
    updateCustomer: async (
      _: any,
      { id, input }: any,
      { prisma, user }: myContext,
    ) => {
      if (!user) throw new Error("You must be logged in.");

      const where = {
        id: id,
        ...(user.role !== "SUPER_ADMIN" ? { tenantId: user.tenantId } : {}),
      };

      const { name, email, phone } = input;
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;

      if (Object.keys(updateData).length === 0)
        throw new Error("No data sent to be updated.");

      try {
        const customer = await prisma.customer.findFirst({ where });

        if (!customer) {
          throw new Error("Customer not found or access denied.");
        }

        return await prisma.customer.update({
          where: { id: id },
          data: updateData,
        });
      } catch (error: any) {
        if (error.code === "P2002") {
          throw new Error("This email is already in use by another customer.");
        }
        console.error("Update error:", error);
        throw new Error("An error occurred during the update.");
      }
    },
    // products
    createProduct: async (
      _: any,
      { input }: any,
      { prisma, user }: myContext,
    ) => {
      if (!user)
        throw new Error("You must be logged in to perform this action.");

      const targetTenantId =
        user.role === "SUPER_ADMIN" ? input.tenantId : user.tenantId;

      if (!targetTenantId) throw new Error("Target tenant ID is required!");

      const { name, price, category, stock } = input;

      try {
        const newProduct = await prisma.product.create({
          data: {
            name,
            price,
            category,
            stock,
            tenantId: targetTenantId,
          },
        });
        return newProduct;
      } catch (err) {
        console.error("Error creating product:", err);
        throw new Error("Failed to create product.");
      }
    },
    deleteProduct: async (_: any, { id }: any, { prisma, user }: myContext) => {
      if (!user) {
        throw new Error("You must be logged in to perform this action.");
      }

      const where = {
        id: id,
        ...(user.role !== "SUPER_ADMIN" ? { tenantId: user.tenantId } : {}),
      };

      try {
        const deleted = await prisma.product.deleteMany({ where });

        if (deleted.count === 0)
          throw new Error("Product not found or you do not have permission.");

        return { id };
      } catch (err) {
        console.error("Error deleting product:", err);
        throw new Error("Failed to delete product.");
      }
    },
    updateProduct: async (
      _: any,
      { id, input }: any,
      { prisma, user }: myContext,
    ) => {
      if (!user) {
        throw new Error("You must be logged in to perform this action.");
      }

      const where = {
        id: id,
        ...(user.role !== "SUPER_ADMIN" ? { tenantId: user.tenantId } : {}),
      };

      const { name, category, price, stock } = input;
      const updateData: any = {};

      if (name !== undefined) updateData.name = name;
      if (category !== undefined) updateData.category = category;
      if (price !== undefined) updateData.price = price;
      if (stock !== undefined) updateData.stock = stock;

      if (Object.keys(updateData).length === 0)
        throw new GraphQLError("No data has been sent to be updated..");

      try {
        const product = await prisma.product.findFirst({ where });
        if (!product) {
          throw new Error("Product not found or access denied.");
        }
        const updatedProduct = await prisma.product.update({
          where: { id: id },
          data: updateData,
        });

        return updatedProduct;
      } catch (err) {
        console.error("Error updating product:", err);
        throw new Error("Failed to update product.");
      }
    },
    //staff
    createStaff: async (
      _: any,
      { input }: any,
      { prisma, user }: myContext,
    ) => {
      if (!user) throw new Error("You must be logged in.");

      const {
        name,
        email,
        phone,
        expertise,
        workDays,
        isActive,
        imageUrl,
        bio,
      } = input;

      const targetTenantId =
        user.role === "SUPER_ADMIN" ? input.tenantId : user.tenantId;

      if (!targetTenantId) {
        throw new Error("Target tenant ID is required for this operation.");
      }

      try {
        const newStaff = await prisma.staff.create({
          data: {
            name,
            email,
            phone,
            expertise,
            workDays,
            isActive,
            imageUrl,
            bio,
            tenantId: targetTenantId,
          },
        });
        return newStaff;
      } catch (err: any) {
        if (err.code === "P2002") {
          throw new Error(
            "This email is already registered to another staff member.",
          );
        }
        console.error("Error creating staff:", err);
        throw new Error("An unexpected error occurred while creating staff.");
      }
    },
    deleteStaff: async (_: any, { id }: any, { prisma, user }: myContext) => {
      if (!user) {
        throw new Error("You must be logged in to perform this action.");
      }

      const where = {
        id: id,
        ...(user.role !== "SUPER_ADMIN" ? { tenantId: user.tenantId } : {}),
      };

      try {
        const deleted = await prisma.staff.deleteMany({ where });

        if (deleted.count === 0)
          throw new Error("Staff not found or you do not have permission.");

        return { id };
      } catch (err) {
        console.error("Error deleting staff:", err);
        throw new Error("Failed to delete staff.");
      }
    },
    updateStaff: async (
      _: any,
      { id, input }: any,
      { prisma, user }: myContext,
    ) => {
      if (!user) {
        throw new Error("You must be logged in to perform this action.");
      }

      const where = {
        id: id,
        ...(user.role !== "SUPER_ADMIN" ? { tenantId: user.tenantId } : {}),
      };

      const {
        name,
        email,
        phone,
        expertise,
        workDays,
        isActive,
        imageUrl,
        bio,
      } = input;
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (expertise !== undefined) updateData.expertise = expertise;
      if (workDays !== undefined) updateData.workDays = workDays;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (bio !== undefined) updateData.bio = bio;

      if (Object.keys(updateData).length === 0)
        throw new Error("No data sent to be updated.");

      try {
        const staff = await prisma.staff.findFirst({ where });

        if (!staff) throw new Error("Staff not found or access denied.");

        return await prisma.staff.update({
          where: { id: id },
          data: updateData,
        });
      } catch (error: any) {
        if (error.code === "P2002") {
          throw new Error(
            "This email is already in use by another staff member.",
          );
        }
        console.error("Update error:", error);
        throw new Error("An error occurred during the update.");
      }
    },
  },
};
