import { gql } from "@apollo/client";

export const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($name: String!, $email: String!, $phone: String!) {
    createCustomer(name: $name, email: $email, phone: $phone) {
      id
      tenantId
      email
      phone
      name
    }
  }
`;

export const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id) {
      id
      name
    }
  }
`;

export const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer(
    $id: ID!
    $name: String
    $email: String
    $phone: String
  ) {
    updateCustomer(id: $id, name: $name, email: $email, phone: $phone) {
      id
      tenantId
      email
      phone
      name
    }
  }
`;
