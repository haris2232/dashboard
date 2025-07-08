"use client"
import { View, StyleSheet } from "react-native"
import { DrawerContentScrollView, DrawerItem } from "@react-navigation/drawer"
import { Avatar, Title, Caption, Drawer, Text, TouchableRipple, Switch, useTheme } from "react-native-paper"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useAuth } from "../context/AuthContext"
import { useTheme as useAppTheme } from "../context/ThemeContext"

const DrawerContent = (props) => {
  const theme = useTheme()
  const { isDarkMode, toggleTheme } = useAppTheme()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <View style={styles.drawerContent}>
      <DrawerContentScrollView {...props}>
        <View style={styles.drawerContent}>
          <View style={styles.userInfoSection}>
            <View style={styles.userInfo}>
              <Avatar.Text
                size={50}
                label={user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                style={{ backgroundColor: theme.colors.primary }}
              />
              <View style={styles.userDetails}>
                <Title style={styles.title}>{user?.name || "User"}</Title>
                <Caption style={styles.caption}>{user?.email}</Caption>
                <Caption style={[styles.caption, styles.role]}>{user?.role?.toUpperCase()}</Caption>
              </View>
            </View>
          </View>

          <Drawer.Section style={styles.drawerSection}>
            <DrawerItem
              icon={({ color, size }) => <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />}
              label="Dashboard"
              onPress={() => props.navigation.navigate("Dashboard")}
            />

            {(user?.role === "admin" || user?.role === "manager") && (
              <>
                <DrawerItem
                  icon={({ color, size }) => (
                    <MaterialCommunityIcons name="package-variant" color={color} size={size} />
                  )}
                  label="Products"
                  onPress={() => props.navigation.navigate("Products")}
                />

                <DrawerItem
                  icon={({ color, size }) => <MaterialCommunityIcons name="tag-multiple" color={color} size={size} />}
                  label="Categories"
                  onPress={() => props.navigation.navigate("Categories")}
                />

                <DrawerItem
                  icon={({ color, size }) => (
                    <MaterialCommunityIcons name="package-variant-closed" color={color} size={size} />
                  )}
                  label="Bundles & Offers"
                  onPress={() => props.navigation.navigate("Bundles")}
                />

                <DrawerItem
                  icon={({ color, size }) => <MaterialCommunityIcons name="ticket-percent" color={color} size={size} />}
                  label="Coupons"
                  onPress={() => props.navigation.navigate("Coupons")}
                />
              </>
            )}

            <DrawerItem
              icon={({ color, size }) => <MaterialCommunityIcons name="shopping" color={color} size={size} />}
              label="Orders"
              onPress={() => props.navigation.navigate("Orders")}
            />

            <DrawerItem
              icon={({ color, size }) => <MaterialCommunityIcons name="account-group" color={color} size={size} />}
              label="Customers"
              onPress={() => props.navigation.navigate("Customers")}
            />

            <DrawerItem
              icon={({ color, size }) => <MaterialCommunityIcons name="star" color={color} size={size} />}
              label="Reviews"
              onPress={() => props.navigation.navigate("Reviews")}
            />

            {user?.role === "admin" && (
              <>
                <DrawerItem
                  icon={({ color, size }) => (
                    <MaterialCommunityIcons name="account-multiple" color={color} size={size} />
                  )}
                  label="User Management"
                  onPress={() => props.navigation.navigate("Users")}
                />

                <DrawerItem
                  icon={({ color, size }) => <MaterialCommunityIcons name="cog" color={color} size={size} />}
                  label="Settings"
                  onPress={() => props.navigation.navigate("Settings")}
                />
              </>
            )}
          </Drawer.Section>

          <Drawer.Section title="Preferences">
            <TouchableRipple onPress={toggleTheme}>
              <View style={styles.preference}>
                <Text>Dark Theme</Text>
                <View pointerEvents="none">
                  <Switch value={isDarkMode} />
                </View>
              </View>
            </TouchableRipple>
          </Drawer.Section>
        </View>
      </DrawerContentScrollView>

      <Drawer.Section style={styles.bottomDrawerSection}>
        <DrawerItem
          icon={({ color, size }) => <MaterialCommunityIcons name="exit-to-app" color={color} size={size} />}
          label="Sign Out"
          onPress={handleLogout}
        />
      </Drawer.Section>
    </View>
  )
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  userInfoSection: {
    paddingLeft: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userDetails: {
    marginLeft: 15,
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginTop: 3,
    fontWeight: "bold",
  },
  caption: {
    fontSize: 14,
    lineHeight: 14,
  },
  role: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 4,
  },
  drawerSection: {
    marginTop: 15,
  },
  bottomDrawerSection: {
    marginBottom: 15,
    borderTopColor: "#f4f4f4",
    borderTopWidth: 1,
  },
  preference: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
})

export default DrawerContent
