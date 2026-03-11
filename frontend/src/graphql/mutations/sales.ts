import { gql } from "@apollo/client";

export const CREATE_SALE = gql`
  mutation CreateSale($input: CreateSaleInput!) {
    createSale(input: $input) {
      id
      quantity
      totalPrice
      createdAt
      customer {
        id
        name
      }
      product {
        id
        name
      }
      tenant {
        id
        name
      }
    }
  }
`;

export const DELETE_SALE = gql`
  mutation DeleteSale($id: ID!) {
    deleteSale(id: $id) {
      deletedId
      success
      message
    }
  }
`;
