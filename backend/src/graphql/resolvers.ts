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
      if (!context.user) {
        return null;
      }

      const customer = await prisma.customer.findFirst({
        where: { id: id, tenantId: context.user.tenantId },
      });

      if (!customer) {
        throw new Error(
          "The customer could not be found, or you do not have permission to access this data.",
        );
      }
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
      if (!context.user || !context.user.tenantId) {
        throw new Error("Authentication required.");
      }

      const product = await prisma.product.findFirst({
        where: {
          id: id,
          tenantId: context.user.tenantId,
        },
      });

      if (!product) {
        throw new Error("Product not found or access denied.");
      }

      // 🚑 AMELİYAT SONU: Hastayı taburcu et!
      return product;
    },
  },
  Mutation: {
    createTenant: async (_: any, args: any) => {
      return await prisma.tenant.create({
        data: { name: args.name, slug: args.slug },
      });
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
        { userId: user.id, role: user.role },
        "supersecretkey",
        { expiresIn: "3d" },
      );

      return { token, user };
    },
    updateUser: async (_: any, { email, password }: any, context: any) => {
      // 1. Yetki Kontrolü
      if (!context.user) {
        throw new GraphQLError("You must login first.", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      const updateData: any = {};

      // 2. Email Güncelleme Hazırlığı
      if (email) {
        updateData.email = email;
      }

      // 3. Şifre Hashleme (Sadece şifre gelmişse ve boş değilse)
      if (password && password.trim().length > 0) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      // 4. Eğer güncellenecek bir şey yoksa boşuna DB'ye gitme
      if (Object.keys(updateData).length === 0) {
        throw new GraphQLError("No data has been sent to be updated..");
      }

      try {
        return await prisma.user.update({
          where: { id: context.user.id },
          data: updateData,
        });
      } catch (error: any) {
        // P2002 Prisma'nın unique constraint hata kodudur (örn: email zaten varsa)
        if (error.code === "P2002") {
          throw new GraphQLError("This email address is already in use..");
        }
        throw new GraphQLError("An error occurred during the update..");
      }
    },
    // customers
    createCustomer: async (_: any, { input }: any, context: any) => {
      if (!context.user?.tenantId) {
        throw new Error("Authentication required.");
      }

      // 2. Destructuring ile Veriyi Sabitleme (Spread yerine daha güvenli)
      const { name, email, phone } = input;

      try {
        const newCustomer = await prisma.customer.create({
          data: {
            name,
            email,
            phone,

            tenantId: context.user.tenantId,
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
      if (!context.user || !context.user.tenantId)
        throw new Error("Unauthorized!");

      try {
        const customer = await prisma.customer.findFirst({
          where: {
            id: id,
            tenantId: context.user.tenantId,
          },
        });

        if (!customer) {
          throw new Error("Customer not found or access denied");
        }
        await prisma.customer.delete({
          where: { id: id },
        });

        return customer;
      } catch (err) {
        console.error("Error deleting customer:", err);
        throw new Error("Failed to delete customer.");
      }
    },
    updateCustomer: async (_: any, { id, input }: any, context: any) => {
      if (!context.user || !context.user.tenantId) {
        throw new Error("Authentication required: No tenant context found.");
      }

      const updateData = {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.phone !== undefined && { phone: input.phone }),
      };

      if (Object.keys(updateData).length === 0) {
        throw new GraphQLError("No data has been sent to be updated.");
      }

      try {
        const customer = await prisma.customer.findFirst({
          where: {
            id: id,
            tenantId: context.user.tenantId,
          },
        });
        if (!customer) {
          throw new Error("Customer not found or access denied.");
        }

        const updatedCustomer = await prisma.customer.update({
          where: { id: id },
          data: updateData,
        });
        return updatedCustomer;
      } catch (error: any) {
        // 6. Hata Yönetimi: Unique alan kontrolü (örn: email zaten varsa)
        if (error.code === "P2002") {
          throw new Error(
            "This email address is already in use by another customer.",
          );
        }
        console.error("Update error:", error);
        throw new Error("An error occurred during the update.");
      }
    },
    // products
    createProduct: async (_: any, { input }: any, context: any) => {
      if (!context.user || !context.user.tenantId) {
        throw new Error("Authentication required: No tenant context found.");
      }
      try {
        const newProduct = await prisma.product.create({
          data: {
            name: input.name,
            price: input.price,
            category: input.category,
            stock: input.stock,
            tenantId: context.user.tenantId,
          },
        });
        return newProduct;
      } catch (err) {
        console.error("Error creating product:", err);
        throw new Error("Failed to create product.");
      }
    },
    deleteProduct: async (_: any, { id }: any, context: any) => {
      if (!context.user || !context.user.tenantId) {
        throw new Error("Authentication required: No tenant context found.");
      }

      try {
        const product = await prisma.product.findFirst({
          where: {
            id: id,
            tenantId: context.user.tenantId,
          },
        });

        if (!product) {
          throw new Error("Product not found or access denied.");
        }

        await prisma.product.delete({
          where: { id: id },
        });

        return product;
      } catch (err) {
        console.error("Error deleting product:", err);
        throw new Error("Failed to delete product.");
      }
    },
    updateProduct: async (_: any, { id, input }: any, context: any) => {
      if (!context.user || !context.user.tenantId) {
        throw new Error("Authentication required: No tenant context found.");
      }

      const updateData = {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.stock !== undefined && { stock: input.stock }),
      };

      if (Object.keys(updateData).length === 0) {
        throw new GraphQLError("No data has been sent to be updated..");
      }

      try {
        const product = await prisma.product.findFirst({
          where: {
            id: id,
            tenantId: context.user.tenantId,
          },
        });
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
  },
};
