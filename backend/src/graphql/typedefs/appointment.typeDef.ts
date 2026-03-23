export const appointmentTypeDef = `#graphql

type Query {
  myAppointments(input: AppointmentFilterInput): [Appointment!]!
  getAppointment(id: ID!): Appointment 
}

type Mutation {
  createAppointment(input: CreateAppointmentInput!): Appointment!
  deleteAppointment(id: ID!): DeleteResponse
  updateAppointment(id: ID!, input: UpdateAppointmentInput!): Appointment!
  updateAppointmentStatus(id: ID!, status: AppointmentStatus!): Appointment!
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
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

 type DeleteResponse {
  success: Boolean!
  message: String
  deletedId: ID
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

`;
