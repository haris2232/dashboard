"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { bundleAPI, productAPI, type Bundle, type Product } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Plus, Edit, Trash2, Package, DollarSign, Calendar, Percent } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

const bundleSchema = z.object({
  name: z.string().min(1, "Bundle name is required"),
  description: z.string().optional(),
  bundlePrice: z.string().min(1, "Bundle price is required"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean(),
})

export function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const { toast } = useToast()

  const form = useForm<z.infer<typeof bundleSchema>>({
    resolver: zodResolver(bundleSchema),
    defaultValues: {
      name: "",
      description: "",
      bundlePrice: "",
      startDate: "",
      endDate: "",
      isActive: true,
    },
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [bundlesResponse, productsResponse] = await Promise.all([bundleAPI.getBundles(), productAPI.getProducts()])
      setBundles(bundlesResponse.data)
      setProducts(productsResponse)
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

  const openDialog = (bundle?: Bundle) => {
    if (bundle) {
      setEditingBundle(bundle)
      form.reset({
        name: bundle.name,
        description: bundle.description || "",
        bundlePrice: bundle.bundlePrice.toString(),
        startDate: bundle.startDate || "",
        endDate: bundle.endDate || "",
        isActive: bundle.isActive,
      })
      setSelectedProducts(bundle.products.map((p) => p._id))
    } else {
      setEditingBundle(null)
      form.reset()
      setSelectedProducts([])
    }
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingBundle(null)
    form.reset()
    setSelectedProducts([])
  }

  const onSubmit = async (values: z.infer<typeof bundleSchema>) => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one product for the bundle",
        variant: "destructive",
      })
      return
    }

    // Validate product count (must be at least 2)
    if (selectedProducts.length < 2) {
      toast({
        title: "Error",
        description: "Bundle must contain at least 2 products",
        variant: "destructive",
      })
      return
    }

    try {
      const bundleProducts = products.filter((p) => selectedProducts.includes(p._id))
      const originalPrice = bundleProducts.reduce((sum, product) => sum + product.basePrice, 0)
      
      // Determine category based on selected products
      const categories = [...new Set(bundleProducts.map(p => p.category))]
      const category = categories.length === 1 ? categories[0].toLowerCase() : 'mixed'

      const bundleData = {
        ...values,
        bundlePrice: Number.parseFloat(values.bundlePrice),
        products: selectedProducts, // Send just the product IDs
        originalPrice,
        category, // Set the category
        createdAt: editingBundle?.createdAt || new Date().toISOString(),
      }

      if (editingBundle) {
        await bundleAPI.updateBundle(editingBundle._id, bundleData)
        toast({
          title: "Success",
          description: "Bundle updated successfully",
        })
      } else {
        await bundleAPI.createBundle(bundleData)
        toast({
          title: "Success",
          description: "Bundle created successfully",
        })
      }

      closeDialog()
      loadData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to save bundle",
        variant: "destructive",
      })
    }
  }

  const deleteBundle = async (id: string) => {
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

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  const calculateSavings = (originalPrice: number, bundlePrice: number) => {
    const savings = originalPrice - bundlePrice
    const percentage = ((savings / originalPrice) * 100).toFixed(0)
    return { savings, percentage }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
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
                        <FormLabel>Bundle Price ($)</FormLabel>
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

                <div>
                  <FormLabel className="text-base font-medium">Select Products (Must be at least 2 products from any category)</FormLabel>
                  
                              {/* Category Filter */}
            <div className="mt-2 mb-3">
              <div className="text-sm font-medium mb-2">Filter by Category:</div>
              <div className="flex space-x-2">
                {['Men', 'Women'].map((category) => {
                  const categoryProducts = products.filter(p => p.category === category)
                  const selectedCategoryProducts = selectedProducts.filter(id =>
                    products.find(p => p._id === id)?.category === category
                  )
                        
                        return (
                          <div key={category} className="flex items-center space-x-2">
                            <span className="text-sm capitalize">{category}:</span>
                            <span className="text-sm text-muted-foreground">
                              {selectedCategoryProducts.length} selected of {categoryProducts.length} available
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
                    {products.map((product) => {
                      const isSelected = selectedProducts.includes(product._id)
                      const selectedCategoryProducts = selectedProducts.filter(id => 
                        products.find(p => p._id === id)?.category === product.category
                      )
                      const isDisabled = false // Allow unlimited products from any category
                      
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
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
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
