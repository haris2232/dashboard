"use client"

import { createContext, useContext, useReducer, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { authAPI } from "../services/api"

const AuthContext = createContext()

const initialState = {
  user: null,
  token: null,
  loading: true,
  error: null,
}

const authReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      }
    case "LOGIN_ERROR":
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
      }
    case "LOGOUT":
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
      }
    case "CLEAR_ERROR":
      return { ...state, error: null }
    default:
      return state
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    checkAuthState()
  }, [])

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken")
      const userData = await AsyncStorage.getItem("userData")

      if (token && userData) {
        const user = JSON.parse(userData)
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user, token },
        })
      } else {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    } catch (error) {
      console.error("Auth state check error:", error)
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const login = async (email, password) => {
    try {
      dispatch({ type: "SET_LOADING", payload: true })

      const response = await authAPI.login(email, password)
      const { token, user } = response.data

      await AsyncStorage.setItem("authToken", token)
      await AsyncStorage.setItem("userData", JSON.stringify(user))

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user, token },
      })

      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Login failed"
      dispatch({
        type: "LOGIN_ERROR",
        payload: errorMessage,
      })
      return { success: false, error: errorMessage }
    }
  }

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("authToken")
      await AsyncStorage.removeItem("userData")
      dispatch({ type: "LOGOUT" })
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" })
  }

  const value = {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    logout,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
