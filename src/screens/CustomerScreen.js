"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList, RefreshControl, Alert } from "react-native"
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
import { customerAPI } from "../services/api"
import { useAuth } from "../context/AuthContext"

const CustomerScreen = () => {
  const theme = useTheme()
  const { user } = useAuth()
  const [customers, setCustomers] = useState([])
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [menuVisible, setMenuVisible] = useState({})
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    filterCustomers()
  }, [searchQuery, customers])

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getCustomers()
      setCustomers(response.data)
    } catch (error) {
      console.error("Error fetching customers:", error)
      Alert.alert("Error", "Failed to fetch customers")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterCustomers = () => {
    if (!searchQuery) {
      setFilteredCustomers(customers)
    } else {
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredCustomers(filtered)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchCustomers()
  }

  const toggleCustomerStatus = async (customerId, isBanned) => {
    try {
      await customerAPI.updateCustomer(customerId, { isBanned: !isBanned })
      fetchCustomers()
      Alert.alert("Success", `Customer ${!isBanned ? "banned" : "activated"} successfully`)
    } catch (error) {
      Alert.alert("Error", "Failed to update customer status")
    }
  }

  const updateCustomerNotes = async () => {
    try {
      await customerAPI.updateCustomer(selectedCustomer._id, { notes })
      setModalVisible(false)
      fetchCustomers()
      Alert.alert("Success", "Customer notes updated successfully")
    } catch (error) {
      Alert.alert("Error", "Failed to update customer notes")
    }
  }

  const toggleMenu = (customerId) => {
    setMenuVisible((prev) => ({
      ...prev,
      [customerId]: !prev[customerId],
    }))
  }

  const openNotesModal = (customer) => {
    setSelectedCustomer(customer)
    setNotes(customer.notes || "")
    setModalVisible(true)
  }

  const renderCustomer = ({ item }) => (
    <Card style={styles.customerCard}>
      <Card.Content>
        <View style={styles.customerHeader}>
          <View style={styles.customerInfo}>
            <Title style={styles.customerName}>{item.name}</Title>
            <Paragraph style={styles.customerEmail}>{item.email}</Paragraph>
            {item.phone && <Paragraph style={styles.customerPhone}>{item.phone}</Paragraph>}
            <Paragraph style={styles.joinDate}>Joined: {new Date(item.createdAt).toLocaleDateString()}</Paragraph>
          </View>

          <View style={styles.customerMeta}>
            <Paragraph style={styles.totalOrders}>{item.totalOrders} orders</Paragraph>
            <Paragraph style={styles.totalSpent}>${item.totalSpent.toFixed(2)} spent</Paragraph>
            <Chip
              mode="outlined"
              style={[styles.statusChip, { backgroundColor: item.isBanned ? "#FFEBEE" : "#E8F5E8" }]}
            >
              {item.isBanned ? "Banned" : "Active"}
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
                  openNotesModal(item)
                }}
                title="Add Notes"
                leadingIcon="note-text"
              />
              <Menu.Item
                onPress={() => {
                  toggleMenu(item._id)
                  toggleCustomerStatus(item._id, item.isBanned)
                }}
                title={item.isBanned ? "Activate" : "Ban Customer"}
                leadingIcon={item.isBanned ? "account-check" : "account-cancel"}
              />
            </Menu>
          )}
        </View>

        {item.address && (
          <View style={styles.addressSection}>
            <Paragraph style={styles.addressLabel}>Address:</Paragraph>
            <Paragraph style={styles.address}>{item.address}</Paragraph>
          </View>
        )}

        {item.notes && (
          <View style={styles.notesSection}>
            <Paragraph style={styles.notesLabel}>Notes:</Paragraph>
            <Paragraph style={styles.notes}>{item.notes}</Paragraph>
          </View>
        )}
      </Card.Content>
    </Card>
  )

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search customers..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>Customer Notes</Title>
          <Paragraph style={styles.customerModalName}>{selectedCustomer?.name}</Paragraph>

          <TextInput
            label="Internal Notes"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.modalInput}
            placeholder="Add internal notes about this customer..."
          />

          <View style={styles.modalButtons}>
            <Button mode="outlined" onPress={() => setModalVisible(false)} style={styles.modalButton}>
              Cancel
            </Button>
            <Button mode="contained" onPress={updateCustomerNotes} style={styles.modalButton}>
              Save Notes
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
  },
  searchbar: {
    margin: 16,
    marginBottom: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  customerCard: {
    marginBottom: 16,
  },
  customerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  customerEmail: {
    fontSize: 14,
    marginBottom: 2,
    color: "#1976D2",
  },
  customerPhone: {
    fontSize: 14,
    marginBottom: 2,
  },
  joinDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  customerMeta: {
    alignItems: "flex-end",
    marginRight: 8,
  },
  totalOrders: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  totalSpent: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 8,
  },
  statusChip: {
    height: 28,
  },
  addressSection: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  address: {
    fontSize: 12,
    opacity: 0.8,
  },
  notesSection: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  notes: {
    fontSize: 12,
    fontStyle: "italic",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  customerModalName: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    opacity: 0.7,
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
})

export default CustomerScreen
