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
      if (!user) return null;

      const cleanSearch = searchTerm?.trim();
      const searchFilter = cleanSearch
        ? {
            OR: [
              { name: { contains: cleanSearch, mode: "insensitive" as const } },
              {
                email: { contains: cleanSearch, mode: "insensitive" as const },
              },
            ],
          }
        : {};

      return await prisma.staff.findMany({
        where: user.role === "SUPER_ADMIN" ? {} : { tenantId: user.tenantId },
        ...searchFilter,
      });
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

    //appointments
    myAppointments: async (
      _: any,
      { input = {} }: any,
      { prisma, user }: myContext,
    ) => {
      if (!user) return null;

      const cleanSearch = input.searchTerm?.trim();
      const searchFilter = cleanSearch
        ? {
            OR: [
              {
                customer: {
                  name: { contains: cleanSearch, mode: "insensitive" as const },
                },
              },
              {
                customer: {
                  email: {
                    contains: cleanSearch,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                customer: {
                  phone: {
                    contains: cleanSearch,
                  },
                },
              },
              {
                notes: { contains: cleanSearch, mode: "insensitive" as const },
              },
            ],
          }
        : {};

      return await prisma.appointment.findMany({
        where: {
          AND: [
            user.role === "SUPER_ADMIN" ? {} : { tenantId: user.tenantId },
            // Bir personel, arkadaşının randevusunu göremez!
            user.role === "STAFF" ? { staffId: user.id } : {},
            searchFilter,
          ],
        },
        orderBy: {
          startTime: "asc",
        },
        include: {
          customer: true,
          staff: true,
        },
        take: 50,
      });
    },
    getAppointment: async (
      _: any,
      { id }: { id: string },
      { prisma, user }: myContext,
    ) => {
      if (!user) return null;

      const appointment = await prisma.appointment.findFirst({
        where: {
          id: id,
          ...(user.role === "SUPER_ADMIN" ? {} : { tenantId: user.tenantId }),
        },
        include: { customer: true, staff: true },
      });
      return appointment;
    },

    // sales
    mySales: async (
      _: any,
      { searchTerm }: any,
      { prisma, user }: myContext,
    ) => {
      if (!user) return null;

      const cleanSearch = searchTerm?.trim();
      const searchFilter = cleanSearch
        ? {
            OR: [
              {
                product: {
                  name: { contains: cleanSearch, mode: "insensitive" as const },
                },
              },
              {
                customer: {
                  name: { contains: cleanSearch, mode: "insensitive" as const },
                },
              },
            ],
          }
        : {};

      return await prisma.sale.findMany({
        where: {
          ...(user.role === "SUPER_ADMIN" ? {} : { tenantId: user.tenantId }),
          ...searchFilter,
        },
        include: {
          product: true,
          customer: true,
        },
        orderBy: { createdAt: "desc" },
      });
    },
    getSale: async (
      _: any,
      { id }: { id: string },
      { prisma, user }: myContext,
    ) => {
      if (!user) return null;

      const sale = await prisma.sale.findFirst({
        where: {
          id: id,
          ...(user.role !== "SUPER_ADMIN" ? { tenantId: user.tenantId } : {}),
        },
        include: {
          product: true,
          customer: true,
        },
      });
      return sale;
    },

    // dashboard istatistik
    getDashboardStats: async (_: any, __: any, { prisma, user }: myContext) => {
      if (!user) throw new Error("Unauthorized. Please login first.");

      const tenantId = user.tenantId;
      const isAdmin = user.role === "SUPER_ADMIN";
      const whereFilter = isAdmin ? {} : { tenantId };

      try {
        const [
          customers,
          staff,
          products,
          appointments,
          appointmentSum,
          salesCount,
          salesSum,
        ] = await Promise.all([
          prisma.customer.count({ where: whereFilter }),
          prisma.staff.count({ where: whereFilter }),
          prisma.product.count({ where: whereFilter }),
          prisma.appointment.count({ where: whereFilter }),

          prisma.appointment.aggregate({
            _sum: { price: true },
            where: { ...whereFilter, status: "COMPLETED" },
          }),

          // 💉 SATIŞ ADEDİ DİKİŞİ
          prisma.sale.count({ where: whereFilter }),

          // 💎 SATIŞ GELİRİ DİKİŞİ (Sales Revenue) 💎
          prisma.sale.aggregate({
            _sum: { totalPrice: true },
            where: whereFilter,
          }),
        ]);

        // 2. ADIM: Veriyi temizle (NaN/Null korumalı) 🩺
        const totalAppRevenue = Number(appointmentSum._sum?.price) || 0;
        const totalProductRevenue = Number(salesSum._sum?.totalPrice) || 0; // 💉 Satış cirosu

        return {
          customerCount: customers,
          staffCount: staff,
          productCount: products,
          appointmentCount: appointments,

          // 💎 FRONTEND'E GİDEN GELİŞMİŞ VERİLER 💎
          appointmentRevenue: totalAppRevenue,
          productRevenue: totalProductRevenue, // Artık 0 değil, pırlanta gibi dolu! ✅
          totalRevenue: totalAppRevenue + totalProductRevenue, // Toplam Klinik Cirosu 💰

          // İstersen satış adedini de dönebilirsin
          salesCount: salesCount,
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
        orderBy: { createdAt: "desc" },
        take: 3,
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
        await prisma.appointment.deleteMany({ where: { customerId: id } });

        const deleted = await prisma.customer.delete({ where });

        if (deleted.count === 0)
          throw new Error("Customer not found or you do not have permission.");
        return {
          deletedId: id,
          success: true,
          message: "Customer succesfully deleted!",
        };
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
        await prisma.appointment.deleteMany({ where: { staffId: id } });

        const deleted = await prisma.staff.delete({ where });

        if (deleted.count === 0)
          throw new Error("Staff not found or you do not have permission.");

        return {
          deletedId: id,
          success: true,
          message: "Staff member successfully deleted.",
        };
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

        if (!staff) throw new Error("Staff not found or access denied");

        const updatedStaff = await prisma.staff.update({
          where: { id: id },
          data: updateData,
        });

        return updatedStaff;
      } catch (error: any) {
        if (error.code === "P2002") {
          throw new Error(
            "This email is already in use by another staff member.",
          );
        }
      }
    },

    // appointments
    createAppointment: async (
      _: any,
      { input }: any,
      { prisma, user }: myContext,
    ) => {
      if (!user) return null;

      const { startTime, endTime, status, price, customerId, staffId } = input;

      const rawTenantId =
        user.role === "SUPER_ADMIN" ? input.tenantId : user.tenantId;
      const targetTenantId =
        typeof rawTenantId === "object" ? rawTenantId.id : rawTenantId;

      if (!targetTenantId) {
        throw new Error("Target tenant ID is required for this operation.");
      }

      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          tenantId: targetTenantId,
          staffId: input.staffId,
          AND: [
            { startTime: { lt: new Date(endTime) } }, // lt: les than $startTime < input.endTime$
            { endTime: { gt: new Date(startTime) } }, // gt: greater than $endTime > input.startTime$
          ],
        },
      });

      if (existingAppointment)
        throw new Error(
          "The staff already have an appointment at these times.",
        );

      return await prisma.appointment.create({
        data: {
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          price: input.price,
          status: status || "PENDING",
          notes: input.notes,
          tenant: { connect: { id: targetTenantId } },
          customer: { connect: { id: input.customerId } },
          staff: { connect: { id: input.staffId } },
        },
        include: {
          staff: true,
          customer: true,
          tenant: true,
        },
      });
    },
    deleteAppointment: async (
      _: any,
      { id }: any,
      { prisma, user }: myContext,
    ) => {
      if (!user) return null;

      const where = {
        id: id,
        ...(user.role !== "SUPER_ADMIN" ? { tenantId: user.tenantId } : {}),
      };

      try {
        const deleted = await prisma.appointment.deleteMany({ where });

        if (deleted.count === 0)
          return {
            success: false,
            message: "Appointment not found or access denied.",
            deletedId: null,
          };

        return {
          success: true,
          message: "Appointment successfully deleted.",
          deletedId: id,
        };
      } catch (err) {
        console.error("Error deleting appointment:", err);
        return {
          success: false,
          message: "Unexpected error occured.",
          deletedId: null,
        };
      }
    },
    updateAppointment: async (
      _: any,
      { id, input }: any,
      { prisma, user }: myContext,
    ) => {
      if (!user) return null;

      const targetTenantId =
        user.role === "SUPER_ADMIN" ? input.tenantId : user.tenantId;

      const currentApp = await prisma.appointment.findFirst({
        where: { id, tenantId: targetTenantId },
      });

      if (!currentApp)
        throw new Error("Appointment not found or access denied.");

      const { startTime, endTime, status, staffId, customerId, notes, price } =
        input;
      const updateData: any = {};

      if (startTime !== undefined) updateData.startTime = new Date(startTime);
      if (endTime !== undefined) updateData.endTime = new Date(endTime);
      if (price !== undefined) updateData.price = price;
      if (status !== undefined) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
      if (staffId !== undefined) updateData.staffId = staffId;
      if (customerId !== undefined) updateData.customerId = customerId;

      // çakışma kontrolü
      if (startTime || endTime || staffId) {
        const checkStart = updateData.startTime || currentApp.startTime;
        const checkEnd = updateData.endTime || currentApp.endTime;
        const checkStaff = updateData.staffId || currentApp.staffId;
        const checkCustomer = updateData.customerId || currentApp.customerId;

        const conflict = await prisma.appointment.findFirst({
          where: {
            tenantId: targetTenantId,
            id: { not: id },
            AND: [
              { startTime: { lt: checkEnd } },
              { endTime: { gt: checkStart } },
            ],
            OR: [{ staffId: checkStaff }, { customerId: checkCustomer }],
          },
        });

        if (conflict) throw new Error("It clashes with another appointment.");

        return await prisma.appointment.update({
          where: { id: id },
          data: updateData,
          include: {
            staff: true,
            customer: true,
            tenant: true,
          },
        });
      }
    },
    updateAppointmentStatus: async (
      _: any,
      { id, status }: any,
      { prisma, user }: myContext,
    ) => {
      if (!user) throw new Error("Authenticated required!");

      return await prisma.appointment.update({
        where: { id },
        data: { status },
        include: { customer: true, staff: true },
      });
    },

    // sales
    createSale: async (_: any, { input }: any, { prisma, user }: myContext) => {
      if (!user) throw new Error("Authentication required.");

      const { quantity, totalPrice, customerId, productId } = input;

      const targetTenantId =
        user.role === "SUPER_ADMIN" ? input.tenantId : user.tenantId;

      if (!targetTenantId)
        throw new Error("Target tenant ID is required for this operation.");

      // 🏥 TRANSACTION OPERASYONU
      try {
        return await prisma.$transaction(async (tx: any) => {
          // A. Ürünü bul ve stok kontrolü yap
          const product = await tx.product.findUnique({
            where: { id: productId },
          });

          if (!product) throw new Error("Product not found in inventory!");

          if (product.stock < quantity) {
            throw new Error(
              `Insufficient stock! Only ${product.stock} left in storage.`,
            );
          }

          // B. Satışı oluştur
          const newSale = await tx.sale.create({
            data: {
              quantity,
              totalPrice,
              customerId,
              productId,
              tenantId: targetTenantId,
            },
            include: { product: true, customer: true, tenant: true },
          });

          // C. STOKTAN OTOMATİK DÜŞ
          await tx.product.update({
            where: { id: productId },
            data: {
              stock: {
                decrement: quantity, // Stoğu miktar kadar tıkır tıkır düşürür ✅
              },
            },
          });

          return newSale;
        });
      } catch (error: any) {
        throw new Error(
          error.message ||
            "An unexpected error occurred during the sale operation.",
        );
      }
    },
    deleteSale: async (
      _: any,
      { id }: { id: string },
      { prisma, user }: myContext,
    ) => {
      if (!user) throw new Error("Authentication required.");

      // Silinecek satışı bulmamız lazım!
      // Neden? Çünkü hangi üründen kaç tane satıldığını bilmeden stoğu iade edemeyiz.
      const saleToDelete = await prisma.sale.findUnique({
        where: { id },
        include: { product: true }, // Ürün bilgisini de yanına alıyoruz
      });

      if (!saleToDelete) throw new Error("Sale record not found!");

      // 💎 Güvenlik: Başkasının satışını silemesin (Super Admin değilse)
      if (
        user.role !== "SUPER_ADMIN" &&
        saleToDelete.tenantId !== user.tenantId
      ) {
        throw new Error("You are not authorized to cancel this sale!");
      }

      try {
        // 💉 TRANSACTION: Ya satış silinir ve stok artar, ya da hiçbir şey olmaz!
        return await prisma.$transaction(async (tx: any) => {
          // A. Satışı veritabanından siliyoruz
          await tx.sale.delete({
            where: { id },
          });

          // B. STOKLARI GERİ İADE ET
          // Müşterinin aldığı miktarı (quantity) ürünün stoğuna geri ekliyoruz.
          await tx.product.update({
            where: { id: saleToDelete.productId },
            data: {
              stock: {
                increment: saleToDelete.quantity, // Stoğu miktar kadar ARTIRIR ✅
              },
            },
          });

          // C. DeleteResponse Tipinde Cevap Dönüyoruz
          return {
            id: saleToDelete.id,
            success: true,
            message: `Sale cancelled successfully. ${saleToDelete.quantity} items returned to stock.`,
          };
        });
      } catch (error: any) {
        throw new Error(
          error.message ||
            "An unexpected error occurred during sale cancellation.",
        );
      }
    },
  },
};
