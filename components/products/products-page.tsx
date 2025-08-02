"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { productAPI, type Product } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { ProductDialog } from "./product-dialog"
import { Plus, Search, Edit, Trash2, Package, Star } from "lucide-react"

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [collectionFilter, setCollectionFilter] = useState<string>("all")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
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
                             product.collectionType === collectionFilter
    
    return matchesSearch && matchesCollection
  })

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
              <SelectItem value="train">Train Collection</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => {
          const totalStock = getTotalStock(product)
          const defaultVariant = getDefaultVariant(product)
          const finalPrice = defaultVariant?.priceOverride || product.basePrice

          return (
            <Card key={product._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">${finalPrice.toFixed(2)}</span>
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

                  {/* Size and Color Preview */}
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

                  {/* Default Variant Indicator */}
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
