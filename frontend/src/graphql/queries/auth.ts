import { gql } from "@apollo/client";

export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      role
      tenantId
    }
  }
`;

export const GET_MY_CUSTOMERS = gql`
  query GetMyCustomers {
    myCustomers {
      id
      name
      email
      phone
    }
  }
`;
