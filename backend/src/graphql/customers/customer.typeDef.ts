export const customerTypeDef = `#graphql
  type Query {
    myCustomers(searchTerm: String): [Customer!]!
    getCustomer(id: ID!): Customer
    getRecentCustomers: [Customer]!
  }

  type Mutation {
   createCustomer(input: CreateCustomerInput! ): Customer!
   deleteCustomer(id: ID!): DeleteResponse
   updateCustomer(id: ID!, input: UpdateCustomerInput!): Customer!
  }

  type Customer {
   id: ID!
   tenantId: String!
   name: String!
   email: String!
   phone: String!
   createdAt: DateTime!
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

`;
