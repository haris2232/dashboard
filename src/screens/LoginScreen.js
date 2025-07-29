"use client"

import { useState } from "react"
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native"
import { TextInput, Button, Title, Paragraph, Card, useTheme, HelperText } from "react-native-paper"
import { Formik } from "formik"
import * as Yup from "yup"
import { useAuth } from "../context/AuthContext"

const validationSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email format").required("Email is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
})

const LoginScreen = () => {
  const theme = useTheme()
  const { login, loading, error } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (values) => {
    const result = await login(values.email, values.password)
    if (!result.success) {
      Alert.alert("Login Failed", result.error)
    }
  }

  const demoCredentials = [
    { email: "admin@example.com", password: "admin123", role: "Admin" },
    { email: "manager@example.com", password: "manager123", role: "Manager" },
    { email: "viewer@example.com", password: "viewer123", role: "Viewer" },
  ]

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Title style={[styles.title, { color: theme.colors.primary }]}>Athetik Website</Title>
          <Paragraph style={styles.subtitle}>Sign in to manage your store</Paragraph>

          <Card style={styles.card}>
            <Card.Content>
              <Formik
                initialValues={{ email: "", password: "" }}
                validationSchema={validationSchema}
                onSubmit={handleLogin}
              >
                {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
                  <View>
                    <TextInput
                      label="Email"
                      value={values.email}
                      onChangeText={handleChange("email")}
                      onBlur={handleBlur("email")}
                      mode="outlined"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={styles.input}
                      error={touched.email && errors.email}
                    />
                    <HelperText type="error" visible={touched.email && errors.email}>
                      {errors.email}
                    </HelperText>

                    <TextInput
                      label="Password"
                      value={values.password}
                      onChangeText={handleChange("password")}
                      onBlur={handleBlur("password")}
                      mode="outlined"
                      secureTextEntry={!showPassword}
                      right={
                        <TextInput.Icon
                          icon={showPassword ? "eye-off" : "eye"}
                          onPress={() => setShowPassword(!showPassword)}
                        />
                      }
                      style={styles.input}
                      error={touched.password && errors.password}
                    />
                    <HelperText type="error" visible={touched.password && errors.password}>
                      {errors.password}
                    </HelperText>

                    <Button
                      mode="contained"
                      onPress={handleSubmit}
                      loading={loading}
                      disabled={loading}
                      style={styles.loginButton}
                    >
                      Sign In
                    </Button>
                  </View>
                )}
              </Formik>
            </Card.Content>
          </Card>

          <Card style={[styles.card, styles.demoCard]}>
            <Card.Content>
              <Title style={styles.demoTitle}>Demo Credentials</Title>
              {demoCredentials.map((cred, index) => (
                <View key={index} style={styles.demoItem}>
                  <Paragraph style={styles.demoRole}>{cred.role}:</Paragraph>
                  <Paragraph style={styles.demoText}>
                    {cred.email} / {cred.password}
                  </Paragraph>
                </View>
              ))}
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.7,
  },
  card: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  loginButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  demoCard: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  demoTitle: {
    fontSize: 18,
    marginBottom: 12,
    textAlign: "center",
  },
  demoItem: {
    marginBottom: 8,
  },
  demoRole: {
    fontWeight: "bold",
    fontSize: 14,
  },
  demoText: {
    fontSize: 12,
    fontFamily: "monospace",
  },
})

export default LoginScreen
