"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl } from "react-native"
import { Card, Title, Paragraph, useTheme, List, Chip } from "react-native-paper"
import { LineChart, BarChart } from "react-native-chart-kit"
import { dashboardAPI } from "../services/api"

const { width: screenWidth } = Dimensions.get("window")

const DashboardScreen = () => {
  const theme = useTheme()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await dashboardAPI.getStats()
      setStats(response.data)
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchDashboardStats()
  }

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${theme.colors.primary}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${theme.colors.onSurface}, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: theme.colors.primary,
    },
  }

  const salesData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43],
        color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  }

  const orderStatusData = {
    labels: ["Pending", "Processing", "Shipped", "Delivered"],
    datasets: [
      {
        data: [12, 8, 15, 25],
      },
    ],
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Paragraph>Loading dashboard...</Paragraph>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { backgroundColor: "#E3F2FD" }]}>
            <Card.Content>
              <Title style={styles.statNumber}>{stats?.totalProducts || 0}</Title>
              <Paragraph style={styles.statLabel}>Products</Paragraph>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: "#E8F5E8" }]}>
            <Card.Content>
              <Title style={styles.statNumber}>{stats?.totalOrders || 0}</Title>
              <Paragraph style={styles.statLabel}>Orders</Paragraph>
            </Card.Content>
          </Card>
        </View>

        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { backgroundColor: "#FFF3E0" }]}>
            <Card.Content>
              <Title style={styles.statNumber}>{stats?.totalCustomers || 0}</Title>
              <Paragraph style={styles.statLabel}>Customers</Paragraph>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { backgroundColor: "#FCE4EC" }]}>
            <Card.Content>
              <Title style={styles.statNumber}>${stats?.monthlyRevenue?.toFixed(2) || "0.00"}</Title>
              <Paragraph style={styles.statLabel}>Revenue</Paragraph>
            </Card.Content>
          </Card>
        </View>
      </View>

      {/* Charts */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <Title style={styles.chartTitle}>Sales Trend</Title>
          <LineChart
            data={salesData}
            width={screenWidth - 60}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      <Card style={styles.chartCard}>
        <Card.Content>
          <Title style={styles.chartTitle}>Order Status</Title>
          <BarChart
            data={orderStatusData}
            width={screenWidth - 60}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Recent Orders */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Recent Orders</Title>
          {stats?.recentOrders?.map((order, index) => (
            <List.Item
              key={index}
              title={`Order #${order.orderNumber}`}
              description={`${order.customer?.name || "Unknown"} - $${order.total}`}
              left={(props) => <List.Icon {...props} icon="shopping" />}
              right={() => (
                <Chip mode="outlined" style={[styles.statusChip, { backgroundColor: getStatusColor(order.status) }]}>
                  {order.status}
                </Chip>
              )}
            />
          ))}
        </Card.Content>
      </Card>

      {/* Low Stock Alert */}
      {stats?.lowStockProducts?.length > 0 && (
        <Card style={[styles.card, styles.alertCard]}>
          <Card.Content>
            <Title style={styles.alertTitle}>Low Stock Alert</Title>
            {stats.lowStockProducts.map((product, index) => (
              <List.Item
                key={index}
                title={product.title}
                description={`Only ${product.inventory} left in stock`}
                left={(props) => <List.Icon {...props} icon="alert" />}
              />
            ))}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  )
}

const getStatusColor = (status) => {
  switch (status) {
    case "pending":
      return "#FFF3E0"
    case "processing":
      return "#E3F2FD"
    case "shipped":
      return "#E8F5E8"
    case "delivered":
      return "#E8F5E8"
    case "cancelled":
      return "#FFEBEE"
    default:
      return "#F5F5F5"
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  statLabel: {
    textAlign: "center",
    fontSize: 12,
    opacity: 0.7,
  },
  chartCard: {
    margin: 16,
    marginTop: 0,
  },
  chartTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  card: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  statusChip: {
    alignSelf: "center",
  },
  alertCard: {
    backgroundColor: "#FFEBEE",
  },
  alertTitle: {
    color: "#D32F2F",
    fontSize: 18,
    marginBottom: 8,
  },
})

export default DashboardScreen
