const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const multer = require("multer")
const path = require("path")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const fs = require("fs")

const app = express()

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use("/uploads", express.static("uploads"))

// Create uploads directory if it doesn't exist
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads")
}

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/ecommerce_admin", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

// JWT Secret
const JWT_SECRET = "your-super-secret-jwt-key"

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname))
  },
})

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Only image files are allowed"))
    }
  },
})

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "manager", "viewer"], default: "viewer" },
  name: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
})

const User = mongoose.model("User", userSchema)

// Product Schema
const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  sku: { type: String, required: true, unique: true },
  inventory: { type: Number, default: 0 },
  tags: [String],
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  images: [String],
  variants: [
    {
      size: String,
      color: String,
      colorType: { type: String, enum: ["hex", "image"] },
      colorValue: String, // hex code or image path
      sku: String,
      stock: Number,
      price: Number,
    },
  ],
  description: String,
  purpose: String,
  features: String,
  material: String,
  featuredHighlight: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
})

const Product = mongoose.model("Product", productSchema)

// Category Schema
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  image: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
})

const Category = mongoose.model("Category", categorySchema)

// Order Schema
const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customer: {
    name: String,
    email: String,
    phone: String,
    address: String,
  },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: Number,
      price: Number,
      variant: String,
    },
  ],
  total: Number,
  status: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
    default: "pending",
  },
  trackingNumber: String,
  carrier: String,
  paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
})

const Order = mongoose.model("Order", orderSchema)

// Review Schema
const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  customer: {
    name: String,
    email: String,
  },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: String,
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  adminResponse: String,
  createdAt: { type: Date, default: Date.now },
})

const Review = mongoose.model("Review", reviewSchema)

// Coupon Schema
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ["flat", "percentage"], required: true },
  value: { type: Number, required: true },
  minAmount: Number,
  maxDiscount: Number,
  usageLimit: Number,
  usedCount: { type: Number, default: 0 },
  expiresAt: Date,
  isStackable: { type: Boolean, default: false },
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
})

const Coupon = mongoose.model("Coupon", couponSchema)

// Bundle Schema
const bundleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  originalPrice: Number,
  bundlePrice: { type: Number, required: true },
  startDate: Date,
  endDate: Date,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
})

const Bundle = mongoose.model("Bundle", bundleSchema)

// Settings Schema
const settingsSchema = new mongoose.Schema({
  storeName: String,
  logo: String,
  currency: { type: String, default: "USD" },
  language: { type: String, default: "en" },
  timezone: String,
  country: String,
  freeShippingThreshold: Number,
  freeGiftThreshold: Number,
  freeGiftProduct: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  emailSettings: {
    host: String,
    port: Number,
    username: String,
    password: String,
    senderName: String,
  },
  modules: {
    reviews: { type: Boolean, default: true },
    coupons: { type: Boolean, default: true },
    shipping: { type: Boolean, default: true },
    bundles: { type: Boolean, default: true },
  },
  seoMeta: {
    title: String,
    description: String,
    keywords: String,
  },
  contactInfo: {
    email: String,
    phone: String,
    address: String,
  },
})

const Settings = mongoose.model("Settings", settingsSchema)

// Customer Schema
const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  address: String,
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  isBanned: { type: Boolean, default: false },
  notes: String,
  createdAt: { type: Date, default: Date.now },
})

const Customer = mongoose.model("Customer", customerSchema)

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Access token required" })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" })
    }
    req.user = user
    next()
  })
}

// Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" })
    }
    next()
  }
}

// Initialize default users
const initializeUsers = async () => {
  try {
    const userCount = await User.countDocuments()
    if (userCount === 0) {
      const defaultUsers = [
        { email: "admin@example.com", password: "admin123", role: "admin", name: "Admin User" },
        { email: "manager@example.com", password: "manager123", role: "manager", name: "Manager User" },
        { email: "viewer@example.com", password: "viewer123", role: "viewer", name: "Viewer User" },
      ]

      for (const userData of defaultUsers) {
        const hashedPassword = await bcrypt.hash(userData.password, 10)
        const user = new User({
          ...userData,
          password: hashedPassword,
        })
        await user.save()
      }
      console.log("Default users created")
    }
  } catch (error) {
    console.error("Error initializing users:", error)
  }
}

