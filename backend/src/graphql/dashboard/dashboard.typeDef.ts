export const dashboardTypeDef = `#graphql
  type Query {
    getDashboardStats: DashboardStats
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

`;
