"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList, RefreshControl, Alert, Image } from "react-native"
import { Card, Title, Paragraph, FAB, Searchbar, Chip, IconButton, Menu, useTheme } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import { productAPI } from "../services/api"
import { useAuth } from "../context/AuthContext"

const ProductListScreen = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [menuVisible, setMenuVisible] = useState({})

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [searchQuery, products])

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getProducts()
      setProducts(response.data)
    } catch (error) {
      console.error("Error fetching products:", error)
      Alert.alert("Error", "Failed to fetch products")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterProducts = () => {
    if (!searchQuery) {
      setFilteredProducts(products)
    } else {
      const filtered = products.filter(
        (product) =>
          product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredProducts(filtered)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchProducts()
  }

  const handleDeleteProduct = async (productId) => {
    Alert.alert("Delete Product", "Are you sure you want to delete this product?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await productAPI.deleteProduct(productId)
            fetchProducts()
          } catch (error) {
            Alert.alert("Error", "Failed to delete product")
          }
        },
      },
    ])
  }

  const toggleMenu = (productId) => {
    setMenuVisible((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }))
  }

  const renderProduct = ({ item }) => (
    <Card style={styles.productCard}>
      <View style={styles.productContent}>
        {item.images && item.images.length > 0 && (
          <Image
            source={{ uri: `http://34.18.0.53:3000/${item.images[0]}` }}
            style={styles.productImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.productInfo}>
          <Title style={styles.productTitle}>{item.title}</Title>
          <Paragraph style={styles.productSku}>SKU: {item.sku}</Paragraph>
          <Paragraph style={styles.productPrice}>${item.price}</Paragraph>

          <View style={styles.productMeta}>
            <Chip
              mode="outlined"
              style={[styles.stockChip, { backgroundColor: item.inventory > 10 ? "#E8F5E8" : "#FFEBEE" }]}
            >
              Stock: {item.inventory}
            </Chip>

            <Chip
              mode="outlined"
              style={[styles.statusChip, { backgroundColor: item.isActive ? "#E8F5E8" : "#FFEBEE" }]}
            >
              {item.isActive ? "Active" : "Inactive"}
            </Chip>
          </View>
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
                navigation.navigate("ProductForm", { product: item })
              }}
              title="Edit"
              leadingIcon="pencil"
            />
            <Menu.Item
              onPress={() => {
                toggleMenu(item._id)
                handleDeleteProduct(item._id)
              }}
              title="Delete"
              leadingIcon="delete"
            />
          </Menu>
        )}
      </View>
    </Card>
  )

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search products..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {(user?.role === "admin" || user?.role === "manager") && (
        <FAB
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          icon="plus"
          onPress={() => navigation.navigate("ProductForm")}
        />
      )}
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
  productCard: {
    marginBottom: 16,
  },
  productContent: {
    flexDirection: "row",
    padding: 16,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  productSku: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: "row",
    gap: 8,
  },
  stockChip: {
    height: 24,
  },
  statusChip: {
    height: 24,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
})

export default ProductListScreen