// Auth Routes
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email, isActive: true })
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "24h" })

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// User Routes
app.get("/api/users", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const users = await User.find().select("-password")
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post("/api/users", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { email, password, role, name } = req.body
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = new User({
      email,
      password: hashedPassword,
      role,
      name,
    })

    await user.save()
    const userResponse = user.toObject()
    delete userResponse.password

    res.status(201).json(userResponse)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put("/api/users/:id", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { email, role, name, isActive } = req.body
    const user = await User.findByIdAndUpdate(req.params.id, { email, role, name, isActive }, { new: true }).select(
      "-password",
    )

    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete("/api/users/:id", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.json({ message: "User deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Product Routes
app.get("/api/products", authenticateToken, async (req, res) => {
  try {
    const products = await Product.find().populate("category")
    res.json(products)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post(
  "/api/products",
  authenticateToken,
  requireRole(["admin", "manager"]),
  upload.array("images", 5),
  async (req, res) => {
    try {
      const productData = JSON.parse(req.body.productData)
      const images = req.files ? req.files.map((file) => file.path) : []

      const product = new Product({
        ...productData,
        images,
      })

      await product.save()
      res.status(201).json(product)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },
)

app.put(
  "/api/products/:id",
  authenticateToken,
  requireRole(["admin", "manager"]),
  upload.array("images", 5),
  async (req, res) => {
    try {
      const productData = JSON.parse(req.body.productData)
      const newImages = req.files ? req.files.map((file) => file.path) : []

      const existingProduct = await Product.findById(req.params.id)
      const images = [...(existingProduct.images || []), ...newImages]

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { ...productData, images },
        { new: true },
      ).populate("category")

      res.json(product)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },
)

app.delete("/api/products/:id", authenticateToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id)
    res.json({ message: "Product deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Category Routes
app.get("/api/categories", authenticateToken, async (req, res) => {
  try {
    const categories = await Category.find()
    res.json(categories)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post(
  "/api/categories",
  authenticateToken,
  requireRole(["admin", "manager"]),
  upload.single("image"),
  async (req, res) => {
    try {
      const categoryData = {
        name: req.body.name,
        description: req.body.description,
        image: req.file ? req.file.path : null,
      }

      const category = new Category(categoryData)
      await category.save()
      res.status(201).json(category)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },
)

// Order Routes
app.get("/api/orders", authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find().populate("items.product").sort({ createdAt: -1 })
    res.json(orders)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put("/api/orders/:id", authenticateToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("items.product")

    res.json(order)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Review Routes
app.get("/api/reviews", authenticateToken, async (req, res) => {
  try {
    const reviews = await Review.find().populate("product").sort({ createdAt: -1 })
    res.json(reviews)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put("/api/reviews/:id", authenticateToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("product")

    res.json(review)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Customer Routes
app.get("/api/customers", authenticateToken, async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 })
    res.json(customers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put("/api/customers/:id", authenticateToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true })

    res.json(customer)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Coupon Routes
app.get("/api/coupons", authenticateToken, async (req, res) => {
  try {
    const coupons = await Coupon.find().populate("applicableProducts applicableCategories")
    res.json(coupons)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post("/api/coupons", authenticateToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const coupon = new Coupon(req.body)
    await coupon.save()
    res.status(201).json(coupon)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Bundle Routes
app.get("/api/bundles", authenticateToken, async (req, res) => {
  try {
    const bundles = await Bundle.find().populate("products")
    res.json(bundles)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post("/api/bundles", authenticateToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const bundle = new Bundle(req.body)
    await bundle.save()
    res.status(201).json(bundle)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Settings Routes
app.get("/api/settings", authenticateToken, async (req, res) => {
  try {
    let settings = await Settings.findOne()
    if (!settings) {
      settings = new Settings({})
      await settings.save()
    }
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.put("/api/settings", authenticateToken, requireRole(["admin"]), upload.single("logo"), async (req, res) => {
  try {
    const settingsData = JSON.parse(req.body.settingsData || "{}")
    if (req.file) {
      settingsData.logo = req.file.path
    }

    let settings = await Settings.findOne()
    if (!settings) {
      settings = new Settings(settingsData)
    } else {
      Object.assign(settings, settingsData)
    }

    await settings.save()
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Dashboard Stats Route
app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments()
    const totalOrders = await Order.countDocuments()
    const totalCustomers = await Customer.countDocuments()
    const totalUsers = await User.countDocuments()

    const recentOrders = await Order.find().populate("items.product").sort({ createdAt: -1 }).limit(5)

    const lowStockProducts = await Product.find({ inventory: { $lt: 10 } }).limit(5)

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
          status: { $in: ["delivered", "shipped"] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
        },
      },
    ])

    res.json({
      totalProducts,
      totalOrders,
      totalCustomers,
      totalUsers,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      recentOrders,
      lowStockProducts,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// File upload route
app.post("/api/upload", authenticateToken, upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    res.json({
      filename: req.file.filename,
      path: req.file.path,
      url: `${req.protocol}://${req.get("host")}/${req.file.path}`,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large" })
    }
  }
  res.status(500).json({ error: error.message })
})

const PORT = process.env.PORT || 3000

// Initialize database and start server
mongoose.connection.once("open", async () => {
  console.log("Connected to MongoDB")
  await initializeUsers()

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})

mongoose.connection.on("error", (error) => {
  console.error("MongoDB connection error:", error)
})
