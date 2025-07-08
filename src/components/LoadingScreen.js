"use client"
import { View, StyleSheet } from "react-native"
import { ActivityIndicator, Title, useTheme } from "react-native-paper"

const LoadingScreen = () => {
  const theme = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Title style={[styles.title, { color: theme.colors.onBackground }]}>Loading...</Title>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    marginTop: 16,
  },
})

export default LoadingScreen
