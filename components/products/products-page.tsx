"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox" // <-- Import Checkbox
import { productAPI, type Product } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { ProductDialog } from "./product-dialog"
import { Plus, Search, Edit, Trash2, Package, Star, XCircle } from "lucide-react"

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [collectionFilter, setCollectionFilter] = useState<string>("all")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]) // <-- State for selected product IDs
  const { toast } = useToast()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const data = await productAPI.getProducts()
      setProducts(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      await productAPI.deleteProduct(productId)
      toast({
        title: "Success",
        description: "Product deleted successfully",
      })
      fetchProducts()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      })
    }
  }

  // --- New Bulk Delete Handler ---
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedProducts.length} selected products?`)) return

    try {
      // Perform all delete operations concurrently
      await Promise.all(selectedProducts.map((id) => productAPI.deleteProduct(id)))
      
      toast({
        title: "Success",
        description: `${selectedProducts.length} products deleted successfully.`,
      })
      
      setSelectedProducts([]) // Clear selection
      fetchProducts() // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete some products. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setSelectedProduct(null)
    setDialogOpen(true)
  }

  const handleDialogClose = (shouldRefresh?: boolean) => {
    setDialogOpen(false)
    setSelectedProduct(null)
    if (shouldRefresh) {
      fetchProducts()
    }
  }

  const getTotalStock = (product: Product) => {
    return product.variants.reduce((total, variant) => total + variant.stock, 0)
  }

  const getDefaultVariant = (product: Product) => {
    return product.variants.find((v) => v.id === product.defaultVariant) || product.variants[0]
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.baseSku.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCollection = collectionFilter === "all" || 
                              (collectionFilter === "men" && product.category === "Men") ||
                              (collectionFilter === "women" && product.category === "Women")
    
    return matchesSearch && matchesCollection
  })

  // --- New Handlers for Selection ---
  const handleProductSelect = (productId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedProducts((prev) => [...prev, productId])
    } else {
      setSelectedProducts((prev) => prev.filter((id) => id !== productId))
    }
  }

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedProducts(filteredProducts.map((p) => p._id))
    } else {
      setSelectedProducts([])
    }
  }

  const areAllVisibleSelected = filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">Manage your product catalog with variants.</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* --- "Select All" Checkbox --- */}
          <Checkbox
            checked={areAllVisibleSelected}
            onCheckedChange={(checked) => handleSelectAll(!!checked)}
            aria-label="Select all products on this page"
            disabled={filteredProducts.length === 0}
          />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={collectionFilter} onValueChange={setCollectionFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by collection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Collections</SelectItem>
              <SelectItem value="men">Men Collection</SelectItem>
              <SelectItem value="women">Women Collection</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* --- Conditional Action Buttons --- */}
        {selectedProducts.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selectedProducts.length} selected</span>
            <Button variant="destructive" onClick={handleBulkDelete} className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Selected
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSelectedProducts([])}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => {
          const totalStock = getTotalStock(product)
          const defaultVariant = getDefaultVariant(product)
          const finalPrice = defaultVariant?.priceOverride || product.basePrice
          const isSelected = selectedProducts.includes(product._id)

          return (
            // --- Added selection styling to Card ---
            <Card key={product._id} className={`transition-all ${isSelected ? "border-primary ring-2 ring-primary" : "hover:shadow-lg"}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {/* --- Individual Product Checkbox --- */}
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleProductSelect(product._id, !!checked)}
                      aria-label={`Select product ${product.title}`}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
                      <CardDescription className="mt-1">
                        SKU: {product.baseSku} • {product.category}
                        {product.subCategory && <> • {product.subCategory}</>}
                        {product.collectionType && product.collectionType !== "general" && (
                          <> • <Badge variant="outline" className="text-xs">{product.collectionType.toUpperCase()}</Badge></>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(product._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* ... Rest of your CardContent remains the same ... */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {product.discountPercentage && product.discountPercentage > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          -{product.discountPercentage}%
                        </Badge>
                      )}
                      <span className="text-2xl font-bold">AED{finalPrice.toFixed(2)}</span>
                    </div>
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>Stock: {totalStock}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-muted-foreground">Variants: {product.variants.length}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">Sizes:</span>
                      <div className="flex space-x-1">
                        {product.sizeOptions.slice(0, 3).map((size) => (
                          <Badge key={size} variant="outline" className="text-xs">
                            {size}
                          </Badge>
                        ))}
                        {product.sizeOptions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{product.sizeOptions.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">Colors:</span>
                      <div className="flex space-x-1">
                        {product.colorOptions.slice(0, 4).map((color) => (
                          <div key={color.name} className="flex items-center">
                            {color.type === "hex" ? (
                              <div
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                              />
                            ) : (
                              <img
                                src={color.value.startsWith('http') ? color.value : `http://localhost:5000${color.value}`}
                                alt={color.name}
                                className="w-4 h-4 rounded-full border border-gray-300 object-cover"
                                title={color.name}
                              />
                            )}
                          </div>
                        ))}
                        {product.colorOptions.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{product.colorOptions.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {defaultVariant && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                      Default: {defaultVariant.size} / {defaultVariant.color?.name || 'N/A'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500">
            {searchQuery ? "Try adjusting your search terms" : "Get started by adding your first product"}
          </p>
        </div>
      )}

      <ProductDialog open={dialogOpen} onClose={handleDialogClose} product={selectedProduct} />
    </div>
  )
}