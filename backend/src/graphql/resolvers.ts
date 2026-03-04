import prisma from "../lib/prisma.js";
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
}

export const resolvers = {
  Query: {
    me: async (_: any, args: any, context: any) => {
      if (!context.user) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { id: context.user.id },
        include: { tenant: true },
      });

      if (!user) {
        throw new Error(
          "The session is invalid or the user has been deleted from the database.",
        );
      }

      return user;
    },
    // users
    getUser: async (_: any, { id }: { id: string }, context: myContext) => {
      if (!context.user) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { id: id },
      });

      if (!user) {
        throw new Error(
          "The session is invalid or the user has been deleted from the database.",
        );
      }
      return user;
    },
    users: async (_: any, __: any, context: any) => {
      if (!context.user) {
        throw new Error("You must log in to view this list.");
      }

      if (context.user.role === "SUPER_ADMIN") {
        return await prisma.user.findMany();
      }

      if (context.user.role === "TENANT_ADMIN") {
        return await prisma.user.findMany({
          where: {
            tenantId: context.user.tenantId,
          },
        });
      }
      throw new Error("You do not have permission to view this list..");
    },
    // customers
    myCustomers: async (_: any, { searchTerm }: any, context: any) => {
      if (!context.user) {
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

      if (context.user.role === "SUPER_ADMIN") {
        return await prisma.customer.findMany({
          where: searchFilter,
        });
      }

      const allowedRoles = ["TENANT_ADMIN", "DOCTOR", "STAFF"];
      if (allowedRoles.includes(context.user.role)) {
        return await prisma.customer.findMany({
          where: {
            tenantId: context.user.tenantId,
            ...searchFilter,
          },
        });
      }
      throw new Error("You do not have permission to view this list..");
    },
    getCustomer: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user) return null;

      const customer = await prisma.customer.findFirst({
        where: {
          id: id,
          ...(context.user.role !== "SUPER_ADMIN"
            ? { tenantId: context.user.tenantId }
            : {}),
        },
      });

      return customer;
    },
    // products
    myProducts: async (_: any, { searchTerm }: any, context: any) => {
      if (!context.user || !context.user.tenantId) {
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

      if (context.user.role === "SUPER_ADMIN") {
        return await prisma.product.findMany({
          where: searchFilter,
        });
      }

      const allowedRoles = ["TENANT_ADMIN", "DOCTOR", "STAFF"];
      if (allowedRoles.includes(context.user.role)) {
        return await prisma.product.findMany({
          where: {
            tenantId: context.user.tenantId,
            ...searchFilter,
          },
        });
      }
      throw new Error("You do not have permission to view this list..");
    },
    getProduct: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user) return null;

      const product = await prisma.product.findFirst({
        where: {
          id: id,
          ...(context.user.role !== "SUPER_ADMIN"
            ? { tenantId: context.user.tenantId }
            : {}),
        },
      });

      return product;
    },
    // staff
    myStaff: async (_: any, { searchTerm }: any, context: any) => {
      if (!context.user || !context.user.tenantId) {
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

      if (context.user.role === "SUPER_ADMIN") {
        return await prisma.staff.findMany({
          where: searchFilter,
        });
      }

      if (context.user.role === "TENANT_ADMIN") {
        if (!context.user.tenantId) {
          throw new Error("Tenant ID is required for this role.");
        }

        return await prisma.staff.findMany({
          where: {
            tenantId: context.user.tenantId,
            ...searchFilter,
          },
        });
      }

      throw new Error("Unauthorized access.");
    },
    getStaff: async (_: any, { id }: { id: string }, context: any) => {
      if (!context.user) return null;

      const staff = await prisma.staff.findFirst({
        where: {
          id: id,
          ...(context.user.role !== "SUPER_ADMIN"
            ? { tenantId: context.user.tenantId }
            : {}),
        },
      });

      return staff;
    },
  },
  Mutation: {
    createTenant: async (_: any, { input }: any, context: any) => {
      // 1. Yetki Kontrolü (En Kritik Dikiş) 💉
      // Sadece sistemin ana sahibi (SUPER_ADMIN) yeni bir tenant (kliniik) ekleyebilmeli.
      if (!context.user || context.user.role !== "SUPER_ADMIN") {
        throw new Error("Only the Super Admin can create a new tenant.");
      }

      const { name, slug } = input;

      // 2. Slug Kontrolü (Opsiyonel ama Profesyonelce)
      // Slug genelde küçük harf ve tireli olur: "luxe-clinic" gibi.
      const cleanSlug = slug.toLowerCase().trim().replace(/\s+/g, "-");

      try {
        return await prisma.tenant.create({
          data: {
            name,
            slug: cleanSlug,
          },
        });
      } catch (err: any) {
        // 3. Unique Constraint Kontrolü (Slug zaten varsa) 🔬
        if (err.code === "P2002") {
          throw new Error(
            "This slug (URL identifier) is already in use by another tenant.",
          );
        }
        console.error("Create Tenant Error:", err);
        throw new Error("Failed to create tenant.");
      }
    },
    signup: async (_: any, { credentials, tenantName, slug }: any) => {
      const existingUser = await prisma.user.findUnique({
        where: { email: credentials.email },
      });

      if (existingUser) {
        throw new Error("This email is already registered");
      }
      // 1. Şifreyi güvenli hale getiriyoruz
      const hashedPsw = await bcrypt.hash(credentials.password, 10);

      // 2. Tek bir hamlede hem Tenant hem de User oluşturuyoruz (Atomic Transaction)
      const newTenant = await prisma.tenant.create({
        data: {
          name: tenantName,
          slug: slug,
          users: {
            create: {
              email: credentials.email,
              password: hashedPsw,
              role: "TENANT_ADMIN", // İlk kayıt olan kişiye 'Patron' yetkisi veriyoruz
            },
          },
        },
        // Oluşturduğumuz kullanıcı bilgisini geri almak için 'include' kullanıyoruz
        include: {
          users: true,
        },
      });

      // 3. Yeni oluşturulan kullanıcıyı diziden çekiyoruz
      const createdUser = newTenant.users[0];

      // 4. Kullanıcıya özel token üretiyoruz
      const token = jwt.sign(
        {
          userId: createdUser.id,
          role: createdUser.role,
          tenantId: newTenant.id,
        },
        "supersecretkey", // Burayı ilerde .env dosyasına taşımayı unutma! ;)
        { expiresIn: "3d" },
      );

      // 5. Frontend'in beklediği formatta veriyi dönüyoruz
      return {
        token,
        user: createdUser,
      };
    },
    signin: async (_: any, { credentials }: any) => {
      const user = await prisma.user.findUnique({
        where: {
          email: credentials.email,
        },
      });
      if (!user) {
        throw new Error("Incorrect email or password!");
      }

      const isValid = await bcrypt.compare(credentials.password, user.password);
      if (!isValid) {
        throw new Error("Uncorrect email or password!");
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role, tenantId: user.tenantId },
        "supersecretkey",
        { expiresIn: "3d" },
      );

      return { token, user };
    },
    updateUser: async (_: any, { input }: any, context: any) => {
      if (!context.user) throw new Error("You must login first.");

      const { email, password } = input;
      const updateData: any = {};

      if (email !== undefined) updateData.email = email;

      if (password !== undefined && password.trim().length > 0) {
        updateData.password = await bcrypt.hash(password, 10); // Sadece hashli hali kutuya girsin!
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error("No data provided for update.");
      }

      try {
        return await prisma.user.update({
          where: { id: context.user.id },
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
    createCustomer: async (_: any, { input }: any, context: any) => {
      if (!context.user)
        throw new Error("You must be logged in to perform this action.");

      const targetTenantId =
        context.user.role === "SUPER_ADMIN"
          ? input.tenantId
          : context.user.tenantId;

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
    deleteCustomer: async (_: any, { id }: any, context: any) => {
      if (!context.user)
        throw new Error("You must be logged in to perform this action.");

      const where = {
        id: id,
        ...(context.user.role !== "SUPER_ADMIN"
          ? { tenantId: context.user.tenantId }
          : {}),
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
    updateCustomer: async (_: any, { id, input }: any, context: any) => {
      if (!context.user) throw new Error("You must be logged in.");

      const where = {
        id: id,
        ...(context.user.role !== "SUPER_ADMIN"
          ? { tenantId: context.user.tenantId }
          : {}),
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
    createProduct: async (_: any, { input }: any, context: any) => {
      if (!context.user)
        throw new Error("You must be logged in to perform this action.");

      const targetTenantId =
        context.user.role === "SUPER_ADMIN"
          ? input.tenantId
          : context.user.tenantId;

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
    deleteProduct: async (_: any, { id }: any, context: any) => {
      if (!context.user) {
        throw new Error("You must be logged in to perform this action.");
      }

      const where = {
        id: id,
        ...(context.user.role !== "SUPER_ADMIN"
          ? { tenantId: context.user.tenantId }
          : {}),
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
    updateProduct: async (_: any, { id, input }: any, context: any) => {
      if (!context.user) {
        throw new Error("You must be logged in to perform this action.");
      }

      const where = {
        id: id,
        ...(context.user.role !== "SUPER_ADMIN"
          ? { tenantId: context.user.tenantId }
          : {}),
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
    createStaff: async (_: any, { input }: any, context: any) => {
      if (!context.user) throw new Error("You must be logged in.");

      const {
        name,
        email,
        phone,
        expertise,
        workDays,
        isActive,
        imageUrl,
        bio,
        tenantId: inputTenantId,
      } = input;

      // Super Admin ise input'tan gelen tenantId'yi kullanır, değilse kendi tenantId'sini.
      const targetTenantId =
        context.user.role === "SUPER_ADMIN"
          ? input.tenantId
          : context.user.tenantId;

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
        // 💉 Spesifik hata kontrolü (Email zaten varsa)
        if (err.code === "P2002") {
          throw new Error(
            "This email is already registered to another staff member.",
          );
        }
        console.error("Error creating staff:", err);
        throw new Error("An unexpected error occurred while creating staff.");
      }
    },
    deleteStaff: async (_: any, { id }: any, context: any) => {
      if (!context.user) {
        throw new Error("You must be logged in to perform this action.");
      }

      const where = {
        id: id,
        ...(context.user.role !== "SUPER_ADMIN"
          ? { tenantId: context.user.tenantId }
          : {}),
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
    updateStaff: async (_: any, { id, input }: any, context: any) => {
      if (!context.user) {
        throw new Error("You must be logged in to perform this action.");
      }

      const where = {
        id: id,
        ...(context.user.role !== "SUPER_ADMIN"
          ? { tenantId: context.user.tenantId }
          : {}),
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
