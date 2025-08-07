"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert, Image, TouchableOpacity } from "react-native"
import {
  TextInput,
  Button,
  Title,
  Paragraph,
  Card,
  Switch,
  IconButton,
  useTheme,
  HelperText,
  Menu,
  Divider,
} from "react-native-paper"
import { Formik, FieldArray } from "formik"
import * as Yup from "yup"
import * as ImagePicker from "expo-image-picker"
import { useNavigation, useRoute } from "@react-navigation/native"
import { productAPI, categoryAPI } from "../services/api"

const validationSchema = Yup.object().shape({
  title: Yup.string().required("Title is required"),
  price: Yup.number().positive("Price must be positive").required("Price is required"),
  sku: Yup.string().required("SKU is required"),
  inventory: Yup.number().min(0, "Inventory cannot be negative").required("Inventory is required"),
})

const ProductFormScreen = () => {
  const theme = useTheme()
  const navigation = useNavigation()
  const route = useRoute()
  const { product } = route.params || {}

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState(product?.images || [])
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false)

  useEffect(() => {
    fetchCategories()
    requestPermissions()
  }, [])

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
    }
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
        setImages((prev) => [...prev, result.assets[0].uri])
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image")
    }
  }

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (values) => {
    try {
      setLoading(true)

      const formData = new FormData()

      // Add product data
      formData.append(
        "productData",
        JSON.stringify({
          ...values,
          price: Number.parseFloat(values.price),
          inventory: Number.parseInt(values.inventory),
        }),
      )

      // Add new images
      images.forEach((imageUri, index) => {
        if (imageUri.startsWith("file://")) {
          formData.append("images", {
            uri: imageUri,
            type: "image/jpeg",
            name: `image_${index}.jpg`,
          })
        }
      })

      if (product) {
        await productAPI.updateProduct(product._id, formData)
        Alert.alert("Success", "Product updated successfully")
      } else {
        await productAPI.createProduct(formData)
        Alert.alert("Success", "Product created successfully")
      }

      navigation.goBack()
    } catch (error) {
      console.error("Error saving product:", error)
      Alert.alert("Error", "Failed to save product")
    } finally {
      setLoading(false)
    }
  }

  const initialValues = {
    title: product?.title || "",
    price: product?.price?.toString() || "",
    sku: product?.sku || "",
    inventory: product?.inventory?.toString() || "0",
    tags: product?.tags || [],
    category: product?.category?._id || "",
    description: product?.description || "",
    purpose: product?.purpose || "",
    features: product?.features || "",
    material: product?.material || "",
    featuredHighlight: product?.featuredHighlight || "",
    isActive: product?.isActive !== undefined ? product.isActive : true,
    variants: product?.variants || [],
  }

  return (
    <ScrollView style={styles.container}>
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
          <View style={styles.form}>
            {/* Basic Information */}
            <Card style={styles.section}>
              <Card.Content>
                <Title style={styles.sectionTitle}>Basic Information</Title>

                <TextInput
                  label="Product Title"
                  value={values.title}
                  onChangeText={handleChange("title")}
                  onBlur={handleBlur("title")}
                  mode="outlined"
                  style={styles.input}
                  error={touched.title && errors.title}
                />
                <HelperText type="error" visible={touched.title && errors.title}>
                  {errors.title}
                </HelperText>

                <View style={styles.row}>
                  <TextInput
                    label="Price ($)"
                    value={values.price}
                    onChangeText={handleChange("price")}
                    onBlur={handleBlur("price")}
                    mode="outlined"
                    keyboardType="numeric"
                    style={[styles.input, styles.halfWidth]}
                    error={touched.price && errors.price}
                  />

                  <TextInput
                    label="SKU"
                    value={values.sku}
                    onChangeText={handleChange("sku")}
                    onBlur={handleBlur("sku")}
                    mode="outlined"
                    style={[styles.input, styles.halfWidth]}
                    error={touched.sku && errors.sku}
                  />
                </View>

                <TextInput
                  label="Inventory"
                  value={values.inventory}
                  onChangeText={handleChange("inventory")}
                  onBlur={handleBlur("inventory")}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.input}
                  error={touched.inventory && errors.inventory}
                />

                {/* Category Selection */}
                <Menu
                  visible={categoryMenuVisible}
                  onDismiss={() => setCategoryMenuVisible(false)}
                  anchor={
                    <TouchableOpacity onPress={() => setCategoryMenuVisible(true)}>
                      <TextInput
                        label="Category"
                        value={categories.find((cat) => cat._id === values.category)?.name || ""}
                        mode="outlined"
                        style={styles.input}
                        editable={false}
                        right={<TextInput.Icon icon="chevron-down" />}
                      />
                    </TouchableOpacity>
                  }
                >
                  {categories.map((category) => (
                    <Menu.Item
                      key={category._id}
                      onPress={() => {
                        setFieldValue("category", category._id)
                        setCategoryMenuVisible(false)
                      }}
                      title={category.name}
                    />
                  ))}
                </Menu>

                <View style={styles.switchRow}>
                  <Paragraph>Active Product</Paragraph>
                  <Switch value={values.isActive} onValueChange={(value) => setFieldValue("isActive", value)} />
                </View>
              </Card.Content>
            </Card>

            {/* Images */}
            <Card style={styles.section}>
              <Card.Content>
                <Title style={styles.sectionTitle}>Product Images</Title>

                <View style={styles.imageContainer}>
                  {images.map((imageUri, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image
                        source={{
                          uri: imageUri.startsWith("http") ? `http://34.18.0.53:3000/${imageUri}` : imageUri,
                        }}
                        style={styles.productImage}
                      />
                      <IconButton
                        icon="close"
                        size={20}
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      />
                    </View>
                  ))}

                  <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                    <IconButton icon="plus" size={30} />
                    <Paragraph>Add Image</Paragraph>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>

            {/* Product Details */}
            <Card style={styles.section}>
              <Card.Content>
                <Title style={styles.sectionTitle}>Product Details</Title>

                <TextInput
                  label="Description"
                  value={values.description}
                  onChangeText={handleChange("description")}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  style={styles.input}
                />

                <TextInput
                  label="Purpose"
                  value={values.purpose}
                  onChangeText={handleChange("purpose")}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />

                <TextInput
                  label="Features & Fit"
                  value={values.features}
                  onChangeText={handleChange("features")}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />

                <TextInput
                  label="Material & Care"
                  value={values.material}
                  onChangeText={handleChange("material")}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />

                <TextInput
                  label="Featured Highlight"
                  value={values.featuredHighlight}
                  onChangeText={handleChange("featuredHighlight")}
                  mode="outlined"
                  style={styles.input}
                />
              </Card.Content>
            </Card>

            {/* Variants */}
            <Card style={styles.section}>
              <Card.Content>
                <Title style={styles.sectionTitle}>Product Variants</Title>

                <FieldArray name="variants">
                  {({ push, remove }) => (
                    <View>
                      {values.variants.map((variant, index) => (
                        <View key={index} style={styles.variantContainer}>
                          <View style={styles.variantHeader}>
                            <Paragraph style={styles.variantTitle}>Variant {index + 1}</Paragraph>
                            <IconButton icon="delete" size={20} onPress={() => remove(index)} />
                          </View>

                          <TextInput
                            label="Size"
                            value={variant.size}
                            onChangeText={handleChange(`variants.${index}.size`)}
                            mode="outlined"
                            style={styles.input}
                          />

                          <TextInput
                            label="Color"
                            value={variant.color}
                            onChangeText={handleChange(`variants.${index}.color`)}
                            mode="outlined"
                            style={styles.input}
                          />

                          <View style={styles.row}>
                            <TextInput
                              label="SKU"
                              value={variant.sku}
                              onChangeText={handleChange(`variants.${index}.sku`)}
                              mode="outlined"
                              style={[styles.input, styles.halfWidth]}
                            />

                            <TextInput
                              label="Stock"
                              value={variant.stock?.toString()}
                              onChangeText={handleChange(`variants.${index}.stock`)}
                              mode="outlined"
                              keyboardType="numeric"
                              style={[styles.input, styles.halfWidth]}
                            />
                          </View>

                          <TextInput
                            label="Price ($)"
                            value={variant.price?.toString()}
                            onChangeText={handleChange(`variants.${index}.price`)}
                            mode="outlined"
                            keyboardType="numeric"
                            style={styles.input}
                          />

                          <Divider style={styles.divider} />
                        </View>
                      ))}

                      <Button
                        mode="outlined"
                        onPress={() =>
                          push({
                            size: "",
                            color: "",
                            sku: "",
                            stock: 0,
                            price: 0,
                          })
                        }
                        style={styles.addVariantButton}
                      >
                        Add Variant
                      </Button>
                    </View>
                  )}
                </FieldArray>
              </Card.Content>
            </Card>

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
            >
              {product ? "Update Product" : "Create Product"}
            </Button>
          </View>
        )}
      </Formik>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  form: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
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
    marginTop: 16,
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  imageWrapper: {
    position: "relative",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "red",
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  variantContainer: {
    marginBottom: 16,
  },
  variantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  variantTitle: {
    fontWeight: "bold",
  },
  divider: {
    marginTop: 16,
  },
  addVariantButton: {
    marginTop: 8,
  },
  submitButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
})

export default ProductFormScreen
