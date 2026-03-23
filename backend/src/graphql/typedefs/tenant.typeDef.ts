export const tenantTypeDef = `#graphql
  type Mutation {
    createTenant(input: CreateTenantInput!): Tenant!
  }

  type Tenant {
   id: String!
   name: String!
   slug: String!
   createdAt: DateTime!
   users: [User!]!
}

input CreateTenantInput {
  name: String!
  slug: String!
}
`;
