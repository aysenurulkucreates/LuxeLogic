export const typeDefs = `#graphql
scalar DateTime  

  
type Query {
  me: User

  getUser(id: ID!): User
  users: [User]
    
  myCustomers(searchTerm: String): [Customer!]!
  getCustomer(id: ID!): Customer

  myProducts(searchTerm: String): [Product!]!
  getProduct(id: ID!): Product

  myStaff(searchTerm: String): [Staff!]!
  getStaff(id: ID!): Staff

  myAppointments(input: AppointmentFilterInput): [Appointment!]!
  getAppointment(id: ID!): Appointment 

  mySales(searchTerm: String): [Sale!]!
  getSale(id: ID!): Sale

  getDashboardStats: DashboardStats
  getRecentCustomers: [Customer]!



}

type Mutation {
  createTenant(input: CreateTenantInput!): Tenant!

  signup(credentials: CredentialsInput!, tenantName: String!, slug:String! ): AuthPayload!
  signin(credentials: CredentialsInput!): AuthPayload!
  updateUser(input: UpdateUserInput!): User!

  createCustomer(input: CreateCustomerInput! ): Customer!
  deleteCustomer(id: ID!): DeleteResponse
  updateCustomer(id: ID!, input: UpdateCustomerInput!): Customer!

  createProduct(input: CreateProductInput! ): Product!
  deleteProduct(id: ID!):DeleteResponse
  updateProduct(id: ID!, input: UpdateProductInput!): Product!

  createStaff(input: CreateStaffInput!): Staff!
  deleteStaff(id: ID!): DeleteResponse
  updateStaff(id: ID!, input: UpdateStaffInput!): Staff!

  createAppointment(input: CreateAppointmentInput!): Appointment!
  deleteAppointment(id: ID!): DeleteResponse
  updateAppointment(id: ID!, input: UpdateAppointmentInput!): Appointment!
  updateAppointmentStatus(id: ID!, status: AppointmentStatus!): Appointment!

  createSale(input: CreateSaleInput!): Sale!
  deleteSale(id: ID!): DeleteResponse

}

enum Role {
  SUPER_ADMIN
  TENANT_ADMIN
  DOCTOR
  NURSE
  STAFF
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}

type Tenant {
   id: String!
   name: String!
   slug: String!
   createdAt: DateTime!
   users: [User!]!
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

type Customer {
  id: ID!
  tenantId: String!
  name: String!
  email: String!
  phone: String!
  createdAt: DateTime!
}

type Product {
  id: ID!
  tenantId: String!
  name: String!
  category: String!
  price: Float!
  stock: Int!

  tenant: Tenant

  createdAt: DateTime!
  updatedAt: DateTime!
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

type Appointment {
  id: ID!
  
  startTime: DateTime!
  endTime: DateTime!

  price: Float!
  status: AppointmentStatus!
  notes: String

  customer: Customer!
  staff: Staff!
  tenant: Tenant!
 }

 type Sale {
  id: ID!

  quantity: Int!
  totalPrice: Float!

  product: Product!
  customer: Customer
  tenant: Tenant!

  createdAt: DateTime!
 }

type AuthPayload {
  token: String!
  user: User!
}

type DashboardStats {
  customerCount: Int
  staffCount: Int
  productCount: Int
  appointmentCount: Int

  totalRevenue: Float
  appointmentRevenue: Float
  productRevenue: Float
}

type DeleteResponse {
  success: Boolean!
  message: String
  deletedId: ID
}


input CreateTenantInput {
  name: String!
  slug: String!
}

input UpdateUserInput {
 email: String 
 password: String
}

input CredentialsInput {
  email: String!
  password: String!
}

input CreateCustomerInput {
  name: String!
  email: String!
  phone: String!
  tenantId: String
 
}

input UpdateCustomerInput {
  name: String
  email: String
  phone: String
}


input CreateProductInput {
  name: String!
  category: String!
  price: Float!
  stock: Int!
  tenantId: String

}

input UpdateProductInput {
  name: String
  category: String
  price: Float
  stock: Int
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

input AppointmentFilterInput {
  searchTerm: String
  status: AppointmentStatus
  startDate: DateTime
  endDate: DateTime
}

input CreateAppointmentInput {
  startTime: DateTime!
  endTime: DateTime!
  
  customerId: ID!
  staffId: ID!
  tenantId: ID!

  price: Float!
  notes: String
  status: AppointmentStatus!
}

input UpdateAppointmentInput {
  startTime: DateTime
  endTime: DateTime

  customerId: ID
  staffId: ID
  tenantId: ID

  price: Float
  notes: String
  status: AppointmentStatus
}

input CreateSaleInput {
  quantity: Int!
  totalPrice: Float!

  customerId: ID
  productId: ID!
}

`;
