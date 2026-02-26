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
    myCustomers: async (_: any, args: any, context: any) => {
      if (!context.user) {
        throw new Error("You must log in to view this list.");
      }

      if (context.user.role === "SUPER_ADMIN") {
        return await prisma.customer.findMany();
      }

      const allowedRoles = ["TENANT_ADMIN", "DOCTOR", "STAFF"];
      if (allowedRoles.includes(context.user.role)) {
        return await prisma.customer.findMany({
          where: {
            tenantId: context.user.tenantId,
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
  },
};
