import { gql } from "@apollo/client";

export const SIGNIN_MUTATION = gql`
  mutation Signin($credentials: CredentialsInput!) {
    signin(credentials: $credentials) {
      token
      user {
        id
        email
        role
      }
    }
  }
`;

export const SIGNUP_MUTATION = gql`
  mutation Signup(
    $credentials: CredentialsInput!
    $tenantName: String!
    $slug: String!
  ) {
    signup(credentials: $credentials, tenantName: $tenantName, slug: $slug) {
      token
      user {
        id
        email
        role
      }
    }
  }
`;

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      id
      email
      role
    }
  }
`;
