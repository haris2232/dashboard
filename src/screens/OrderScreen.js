"use client"

import { useState, useEffect, useCallback } from "react"
import { View, StyleSheet, FlatList, RefreshControl, Alert, ScrollView, TouchableOpacity } from "react-native"
import {
  Card,
  Title,
  Paragraph,
  Searchbar,
  Chip,
  IconButton,
  Menu,
  useTheme,
  Button,
  Portal,
  Modal,
  TextInput,
} from "react-native-paper"
import { orderAPI } from "../services/api"
import { format } from "date-fns"
import { useAuth } from "../context/AuthContext"

const OrderScreen = () => {
  const theme = useTheme()
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [menuVisible, setMenuVisible] = useState({})
  const [modalVisible, setModalVisible] = useState(false)
  const [detailsModalVisible, setDetailsModalVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [trackingNumber, setTrackingNumber] = useState("")
  const [carrier, setCarrier] = useState("")

  useEffect(() => {
    fetchOrders()
  }, [])
  
  const filterOrders = useCallback(() => {
    filterOrders()
  }, [searchQuery, orders]);
  
  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getOrders()
      // --- LOGGING START ---
      console.log("Orders received from API:", JSON.stringify(response.data.slice(0, 2), null, 2));
      // --- LOGGING END ---
      setOrders(response.data)
    } catch (error) {
      console.error("Error fetching orders:", error)
      Alert.alert("Error", "Failed to fetch orders")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterOrdersInternal = () => {
    if (!searchQuery) {
      setFilteredOrders(orders)
    } else {
      const filtered = orders.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredOrders(filtered)
    }
  }

  useEffect(() => {
    filterOrdersInternal();
  }, [searchQuery, orders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchOrders()
  }, []);

  const updateOrderStatus = async (orderId, status) => {
    try {
      await orderAPI.updateOrder(orderId, { status })
      fetchOrders()
      Alert.alert("Success", "Order status updated successfully")
    } catch (error) {
      Alert.alert("Error", "Failed to update order status")
    }
  }

  const updateTracking = async () => {
    try {
      await orderAPI.updateOrder(selectedOrder._id, {
        trackingNumber,
        carrier,
        status: "shipped",
      })
      setModalVisible(false)
      setTrackingNumber("")
      setCarrier("")
      fetchOrders()
      Alert.alert("Success", "Tracking information updated successfully")
    } catch (error) {
      Alert.alert("Error", "Failed to update tracking information")
    }
  }

  const toggleMenu = (orderId) => {
    setMenuVisible((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }))
  }

  const openTrackingModal = (order) => {
    setSelectedOrder(order)
    setTrackingNumber(order.trackingNumber || "")
    setCarrier(order.carrier || "")
    setModalVisible(true)
  }

  const openDetailsModal = (order) => {
    setSelectedOrder(order);
    setDetailsModalVisible(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#FFF3E0"
      case "processing":
        return "#E3F2FD"
      case "shipped":
        return "#E8F5E8"
      case "delivered":
        return "#C8E6C9"
      case "cancelled":
        return "#FFEBEE"
      default:
        return "#F5F5F5"
    }
  }

  const renderOrder = ({ item }) => (
    <TouchableOpacity onPress={() => openDetailsModal(item)}>
      <Card style={styles.orderCard}>
        <Card.Content>
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <Title style={styles.orderNumber}>#{item.orderNumber}</Title>
              <Paragraph style={styles.customerName}>{item.customer?.name || "Unknown Customer"}</Paragraph>
              <Paragraph style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString()}</Paragraph>
            </View>

            <View style={styles.orderMeta}>
              <Paragraph style={styles.orderTotal}>${item.total}</Paragraph>
              <Chip mode="outlined" style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}>
                {item.status}
              </Chip>
            </View>

            {(user?.role === "admin" || user?.role === "manager") && (
              <Menu
                visible={menuVisible[item._id]}
                onDismiss={() => toggleMenu(item._id)}
                anchor={<IconButton icon="dots-vertical" onPress={() => toggleMenu(item._id)} />}
              >
                <Menu.Item
                  onPress={() => {
                    toggleMenu(item._id)
                    updateOrderStatus(item._id, "processing")
                  }}
                  title="Mark Processing"
                  leadingIcon="clock"
                />
                <Menu.Item
                  onPress={() => {
                    toggleMenu(item._id)
                    openTrackingModal(item)
                  }}
                  title="Add Tracking"
                  leadingIcon="truck"
                />
                <Menu.Item
                  onPress={() => {
                    toggleMenu(item._id)
                    updateOrderStatus(item._id, "delivered")
                  }}
                  title="Mark Delivered"
                  leadingIcon="check"
                />
                <Menu.Item
                  onPress={() => {
                    toggleMenu(item._id)
                    updateOrderStatus(item._id, "cancelled")
                  }}
                  title="Cancel Order"
                  leadingIcon="close"
                />
              </Menu>
            )}
          </View>

          <View style={styles.orderDetails}>
            <Paragraph style={styles.customerEmail}>{item.customer?.email}</Paragraph>
            <Paragraph style={styles.itemCount}>
              {item.items?.length || 0} item{item.items?.length !== 1 ? "s" : ""}
            </Paragraph>
            {item.trackingNumber && (
              <Paragraph style={styles.tracking}>
                Tracking: {item.trackingNumber} ({item.carrier})
              </Paragraph>
            )}
          </View>

          {item.items && item.items.length > 0 && (
            <View style={styles.itemsList}>
              {item.items.slice(0, 2).map((orderItem, index) => (
                <View key={index} style={styles.orderItem}>
                  <Paragraph style={styles.itemName}>{orderItem.product?.title || "Unknown Product"}</Paragraph>
                  <Paragraph style={styles.itemDetails}>
                    Qty: {orderItem.quantity} × ${orderItem.price}
                  </Paragraph>
                </View>
              ))}
              {item.items.length > 2 && (
                <Paragraph style={styles.moreItems}>+{item.items.length - 2} more items</Paragraph>
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search orders..."
        onChangeText={(query) => setSearchQuery(query)}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredOrders}
        renderItem={renderOrder} // Use the updated renderOrder
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Order Details Modal */}
      <Portal>
        <Modal visible={detailsModalVisible} onDismiss={() => setDetailsModalVisible(false)} contentContainerStyle={styles.modalContainer}>
          {selectedOrder && (
            <ScrollView>
              <Title>Order #{selectedOrder.orderNumber}</Title>
              <Paragraph>Placed on: {format(new Date(selectedOrder.createdAt), 'dd MMM yyyy, h:mm a')}</Paragraph>
              
              <Title style={styles.detailTitle}>Customer Details</Title>
              <Paragraph>Name: {selectedOrder.customer.name}</Paragraph>
              <Paragraph>Email: {selectedOrder.customer.email}</Paragraph>
              <Paragraph>Phone: {selectedOrder.customer.phone}</Paragraph>

              {selectedOrder.customer.address && (
                <>
                  <Title style={styles.detailTitle}>Shipping Address</Title>
                  <Paragraph>{selectedOrder.customer.address.street}</Paragraph>
                  <Paragraph>{selectedOrder.customer.address.city}, {selectedOrder.customer.address.state} {selectedOrder.customer.address.zipCode}</Paragraph>
                  <Paragraph>{selectedOrder.customer.address.country}</Paragraph>
                </>
              )}

              <Title style={styles.detailTitle}>Order Items</Title>
              {selectedOrder.items.map((item, index) => (
                <Paragraph key={index}>- {item.productName} (x{item.quantity}) @ ${item.price}</Paragraph>
              ))}
              <Button onPress={() => setDetailsModalVisible(false)} style={{marginTop: 20}}>Close</Button>
            </ScrollView>
          )}
        </Modal>
      </Portal>

      {/* Tracking Modal (existing) */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>Add Tracking Information</Title>

          <TextInput
            label="Tracking Number"
            value={trackingNumber}
            onChangeText={setTrackingNumber}
            mode="outlined"
            style={styles.modalInput}
          />

          <TextInput
            label="Carrier"
            value={carrier}
            onChangeText={setCarrier}
            mode="outlined"
            style={styles.modalInput}
            placeholder="e.g., FedEx, UPS, DHL"
          />

          <View style={styles.modalButtons}>
            <Button mode="outlined" onPress={() => setModalVisible(false)} style={styles.modalButton}>
              Cancel
            </Button>
            <Button mode="contained" onPress={updateTracking} style={styles.modalButton}>
              Update
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingBottom: 16,
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  orderCard: {
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  orderMeta: {
    alignItems: "flex-end",
    marginRight: 8,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 8,
  },
  statusChip: {
    height: 28,
  },
  orderDetails: {
    marginBottom: 12,
  },
  customerEmail: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  tracking: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1976D2",
  },
  itemsList: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 12,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  itemName: {
    flex: 1,
    fontSize: 12,
  },
  itemDetails: {
    fontSize: 12,
    opacity: 0.7,
  },
  moreItems: {
    fontSize: 12,
    fontStyle: "italic",
    opacity: 0.7,
    marginTop: 4,
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 16,
    textAlign: "center",
  },
  modalInput: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 18,
    marginTop: 15,
    marginBottom: 5,
  },
})

export default OrderScreen
