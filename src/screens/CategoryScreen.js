"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, FlatList, RefreshControl, Alert, Image, TouchableOpacity } from "react-native"
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
import * as ImagePicker from "expo-image-picker"
import { Formik } from "formik"
import * as Yup from "yup"
import { categoryAPI } from "../services/api"
import { useAuth } from "../context/AuthContext"

const validationSchema = Yup.object().shape({
  name: Yup.string().required("Category name is required"),
  description: Yup.string(),
})

const CategoryScreen = () => {
  const theme = useTheme()
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [filteredCategories, setFilteredCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [menuVisible, setMenuVisible] = useState({})
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [categoryImage, setCategoryImage] = useState(null)

  useEffect(() => {
    fetchCategories()
    requestPermissions()
  }, [])

  useEffect(() => {
    filterCategories()
  }, [searchQuery, categories])

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions to upload images.")
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getCategories()
      setCategories(response.data)
    } catch (error) {
      console.error("Error fetching categories:", error)
      Alert.alert("Error", "Failed to fetch categories")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterCategories = () => {
    if (!searchQuery) {
      setFilteredCategories(categories)
    } else {
      const filtered = categories.filter((category) => category.name.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredCategories(filtered)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchCategories()
  }

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled) {
        setCategoryImage(result.assets[0].uri)
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image")
    }
  }

  const handleSubmit = async (values, { resetForm }) => {
    try {
      const formData = new FormData()
      formData.append("name", values.name)
      formData.append("description", values.description)

      if (categoryImage) {
        formData.append("image", {
          uri: categoryImage,
          type: "image/jpeg",
          name: "category.jpg",
        })
      }

      if (selectedCategory) {
        await categoryAPI.updateCategory(selectedCategory._id, values)
        Alert.alert("Success", "Category updated successfully")
      } else {
        await categoryAPI.createCategory(formData)
        Alert.alert("Success", "Category created successfully")
      }

      setModalVisible(false)
      setSelectedCategory(null)
      setCategoryImage(null)
      resetForm()
      fetchCategories()
    } catch (error) {
      console.error("Error saving category:", error)
      Alert.alert("Error", "Failed to save category")
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    Alert.alert("Delete Category", "Are you sure you want to delete this category?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await categoryAPI.deleteCategory(categoryId)
            fetchCategories()
            Alert.alert("Success", "Category deleted successfully")
          } catch (error) {
            Alert.alert("Error", "Failed to delete category")
          }
        },
      },
    ])
  }

  const toggleMenu = (categoryId) => {
    setMenuVisible((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

  const openModal = (category = null) => {
    setSelectedCategory(category)
    setCategoryImage(category?.image || null)
    setModalVisible(true)
  }

  const renderCategory = ({ item }) => (
    <Card style={styles.categoryCard}>
      <View style={styles.categoryContent}>
        {item.image && (
          <Image
            source={{ uri: `http://34.18.0.53:3000/${item.image}` }}
            style={styles.categoryImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.categoryInfo}>
          <Title style={styles.categoryName}>{item.name}</Title>
          {item.description && <Paragraph style={styles.categoryDescription}>{item.description}</Paragraph>}

          <View style={styles.categoryMeta}>
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
                openModal(item)
              }}
              title="Edit"
              leadingIcon="pencil"
            />
            <Menu.Item
              onPress={() => {
                toggleMenu(item._id)
                handleDeleteCategory(item._id)
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
        placeholder="Search categories..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredCategories}
        renderItem={renderCategory}
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
          <Title style={styles.modalTitle}>{selectedCategory ? "Edit Category" : "Create Category"}</Title>

          <Formik
            initialValues={{
              name: selectedCategory?.name || "",
              description: selectedCategory?.description || "",
              isActive: selectedCategory?.isActive !== undefined ? selectedCategory.isActive : true,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
              <View>
                <TextInput
                  label="Category Name"
                  value={values.name}
                  onChangeText={handleChange("name")}
                  onBlur={handleBlur("name")}
                  mode="outlined"
                  style={styles.modalInput}
                  error={touched.name && errors.name}
                />

                <TextInput
                  label="Description"
                  value={values.description}
                  onChangeText={handleChange("description")}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.modalInput}
                />

                <View style={styles.imageSection}>
                  <Paragraph style={styles.imageLabel}>Category Image</Paragraph>
                  <View style={styles.imageContainer}>
                    {categoryImage && (
                      <Image
                        source={{
                          uri: categoryImage.startsWith("http")
                            ? `http://34.18.0.53:3000/${categoryImage}`
                            : categoryImage,
                        }}
                        style={styles.selectedImage}
                      />
                    )}
                    <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                      <IconButton icon="camera" size={30} />
                      <Paragraph>{categoryImage ? "Change Image" : "Add Image"}</Paragraph>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.switchRow}>
                  <Paragraph>Active Category</Paragraph>
                  <Switch value={values.isActive} onValueChange={(value) => setFieldValue("isActive", value)} />
                </View>

                <View style={styles.modalButtons}>
                  <Button mode="outlined" onPress={() => setModalVisible(false)} style={styles.modalButton}>
                    Cancel
                  </Button>
                  <Button mode="contained" onPress={handleSubmit} style={styles.modalButton}>
                    {selectedCategory ? "Update" : "Create"}
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
  categoryCard: {
    marginBottom: 16,
  },
  categoryContent: {
    flexDirection: "row",
    padding: 16,
  },
  categoryImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  categoryMeta: {
    flexDirection: "row",
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
  imageSection: {
    marginBottom: 16,
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  imageContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  imageButton: {
    alignItems: "center",
    padding: 16,
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    borderRadius: 8,
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

export default CategoryScreen
