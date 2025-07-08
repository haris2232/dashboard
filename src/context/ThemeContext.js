"use client"

import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    loadThemePreference()
  }, [])

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("themePreference")
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === "dark")
      }
    } catch (error) {
      console.error("Error loading theme preference:", error)
    }
  }

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode
      setIsDarkMode(newTheme)
      await AsyncStorage.setItem("themePreference", newTheme ? "dark" : "light")
    } catch (error) {
      console.error("Error saving theme preference:", error)
    }
  }

  const value = {
    isDarkMode,
    toggleTheme,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
