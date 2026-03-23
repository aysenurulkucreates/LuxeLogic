export const userTypeDef = `#graphql
  type Query {
    me: User

   getUser(id: ID!): User
   users: [User]
    
  }

  type Mutation {
    signup(credentials: CredentialsInput!, tenantName: String!, slug:String! ): AuthPayload!
    signin(credentials: CredentialsInput!): AuthPayload!
    updateUser(input: UpdateUserInput!): User!
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

type DeleteResponse {
  success: Boolean!
  message: String
  deletedId: ID
}

type AuthPayload {
  token: String!
  user: User!
}


input UpdateUserInput {
 email: String 
 password: String
}

input CredentialsInput {
  email: String!
  password: String!
}


`;
