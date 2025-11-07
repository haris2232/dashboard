// Real API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://athlekt.com/backendnew/api';

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
    const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
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
  collectionType?: "men" | "women" | "train" | "general"
  description: string
  discountPercentage?: number
  images: string[]
  highlightImage?: string
  isActive: boolean
  createdAt: string
  // Variation options
  sizeOptions: string[]
  colorOptions: Array<{
    name: string
    type: "hex" | "image"
    value: string
    images?: string[]
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
  _id: string
  name: string
  email: string
  totalOrders: number
  totalSpent: number
  isActive: boolean
  isBanned: boolean
  isEmailVerified: boolean
  phone?: string
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  dateOfBirth?: string
  marketingOptIn: boolean
  banReason?: string
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
  currency: string
  homepageImage1?: string
  homepageImage1Type?: 'image' | 'video'
  homepageImage2?: string
  homepageImage3?: string
  homepageImage4?: string
  homepageImage5?: string
  homepageImage6?: string
  homepageImage7?: string
  salesImage1?: string
  salesImage2?: string
}

export interface ShippingRule {
  _id: string
  name: string
  region: string
  minWeight: number
  maxWeight: number
  minOrderAmount: number
  maxOrderAmount: number
  shippingCost: number
  freeShippingAt: number
  deliveryDays: number
  isActive: boolean
  priority: number
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
    collectionType: "women",
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
    collectionType: "men",
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
  {
    _id: "3",
    title: "Training Shorts",
    basePrice: 45.99,
    baseSku: "TS-003",
    category: "Sports",
    collectionType: "train",
    description: "Comfortable training shorts for workouts",
    images: ["/placeholder.svg?height=300&width=300"],
    isActive: true,
    createdAt: new Date().toISOString(),
    sizeOptions: ["S", "M", "L"],
    colorOptions: [
      { name: "Gray", type: "hex", value: "#6b7280" },
      { name: "Black", type: "hex", value: "#000000" },
    ],
    variants: [
      {
        id: "v6",
        size: "M",
        color: { name: "Gray", type: "hex", value: "#6b7280" },
        sku: "TS-003-M-GRY",
        stock: 8,
        isActive: true,
      },
    ],
    defaultVariant: "v6",
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
          collectionType: product.collectionType,
          description: product.description,
          discountPercentage: product.discountPercentage || 0,
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

  getProductsByCollection: async (collectionType: "men" | "women" | "train" | "general"): Promise<Product[]> => {
    try {
      const response = await apiCall(`/products?collectionType=${collectionType}`);
      if (response.data && Array.isArray(response.data)) {
        return response.data.map((product: any) => ({
          _id: product._id || product.id,
          title: product.title,
          basePrice: product.basePrice,
          baseSku: product.baseSku,
          category: product.category,
          subCategory: product.subCategory,
          collectionType: product.collectionType,
          description: product.description,
          discountPercentage: product.discountPercentage || 0,
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
      console.error('Error fetching products by collection:', error);
      // Return mock data filtered by collection type if backend is not available
      return mockProducts.filter(product => product.collectionType === collectionType);
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
      const formData = new FormData();
      files.forEach((file) => {
        // The backend route expects the field name to be 'images'
        formData.append('images', file);
      });

      const response = await fetch(`${API_BASE_URL}/products/upload-images`, {
        method: 'POST',
        body: formData,
        // Note: Don't set 'Content-Type' header manually for FormData,
        // the browser will do it correctly with the boundary.
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
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

  updateOrderStatus: async (id: string, status: Order["status"]): Promise<{ data: Order; emailSent: boolean; statusChanged: boolean }> => {
    try {
      const response = await apiCall(`/orders/admin/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      return response;
    } catch (error) {
      console.error('Error updating order status:', error);
      // Fallback to mock data
      const index = mockOrders.findIndex((o) => o.id === id);
      if (index === -1) throw new Error("Order not found");
      mockOrders[index].status = status;
      return { 
        data: mockOrders[index], 
        emailSent: false, 
        statusChanged: true 
      };
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
  getCustomers: async (): Promise<{ data: Customer[] }> => {
    try {
      console.log('🔍 Fetching customers from backend...');
      const response = await apiCall('/customers');
      console.log('📊 Backend response:', response);
      return response;
    } catch (error) {
      console.error('❌ Error fetching customers:', error);
      console.log('🔄 Falling back to mock data...');
      // Fallback to mock data
      await delay(500);
      return { data: mockCustomers };
    }
  },

  getCustomerById: async (id: string): Promise<Customer> => {
    try {
      const response = await apiCall(`/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  },

  updateCustomer: async (id: string, customerData: Partial<Customer>): Promise<Customer> => {
    try {
      const response = await apiCall(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(customerData)
      });
      return response.data;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  banCustomer: async (id: string): Promise<void> => {
    try {
      await apiCall(`/customers/ban/${id}`, { method: 'POST' });
    } catch (error) {
      console.error('Error banning customer:', error);
      throw error;
    }
  },

  unbanCustomer: async (id: string): Promise<void> => {
    try {
      await apiCall(`/customers/unban/${id}`, { method: 'POST' });
    } catch (error) {
      console.error('Error unbanning customer:', error);
      throw error;
    }
  },

  deleteCustomer: async (id: string): Promise<void> => {
    try {
      await apiCall(`/customers/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
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
      
      // Calculate low stock count
      const lowStockCount = products.reduce((count: number, product: Product) => {
        return count + product.variants.filter((v: ProductVariant) => v.stock < 10).length
      }, 0)

      // Get real orders from backend
      const ordersResponse = await apiCall('/orders/admin/all').catch(() => ({ data: [] }));
      const realOrders = ordersResponse.data || [];
      
      // Get real customers from backend
      const customersResponse = await apiCall('/customers').catch(() => ({ data: [] }));
      const realCustomers = customersResponse.data || [];
      
      // Calculate current month and previous month data
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      
      // Current month orders
      const currentMonthOrders = realOrders.filter((order: any) => {
        const orderDate = new Date(order.createdAt)
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
      })
      
      // Previous month orders
      const previousMonthOrders = realOrders.filter((order: any) => {
        const orderDate = new Date(order.createdAt)
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
        return orderDate.getMonth() === prevMonth && orderDate.getFullYear() === prevYear
      })
      
      // Calculate revenue percentages
      const currentMonthRevenue = currentMonthOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
      const previousMonthRevenue = previousMonthOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
      const revenuePercentage = previousMonthRevenue > 0 ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100) : 0
      
      // Calculate order percentages
      const currentMonthOrderCount = currentMonthOrders.length
      const previousMonthOrderCount = previousMonthOrders.length
      const orderPercentage = previousMonthOrderCount > 0 ? ((currentMonthOrderCount - previousMonthOrderCount) / previousMonthOrderCount * 100) : 0
      
      // Calculate customer growth (simplified - assuming new customers this month)
      const currentMonthCustomers = realCustomers.filter((customer: any) => {
        const customerDate = new Date(customer.createdAt)
        return customerDate.getMonth() === currentMonth && customerDate.getFullYear() === currentYear
      })
      const previousMonthCustomers = realCustomers.filter((customer: any) => {
        const customerDate = new Date(customer.createdAt)
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
        return customerDate.getMonth() === prevMonth && customerDate.getFullYear() === prevYear
      })
      const customerPercentage = previousMonthCustomers.length > 0 ? ((currentMonthCustomers.length - previousMonthCustomers.length) / previousMonthCustomers.length * 100) : 0
      
              return {
          totalProducts: products.length,
          totalOrders: realOrders.length,
          totalCustomers: realCustomers.length,
          totalStock,
          lowStockCount,
          monthlyRevenue: currentMonthRevenue,
          revenuePercentage: Math.round(revenuePercentage * 10) / 10, // Round to 1 decimal
          orderPercentage: Math.round(orderPercentage * 10) / 10,
          customerPercentage: Math.round(customerPercentage * 10) / 10,
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
      const customersResponse = await apiCall('/customers').catch(() => ({ data: [] }));
      const realCustomers = customersResponse.data || [];
      
      // Calculate low stock count for fallback
      const lowStockCount = mockProducts.reduce((count: number, product: Product) => {
        return count + product.variants.filter((v: ProductVariant) => v.stock < 10).length
      }, 0)
      
      // Calculate percentages for fallback data
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      
      const currentMonthOrders = realOrders.filter((order: any) => {
        const orderDate = new Date(order.createdAt)
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
      })
      
      const previousMonthOrders = realOrders.filter((order: any) => {
        const orderDate = new Date(order.createdAt)
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
        return orderDate.getMonth() === prevMonth && orderDate.getFullYear() === prevYear
      })
      
      const currentMonthRevenue = currentMonthOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
      const previousMonthRevenue = previousMonthOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
      const revenuePercentage = previousMonthRevenue > 0 ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100) : 0
      
      const currentMonthOrderCount = currentMonthOrders.length
      const previousMonthOrderCount = previousMonthOrders.length
      const orderPercentage = previousMonthOrderCount > 0 ? ((currentMonthOrderCount - previousMonthOrderCount) / previousMonthOrderCount * 100) : 0
      
      const currentMonthCustomers = realCustomers.filter((customer: any) => {
        const customerDate = new Date(customer.createdAt)
        return customerDate.getMonth() === currentMonth && customerDate.getFullYear() === currentYear
      })
      const previousMonthCustomers = realCustomers.filter((customer: any) => {
        const customerDate = new Date(customer.createdAt)
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
        return customerDate.getMonth() === prevMonth && customerDate.getFullYear() === prevYear
      })
      const customerPercentage = previousMonthCustomers.length > 0 ? ((currentMonthCustomers.length - previousMonthCustomers.length) / previousMonthCustomers.length * 100) : 0
      
      return {
        totalProducts: mockProducts.length,
        totalOrders: realOrders.length || mockOrders.length,
        totalCustomers: realCustomers.length || mockCustomers.length,
        totalStock,
        lowStockCount,
        monthlyRevenue: currentMonthRevenue || mockOrders.reduce((sum: number, order: Order) => sum + order.total, 0),
        revenuePercentage: Math.round(revenuePercentage * 10) / 10,
        orderPercentage: Math.round(orderPercentage * 10) / 10,
        customerPercentage: Math.round(customerPercentage * 10) / 10,
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
    try {
      const response = await apiCall('/bundles');
      return response;
    } catch (error) {
      console.error('Error fetching bundles:', error);
      return { data: [] };
    }
  },
  
  getBundleById: async (id: string): Promise<Bundle> => {
    try {
      const response = await apiCall(`/bundles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bundle:', error);
      throw error;
    }
  },
  
  createBundle: async (data: Omit<Bundle, "_id">): Promise<Bundle> => {
    try {
      const response = await apiCall('/bundles', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating bundle:', error);
      throw error;
    }
  },
  
  updateBundle: async (id: string, data: Partial<Bundle>): Promise<Bundle> => {
    try {
      const response = await apiCall(`/bundles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating bundle:', error);
      throw error;
    }
  },
  
  deleteBundle: async (id: string): Promise<void> => {
    try {
      await apiCall(`/bundles/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting bundle:', error);
      throw error;
    }
  },
  
  getActiveBundles: async (): Promise<{ data: Bundle[] }> => {
    try {
      const response = await apiCall('/bundles/public/active');
      return response;
    } catch (error) {
      console.error('Error fetching active bundles:', error);
      return { data: [] };
    }
  },
  
  calculateBundleDiscount: async (cartItems: any[]): Promise<any> => {
    try {
      const response = await apiCall('/bundles/public/calculate-discount', {
        method: 'POST',
        body: JSON.stringify({ cartItems }),
      });
      return response;
    } catch (error) {
      console.error('Error calculating bundle discount:', error);
      throw error;
    }
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
    try {
      const response = await apiCall('/settings/public');
      return { data: response };
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Fallback to mock data if API fails
      await delay(400);
      return { data: mockSettings };
    }
  },
  updateSettings: async (formData: FormData): Promise<Settings> => {
    try {
      // Extract settingsData from FormData and send as JSON
      const settingsDataString = formData.get("settingsData") as string;
      const settingsData = JSON.parse(settingsDataString);
      
      // Backend expects JSON body with settingsData field containing JSON string
      const url = `${API_BASE_URL}/settings`;
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          settingsData: settingsDataString // Send as JSON string in settingsData field
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error updating settings:', error);
      // Fallback to mock data if API fails
      await delay(800);
      mockSettings = { ...mockSettings, ...JSON.parse(formData.get("settingsData") as string) };
      return mockSettings;
    }
  },
}

// User API
export const userAPI = {
  getUsers: async (): Promise<{ data: User[] }> => {
    try {
      const response = await apiCall('/users');
      return response;
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback to mock data if API fails
      await delay(500);
      return { data: mockUsers };
    }
  },
  createUser: async (data: Omit<User, "_id" | "createdAt">): Promise<User> => {
    try {
      const response = await apiCall('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      // Fallback to mock data if API fails
      await delay(800);
      const newUser: User = { ...data, _id: Math.random().toString(36).slice(2), createdAt: new Date().toISOString() };
      mockUsers.push(newUser);
      return newUser;
    }
  },
  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    try {
      const response = await apiCall(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      // Fallback to mock data if API fails
      await delay(800);
      const idx = mockUsers.findIndex((u) => u._id === id);
      if (idx === -1) throw new Error("User not found");
      mockUsers[idx] = { ...mockUsers[idx], ...data };
      return mockUsers[idx];
    }
  },
  deleteUser: async (id: string): Promise<void> => {
    try {
      await apiCall(`/users/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting user:', error);
      // Fallback to mock data if API fails
      await delay(300);
      mockUsers = mockUsers.filter((u) => u._id !== id);
    }
  },
}

// Shipping API
export const shippingAPI = {
  getShippingRules: async (): Promise<{ data: ShippingRule[] }> => {
    return apiCall('/shipping')
  },
  getShippingRuleById: async (id: string): Promise<{ data: ShippingRule }> => {
    return apiCall(`/shipping/${id}`)
  },
  createShippingRule: async (data: Omit<ShippingRule, "_id" | "createdAt">): Promise<{ data: ShippingRule }> => {
    return apiCall('/shipping', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  updateShippingRule: async (id: string, data: Partial<ShippingRule>): Promise<{ data: ShippingRule }> => {
    return apiCall(`/shipping/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },
  deleteShippingRule: async (id: string): Promise<void> => {
    return apiCall(`/shipping/${id}`, {
      method: 'DELETE'
    })
  },
  getActiveShippingRules: async (): Promise<{ data: ShippingRule[] }> => {
    return apiCall('/shipping/public/active')
  },
  calculateShipping: async (data: { subtotal: number; region?: string; weight?: number }): Promise<any> => {
    return apiCall('/shipping/public/calculate', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
}

export interface Blog {
  _id: string
  adminName: string
  url: string
  content: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const blogAPI = {
  getBlogs: async (): Promise<{ data: Blog[] }> => {
    return apiCall('/blogs')
  },
  getBlogById: async (id: string): Promise<{ data: Blog }> => {
    return apiCall(`/blogs/${id}`)
  },
  createBlog: async (data: Omit<Blog, "_id" | "createdAt" | "updatedAt">): Promise<{ blog: Blog }> => {
    return apiCall('/blogs', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  updateBlog: async (id: string, data: Partial<Blog>): Promise<{ blog: Blog }> => {
    return apiCall(`/blogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },
  deleteBlog: async (id: string): Promise<void> => {
    return apiCall(`/blogs/${id}`, {
      method: 'DELETE'
    })
  },
  toggleBlogStatus: async (id: string): Promise<{ blog: Blog }> => {
    return apiCall(`/blogs/${id}/toggle`, {
      method: 'PUT'
    })
  },
  getActiveBlogs: async (): Promise<{ success: boolean; data: Blog[] }> => {
    return apiCall('/blogs/public/active')
  },
}

export interface CarouselImage {
  _id: string
  imageUrl: string
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const carouselImageAPI = {
  getCarouselImages: async (): Promise<{ data: CarouselImage[] }> => {
    return apiCall('/carousel-images')
  },
  getCarouselImageById: async (id: string): Promise<{ data: CarouselImage }> => {
    return apiCall(`/carousel-images/${id}`)
  },
  createCarouselImage: async (data: Omit<CarouselImage, "_id" | "createdAt" | "updatedAt">): Promise<{ image: CarouselImage }> => {
    return apiCall('/carousel-images', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },
  updateCarouselImage: async (id: string, data: Partial<CarouselImage>): Promise<{ image: CarouselImage }> => {
    return apiCall(`/carousel-images/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },
  deleteCarouselImage: async (id: string): Promise<void> => {
    return apiCall(`/carousel-images/${id}`, {
      method: 'DELETE'
    })
  },
  toggleCarouselImageStatus: async (id: string): Promise<{ image: CarouselImage }> => {
    return apiCall(`/carousel-images/${id}/toggle`, {
      method: 'PUT'
    })
  },
  getActiveCarouselImages: async (): Promise<{ success: boolean; data: CarouselImage[] }> => {
    return apiCall('/carousel-images/public/active')
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
  currency: "USD",
  homepageImage1: "",
  homepageImage2: "",
  homepageImage3: "",
  homepageImage4: "",
  homepageImage5: "",
  homepageImage6: "",
  homepageImage7: "",
  salesImage1: "",
  salesImage2: "",
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
  blogAPI,
  carouselImageAPI,
}
