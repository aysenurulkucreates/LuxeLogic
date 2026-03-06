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

export const GET_CUSTOMER = gql`
  query GetCustomer($id: ID!) {
    getCustomer(id: $id) {
      id
      tenantId
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

export const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    getProduct(id: $id) {
      id
      tenantId
      name
      category
      price
      stock
    }
  }
`;

export const GET_MY_STAFF = gql`
  query GetMyStaff($searchTerm: String) {
    myStaff(searchTerm: $searchTerm) {
      id
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

export const GET_STAFF = gql`
  query GetStaff($id: ID!) {
    getStaff(id: $id) {
      id
      name
      email
      phone
      expertise
      workDays
      isActive
      imageUrl
      bio
      tenantId
    }
  }
`;

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    getDashboardStats {
      customerCount
      staffCount
      productCount
      appointmentCount
    }
  }
`;

export const GET_RECENT_CUSTOMERS = gql`
  query GetRecentCustomers {
    getRecentCustomers {
      id
      name
      email
      phone
      createdAt
    }
  }
`;
