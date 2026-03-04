export const typeDefs = `#graphql
scalar DateTime  

  
type Query {
  me: User

  getUser(id: ID!): User
  users: [User]
    
  myCustomers(searchTerm: String): [Customer!]!
  getCustomer(id: ID!): Customer

  myProducts(searchTerm: String): [Product!]!
  getProduct(id: ID!): Product

  myStaff(searchterm: String): [Staff!]!
  getStaff(id: ID!): Staff

}

type Mutation {
  createTenant(input: CreateTenantInput!): Tenant!

  signup(credentials: CredentialsInput!, tenantName: String!, slug:String! ): AuthPayload!
  signin(credentials: CredentialsInput!): AuthPayload!
  updateUser(input: UpdateUserInput!): User!

  createCustomer(input: CreateCustomerInput! ): Customer!
  deleteCustomer(id: ID!): Customer
  updateCustomer(id: ID!, input: UpdateCustomerInput!): Customer!

  createProduct(input: CreateProductInput! ): Product!
  deleteProduct(id: ID!): Product
  updateProduct(id: ID!, input: UpdateProductInput!): Product!

  createStaff(input: CreateStaffInput! ): Staff!
  deleteStaff(id: ID!): Staff
  updateStaff(id: ID!, input: UpdateStaffInput!): Staff!

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


type Staff {
  id: ID!
  tenantId: String!
  name: String!
  email: String!
  phone: String!
  expertise: String!
  workDays: [String!]!
  isActive: Boolean!
  imageUrl: String
  bio: String

  tenant: Tenant

  createdAt: DateTime!
  updatedAt: DateTime!
}


type AuthPayload {
  token: String!
  user: User!
}

input CreateTenantInput {
  name: String!
  slug: String!
}

input UpdateUserInput {
 email: String 
 password: String
}

input CredentialsInput {
  email: String!
  password: String!
}

input CreateCustomerInput {
  name: String!
  email: String!
  phone: String!
  tenantId: String
 
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
  tenantId: String

}

input UpdateProductInput {
  name: String
  category: String
  price: Float
  stock: Int
}


input CreateStaffInput {
  name: String!
  email: String!
  phone: String!
  expertise: String!
  workDays: [String!]!
  isActive: Boolean!
  imageUrl: String
  bio: String
  tenantId: String
}

input UpdateStaffInput{
  name: String
  email: String
  phone: String
  expertise: String
  workDays: [String!]
  isActive: Boolean
  imageUrl: String
  bio: String
}

`;
