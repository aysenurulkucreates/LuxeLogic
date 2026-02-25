export const typeDefs = `#graphql
scalar DateTime  

  
type Query {
  me: User
  getUser(id: ID!): User
  users: [User]
    
  myCustomers: [Customer]
  getCustomer(id: ID!): Customer
}

type Mutation {
  createTenant(name: String!, slug: String!): Tenant!
  signup(credentials: CredentialsInput!, tenantId: String! ): AuthPayload!
  signin(credentials: CredentialsInput!): AuthPayload!
  updateUser(email: String, password: String): User!
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

   tenantId: String
   tenant: Tenant

   createdAt: DateTime!

}

type Customer {
  id: ID!
  name: String!
  email: String!
  phone: String!
}

type AuthPayload {
  token: String!
  user: User!
}

input CredentialsInput {
   email: String!
   password: String!
}

`;
