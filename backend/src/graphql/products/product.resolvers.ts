import { myContext } from "../../context/context.js";
import { GraphQLError } from "graphql";

export const productResolvers = {
  Query: {
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
  },
  Mutation: {
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
  },
};
