"use client"

import { useEffect, useState } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createDrawerNavigator } from "@react-navigation/drawer"
import { createStackNavigator } from "@react-navigation/stack"
import { Provider as PaperProvider, DefaultTheme, DarkTheme } from "react-native-paper"
import { AuthProvider, useAuth } from "./src/context/AuthContext"
import { ThemeProvider, useTheme } from "./src/context/ThemeContext"

// Screens
import LoginScreen from "./src/screens/LoginScreen"
import DashboardScreen from "./src/screens/DashboardScreen"
import ProductListScreen from "./src/screens/ProductListScreen"
import ProductFormScreen from "./src/screens/ProductFormScreen"
import CategoryScreen from "./src/screens/CategoryScreen"
import OrderScreen from "./src/screens/OrderScreen"
import CustomerScreen from "./src/screens/CustomerScreen"
import ReviewScreen from "./src/screens/ReviewScreen"
import CouponScreen from "./src/screens/CouponScreen"
import BundleScreen from "./src/screens/BundleScreen"
import SettingsScreen from "./src/screens/SettingsScreen"
import UserManagementScreen from "./src/screens/UserManagementScreen"

// Components
import DrawerContent from "./src/components/DrawerContent"
import LoadingScreen from "./src/components/LoadingScreen"

const Drawer = createDrawerNavigator()
const Stack = createStackNavigator()

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
)

const AppDrawer = () => {
  const { user } = useAuth()

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        drawerStyle: {
          width: 280,
        },
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Dashboard" }} />

      {(user?.role === "admin" || user?.role === "manager") && (
        <>
          <Drawer.Screen name="Products" component={ProductStack} options={{ title: "Products" }} />
          <Drawer.Screen name="Categories" component={CategoryScreen} options={{ title: "Categories" }} />
          <Drawer.Screen name="Bundles" component={BundleScreen} options={{ title: "Bundles & Offers" }} />
          <Drawer.Screen name="Coupons" component={CouponScreen} options={{ title: "Coupons" }} />
        </>
      )}

      <Drawer.Screen name="Orders" component={OrderScreen} options={{ title: "Orders" }} />
      <Drawer.Screen name="Customers" component={CustomerScreen} options={{ title: "Customers" }} />
      <Drawer.Screen name="Reviews" component={ReviewScreen} options={{ title: "Reviews" }} />

      {user?.role === "admin" && (
        <>
          <Drawer.Screen name="Users" component={UserManagementScreen} options={{ title: "User Management" }} />
          <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
        </>
      )}
    </Drawer.Navigator>
  )
}

const ProductStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ProductList"
      component={ProductListScreen}
      options={{ title: "Products", headerShown: false }}
    />
    <Stack.Screen name="ProductForm" component={ProductFormScreen} options={{ title: "Product Details" }} />
  </Stack.Navigator>
)

const AppNavigator = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  return user ? <AppDrawer /> : <AuthStack />
}

const App = () => {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Any initialization logic here
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setIsReady(true)
      } catch (error) {
        console.error("App initialization error:", error)
        setIsReady(true)
      }
    }

    initializeApp()
  }, [])

  if (!isReady) {
    return <LoadingScreen />
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemedApp />
      </AuthProvider>
    </ThemeProvider>
  )
}

const ThemedApp = () => {
  const { isDarkMode } = useTheme()

  return (
    <PaperProvider theme={isDarkMode ? DarkTheme : DefaultTheme}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </PaperProvider>
  )
}

export default App
