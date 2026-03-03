import { gql } from "@apollo/client";

export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      role
      tenantId
      tenant {
        name
      }
    }
  }
`;

export const GET_MY_CUSTOMERS = gql`
  query GetMyCustomers($searchTerm: String) {
    myCustomers(searchTerm: $searchTerm) {
      id
      name
      email
      phone
    }
  }
`;

export const GET_MY_PRODUCTS = gql`
  query GetMyProducts($searchTerm: String) {
    myProducts(searchTerm: $searchTerm) {
      id
      name
      category
      price
      stock
    }
  }
`;
