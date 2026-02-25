import prisma from "../lib/prisma.js";
import bcrypt from "bcryptjs";
import { GraphQLError } from "graphql";
import jwt from "jsonwebtoken";

export const resolvers = {
  Mutation: {
    createTenant: async (_: any, args: any) => {
      return await prisma.tenant.create({
        data: { name: args.name, slug: args.slug },
      });
    },
    signup: async (_: any, { credentials, tenantId }: any) => {
      const hashedPsw = await bcrypt.hash(credentials.password, 10);
      const user = await prisma.user.create({
        data: {
          password: hashedPsw,
          email: credentials.email,
          tenantId: tenantId,
        },
      });
      const token = jwt.sign({ userId: user.id }, "supersecretkey", {
        expiresIn: "3d",
      });
      return {
        token,
        user,
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
