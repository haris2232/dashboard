// Real API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper function for API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get auth token from localStorage if available
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Helper function for file uploads
const uploadFiles = async (files: File[], endpoint: string) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Upload failed! status: ${response.status}`);
  }

  return response.json();
};

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
  _id: string
  title: string
  basePrice: number
  baseSku: string
  category: string
  subCategory?: string
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
  // Carousel display settings
  showInCarousel?: boolean
  carouselOrder?: number
  carouselImage?: string
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
  minAmount?: number
  maxDiscount?: number
  usageLimit?: number
  usedCount: number
  expiresAt?: string
  isStackable: boolean
  applicableProducts?: string[]
  applicableCategories?: string[]
  isActive: boolean
  createdAt: string
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

// Mock data for fallback
const mockProducts: Product[] = [
  {
    _id: "1",
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
    ],
    defaultVariant: "v2",
  },
  {
    _id: "2",
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
    ],
    defaultVariant: "v5",
  },
];

// Product API
export const productAPI = {
  getProducts: async (): Promise<Product[]> => {
    try {
      const response = await apiCall('/products');
      // Handle both old mock data structure and new backend structure
      if (response.data && Array.isArray(response.data)) {
        return response.data.map((product: any) => ({
          _id: product._id || product.id,
          title: product.title,
          basePrice: product.basePrice,
          baseSku: product.baseSku,
          category: product.category,
          subCategory: product.subCategory,
          description: product.description,
          images: product.images || [],
          isActive: product.isActive,
          createdAt: product.createdAt,
          sizeOptions: product.sizeOptions || [],
          colorOptions: product.colorOptions || [],
          variants: product.variants || [],
          defaultVariant: product.defaultVariant
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching products:', error);
      // Return mock data if backend is not available
      return mockProducts;
    }
  },

  createProduct: async (productData: Omit<Product, "_id" | "createdAt">): Promise<Product> => {
    try {
      const response = await apiCall('/products', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  updateProduct: async (id: string, productData: Partial<Product>): Promise<Product> => {
    try {
      const response = await apiCall(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  deleteProduct: async (id: string): Promise<void> => {
    try {
      await apiCall(`/products/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  uploadImages: async (files: File[]): Promise<string[]> => {
    try {
      const response = await uploadFiles(files, '/products/upload-images');
      return response.data;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  },

  getProduct: async (id: string): Promise<Product> => {
    try {
      const response = await apiCall(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },
};

// Order API
export const orderAPI = {
  getOrders: async (): Promise<Order[]> => {
    try {
      const response = await apiCall('/orders/admin/all');
      if (response.data && Array.isArray(response.data)) {
        return response.data.map((order: any) => ({
          id: order._id,
          orderNumber: order.orderNumber,
          customer: {
            name: order.customer.name,
            email: order.customer.email,
          },
          total: order.total,
          status: order.status,
          items: order.items.map((item: any) => ({
            product: {
              _id: item.productId,
              title: item.productName,
            },
            quantity: item.quantity,
            price: item.price,
          })),
          trackingNumber: order.trackingNumber,
          carrier: order.shippingMethod,
          createdAt: order.createdAt,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Return mock data if backend is not available
      return mockOrders;
    }
  },

  getOrdersByCustomer: async (customerId: string): Promise<Order[]> => {
    try {
      const response = await apiCall('/orders/admin/all');
      if (response.data && Array.isArray(response.data)) {
        const orders = response.data.filter((order: any) => 
          order.customer.email.includes(customerId)
        );
        return orders.map((order: any) => ({
          id: order._id,
          orderNumber: order.orderNumber,
          customer: {
            name: order.customer.name,
            email: order.customer.email,
          },
          total: order.total,
          status: order.status,
          items: order.items.map((item: any) => ({
            product: {
              _id: item.productId,
              title: item.productName,
            },
            quantity: item.quantity,
            price: item.price,
          })),
          trackingNumber: order.trackingNumber,
          carrier: order.shippingMethod,
          createdAt: order.createdAt,
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching orders by customer:', error);
      return mockOrders.filter((order) => order.customer.email.includes(customerId));
    }
  },

  updateOrderStatus: async (id: string, status: Order["status"]): Promise<Order> => {
    try {
      const response = await apiCall(`/orders/admin/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      // Fallback to mock data
      const index = mockOrders.findIndex((o) => o.id === id);
      if (index === -1) throw new Error("Order not found");
      mockOrders[index].status = status;
      return mockOrders[index];
    }
  },

  assignTracking: async (id: string, trackingNumber: string, carrier: string): Promise<Order> => {
    try {
      const response = await apiCall(`/orders/admin/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ 
          trackingNumber,
          notes: `Carrier: ${carrier}` 
        }),
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning tracking:', error);
      // Fallback to mock data
      const index = mockOrders.findIndex((o) => o.id === id);
      if (index === -1) throw new Error("Order not found");
      mockOrders[index].trackingNumber = trackingNumber;
      mockOrders[index].carrier = carrier;
      return mockOrders[index];
    }
  },
}

// Customer API
export const customerAPI = {
  getCustomers: async (): Promise<Customer[]> => {
    try {
      console.log('🔍 Fetching customers from backend...');
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      console.log('🔑 Token available:', !!token);
      
      const response = await apiCall('/users/admin/all')
      console.log('📊 Backend response:', response);
      
      const customers = response.data.map((user: any) => ({
        id: user._id,
        name: user.firstName || user.name || user.email,
        email: user.email,
        totalOrders: user.totalOrders || 0,
        totalSpent: user.totalSpent || 0,
        isBanned: user.isBanned || false,
        notes: user.notes || "",
        createdAt: user.createdAt
      }));
      
      console.log('👥 Mapped customers:', customers);
      return customers;
    } catch (error) {
      console.error('❌ Error fetching customers:', error)
      console.log('🔄 Falling back to mock data...');
      // Fallback to mock data
      return mockCustomers
    }
  },

  updateCustomer: async (id: string, customerData: Partial<Customer>): Promise<Customer> => {
    try {
      if (customerData.isBanned !== undefined) {
        const endpoint = customerData.isBanned ? `/users/admin/ban/${id}` : `/users/admin/unban/${id}`
        const response = await apiCall(endpoint, {
          method: 'POST',
          body: JSON.stringify({ reason: customerData.notes || "No reason provided" })
        })
        return response.user
      }
      
      // For other updates, use the user profile update endpoint
      const response = await apiCall(`/users/profile/${id}`, {
        method: 'PUT',
        body: JSON.stringify(customerData)
      })
      return response.data
    } catch (error) {
      console.error('Error updating customer:', error)
      throw error
    }
  },
}

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    try {
      // Get real products from backend
      const products = await productAPI.getProducts()
      
      // Get stats from backend
      const statsResponse = await apiCall('/products/stats')
      const stats = statsResponse.data
      
      // Calculate total stock from real products
      const totalStock = products.reduce(
        (sum: number, product: Product) => sum + product.variants.reduce((variantSum: number, variant: ProductVariant) => variantSum + variant.stock, 0),
        0,
      )

      // Get low stock products (stock < 10)
      const lowStockProducts = products.filter((p: Product) => p.variants.some((v: ProductVariant) => v.stock < 10))

      // Get real orders from backend
      const ordersResponse = await apiCall('/orders/admin/all').catch(() => ({ data: [] }));
      const realOrders = ordersResponse.data || [];
      
      // Get real customers from backend
      const customersResponse = await apiCall('/users/admin/all').catch(() => ({ data: [] }));
      const realCustomers = customersResponse.data || [];
      
      return {
        totalProducts: products.length,
        totalOrders: realOrders.length,
        totalCustomers: realCustomers.length, // Now using real customers
        totalStock,
        monthlyRevenue: realOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0),
        recentOrders: realOrders.slice(0, 5).map((order: any) => ({
          id: order._id,
          orderNumber: order.orderNumber,
          customer: {
            name: order.customer.name,
            email: order.customer.email,
          },
          total: order.total,
          status: order.status,
          createdAt: order.createdAt,
        })),
        lowStockProducts: lowStockProducts,
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      // Fallback to mock data if backend fails
      const totalStock = mockProducts.reduce(
        (sum: number, product: Product) => sum + product.variants.reduce((variantSum: number, variant: ProductVariant) => variantSum + variant.stock, 0),
        0,
      )

      // Try to get real orders and customers even in fallback
      const ordersResponse = await apiCall('/orders/admin/all').catch(() => ({ data: [] }));
      const realOrders = ordersResponse.data || [];
      const customersResponse = await apiCall('/users/admin/all').catch(() => ({ data: [] }));
      const realCustomers = customersResponse.data || [];
      
      return {
        totalProducts: mockProducts.length,
        totalOrders: realOrders.length || mockOrders.length,
        totalCustomers: realCustomers.length || mockCustomers.length,
        totalStock,
        monthlyRevenue: realOrders.length ? realOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0) : mockOrders.reduce((sum: number, order: Order) => sum + order.total, 0),
        recentOrders: realOrders.length ? realOrders.slice(0, 5).map((order: any) => ({
          id: order._id,
          orderNumber: order.orderNumber,
          customer: {
            name: order.customer.name,
            email: order.customer.email,
          },
          total: order.total,
          status: order.status,
          createdAt: order.createdAt,
        })) : mockOrders.slice(0, 5),
        lowStockProducts: mockProducts.filter((p: Product) => p.variants.some((v: ProductVariant) => v.stock < 10)),
      }
    }
  },
}

// Category API
export const categoryAPI = {
  // Get all categories (admin dashboard)
  getCategories: async (): Promise<Category[]> => {
    try {
      const response = await apiCall('/categories')
      return response.data
    } catch (error) {
      console.error('Error fetching categories:', error)
      return []
    }
  },

  // Get carousel categories (public website)
  getCarouselCategories: async (): Promise<Category[]> => {
    try {
      const response = await apiCall('/categories/public/carousel')
      return response.data
    } catch (error) {
      console.error('Error fetching carousel categories:', error)
      return []
    }
  },

  // Create category
  createCategory: async (data: Omit<Category, "_id" | "createdAt">): Promise<Category> => {
    try {
      const response = await apiCall('/categories', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      return response.category
    } catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  },

  // Update category
  updateCategory: async (id: string, data: Partial<Category>): Promise<Category> => {
    try {
      const response = await apiCall(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
      return response.category
    } catch (error) {
      console.error('Error updating category:', error)
      throw error
    }
  },

  // Delete category
  deleteCategory: async (id: string): Promise<void> => {
    try {
      await apiCall(`/categories/${id}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Error deleting category:', error)
      throw error
    }
  },

  // Toggle carousel display
  toggleCarouselDisplay: async (id: string, data: {
    showInCarousel: boolean;
    carouselOrder?: number;
    carouselImage?: string;
  }): Promise<Category> => {
    try {
      const response = await apiCall(`/categories/${id}/carousel`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
      return response.category
    } catch (error) {
      console.error('Error updating carousel display:', error)
      throw error
    }
  },

  // Get category statistics
  getCategoryStats: async (): Promise<any> => {
    try {
      const response = await apiCall('/categories/stats')
      return response.data
    } catch (error) {
      console.error('Error fetching category stats:', error)
      return { total: 0, active: 0, inCarousel: 0 }
    }
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
  // Get all coupons (admin dashboard)
  getCoupons: async (): Promise<Coupon[]> => {
    try {
      const response = await apiCall('/coupons')
      return response.data
    } catch (error) {
      console.error('Error fetching coupons:', error)
      return []
    }
  },

  // Get coupon by ID
  getCouponById: async (id: string): Promise<Coupon> => {
    try {
      const response = await apiCall(`/coupons/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching coupon:', error)
      throw error
    }
  },

  // Create coupon
  createCoupon: async (data: Omit<Coupon, "_id" | "createdAt" | "usedCount">): Promise<Coupon> => {
    try {
      const response = await apiCall('/coupons', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      return response.data
    } catch (error) {
      console.error('Error creating coupon:', error)
      throw error
    }
  },

  // Update coupon
  updateCoupon: async (id: string, data: Partial<Coupon>): Promise<Coupon> => {
    try {
      const response = await apiCall(`/coupons/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
      return response.data
    } catch (error) {
      console.error('Error updating coupon:', error)
      throw error
    }
  },

  // Delete coupon
  deleteCoupon: async (id: string): Promise<void> => {
    try {
      await apiCall(`/coupons/${id}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('Error deleting coupon:', error)
      throw error
    }
  },

  // Get coupon statistics
  getCouponStats: async (): Promise<any> => {
    try {
      const response = await apiCall('/coupons/stats')
      return response.data
    } catch (error) {
      console.error('Error fetching coupon stats:', error)
      return { total: 0, active: 0, expired: 0, totalUsage: 0 }
    }
  },

  // Validate coupon (public)
  validateCoupon: async (code: string, cartTotal: number, items: any[]): Promise<any> => {
    try {
      const response = await apiCall('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, cartTotal, items })
      })
      return response.data
    } catch (error) {
      console.error('Error validating coupon:', error)
      throw error
    }
  },

  // Apply coupon (public)
  applyCoupon: async (code: string, orderId: string): Promise<any> => {
    try {
      const response = await apiCall('/coupons/apply', {
        method: 'POST',
        body: JSON.stringify({ code, orderId })
      })
      return response.data
    } catch (error) {
      console.error('Error applying coupon:', error)
      throw error
    }
  },
}

// Review API
export const reviewAPI = {
  // Get all reviews (admin dashboard)
  getReviews: async (): Promise<Review[]> => {
    try {
      const response = await apiCall('/reviews')
      return response.data
    } catch (error) {
      console.error('Error fetching reviews:', error)
      return []
    }
  },

  // Get approved reviews for public website
  getPublicReviews: async (productId: string): Promise<Review[]> => {
    try {
      const response = await apiCall(`/reviews/public/${productId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching public reviews:', error)
      return []
    }
  },

  // Create new review (customer)
  createReview: async (reviewData: {
    productId: string;
    rating: number;
    comment: string;
    customerName: string;
    customerEmail: string;
  }): Promise<any> => {
    try {
      const response = await apiCall('/reviews/public/create', {
        method: 'POST',
        body: JSON.stringify(reviewData)
      })
      return response
    } catch (error) {
      console.error('Error creating review:', error)
      throw error
    }
  },

  // Approve review (admin)
  approveReview: async (reviewId: string, adminResponse?: string): Promise<Review> => {
    try {
      const response = await apiCall(`/reviews/${reviewId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ adminResponse })
      })
      return response.review
    } catch (error) {
      console.error('Error approving review:', error)
      throw error
    }
  },

  // Reject review (admin)
  rejectReview: async (reviewId: string, adminResponse?: string): Promise<Review> => {
    try {
      const response = await apiCall(`/reviews/${reviewId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ adminResponse })
      })
      return response.review
    } catch (error) {
      console.error('Error rejecting review:', error)
      throw error
    }
  },

  // Update review (admin)
  updateReview: async (id: string, reviewData: Partial<Review>): Promise<Review> => {
    try {
      const response = await apiCall(`/reviews/${id}`, {
        method: 'PUT',
        body: JSON.stringify(reviewData)
      })
      return response.review
    } catch (error) {
      console.error('Error updating review:', error)
      throw error
    }
  },

  // Get review statistics
  getReviewStats: async (): Promise<any> => {
    try {
      const response = await apiCall('/reviews/stats')
      return response.data
    } catch (error) {
      console.error('Error fetching review stats:', error)
      return { pending: 0, approved: 0, rejected: 0 }
    }
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

// Mock data for other entities (keeping for backward compatibility)
const mockOrders: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-001",
    customer: { name: "John Doe", email: "john@example.com" },
    total: 199.98,
    status: "processing",
    items: [
      {
        product: {} as Product,
        variant: {} as ProductVariant,
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
        product: {} as Product,
        variant: {} as ProductVariant,
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
    products: [],
    originalPrice: 449.98,
    bundlePrice: 399.99,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    _id: "2",
    name: "Gaming Bundle",
    description: "Perfect gaming setup for enthusiasts",
    products: [],
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
    minAmount: 50,
    maxDiscount: 25,
    usedCount: 25,
    usageLimit: 100,
    isActive: true,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isStackable: false,
    applicableProducts: [],
    applicableCategories: [],
    createdAt: new Date().toISOString(),
  },
  {
    _id: "2",
    code: "SAVE20",
    type: "flat",
    value: 20,
    minAmount: 100,
    usedCount: 5,
    usageLimit: 50,
    isActive: true,
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    isStackable: true,
    applicableProducts: [],
    applicableCategories: [],
    createdAt: new Date().toISOString(),
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
