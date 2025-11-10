"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { bundleAPI, type Bundle } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Plus, Edit, Trash2, Package, Calendar, Percent, Search, XCircle } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { BundleDialog } from "./bundle-dialog"

export function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null)
  const [selectedBundles, setSelectedBundles] = useState<string[]>([])
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const bundlesResponse = await bundleAPI.getBundles()
      setBundles(bundlesResponse.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (bundle: Bundle) => {
    setEditingBundle(bundle)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingBundle(null)
    setDialogOpen(true)
  }

  const handleDialogClose = (shouldRefresh?: boolean) => {
    setDialogOpen(false)
    setEditingBundle(null)
    if (shouldRefresh) {
      loadData()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bundle?")) return

    try {
      await bundleAPI.deleteBundle(id)
      toast({
        title: "Success",
        description: "Bundle deleted successfully",
      })
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete bundle",
        variant: "destructive",
      })
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedBundles.length} selected bundles?`)) return

    try {
      await Promise.all(selectedBundles.map((id) => bundleAPI.deleteBundle(id)))
      toast({
        title: "Success",
        description: `${selectedBundles.length} bundles deleted successfully.`,
      })
      setSelectedBundles([])
      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete some bundles. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleBundleSelect = (bundleId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedBundles((prev) => [...prev, bundleId])
    } else {
      setSelectedBundles((prev) => prev.filter((id) => id !== bundleId))
    }
  }

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedBundles(filteredBundles.map((b) => b._id))
    } else {
      setSelectedBundles([])
    }
  }

  const filteredBundles = bundles.filter((bundle) => {
    const matchesSearch = bundle.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || bundle.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const areAllVisibleSelected = filteredBundles.length > 0 && selectedBundles.length === filteredBundles.length

  const calculateSavings = (originalPrice: number, bundlePrice: number) => {
    if (!originalPrice || originalPrice === 0) {
      return { savings: 0, percentage: '0' };
    }
    const savings = originalPrice - bundlePrice;
    const percentage = ((savings / originalPrice) * 100).toFixed(0)
    return { savings, percentage }
  }

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
        <h1 className="text-3xl font-bold tracking-tight">Product Bundles</h1>
        <p className="text-muted-foreground">Create and manage product bundles and special offers.</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Checkbox
            checked={areAllVisibleSelected}
            onCheckedChange={(checked) => handleSelectAll(!!checked)}
            aria-label="Select all bundles on this page"
            disabled={filteredBundles.length === 0}
          />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search bundles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="men">Men</SelectItem>
              <SelectItem value="women">Women</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedBundles.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selectedBundles.length} selected</span>
            <Button variant="destructive" onClick={handleBulkDelete} className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Selected
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSelectedBundles([])}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Bundle
          </Button>
        )}
      </div>

      <BundleDialog open={dialogOpen} onClose={handleDialogClose} bundle={editingBundle} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredBundles.map((bundle) => {
          const { savings, percentage } = calculateSavings(bundle.originalPrice, bundle.bundlePrice)
          const isSelected = selectedBundles.includes(bundle._id)

          return (
            <Card key={bundle._id} className={`transition-all ${isSelected ? "border-primary ring-2 ring-primary" : "hover:shadow-lg"}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleBundleSelect(bundle._id, !!checked)}
                      aria-label={`Select bundle ${bundle.name}`}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{bundle.name}</CardTitle>
                      <CardDescription className="mt-1 capitalize">
                        {bundle.category.charAt(0).toUpperCase() + bundle.category.slice(1)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(bundle)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(bundle._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="destructive" className="text-xs">
                        -{percentage}%
                      </Badge>
                      <span className="text-2xl font-bold">{formatCurrency(bundle.bundlePrice)}</span>
                      <span className="text-sm text-muted-foreground line-through">{formatCurrency(bundle.originalPrice)}</span>
                    </div>
                    <Badge variant={bundle.isActive ? "default" : "secondary"}>
                      {bundle.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>{bundle.products?.length || 0} Products</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-muted-foreground">Save: {formatCurrency(savings)}</span>
                    </div>
                  </div>
                  {bundle.startDate && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      Active from {formatDate(bundle.startDate)}
                      {bundle.endDate && ` to ${formatDate(bundle.endDate)}`}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredBundles.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No bundles found</h3>
          <p className="text-gray-500">
            {searchQuery ? "Try adjusting your search terms" : "Get started by creating your first bundle"}
          </p>
        </div>
      )}
    </div>
  )
}
        <div>
          <h1 className="text-3xl font-bold">Product Bundles</h1>
          <p className="text-muted-foreground">Create and manage product bundles and special offers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Bundle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBundle ? "Edit Bundle" : "Create New Bundle"}</DialogTitle>
              <DialogDescription>
                {editingBundle ? "Update bundle information" : "Create a new product bundle with special pricing"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bundle Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter bundle name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bundlePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bundle Price </FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter bundle description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormLabel className="text-base font-medium">Select Products</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    All products in a bundle must be from the same category and sub-category. Select the first product to lock the categories.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <select
                          value={selectedCategory || ""}
                          onChange={(e) => {
                            setSelectedCategory(e.target.value || null)
                            setSelectedSubCategory(null)
                          }}
                          className="w-full p-2 border rounded-md"
                          disabled={selectedProducts.length > 0}
                        >
                          <option value="">All Categories</option>
                          {uniqueCategories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </FormControl>
                    </FormItem>
                    <FormItem>
                      <FormLabel>Sub-category</FormLabel>
                      <FormControl>
                        <select
                          value={selectedSubCategory || ""}
                          onChange={(e) => setSelectedSubCategory(e.target.value || null)}
                          className="w-full p-2 border rounded-md"
                          disabled={!selectedCategory || selectedProducts.length > 0}
                        >
                          <option value="">All Sub-categories</option>
                          {uniqueSubCategories.map((subCat) => (
                            <option key={subCat} value={subCat}>{subCat}</option>
                          ))}
                        </select>
                      </FormControl>
                    </FormItem>
                  </div>

                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                    {filteredProducts.map((product) => {
                      const isSelected = selectedProducts.includes(product._id)
                      const selectedCategoryProducts = selectedProducts.filter(id => 
                        products.find(p => p._id === id)?.category === product.category
                      )
                      const isDisabled =
                        selectedProducts.length > 0 &&
                        (product.category !== selectedCategory || product.subCategory !== selectedSubCategory)
                      
                      return (
                        <div key={product._id} className={`flex items-center space-x-3 p-2 hover:bg-muted rounded ${isDisabled ? 'opacity-50' : ''}`}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleProductSelection(product._id)}
                            disabled={isDisabled}
                          />
                          <img
                            src={product.images[0] || "/placeholder.svg"}
                            alt={product.title}
                            className="w-10 h-10 object-cover rounded"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{product.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(product.basePrice)} • {product.category}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {selectedProducts.length > 0 && (
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <div className="text-sm font-medium">Selected Products Summary:</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedProducts.length} products selected • Original Price:{" "}
                        {formatCurrency(
                          products
                            .filter((p) => selectedProducts.includes(p._id))
                            .reduce((sum, p) => sum + p.basePrice, 0),
                        )}
                      </div>
                      {selectedProducts.length < 2 && (
                        <div className="text-sm text-red-600 mt-1">
                          ⚠️ Bundle must contain at least 2 products
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Bundle</FormLabel>
                        <div className="text-sm text-muted-foreground">Bundle will be available for purchase</div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingBundle ? "Update Bundle" : "Create Bundle"}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {bundles.map((bundle) => {
          const { savings, percentage } = calculateSavings(bundle.originalPrice, bundle.bundlePrice)

          return (
            <Card key={bundle._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {bundle.name}
                      {!bundle.isActive && <Badge variant="secondary">Inactive</Badge>}
                    </CardTitle>
                    {bundle.description && <CardDescription>{bundle.description}</CardDescription>}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openDialog(bundle)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteBundle(bundle._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Products */}
                  <div>
                    <h4 className="font-medium mb-3">Included Products ({bundle.products.length})</h4>
                    <div className="space-y-2">
                      {bundle.products.map((product) => (
                        <div key={product._id} className="flex items-center space-x-2 text-sm">
                          <img
                            src={product.images?.[0] || "/placeholder.svg"}
                            alt={product.title}
                            className="w-8 h-8 object-cover rounded"
                          />
                          <div className="flex-1">
                            <div className="font-medium">{product.title}</div>
                            <div className="text-muted-foreground">{formatCurrency(product.basePrice)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div>
                    <h4 className="font-medium mb-3">Pricing Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Original Price:</span>
                        <span className="line-through">{formatCurrency(bundle.originalPrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>Bundle Price:</span>
                        <span className="text-green-600">{formatCurrency(bundle.bundlePrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">You Save:</span>
                        <span className="text-green-600 font-medium">
                          {formatCurrency(savings)} ({percentage}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dates & Status */}
                  <div>
                    <h4 className="font-medium mb-3">Bundle Details</h4>
                    <div className="space-y-2 text-sm">
                      {bundle.startDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Starts: {formatDate(bundle.startDate)}</span>
                        </div>
                      )}
                      {bundle.endDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Ends: {formatDate(bundle.endDate)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span>Created: {formatDate(bundle.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        <span>Discount: {percentage}% off</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {bundles.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No bundles created yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first product bundle to offer special deals to customers
              </p>
              <Button onClick={() => openDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Bundle
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
