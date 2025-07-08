"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList, RefreshControl, Alert } from "react-native"
import {
  Card,
  Title,
  Paragraph,
  FAB,
  Searchbar,
  Chip,
  IconButton,
  Menu,
  useTheme,
  Button,
  Portal,
  Modal,
  TextInput,
  Switch,
  Avatar,
} from "react-native-paper"
import { Formik } from "formik"
import * as Yup from "yup"
import { userAPI } from "../services/api"

const validationSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  email: Yup.string().email("Invalid email format").required("Email is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters"),
  role: Yup.string().oneOf(["admin", "manager", "viewer"]).required("Role is required"),
})

const UserManagementScreen = () => {
  const theme = useTheme()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [menuVisible, setMenuVisible] = useState({})
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [searchQuery, users])

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getUsers()
      setUsers(response.data)
    } catch (error) {
      console.error("Error fetching users:", error)
      Alert.alert("Error", "Failed to fetch users")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterUsers = () => {
    if (!searchQuery) {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredUsers(filtered)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchUsers()
  }

  const handleSubmit = async (values, { resetForm }) => {
    try {
      if (selectedUser) {
        await userAPI.updateUser(selectedUser._id, values)
        Alert.alert("Success", "User updated successfully")
      } else {
        await userAPI.createUser(values)
        Alert.alert("Success", "User created successfully")
      }

      setModalVisible(false)
      setSelectedUser(null)
      resetForm()
      fetchUsers()
    } catch (error) {
      console.error("Error saving user:", error)
      Alert.alert("Error", "Failed to save user")
    }
  }

  const handleDeleteUser = async (userId) => {
    Alert.alert("Delete User", "Are you sure you want to delete this user?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await userAPI.deleteUser(userId)
            fetchUsers()
            Alert.alert("Success", "User deleted successfully")
          } catch (error) {
            Alert.alert("Error", "Failed to delete user")
          }
        },
      },
    ])
  }

  const toggleMenu = (userId) => {
    setMenuVisible((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }))
  }

  const openModal = (user = null) => {
    setSelectedUser(user)
    setModalVisible(true)
  }

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "#FFEBEE"
      case "manager":
        return "#E3F2FD"
      case "viewer":
        return "#E8F5E8"
      default:
        return "#F5F5F5"
    }
  }

  const renderUser = ({ item }) => (
    <Card style={styles.userCard}>
      <Card.Content>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Avatar.Text
              size={50}
              label={item.name?.charAt(0) || item.email.charAt(0)}
              style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
            />
            <View style={styles.userDetails}>
              <Title style={styles.userName}>{item.name || "No Name"}</Title>
              <Paragraph style={styles.userEmail}>{item.email}</Paragraph>
              <Paragraph style={styles.joinDate}>Joined: {new Date(item.createdAt).toLocaleDateString()}</Paragraph>
            </View>
          </View>

          <View style={styles.userMeta}>
            <Chip mode="outlined" style={[styles.roleChip, { backgroundColor: getRoleColor(item.role) }]}>
              {item.role.toUpperCase()}
            </Chip>

            <Chip
              mode="outlined"
              style={[styles.statusChip, { backgroundColor: item.isActive ? "#E8F5E8" : "#FFEBEE" }]}
            >
              {item.isActive ? "Active" : "Inactive"}
            </Chip>
          </View>

          <Menu
            visible={menuVisible[item._id]}
            onDismiss={() => toggleMenu(item._id)}
            anchor={<IconButton icon="dots-vertical" onPress={() => toggleMenu(item._id)} />}
          >
            <Menu.Item
              onPress={() => {
                toggleMenu(item._id)
                openModal(item)
              }}
              title="Edit"
              leadingIcon="pencil"
            />
            <Menu.Item
              onPress={() => {
                toggleMenu(item._id)
                handleDeleteUser(item._id)
              }}
              title="Delete"
              leadingIcon="delete"
            />
          </Menu>
        </View>
      </Card.Content>
    </Card>
  )

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search users..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <FAB style={[styles.fab, { backgroundColor: theme.colors.primary }]} icon="plus" onPress={() => openModal()} />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>{selectedUser ? "Edit User" : "Create User"}</Title>

          <Formik
            initialValues={{
              name: selectedUser?.name || "",
              email: selectedUser?.email || "",
              password: "",
              role: selectedUser?.role || "viewer",
              isActive: selectedUser?.isActive !== undefined ? selectedUser.isActive : true,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
              <View>
                <TextInput
                  label="Full Name"
                  value={values.name}
                  onChangeText={handleChange("name")}
                  onBlur={handleBlur("name")}
                  mode="outlined"
                  style={styles.modalInput}
                  error={touched.name && errors.name}
                />

                <TextInput
                  label="Email"
                  value={values.email}
                  onChangeText={handleChange("email")}
                  onBlur={handleBlur("email")}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.modalInput}
                  error={touched.email && errors.email}
                />

                <TextInput
                  label={selectedUser ? "New Password (leave blank to keep current)" : "Password"}
                  value={values.password}
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  mode="outlined"
                  secureTextEntry
                  style={styles.modalInput}
                  error={touched.password && errors.password}
                />

                <View style={styles.roleSection}>
                  <Paragraph style={styles.roleLabel}>Role</Paragraph>
                  <View style={styles.roleButtons}>
                    {["admin", "manager", "viewer"].map((role) => (
                      <Button
                        key={role}
                        mode={values.role === role ? "contained" : "outlined"}
                        onPress={() => setFieldValue("role", role)}
                        style={styles.roleButton}
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Button>
                    ))}
                  </View>
                </View>

                <View style={styles.switchRow}>
                  <Paragraph>Active User</Paragraph>
                  <Switch value={values.isActive} onValueChange={(value) => setFieldValue("isActive", value)} />
                </View>

                <View style={styles.modalButtons}>
                  <Button mode="outlined" onPress={() => setModalVisible(false)} style={styles.modalButton}>
                    Cancel
                  </Button>
                  <Button mode="contained" onPress={handleSubmit} style={styles.modalButton}>
                    {selectedUser ? "Update" : "Create"}
                  </Button>
                </View>
              </View>
            )}
          </Formik>
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
  userCard: {
    marginBottom: 16,
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#1976D2",
    marginBottom: 2,
  },
  joinDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  userMeta: {
    alignItems: "flex-end",
    marginRight: 8,
  },
  roleChip: {
    height: 28,
    marginBottom: 8,
  },
  statusChip: {
    height: 28,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 16,
    textAlign: "center",
  },
  modalInput: {
    marginBottom: 16,
  },
  roleSection: {
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  roleButtons: {
    flexDirection: "row",
    gap: 8,
  },
  roleButton: {
    flex: 1,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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

export default UserManagementScreen
