// Mock API for demo purposes
export interface ProductVariant {
  id: string
  size: string
  color: {
    name: string
    type: "hex" | "image"
    value: string // hex code or image URL
  }
  sku: string
  stock: number
  priceOverride?: number
  isActive: boolean
}

export interface Product {
  id: string
  title: string
  basePrice: number
  baseSku: string
  category: string
  description: string
  images: string[]
  isActive: boolean
  createdAt: string
  // Variation options
  sizeOptions: string[]
  colorOptions: Array<{
    name: string
    type: "hex" | "image"
    value: string
  }>
  variants: ProductVariant[]
  defaultVariant?: string // variant ID
}

export interface Order {
  id: string
  orderNumber: string
  customer: {
    name: string
    email: string
  }
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  items: Array<{
    product: Product
    variant?: ProductVariant
    quantity: number
    price: number
  }>
  trackingNumber?: string
  carrier?: string
  createdAt: string
}

export interface Customer {
  id: string
  name: string
  email: string
  totalOrders: number
  totalSpent: number
  isBanned: boolean
  notes?: string
  createdAt: string
}

export interface Category {
  _id: string
  name: string
  description?: string
  image?: string
  isActive: boolean
  createdAt: string
}

export interface Bundle {
  _id: string
  name: string
  description?: string
  products: any[]
  originalPrice: number
  bundlePrice: number
  startDate?: string
  endDate?: string
  isActive: boolean
  createdAt: string
}

export interface Review {
  _id: string
  id: string
  product: {
    title: string
  }
  customer: {
    name: string
  }
  rating: number
  comment: string
  status: string
  adminResponse?: string
  responseDate?: string
  createdAt: string
}

export interface Coupon {
  _id: string
  code: string
  type: "flat" | "percentage"
  value: number
  usedCount: number
  usageLimit?: number
  isActive: boolean
  expiresAt?: string
}

export interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "manager" | "viewer"
  isActive: boolean
  createdAt: string
}

export interface Settings {
  _id: string
  storeName: string
  currency: string
  language: string
  freeShippingThreshold: number
  modules: {
    reviews: boolean
    coupons: boolean
    shipping: boolean
    bundles: boolean
  }
  smtp?: {
    host: string
    port: number
    username: string
    password: string
    senderName: string
  }
  seo?: {
    title: string
    description: string
    keywords: string
  }
  contact?: {
    phone: string
    address: string
    email: string
  }
}

export interface ShippingRule {
  id: string
  name: string
  region: string
  minWeight?: number
  maxWeight?: number
  minAmount?: number
  maxAmount?: number
  shippingCost: number
  freeShippingThreshold?: number
  estimatedDays: number
  isActive: boolean
  createdAt: string
}

export interface ShippingSettings {
  freeShippingThreshold: number
  freeGiftThreshold: number
  defaultShippingCost: number
  enableFreeShipping: boolean
  enableFreeGift: boolean
  freeGiftProduct?: string
}

