import { gql } from "@apollo/client";

export const CREATE_APPOINTMENT = gql`
  mutation CreateAppointment($input: CreateAppointmentInput!) {
    createAppointment(input: $input) {
      id
      startTime
      endTime
      staff {
        id
        name
      }
      customer {
        id
        name
      }
      tenant {
        id
        name
      }
      notes
      status
    }
  }
`;

export const DELETE_APPOINTMENT = gql`
  mutation DeleteAppointment($id: ID!) {
    deleteAppointment(id: $id) {
      message
      success
      deletedId
    }
  }
`;

export const UPDATE_APPOINTMENT = gql`
  mutation UpdateAppointment($id: ID!, $input: UpdateAppointmentInput!) {
    updateAppointment(id: $id, input: $input) {
      id
      startTime
      endTime
      status
      notes
      staff {
        id
        name
      }
      customer {
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
