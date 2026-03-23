export const productTypeDef = `#graphql
  type Query {
    myProducts(searchTerm: String): [Product!]!
    getProduct(id: ID!): Product
  }

  type Mutation {
   createProduct(input: CreateProductInput! ): Product!
   deleteProduct(id: ID!):DeleteResponse
   updateProduct(id: ID!, input: UpdateProductInput!): Product!
  }

  type Product {
  id: ID!
  tenantId: String!
  name: String!
  category: String!
  price: Float!
  stock: Int!

  tenant: Tenant

  createdAt: DateTime!
  updatedAt: DateTime!
}

type DeleteResponse {
  success: Boolean!
  message: String
  deletedId: ID
}

input CreateProductInput {
  name: String!
  category: String!
  price: Float!
  stock: Int!
  tenantId: String

}

input UpdateProductInput {
  name: String
  category: String
  price: Float
  stock: Int
}
`;