// Mock data with variants
let mockProducts: Product[] = [
  {
    id: "1",
    title: "Premium Cotton T-Shirt",
    basePrice: 29.99,
    baseSku: "PCT-001",
    category: "Clothing",
    description: "High-quality cotton t-shirt with comfortable fit",
    images: ["/placeholder.svg?height=300&width=300"],
    isActive: true,
    createdAt: new Date().toISOString(),
    sizeOptions: ["S", "M", "L", "XL"],
    colorOptions: [
      { name: "Black", type: "hex", value: "#000000" },
      { name: "White", type: "hex", value: "#FFFFFF" },
      { name: "Navy", type: "hex", value: "#1e3a8a" },
      { name: "Denim", type: "image", value: "/placeholder.svg?height=50&width=50&text=Denim" },
    ],
    variants: [
      {
        id: "v1",
        size: "S",
        color: { name: "Black", type: "hex", value: "#000000" },
        sku: "PCT-001-S-BLK",
        stock: 15,
        isActive: true,
      },
      {
        id: "v2",
        size: "M",
        color: { name: "Black", type: "hex", value: "#000000" },
        sku: "PCT-001-M-BLK",
        stock: 25,
        isActive: true,
      },
      {
        id: "v3",
        size: "L",
        color: { name: "White", type: "hex", value: "#FFFFFF" },
        sku: "PCT-001-L-WHT",
        stock: 20,
        priceOverride: 32.99,
        isActive: true,
      },
      {
        id: "v4",
        size: "XL",
        color: { name: "Denim", type: "image", value: "/placeholder.svg?height=50&width=50&text=Denim" },
        sku: "PCT-001-XL-DEN",
        stock: 8,
        priceOverride: 39.99,
        isActive: true,
      },
    ],
    defaultVariant: "v2",
  },
  {
    id: "2",
    title: "Gaming Mechanical Keyboard",
    basePrice: 149.99,
    baseSku: "GMK-002",
    category: "Electronics",
    description: "RGB mechanical keyboard perfect for gaming",
    images: ["/placeholder.svg?height=300&width=300"],
    isActive: true,
    createdAt: new Date().toISOString(),
    sizeOptions: ["Compact", "Full Size"],
    colorOptions: [
      { name: "Black", type: "hex", value: "#000000" },
      { name: "White", type: "hex", value: "#FFFFFF" },
    ],
    variants: [
      {
        id: "v5",
        size: "Compact",
        color: { name: "Black", type: "hex", value: "#000000" },
        sku: "GMK-002-COMP-BLK",
        stock: 12,
        isActive: true,
      },
      {
        id: "v6",
        size: "Full Size",
        color: { name: "White", type: "hex", value: "#FFFFFF" },
        sku: "GMK-002-FULL-WHT",
        stock: 8,
        priceOverride: 169.99,
        isActive: true,
      },
    ],
    defaultVariant: "v5",
  },
  {
    id: "3",
    title: "Ergonomic Office Chair",
    basePrice: 299.99,
    baseSku: "EOC-003",
    category: "Furniture",
    description: "Comfortable ergonomic chair for long work sessions",
    images: ["/placeholder.svg?height=300&width=300"],
    isActive: true,
    createdAt: new Date().toISOString(),
    sizeOptions: ["Standard"],
    colorOptions: [
      { name: "Black Leather", type: "image", value: "/placeholder.svg?height=50&width=50&text=Leather" },
      { name: "Gray Fabric", type: "image", value: "/placeholder.svg?height=50&width=50&text=Fabric" },
    ],
    variants: [
      {
        id: "v7",
        size: "Standard",
        color: { name: "Black Leather", type: "image", value: "/placeholder.svg?height=50&width=50&text=Leather" },
        sku: "EOC-003-STD-BLK",
        stock: 5,
        isActive: true,
      },
      {
        id: "v8",
        size: "Standard",
        color: { name: "Gray Fabric", type: "image", value: "/placeholder.svg?height=50&width=50&text=Fabric" },
        sku: "EOC-003-STD-GRY",
        stock: 3,
        priceOverride: 279.99,
        isActive: true,
      },
    ],
    defaultVariant: "v7",
  },
]

const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-001",
    customer: { name: "John Doe", email: "john@example.com" },
    total: 199.98,
    status: "processing",
    items: [
      {
        product: mockProducts[0],
        variant: mockProducts[0].variants[0],
        quantity: 2,
        price: 29.99,
      },
    ],
    trackingNumber: "1Z999AA1234567890",
    carrier: "UPS",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    orderNumber: "ORD-002",
    customer: { name: "Jane Smith", email: "jane@example.com" },
    total: 149.99,
    status: "shipped",
    items: [
      {
        product: mockProducts[1],
        variant: mockProducts[1].variants[0],
        quantity: 1,
        price: 149.99,
      },
    ],
    trackingNumber: "9400111899562123456789",
    carrier: "USPS",
    createdAt: new Date().toISOString(),
  },
]

const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    totalOrders: 5,
    totalSpent: 899.95,
    isBanned: false,
    notes: "VIP customer, always pays on time",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    totalOrders: 3,
    totalSpent: 449.97,
    isBanned: false,
    createdAt: new Date().toISOString(),
  },
]

