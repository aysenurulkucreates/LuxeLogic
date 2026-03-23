export const saleTypeDef = `#graphql
  type Query {
    mySales(searchTerm: String): [Sale!]!
    getSale(id: ID!): Sale
  }

  type Mutation {
    createSale(input: CreateSaleInput!): Sale!
    deleteSale(id: ID!): DeleteResponse
  }

  type Sale {
  id: ID!

  quantity: Int!
  totalPrice: Float!

  product: Product!
  customer: Customer
  tenant: Tenant!

  createdAt: DateTime!
 }

input CreateSaleInput {
  quantity: Int!
  totalPrice: Float!

  customerId: ID
  productId: ID!
}
`;
