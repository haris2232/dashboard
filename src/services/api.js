import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"

const BASE_URL = "http://34.18.0.53:3000/api" // Change this to your server URL

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("authToken")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem("authToken")
      await AsyncStorage.removeItem("userData")
      // You might want to redirect to login here
    }
    return Promise.reject(error)
  },
)

// Auth API
export const authAPI = {
  login: (email, password) => api.post("/auth/login", { email, password }),
}

// User API
export const userAPI = {
  getUsers: () => api.get("/users"),
  createUser: (userData) => api.post("/users", userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
}

// Product API
export const productAPI = {
  getProducts: () => api.get("/products"),
  createProduct: (formData) =>
    api.post("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateProduct: (id, formData) =>
    api.put(`/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteProduct: (id) => api.delete(`/products/${id}`),
}

// Category API
export const categoryAPI = {
  getCategories: () => api.get("/categories"),
  createCategory: (formData) =>
    api.post("/categories", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateCategory: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
}

// Order API
export const orderAPI = {
  getOrders: () => api.get("/orders?populate=customer"),
  updateOrder: (id, orderData) => api.put(`/orders/${id}`, orderData),
}

// Customer API
export const customerAPI = {
  getCustomers: () => api.get("/customers"),
  updateCustomer: (id, customerData) => api.put(`/customers/${id}`, customerData),
}

// Review API
export const reviewAPI = {
  getReviews: () => api.get("/reviews"),
  updateReview: (id, reviewData) => api.put(`/reviews/${id}`, reviewData),
}

// Coupon API
export const couponAPI = {
  getCoupons: () => api.get("/coupons"),
  createCoupon: (couponData) => api.post("/coupons", couponData),
  updateCoupon: (id, couponData) => api.put(`/coupons/${id}`, couponData),
  deleteCoupon: (id) => api.delete(`/coupons/${id}`),
}

// Bundle API
export const bundleAPI = {
  getBundles: () => api.get("/bundles"),
  createBundle: (bundleData) => api.post("/bundles", bundleData),
  updateBundle: (id, bundleData) => api.put(`/bundles/${id}`, bundleData),
  deleteBundle: (id) => api.delete(`/bundles/${id}`),
}

// Settings API
export const settingsAPI = {
  getSettings: () => api.get("/settings"),
  updateSettings: (formData) =>
    api.put("/settings", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
}

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
}

// Upload API
export const uploadAPI = {
  uploadFile: (formData) =>
    api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
}

export default api
