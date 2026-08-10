import { myContext } from "../../context/context.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const userResolvers = {
  Query: {
    // we don't store ID information here because valid tokne information is sufficient; only those with tickets can enter.
    me: async (_: any, __: any, { prisma, user }: myContext) => {
      // thanks to this control, red errors won't up on the screen, the site won't crash, only an error will be returned.
      if (!user) {
        return null;
      }

      const foundUser = await prisma.user.findUnique({
        where: { id: user.id },
        // here, by using select instead of include, we retrieve only the necessary information from the database instead of pulling all the information, thus preventing the password from being stored in RAM.
        select: { id: true, email: true, role: true, tenant: true },
      });
      // this check sends a warning message indicating the status of the user whose account has expired; they need to log in again or they have been deleted from the system.
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
      // thanks to this control, red errors won't up on the screen, the site won't crash, only an error will be returned.
      if (!user) return null;

      return await prisma.user.findUnique({
        where: { id },
        // here, by using select instead of include, we retrieve only the necessary information from the database instead of pulling all the information, thus preventing the password from being stored in RAM.
        select: {
          id: true,
          email: true,
          role: true,
          profileImage: true,
          tenantId: true,
        },
      });
    },
    users: async (_: any, __: any, { prisma, user }: myContext) => {
      // RBAC(Role-Based Access Control) is implemented here.
      // To avoid code repetition (DRY), we define a dynamic 'queryConditions',
      // instead of writing multiple prisma.user.findMany() queries
      // we strictly use select to prevent fetching sensitive data (like 10,000+ passwords) into RAM.

      if (!user) {
        throw new Error("You must log in to view this list.");
      }

      if (user.role !== "SUPER_ADMIN" && user.role !== "TENANT_ADMIN") {
        throw new Error("You do not have eprmission to view this list.");
      }

      const queryConditions =
        user.role === "TENANT_ADMIN" ? { tenantId: user.tenantId } : {};

      return await prisma.user.findMany({
        where: queryConditions,
        select: {
          id: true,
          email: true,
          role: true,
          profileImage: true,
          tenantId: true,
        },
      });
    },
  },
  Mutation: {
    signup: async (
      _: any,
      { credentials, tenantName, slug }: any,
      { prisma }: myContext,
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
    signin: async (_: any, { credentials }: any, { prisma }: myContext) => {
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
  },
};
