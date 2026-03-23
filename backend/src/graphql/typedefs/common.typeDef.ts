export const commonTypeDef = `#graphql
  scalar DateTime 

  type DeleteResponse {
   success: Boolean!
   message: String
   deletedId: ID
}
`;
