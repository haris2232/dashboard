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
} from "react-native-paper"
import { Formik } from "formik"
import * as Yup from "yup"
import { couponAPI, productAPI, categoryAPI } from "../services/api"
import { useAuth } from "../context/AuthContext"

const validationSchema = Yup.object().shape({
  code: Yup.string().required("Coupon code is required"),
  type: Yup.string().oneOf(["flat", "percentage"]).required("Discount type is required"),
  value: Yup.number().positive("Value must be positive").required("Value is required"),
  usageLimit: Yup.number().min(1, "Usage limit must be at least 1"),
})

const CouponScreen = () => {
  const theme = useTheme()
  const { user } = useAuth()
  const [coupons, setCoupons] = useState([])
  const [filteredCoupons, setFilteredCoupons] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [menuVisible, setMenuVisible] = useState({})
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterCoupons()
  }, [searchQuery, coupons])

  const fetchData = async () => {
    try {
      const [couponsRes, productsRes, categoriesRes] = await Promise.all([
        couponAPI.getCoupons(),
        productAPI.getProducts(),
        categoryAPI.getCategories(),
      ])

      setCoupons(couponsRes.data)
      setProducts(productsRes.data)
      setCategories(categoriesRes.data)
    } catch (error) {
      console.error("Error fetching data:", error)
      Alert.alert("Error", "Failed to fetch data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterCoupons = () => {
    if (!searchQuery) {
      setFilteredCoupons(coupons)
    } else {
      const filtered = coupons.filter((coupon) => coupon.code.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredCoupons(filtered)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handleSubmit = async (values, { resetForm }) => {
    try {
      const couponData = {
        ...values,
        value: Number.parseFloat(values.value),
        minAmount: values.minAmount ? Number.parseFloat(values.minAmount) : undefined,
        maxDiscount: values.maxDiscount ? Number.parseFloat(values.maxDiscount) : undefined,
        usageLimit: values.usageLimit ? Number.parseInt(values.usageLimit) : undefined,
        expiresAt: values.expiresAt ? new Date(values.expiresAt) : undefined,
      }

      if (selectedCoupon) {
        await couponAPI.updateCoupon(selectedCoupon._id, couponData)
        Alert.alert("Success", "Coupon updated successfully")
      } else {
        await couponAPI.createCoupon(couponData)
        Alert.alert("Success", "Coupon created successfully")
      }

      setModalVisible(false)
      setSelectedCoupon(null)
      resetForm()
      fetchData()
    } catch (error) {
      console.error("Error saving coupon:", error)
      Alert.alert("Error", "Failed to save coupon")
    }
  }

  const handleDeleteCoupon = async (couponId) => {
    Alert.alert("Delete Coupon", "Are you sure you want to delete this coupon?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await couponAPI.deleteCoupon(couponId)
            fetchData()
            Alert.alert("Success", "Coupon deleted successfully")
          } catch (error) {
            Alert.alert("Error", "Failed to delete coupon")
          }
        },
      },
    ])
  }

  const toggleMenu = (couponId) => {
    setMenuVisible((prev) => ({
      ...prev,
      [couponId]: !prev[couponId],
    }))
  }

  const openModal = (coupon = null) => {
    setSelectedCoupon(coupon)
    setModalVisible(true)
  }

  const getTypeColor = (type) => {
    return type === "percentage" ? "#E3F2FD" : "#E8F5E8"
  }

  const renderCoupon = ({ item }) => (
    <Card style={styles.couponCard}>
      <Card.Content>
        <View style={styles.couponHeader}>
          <View style={styles.couponInfo}>
            <Title style={styles.couponCode}>{item.code}</Title>
            <View style={styles.couponDetails}>
              <Chip mode="outlined" style={[styles.typeChip, { backgroundColor: getTypeColor(item.type) }]}>
                {item.type === "percentage" ? `${item.value}%` : `$${item.value}`}
              </Chip>
              <Chip
                mode="outlined"
                style={[styles.statusChip, { backgroundColor: item.isActive ? "#E8F5E8" : "#FFEBEE" }]}
              >
                {item.isActive ? "Active" : "Inactive"}
              </Chip>
            </View>
          </View>

          <View style={styles.couponMeta}>
            <Paragraph style={styles.usageCount}>
              Used: {item.usedCount}/{item.usageLimit || "∞"}
            </Paragraph>
            {item.expiresAt && (
              <Paragraph style={styles.expiryDate}>Expires: {new Date(item.expiresAt).toLocaleDateString()}</Paragraph>
            )}
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
                  openModal(item)
                }}
                title="Edit"
                leadingIcon="pencil"
              />
              <Menu.Item
                onPress={() => {
                  toggleMenu(item._id)
                  handleDeleteCoupon(item._id)
                }}
                title="Delete"
                leadingIcon="delete"
              />
            </Menu>
          )}
        </View>

        <View style={styles.couponConditions}>
          {item.minAmount && <Paragraph style={styles.condition}>Min Amount: ${item.minAmount}</Paragraph>}
          {item.maxDiscount && <Paragraph style={styles.condition}>Max Discount: ${item.maxDiscount}</Paragraph>}
          {item.isStackable && <Paragraph style={styles.condition}>Stackable</Paragraph>}
        </View>
      </Card.Content>
    </Card>
  )

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search coupons..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredCoupons}
        renderItem={renderCoupon}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {(user?.role === "admin" || user?.role === "manager") && (
        <FAB style={[styles.fab, { backgroundColor: theme.colors.primary }]} icon="plus" onPress={() => openModal()} />
      )}

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>{selectedCoupon ? "Edit Coupon" : "Create Coupon"}</Title>

          <Formik
            initialValues={{
              code: selectedCoupon?.code || "",
              type: selectedCoupon?.type || "percentage",
              value: selectedCoupon?.value?.toString() || "",
              minAmount: selectedCoupon?.minAmount?.toString() || "",
              maxDiscount: selectedCoupon?.maxDiscount?.toString() || "",
              usageLimit: selectedCoupon?.usageLimit?.toString() || "",
              expiresAt: selectedCoupon?.expiresAt
                ? new Date(selectedCoupon.expiresAt).toISOString().split("T")[0]
                : "",
              isStackable: selectedCoupon?.isStackable || false,
              isActive: selectedCoupon?.isActive !== undefined ? selectedCoupon.isActive : true,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
              <View>
                <TextInput
                  label="Coupon Code"
                  value={values.code}
                  onChangeText={handleChange("code")}
                  onBlur={handleBlur("code")}
                  mode="outlined"
                  autoCapitalize="characters"
                  style={styles.modalInput}
                  error={touched.code && errors.code}
                />

                <View style={styles.typeSection}>
                  <Paragraph style={styles.typeLabel}>Discount Type</Paragraph>
                  <View style={styles.typeButtons}>
                    <Button
                      mode={values.type === "percentage" ? "contained" : "outlined"}
                      onPress={() => setFieldValue("type", "percentage")}
                      style={styles.typeButton}
                    >
                      Percentage
                    </Button>
                    <Button
                      mode={values.type === "flat" ? "contained" : "outlined"}
                      onPress={() => setFieldValue("type", "flat")}
                      style={styles.typeButton}
                    >
                      Fixed Amount
                    </Button>
                  </View>
                </View>

                <TextInput
                  label={values.type === "percentage" ? "Percentage (%)" : "Amount ($)"}
                  value={values.value}
                  onChangeText={handleChange("value")}
                  onBlur={handleBlur("value")}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.modalInput}
                  error={touched.value && errors.value}
                />

                <View style={styles.row}>
                  <TextInput
                    label="Min Amount ($)"
                    value={values.minAmount}
                    onChangeText={handleChange("minAmount")}
                    mode="outlined"
                    keyboardType="numeric"
                    style={[styles.modalInput, styles.halfWidth]}
                  />

                  <TextInput
                    label="Max Discount ($)"
                    value={values.maxDiscount}
                    onChangeText={handleChange("maxDiscount")}
                    mode="outlined"
                    keyboardType="numeric"
                    style={[styles.modalInput, styles.halfWidth]}
                  />
                </View>

                <View style={styles.row}>
                  <TextInput
                    label="Usage Limit"
                    value={values.usageLimit}
                    onChangeText={handleChange("usageLimit")}
                    mode="outlined"
                    keyboardType="numeric"
                    style={[styles.modalInput, styles.halfWidth]}
                  />

                  <TextInput
                    label="Expiry Date"
                    value={values.expiresAt}
                    onChangeText={handleChange("expiresAt")}
                    mode="outlined"
                    placeholder="YYYY-MM-DD"
                    style={[styles.modalInput, styles.halfWidth]}
                  />
                </View>

                <View style={styles.switchRow}>
                  <Paragraph>Stackable with other coupons</Paragraph>
                  <Switch value={values.isStackable} onValueChange={(value) => setFieldValue("isStackable", value)} />
                </View>

                <View style={styles.switchRow}>
                  <Paragraph>Active Coupon</Paragraph>
                  <Switch value={values.isActive} onValueChange={(value) => setFieldValue("isActive", value)} />
                </View>

                <View style={styles.modalButtons}>
                  <Button mode="outlined" onPress={() => setModalVisible(false)} style={styles.modalButton}>
                    Cancel
                  </Button>
                  <Button mode="contained" onPress={handleSubmit} style={styles.modalButton}>
                    {selectedCoupon ? "Update" : "Create"}
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
  couponCard: {
    marginBottom: 16,
  },
  couponHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  couponInfo: {
    flex: 1,
  },
  couponCode: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    fontFamily: "monospace",
  },
  couponDetails: {
    flexDirection: "row",
    gap: 8,
  },
  typeChip: {
    height: 28,
  },
  statusChip: {
    height: 28,
  },
  couponMeta: {
    alignItems: "flex-end",
    marginRight: 8,
  },
  usageCount: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  expiryDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  couponConditions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  condition: {
    fontSize: 12,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
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
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 16,
    textAlign: "center",
  },
  modalInput: {
    marginBottom: 16,
  },
  typeSection: {
    marginBottom: 16,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  typeButton: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  halfWidth: {
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

export default CouponScreen
