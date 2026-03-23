export const staffTypeDef = `#graphql
  type Query {
    myStaff(searchTerm: String): [Staff!]!
    getStaff(id: ID!): Staff
  }

  type Mutation {
    createStaff(input: CreateStaffInput!): Staff!
    deleteStaff(id: ID!): DeleteResponse
    updateStaff(id: ID!, input: UpdateStaffInput!): Staff!
  }

  enum Role {
  SUPER_ADMIN
  TENANT_ADMIN
  DOCTOR
  NURSE
  STAFF
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
  role: Role!

  tenant: Tenant

  createdAt: DateTime!
  updatedAt: DateTime!
}

type DeleteResponse {
  success: Boolean!
  message: String
  deletedId: ID
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
  role: Role!
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
