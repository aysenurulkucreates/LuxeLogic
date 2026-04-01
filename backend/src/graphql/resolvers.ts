import bcrypt from "bcryptjs";
import { GraphQLError } from "graphql";
import jwt from "jsonwebtoken";

// this is a template/contains lsit that we use to introduce to TypeScript exactly what data (user, prisma, io) is contained within the context object that goes to GraphQl functions. Instead of simply typing context, defining its contents allows us to gain autocomplete and prevent errors.
interface myContext {
  user?: {
    id: string;
    email: string;
    tenantId: string;
    role: string;
  };
  prisma: any;
  io: any;
}

export const resolvers = {
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

      const allowedRoles = ["TENANT_ADMIN", "DOCTOR", "STAFF", "NURSE"];
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
            user.role === "DOCTOR" ? { staffId: user.id } : {},
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
      if (!user) throw new Error("Not authenticated!");

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
          tenant: true,
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
          tenant: true,
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

    // customers
    createCustomer: async (
      _: any,
      { input }: any,
      { prisma, user, io }: myContext,
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

        io.to(targetTenantId).emit("customer_created", newCustomer);

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
      { prisma, user, io }: myContext,
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

        io.to(deleted.tenantId).emit("customer_deleted", id);

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
      { prisma, user, io }: myContext,
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

        const updatedCustomer = await prisma.customer.update({
          where: { id: id },
          data: updateData,
        });

        io.to(updatedCustomer.tenantId).emit(
          "customer_updated",
          updatedCustomer,
        );

        return updatedCustomer;
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
      { prisma, user, io }: myContext,
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

        io.to(targetTenantId).emit("product_created", newProduct);

        return newProduct;
      } catch (err) {
        console.error("Error creating product:", err);
        throw new Error("Failed to create product.");
      }
    },
    deleteProduct: async (
      _: any,
      { id }: any,
      { prisma, user, io }: myContext,
    ) => {
      if (!user) throw new Error("Authentication required.");

      try {
        // 🩺 1. ADIM: Önce silinecek ürünü buluyoruz!
        // (Çünkü Super Admin siliyorsa hangi şirkete ait olduğunu ancak böyle öğrenebiliriz)
        const productToDelete = await prisma.product.findUnique({
          where: { id: id },
        });

        // Ürün yoksa zaten işlemi iptal et
        if (!productToDelete) {
          throw new Error("Product not found!");
        }

        // 🛡️ 2. ADIM: Güvenlik Duvarı
        // (Eğer Super Admin değilse ve kendi şirketi değilse silemesin)
        if (
          user.role !== "SUPER_ADMIN" &&
          productToDelete.tenantId !== user.tenantId
        ) {
          throw new Error("You do not have permission to delete this product.");
        }

        // 🩺 3. ADIM: Bağımlılık Kontrolü (Satışlarda kullanılmış mı?)
        const usageCount = await prisma.sale.count({
          where: { productId: id },
        });

        if (usageCount > 0) {
          throw new Error(
            "Cannot delete product: It is linked to existing sales records. Try deactivating it instead. ⚠️",
          );
        }

        // 🗑️ 4. ADIM: Güvenli Silme (Artık gönül rahatlığıyla silebiliriz)
        // Burada deleteMany yerine direkt delete kullanıyoruz çünkü id benzersiz
        await prisma.product.delete({
          where: { id: id },
        });

        // 🚨 5. ADIM: Telsiz Anonsu!
        // Ürünü silmeden önce 1. Adımda bilgilerini çekmiştik, o yüzden 'tenantId' altın gibi elimizde!
        io.to(productToDelete.tenantId).emit("product_deleted", id);

        return {
          deletedId: id,
          success: true,
          message: "Product removed from the system successfully. 💎",
        };
      } catch (err: any) {
        console.error("Delete Error:", err);
        throw new Error(err.message || "Failed to execute delete operation.");
      }
    },
    updateProduct: async (
      _: any,
      { id, input }: any,
      { prisma, user, io }: myContext,
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

        io.to(updatedProduct.tenantId).emit("product_updated", updatedProduct);

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
      { prisma, user, io }: myContext,
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
        role,
      } = input;

      const targetTenantId =
        user.role === "SUPER_ADMIN" ? input.tenantId : user.tenantId;

      if (!targetTenantId) {
        throw new Error("Target tenant ID is required for this operation.");
      }

      try {
        // bu e-posta ile sisteme girş yapmış biri var mı
        const existingUser = await prisma.user.findFirst({ where: { email } });
        if (existingUser)
          throw new Error("This email is already registered to another user.");

        const hashedPassword = await bcrypt.hash("Staff123", 10);

        // sisteme girş yapması için user oluşturuyoruz.
        await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            role: role,
            tenantId: targetTenantId,
            profileImage: imageUrl || "",
          },
        });

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
            role,
            tenantId: targetTenantId,
          },
        });

        io.to(targetTenantId).emit("staff_created", newStaff);

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
    deleteStaff: async (
      _: any,
      { id }: any,
      { prisma, user, io }: myContext,
    ) => {
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

        io.to(deleted.tenantId).emit("staff_deleted", id);

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
      { prisma, user, io }: myContext,
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

        io.to(updatedStaff.tenantId).emit("staff_updated", updatedStaff);

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
      { prisma, user, io }: myContext,
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

      const newApp = await prisma.appointment.create({
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

      io.to(targetTenantId).emit("appointment_created", newApp);

      return newApp;
    },
    deleteAppointment: async (
      _: any,
      { id }: any,
      { prisma, user, io }: myContext,
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

        io.to(deleted.tenantId).emit("appointment_deleted", id);

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
      { prisma, user, io }: myContext,
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

        const updatedApp = await prisma.appointment.update({
          where: { id: id },
          data: updateData,
          include: {
            staff: true,
            customer: true,
            tenant: true,
          },
        });

        io.to(updatedApp.tenantId).emit("appointment_updated", updatedApp);

        return updatedApp;
      }
    },
    updateAppointmentStatus: async (
      _: any,
      { id, status }: any,
      { prisma, user, io }: myContext,
    ) => {
      if (!user) throw new Error("Authenticated required!");

      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: { status },
        include: { customer: true, staff: true },
      });

      io.to(updatedAppointment.tenantId).emit(
        "appointment_status_updated",
        updatedAppointment,
      );

      return updatedAppointment;
    },

    // sales
    createSale: async (
      _: any,
      { input }: any,
      { prisma, user, io }: myContext,
    ) => {
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

          io.to(targetTenantId).emit("sale_created", newSale);

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
      { prisma, user, io }: myContext,
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

          io.to(saleToDelete.tenantId).emit("sale_deleted", saleToDelete);

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
