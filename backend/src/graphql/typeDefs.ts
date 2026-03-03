export const typeDefs = `#graphql
scalar DateTime  

  
type Query {
  me: User

  getUser(id: ID!): User
  users: [User]
    
  myCustomers(searchTerm: String): [Customer]!
  getCustomer(id: ID!): Customer

  myProducts(searchTerm: String): [Product]!
  getProduct(id: ID!): Product

}

type Mutation {
  createTenant(name: String!, slug: String!): Tenant!

  signup(credentials: CredentialsInput!, tenantName: String!, slug:String! ): AuthPayload!
  signin(credentials: CredentialsInput!): AuthPayload!

  updateUser(email: String, password: String): User!

  createCustomer(input: CreateCustomerInput! ): Customer
  deleteCustomer(id: ID!): Customer
  updateCustomer(id: ID!, input: UpdateCustomerInput): Customer

  createProduct(input: CreateProductInput! ): Product
  deleteProduct(id: ID!): Product
  updateProduct(id: ID!, input: UpdateProductInput): Product
}

enum Role {
  SUPER_ADMIN
  TENANT_ADMIN
  DOCTOR
  STAFF
}

type Tenant {
   id: String!
   name: String!
   slug: String!
   createdAt: DateTime!
   users: [User!]!
}

type User {
   id: ID!
   email: String!
   password: String!
   role: Role!
   profileImage: String!

   tenantId: String
   tenant: Tenant

   createdAt: DateTime!

}

type Customer {
  id: ID!
  tenantId: String!
  name: String!
  email: String!
  phone: String!
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


type AuthPayload {
  token: String!
  user: User!
}

input CredentialsInput {
  email: String!
  password: String!
}

input CreateCustomerInput {
  name: String!
  email: String!
  phone: String!
 
}

input UpdateCustomerInput {
  name: String
  email: String
  phone: String
}

input CreateProductInput {
  name: String!
  category: String!
  price: Float!
  stock: Int!

}

input UpdateProductInput {
  name: String
  category: String
  price: Float
  stock: Int
}

`;
