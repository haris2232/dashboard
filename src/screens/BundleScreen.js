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
  List,
} from "react-native-paper"
import { Formik } from "formik"
import * as Yup from "yup"
import { bundleAPI, productAPI } from "../services/api"
import { useAuth } from "../context/AuthContext"

const validationSchema = Yup.object().shape({
  name: Yup.string().required("Bundle name is required"),
  bundlePrice: Yup.number().positive("Bundle price must be positive").required("Bundle price is required"),
})

const BundleScreen = () => {
  const theme = useTheme()
  const { user } = useAuth()
  const [bundles, setBundles] = useState([])
  const [filteredBundles, setFilteredBundles] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [menuVisible, setMenuVisible] = useState({})
  const [modalVisible, setModalVisible] = useState(false)
  const [productModalVisible, setProductModalVisible] = useState(false)
  const [selectedBundle, setSelectedBundle] = useState(null)
  const [selectedProducts, setSelectedProducts] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterBundles()
  }, [searchQuery, bundles])

  const fetchData = async () => {
    try {
      const [bundlesRes, productsRes] = await Promise.all([bundleAPI.getBundles(), productAPI.getProducts()])

      setBundles(bundlesRes.data)
      setProducts(productsRes.data)
    } catch (error) {
      console.error("Error fetching data:", error)
      Alert.alert("Error", "Failed to fetch data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterBundles = () => {
    if (!searchQuery) {
      setFilteredBundles(bundles)
    } else {
      const filtered = bundles.filter((bundle) => bundle.name.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredBundles(filtered)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handleSubmit = async (values, { resetForm }) => {
    try {
      const bundleData = {
        ...values,
        bundlePrice: Number.parseFloat(values.bundlePrice),
        products: selectedProducts.map((p) => p._id),
        originalPrice: selectedProducts.reduce((sum, p) => sum + p.price, 0),
        startDate: values.startDate ? new Date(values.startDate) : undefined,
        endDate: values.endDate ? new Date(values.endDate) : undefined,
      }

      if (selectedBundle) {
        await bundleAPI.updateBundle(selectedBundle._id, bundleData)
        Alert.alert("Success", "Bundle updated successfully")
      } else {
        await bundleAPI.createBundle(bundleData)
        Alert.alert("Success", "Bundle created successfully")
      }

      setModalVisible(false)
      setSelectedBundle(null)
      setSelectedProducts([])
      resetForm()
      fetchData()
    } catch (error) {
      console.error("Error saving bundle:", error)
      Alert.alert("Error", "Failed to save bundle")
    }
  }

  const handleDeleteBundle = async (bundleId) => {
    Alert.alert("Delete Bundle", "Are you sure you want to delete this bundle?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await bundleAPI.deleteBundle(bundleId)
            fetchData()
            Alert.alert("Success", "Bundle deleted successfully")
          } catch (error) {
            Alert.alert("Error", "Failed to delete bundle")
          }
        },
      },
    ])
  }

  const toggleMenu = (bundleId) => {
    setMenuVisible((prev) => ({
      ...prev,
      [bundleId]: !prev[bundleId],
    }))
  }

  const openModal = (bundle = null) => {
    setSelectedBundle(bundle)
    setSelectedProducts(bundle?.products || [])
    setModalVisible(true)
  }

  const toggleProductSelection = (product) => {
    setSelectedProducts((prev) => {
      const isSelected = prev.find((p) => p._id === product._id)
      if (isSelected) {
        return prev.filter((p) => p._id !== product._id)
      } else {
        return [...prev, product]
      }
    })
  }

  const renderBundle = ({ item }) => (
    <Card style={styles.bundleCard}>
      <Card.Content>
        <View style={styles.bundleHeader}>
          <View style={styles.bundleInfo}>
            <Title style={styles.bundleName}>{item.name}</Title>
            <View style={styles.priceInfo}>
              <Paragraph style={styles.originalPrice}>Original: ${item.originalPrice?.toFixed(2)}</Paragraph>
              <Paragraph style={styles.bundlePrice}>Bundle: ${item.bundlePrice.toFixed(2)}</Paragraph>
              <Paragraph style={styles.savings}>
                Save: ${((item.originalPrice || 0) - item.bundlePrice).toFixed(2)}
              </Paragraph>
            </View>
          </View>

          <View style={styles.bundleMeta}>
            <Chip
              mode="outlined"
              style={[styles.statusChip, { backgroundColor: item.isActive ? "#E8F5E8" : "#FFEBEE" }]}
            >
              {item.isActive ? "Active" : "Inactive"}
            </Chip>

            {item.startDate && item.endDate && (
              <Paragraph style={styles.dateRange}>
                {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
              </Paragraph>
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
                  handleDeleteBundle(item._id)
                }}
                title="Delete"
                leadingIcon="delete"
              />
            </Menu>
          )}
        </View>

        <View style={styles.productsList}>
          <Paragraph style={styles.productsLabel}>Products in bundle:</Paragraph>
          {item.products?.slice(0, 3).map((product, index) => (
            <Paragraph key={index} style={styles.productItem}>
              • {product.title} - ${product.price}
            </Paragraph>
          ))}
          {item.products?.length > 3 && (
            <Paragraph style={styles.moreProducts}>+{item.products.length - 3} more products</Paragraph>
          )}
        </View>
      </Card.Content>
    </Card>
  )

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search bundles..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredBundles}
        renderItem={renderBundle}
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
          <Title style={styles.modalTitle}>{selectedBundle ? "Edit Bundle" : "Create Bundle"}</Title>

          <Formik
            initialValues={{
              name: selectedBundle?.name || "",
              bundlePrice: selectedBundle?.bundlePrice?.toString() || "",
              startDate: selectedBundle?.startDate
                ? new Date(selectedBundle.startDate).toISOString().split("T")[0]
                : "",
              endDate: selectedBundle?.endDate ? new Date(selectedBundle.endDate).toISOString().split("T")[0] : "",
              isActive: selectedBundle?.isActive !== undefined ? selectedBundle.isActive : true,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
              <View>
                <TextInput
                  label="Bundle Name"
                  value={values.name}
                  onChangeText={handleChange("name")}
                  onBlur={handleBlur("name")}
                  mode="outlined"
                  style={styles.modalInput}
                  error={touched.name && errors.name}
                />

                <View style={styles.productsSection}>
                  <Paragraph style={styles.productsLabel}>Selected Products ({selectedProducts.length})</Paragraph>
                  <Button
                    mode="outlined"
                    onPress={() => setProductModalVisible(true)}
                    style={styles.selectProductsButton}
                  >
                    Select Products
                  </Button>

                  {selectedProducts.length > 0 && (
                    <View style={styles.selectedProductsList}>
                      {selectedProducts.map((product, index) => (
                        <Paragraph key={index} style={styles.selectedProduct}>
                          • {product.title} - ${product.price}
                        </Paragraph>
                      ))}
                      <Paragraph style={styles.totalOriginalPrice}>
                        Total Original Price: ${selectedProducts.reduce((sum, p) => sum + p.price, 0).toFixed(2)}
                      </Paragraph>
                    </View>
                  )}
                </View>

                <TextInput
                  label="Bundle Price ($)"
                  value={values.bundlePrice}
                  onChangeText={handleChange("bundlePrice")}
                  onBlur={handleBlur("bundlePrice")}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.modalInput}
                  error={touched.bundlePrice && errors.bundlePrice}
                />

                <View style={styles.row}>
                  <TextInput
                    label="Start Date"
                    value={values.startDate}
                    onChangeText={handleChange("startDate")}
                    mode="outlined"
                    placeholder="YYYY-MM-DD"
                    style={[styles.modalInput, styles.halfWidth]}
                  />

                  <TextInput
                    label="End Date"
                    value={values.endDate}
                    onChangeText={handleChange("endDate")}
                    mode="outlined"
                    placeholder="YYYY-MM-DD"
                    style={[styles.modalInput, styles.halfWidth]}
                  />
                </View>

                <View style={styles.switchRow}>
                  <Paragraph>Active Bundle</Paragraph>
                  <Switch value={values.isActive} onValueChange={(value) => setFieldValue("isActive", value)} />
                </View>

                <View style={styles.modalButtons}>
                  <Button mode="outlined" onPress={() => setModalVisible(false)} style={styles.modalButton}>
                    Cancel
                  </Button>
                  <Button mode="contained" onPress={handleSubmit} style={styles.modalButton}>
                    {selectedBundle ? "Update" : "Create"}
                  </Button>
                </View>
              </View>
            )}
          </Formik>
        </Modal>

        <Modal
          visible={productModalVisible}
          onDismiss={() => setProductModalVisible(false)}
          contentContainerStyle={styles.productModalContainer}
        >
          <Title style={styles.modalTitle}>Select Products</Title>

          <FlatList
            data={products}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <List.Item
                title={item.title}
                description={`$${item.price} - Stock: ${item.inventory}`}
                left={(props) => (
                  <IconButton
                    {...props}
                    icon={
                      selectedProducts.find((p) => p._id === item._id) ? "checkbox-marked" : "checkbox-blank-outline"
                    }
                    onPress={() => toggleProductSelection(item)}
                  />
                )}
                onPress={() => toggleProductSelection(item)}
              />
            )}
            style={styles.productsList}
          />

          <Button mode="contained" onPress={() => setProductModalVisible(false)} style={styles.doneButton}>
            Done ({selectedProducts.length} selected)
          </Button>
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
  bundleCard: {
    marginBottom: 16,
  },
  bundleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bundleInfo: {
    flex: 1,
  },
  bundleName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  priceInfo: {
    flexDirection: "row",
    gap: 12,
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: "line-through",
    opacity: 0.7,
  },
  bundlePrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  savings: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#D32F2F",
  },
  bundleMeta: {
    alignItems: "flex-end",
    marginRight: 8,
  },
  statusChip: {
    height: 28,
    marginBottom: 8,
  },
  dateRange: {
    fontSize: 10,
    opacity: 0.7,
  },
  productsList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  productsLabel: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  productItem: {
    fontSize: 12,
    marginBottom: 2,
  },
  moreProducts: {
    fontSize: 12,
    fontStyle: "italic",
    opacity: 0.7,
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
  productModalContainer: {
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
  productsSection: {
    marginBottom: 16,
  },
  selectProductsButton: {
    marginBottom: 8,
  },
  selectedProductsList: {
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 8,
  },
  selectedProduct: {
    fontSize: 12,
    marginBottom: 2,
  },
  totalOriginalPrice: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
    color: "#2E7D32",
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
  doneButton: {
    marginTop: 16,
  },
})

export default BundleScreen
