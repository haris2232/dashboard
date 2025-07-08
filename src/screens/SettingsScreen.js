"use client"

import { useState, useEffect } from "react"
import { View, StyleSheet, ScrollView, Alert, Image, TouchableOpacity } from "react-native"
import { Card, Title, Paragraph, TextInput, Button, Switch, useTheme, IconButton } from "react-native-paper"
import * as ImagePicker from "expo-image-picker"
import { Formik } from "formik"
import * as Yup from "yup"
import { settingsAPI } from "../services/api"

const validationSchema = Yup.object().shape({
  storeName: Yup.string().required("Store name is required"),
  currency: Yup.string().required("Currency is required"),
  freeShippingThreshold: Yup.number().min(0, "Must be positive"),
  freeGiftThreshold: Yup.number().min(0, "Must be positive"),
})

const SettingsScreen = () => {
  const theme = useTheme()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoImage, setLogoImage] = useState(null)

  useEffect(() => {
    fetchSettings()
    requestPermissions()
  }, [])

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions to upload images.")
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getSettings()
      setSettings(response.data)
      setLogoImage(response.data.logo)
    } catch (error) {
      console.error("Error fetching settings:", error)
      Alert.alert("Error", "Failed to fetch settings")
    } finally {
      setLoading(false)
    }
  }

  const pickLogo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled) {
        setLogoImage(result.assets[0].uri)
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image")
    }
  }

  const handleSubmit = async (values) => {
    try {
      setSaving(true)

      const formData = new FormData()
      formData.append("settingsData", JSON.stringify(values))

      if (logoImage && logoImage.startsWith("file://")) {
        formData.append("logo", {
          uri: logoImage,
          type: "image/jpeg",
          name: "logo.jpg",
        })
      }

      await settingsAPI.updateSettings(formData)
      Alert.alert("Success", "Settings updated successfully")
      fetchSettings()
    } catch (error) {
      console.error("Error saving settings:", error)
      Alert.alert("Error", "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading || !settings) {
    return (
      <View style={styles.loadingContainer}>
        <Paragraph>Loading settings...</Paragraph>
      </View>
    )
  }

  const initialValues = {
    storeName: settings.storeName || "",
    currency: settings.currency || "USD",
    language: settings.language || "en",
    timezone: settings.timezone || "",
    country: settings.country || "",
    freeShippingThreshold: settings.freeShippingThreshold?.toString() || "0",
    freeGiftThreshold: settings.freeGiftThreshold?.toString() || "0",
    emailSettings: {
      host: settings.emailSettings?.host || "",
      port: settings.emailSettings?.port?.toString() || "587",
      username: settings.emailSettings?.username || "",
      password: settings.emailSettings?.password || "",
      senderName: settings.emailSettings?.senderName || "",
    },
    modules: {
      reviews: settings.modules?.reviews !== undefined ? settings.modules.reviews : true,
      coupons: settings.modules?.coupons !== undefined ? settings.modules.coupons : true,
      shipping: settings.modules?.shipping !== undefined ? settings.modules.shipping : true,
      bundles: settings.modules?.bundles !== undefined ? settings.modules.bundles : true,
    },
    seoMeta: {
      title: settings.seoMeta?.title || "",
      description: settings.seoMeta?.description || "",
      keywords: settings.seoMeta?.keywords || "",
    },
    contactInfo: {
      email: settings.contactInfo?.email || "",
      phone: settings.contactInfo?.phone || "",
      address: settings.contactInfo?.address || "",
    },
  }

  return (
    <ScrollView style={styles.container}>
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit}>
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
          <View style={styles.form}>
            {/* Store Information */}
            <Card style={styles.section}>
              <Card.Content>
                <Title style={styles.sectionTitle}>Store Information</Title>

                <View style={styles.logoSection}>
                  <Paragraph style={styles.logoLabel}>Store Logo</Paragraph>
                  <View style={styles.logoContainer}>
                    {logoImage && (
                      <Image
                        source={{
                          uri: logoImage.startsWith("http") ? `http://localhost:3000/${logoImage}` : logoImage,
                        }}
                        style={styles.logoImage}
                      />
                    )}
                    <TouchableOpacity style={styles.logoButton} onPress={pickLogo}>
                      <IconButton icon="camera" size={30} />
                      <Paragraph>{logoImage ? "Change Logo" : "Add Logo"}</Paragraph>
                    </TouchableOpacity>
                  </View>
                </View>

                <TextInput
                  label="Store Name"
                  value={values.storeName}
                  onChangeText={handleChange("storeName")}
                  onBlur={handleBlur("storeName")}
                  mode="outlined"
                  style={styles.input}
                  error={touched.storeName && errors.storeName}
                />

                <View style={styles.row}>
                  <TextInput
                    label="Currency"
                    value={values.currency}
                    onChangeText={handleChange("currency")}
                    mode="outlined"
                    style={[styles.input, styles.halfWidth]}
                  />

                  <TextInput
                    label="Language"
                    value={values.language}
                    onChangeText={handleChange("language")}
                    mode="outlined"
                    style={[styles.input, styles.halfWidth]}
                  />
                </View>

                <View style={styles.row}>
                  <TextInput
                    label="Timezone"
                    value={values.timezone}
                    onChangeText={handleChange("timezone")}
                    mode="outlined"
                    style={[styles.input, styles.halfWidth]}
                  />

                  <TextInput
                    label="Country"
                    value={values.country}
                    onChangeText={handleChange("country")}
                    mode="outlined"
                    style={[styles.input, styles.halfWidth]}
                  />
                </View>
              </Card.Content>
            </Card>

            {/* Shipping Settings */}
            <Card style={styles.section}>
              <Card.Content>
                <Title style={styles.sectionTitle}>Shipping Settings</Title>

                <TextInput
                  label="Free Shipping Threshold ($)"
                  value={values.freeShippingThreshold}
                  onChangeText={handleChange("freeShippingThreshold")}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.input}
                />

                <TextInput
                  label="Free Gift Threshold ($)"
                  value={values.freeGiftThreshold}
                  onChangeText={handleChange("freeGiftThreshold")}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </Card.Content>
            </Card>

            {/* Email Settings */}
            <Card style={styles.section}>
              <Card.Content>
                <Title style={styles.sectionTitle}>Email Settings</Title>

                <TextInput
                  label="SMTP Host"
                  value={values.emailSettings.host}
                  onChangeText={handleChange("emailSettings.host")}
                  mode="outlined"
                  style={styles.input}
                />

                <View style={styles.row}>
                  <TextInput
                    label="SMTP Port"
                    value={values.emailSettings.port}
                    onChangeText={handleChange("emailSettings.port")}
                    mode="outlined"
                    keyboardType="numeric"
                    style={[styles.input, styles.halfWidth]}
                  />

                  <TextInput
                    label="Sender Name"
                    value={values.emailSettings.senderName}
                    onChangeText={handleChange("emailSettings.senderName")}
                    mode="outlined"
                    style={[styles.input, styles.halfWidth]}
                  />
                </View>

                <TextInput
                  label="SMTP Username"
                  value={values.emailSettings.username}
                  onChangeText={handleChange("emailSettings.username")}
                  mode="outlined"
                  style={styles.input}
                />

                <TextInput
                  label="SMTP Password"
                  value={values.emailSettings.password}
                  onChangeText={handleChange("emailSettings.password")}
                  mode="outlined"
                  secureTextEntry
                  style={styles.input}
                />
              </Card.Content>
            </Card>

            {/* Module Settings */}
            <Card style={styles.section}>
              <Card.Content>
                <Title style={styles.sectionTitle}>Module Settings</Title>

                <View style={styles.switchRow}>
                  <Paragraph>Enable Reviews</Paragraph>
                  <Switch
                    value={values.modules.reviews}
                    onValueChange={(value) => setFieldValue("modules.reviews", value)}
                  />
                </View>

                <View style={styles.switchRow}>
                  <Paragraph>Enable Coupons</Paragraph>
                  <Switch
                    value={values.modules.coupons}
                    onValueChange={(value) => setFieldValue("modules.coupons", value)}
                  />
                </View>

                <View style={styles.switchRow}>
                  <Paragraph>Enable Shipping</Paragraph>
                  <Switch
                    value={values.modules.shipping}
                    onValueChange={(value) => setFieldValue("modules.shipping", value)}
                  />
                </View>

                <View style={styles.switchRow}>
                  <Paragraph>Enable Bundles</Paragraph>
                  <Switch
                    value={values.modules.bundles}
                    onValueChange={(value) => setFieldValue("modules.bundles", value)}
                  />
                </View>
              </Card.Content>
            </Card>

            {/* SEO Settings */}
            <Card style={styles.section}>
              <Card.Content>
                <Title style={styles.sectionTitle}>SEO Settings</Title>

                <TextInput
                  label="Meta Title"
                  value={values.seoMeta.title}
                  onChangeText={handleChange("seoMeta.title")}
                  mode="outlined"
                  style={styles.input}
                />

                <TextInput
                  label="Meta Description"
                  value={values.seoMeta.description}
                  onChangeText={handleChange("seoMeta.description")}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />

                <TextInput
                  label="Meta Keywords"
                  value={values.seoMeta.keywords}
                  onChangeText={handleChange("seoMeta.keywords")}
                  mode="outlined"
                  style={styles.input}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </Card.Content>
            </Card>

            {/* Contact Information */}
            <Card style={styles.section}>
              <Card.Content>
                <Title style={styles.sectionTitle}>Contact Information</Title>

                <TextInput
                  label="Contact Email"
                  value={values.contactInfo.email}
                  onChangeText={handleChange("contactInfo.email")}
                  mode="outlined"
                  keyboardType="email-address"
                  style={styles.input}
                />

                <TextInput
                  label="Contact Phone"
                  value={values.contactInfo.phone}
                  onChangeText={handleChange("contactInfo.phone")}
                  mode="outlined"
                  keyboardType="phone-pad"
                  style={styles.input}
                />

                <TextInput
                  label="Address"
                  value={values.contactInfo.address}
                  onChangeText={handleChange("contactInfo.address")}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />
              </Card.Content>
            </Card>

            {/* Save Button */}
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={saving}
              disabled={saving}
              style={styles.saveButton}
            >
              Save Settings
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  halfWidth: {
    flex: 1,
  },
  logoSection: {
    marginBottom: 16,
  },
  logoLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  logoButton: {
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
    marginBottom: 12,
  },
  saveButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
})

export default SettingsScreen
