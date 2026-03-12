import { gql } from "@apollo/client";

export const CREATE_STAFF = gql`
  mutation CreateStaff($input: CreateStaffInput!) {
    createStaff(input: $input) {
      id
      tenantId
      name
      email
      phone
      expertise
      workDays
      isActive
      imageUrl
      bio
    }
  }
`;

export const DELETE_STAFF = gql`
  mutation DeleteStaff($id: ID!) {
    deleteStaff(id: $id) {
      deletedId
      success
      message
    }
  }
`;

export const UPDATE_STAFF = gql`
  mutation UpdateStaff($input: UpdateStaffInput!, $id: ID!) {
    updateStaff(input: $input, id: $id) {
      id
      tenantId
      name
      email
      phone
      expertise
      workDays
      isActive
      imageUrl
      bio
    }
  }
`;