// Mock data for other entities
let mockCategories: Category[] = [
  {
    _id: "1",
    name: "Electronics",
    description: "Electronic devices and accessories",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "2",
    name: "Furniture",
    description: "Home and office furniture",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "3",
    name: "Clothing",
    description: "Apparel and fashion items",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
]

let mockBundles: Bundle[] = [
  {
    _id: "1",
    name: "Office Starter Pack",
    description: "Everything you need to set up your home office",
    products: [mockProducts[1], mockProducts[2]],
    originalPrice: 449.98,
    bundlePrice: 399.99,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "2",
    name: "Gaming Bundle",
    description: "Perfect gaming setup for enthusiasts",
    products: [mockProducts[1]],
    originalPrice: 149.99,
    bundlePrice: 129.99,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
]

const mockReviews: Review[] = [
  {
    _id: "1",
    id: "1",
    product: { title: "Premium Cotton T-Shirt" },
    customer: { name: "John Doe" },
    rating: 5,
    comment: "Great quality t-shirt, fits perfectly!",
    status: "approved",
    adminResponse: "Thank you for your feedback! We're glad you love the t-shirt.",
    responseDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    _id: "2",
    id: "2",
    product: { title: "Gaming Mechanical Keyboard" },
    customer: { name: "Jane Smith" },
    rating: 4,
    comment: "Good keyboard but a bit loud for my taste",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
]

let mockCoupons: Coupon[] = [
  {
    _id: "1",
    code: "WELCOME10",
    type: "percentage",
    value: 10,
    usedCount: 25,
    usageLimit: 100,
    isActive: true,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: "2",
    code: "SAVE20",
    type: "flat",
    value: 20,
    usedCount: 5,
    usageLimit: 50,
    isActive: true,
  },
]

let mockUsers: User[] = [
  {
    _id: "1",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "2",
    name: "Manager User",
    email: "manager@example.com",
    role: "manager",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "3",
    name: "Viewer User",
    email: "viewer@example.com",
    role: "viewer",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
]

let mockSettings: Settings = {
  _id: "1",
  storeName: "Demo eCommerce Store",
  currency: "USD",
  language: "en",
  freeShippingThreshold: 50,
  modules: {
    reviews: true,
    coupons: true,
    shipping: true,
    bundles: true,
  },
  smtp: {
    host: "smtp.gmail.com",
    port: 587,
    username: "store@example.com",
    password: "password",
    senderName: "Demo Store",
  },
  seo: {
    title: "Demo eCommerce Store",
    description: "Your one-stop shop for quality products",
    keywords: "ecommerce, shopping, products",
  },
  contact: {
    phone: "+1 (555) 123-4567",
    address: "123 Main St, City, State 12345",
    email: "contact@example.com",
  },
}

let mockShippingRules: ShippingRule[] = [
  {
    id: "1",
    name: "US Standard Shipping",
    region: "US",
    minWeight: 0,
    maxWeight: 10,
    minAmount: 0,
    maxAmount: 50,
    shippingCost: 9.99,
    freeShippingThreshold: 50,
    estimatedDays: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "International Shipping",
    region: "INTL",
    shippingCost: 24.99,
    freeShippingThreshold: 100,
    estimatedDays: 7,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
]

let mockShippingSettings: ShippingSettings = {
  freeShippingThreshold: 50,
  freeGiftThreshold: 100,
  defaultShippingCost: 9.99,
  enableFreeShipping: true,
  enableFreeGift: true,
  freeGiftProduct: "Premium Cotton T-Shirt",
}

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Product API
export const productAPI = {
  getProducts: async (): Promise<Product[]> => {
    await delay(500)
    return mockProducts
  },

  createProduct: async (productData: Omit<Product, "id" | "createdAt">): Promise<Product> => {
    await delay(1000)
    const newProduct: Product = {
      ...productData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    }
    mockProducts.push(newProduct)
    return newProduct
  },

  updateProduct: async (id: string, productData: Partial<Product>): Promise<Product> => {
    await delay(1000)
    const index = mockProducts.findIndex((p) => p.id === id)
    if (index === -1) throw new Error("Product not found")

    mockProducts[index] = { ...mockProducts[index], ...productData }
    return mockProducts[index]
  },

  deleteProduct: async (id: string): Promise<void> => {
    await delay(500)
    mockProducts = mockProducts.filter((p) => p.id !== id)
  },
}

// Order API
export const orderAPI = {
  getOrders: async (): Promise<Order[]> => {
    await delay(500)
    return mockOrders
  },

  getOrdersByCustomer: async (customerId: string): Promise<Order[]> => {
    await delay(500)
    return mockOrders.filter((order) => order.customer.email.includes(customerId))
  },

  updateOrderStatus: async (id: string, status: Order["status"]): Promise<Order> => {
    await delay(1000)
    const index = mockOrders.findIndex((o) => o.id === id)
    if (index === -1) throw new Error("Order not found")

    mockOrders[index].status = status
    return mockOrders[index]
  },

  assignTracking: async (id: string, trackingNumber: string, carrier: string): Promise<Order> => {
    await delay(1000)
    const index = mockOrders.findIndex((o) => o.id === id)
    if (index === -1) throw new Error("Order not found")

    mockOrders[index].trackingNumber = trackingNumber
    mockOrders[index].carrier = carrier
    return mockOrders[index]
  },
}

// Customer API
export const customerAPI = {
  getCustomers: async (): Promise<Customer[]> => {
    await delay(500)
    return mockCustomers
  },

  updateCustomer: async (id: string, customerData: Partial<Customer>): Promise<Customer> => {
    await delay(1000)
    const index = mockCustomers.findIndex((c) => c.id === id)
    if (index === -1) throw new Error("Customer not found")

    mockCustomers[index] = { ...mockCustomers[index], ...customerData }
    return mockCustomers[index]
  },
}

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    await delay(500)
    const totalStock = mockProducts.reduce(
      (sum, product) => sum + product.variants.reduce((variantSum, variant) => variantSum + variant.stock, 0),
      0,
    )

    return {
      totalProducts: mockProducts.length,
      totalOrders: mockOrders.length,
      totalCustomers: mockCustomers.length,
      totalStock,
      monthlyRevenue: mockOrders.reduce((sum, order) => sum + order.total, 0),
      recentOrders: mockOrders.slice(0, 5),
      lowStockProducts: mockProducts.filter((p) => p.variants.some((v) => v.stock < 10)),
    }
  },
}

// Category API
export const categoryAPI = {
  getCategories: async (): Promise<{ data: Category[] }> => {
    await delay(500)
    return { data: mockCategories }
  },
  createCategory: async (data: Omit<Category, "_id" | "createdAt">): Promise<Category> => {
    await delay(500)
    const newCategory: Category = {
      ...data,
      _id: Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
    }
    mockCategories.push(newCategory)
    return newCategory
  },
  updateCategory: async (id: string, data: Partial<Category>): Promise<Category> => {
    await delay(500)
    const idx = mockCategories.findIndex((c) => c._id === id)
    if (idx === -1) throw new Error("Category not found")
    mockCategories[idx] = { ...mockCategories[idx], ...data }
    return mockCategories[idx]
  },
  deleteCategory: async (id: string): Promise<void> => {
    await delay(300)
    mockCategories = mockCategories.filter((c) => c._id !== id)
  },
}

// Bundle API
export const bundleAPI = {
  getBundles: async (): Promise<{ data: Bundle[] }> => {
    await delay(500)
    return { data: mockBundles }
  },
  createBundle: async (data: Omit<Bundle, "_id">): Promise<Bundle> => {
    await delay(1000)
    const newBundle: Bundle = { ...data, _id: Math.random().toString(36).slice(2) }
    mockBundles.push(newBundle)
    return newBundle
  },
  updateBundle: async (id: string, data: Partial<Bundle>): Promise<Bundle> => {
    await delay(1000)
    const idx = mockBundles.findIndex((b) => b._id === id)
    if (idx === -1) throw new Error("Bundle not found")
    mockBundles[idx] = { ...mockBundles[idx], ...data }
    return mockBundles[idx]
  },
  deleteBundle: async (id: string): Promise<void> => {
    await delay(300)
    mockBundles = mockBundles.filter((b) => b._id !== id)
  },
}

// Coupon API
export const couponAPI = {
  getCoupons: async (): Promise<{ data: Coupon[] }> => {
    await delay(500)
    return { data: mockCoupons }
  },
  createCoupon: async (data: Omit<Coupon, "_id">): Promise<Coupon> => {
    await delay(500)
    const newCoupon: Coupon = { ...data, _id: Math.random().toString(36).slice(2) }
    mockCoupons.push(newCoupon)
    return newCoupon
  },
  updateCoupon: async (id: string, data: Partial<Coupon>): Promise<Coupon> => {
    await delay(500)
    const idx = mockCoupons.findIndex((c) => c._id === id)
    if (idx === -1) throw new Error("Coupon not found")
    mockCoupons[idx] = { ...mockCoupons[idx], ...data }
    return mockCoupons[idx]
  },
  deleteCoupon: async (id: string): Promise<void> => {
    await delay(300)
    mockCoupons = mockCoupons.filter((c) => c._id !== id)
  },
}

// Review API
export const reviewAPI = {
  getReviews: async (): Promise<{ data: Review[] }> => {
    await delay(500)
    return { data: mockReviews }
  },
  updateReview: async (id: string, data: Partial<Review>): Promise<Review> => {
    await delay(500)
    const idx = mockReviews.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error("Review not found")
    mockReviews[idx] = { ...mockReviews[idx], ...data }
    return mockReviews[idx]
  },
}

// Settings API
export const settingsAPI = {
  getSettings: async (): Promise<{ data: Settings }> => {
    await delay(400)
    return { data: mockSettings }
  },
  updateSettings: async (formData: FormData): Promise<Settings> => {
    await delay(800)
    const settingsData = JSON.parse(formData.get("settingsData") as string)
    mockSettings = { ...mockSettings, ...settingsData }
    return mockSettings
  },
}

// User API
export const userAPI = {
  getUsers: async (): Promise<{ data: User[] }> => {
    await delay(500)
    return { data: mockUsers }
  },
  createUser: async (data: Omit<User, "_id" | "createdAt">): Promise<User> => {
    await delay(800)
    const newUser: User = { ...data, _id: Math.random().toString(36).slice(2), createdAt: new Date().toISOString() }
    mockUsers.push(newUser)
    return newUser
  },
  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    await delay(800)
    const idx = mockUsers.findIndex((u) => u._id === id)
    if (idx === -1) throw new Error("User not found")
    mockUsers[idx] = { ...mockUsers[idx], ...data }
    return mockUsers[idx]
  },
  deleteUser: async (id: string): Promise<void> => {
    await delay(300)
    mockUsers = mockUsers.filter((u) => u._id !== id)
  },
}

// Shipping API
export const shippingAPI = {
  getShippingRules: async (): Promise<{ data: ShippingRule[] }> => {
    await delay(500)
    return { data: mockShippingRules }
  },
  createShippingRule: async (data: Omit<ShippingRule, "id" | "createdAt">): Promise<ShippingRule> => {
    await delay(800)
    const newRule: ShippingRule = {
      ...data,
      id: Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
    }
    mockShippingRules.push(newRule)
    return newRule
  },
  updateShippingRule: async (id: string, data: Partial<ShippingRule>): Promise<ShippingRule> => {
    await delay(800)
    const idx = mockShippingRules.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error("Shipping rule not found")
    mockShippingRules[idx] = { ...mockShippingRules[idx], ...data }
    return mockShippingRules[idx]
  },
  deleteShippingRule: async (id: string): Promise<void> => {
    await delay(300)
    mockShippingRules = mockShippingRules.filter((r) => r.id !== id)
  },
  getShippingSettings: async (): Promise<{ data: ShippingSettings }> => {
    await delay(400)
    return { data: mockShippingSettings }
  },
  updateShippingSettings: async (data: Partial<ShippingSettings>): Promise<ShippingSettings> => {
    await delay(800)
    mockShippingSettings = { ...mockShippingSettings, ...data }
    return mockShippingSettings
  },
}

// Utility function for formatting
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Default export
export default {
  productAPI,
  orderAPI,
  customerAPI,
  categoryAPI,
  bundleAPI,
  couponAPI,
  reviewAPI,
  settingsAPI,
  userAPI,
  dashboardAPI,
  shippingAPI,
}
