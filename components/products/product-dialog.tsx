"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { productAPI, type Product, type ProductVariant } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { X, Plus, Star, Upload, Palette, ImageIcon, Trash2, MoveUp, MoveDown } from "lucide-react"

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  basePrice: z.string().min(1, "Price is required"),
  baseSku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  isActive: z.boolean(),
})

interface ProductDialogProps {
  open: boolean
  onClose: (shouldRefresh?: boolean) => void
  product?: Product | null
}

export function ProductDialog({ open, onClose, product }: ProductDialogProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [images, setImages] = useState<string[]>([])
  const [sizeOptions, setSizeOptions] = useState<string[]>([])
  const [colorOptions, setColorOptions] = useState<
    Array<{
      name: string
      type: "hex" | "image"
      value: string
    }>
  >([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [defaultVariant, setDefaultVariant] = useState<string>("")
  const [newSize, setNewSize] = useState("")
  const [newColorName, setNewColorName] = useState("")
  const [newColorValue, setNewColorValue] = useState("#000000")
  const [colorInputType, setColorInputType] = useState<"hex" | "image">("hex")
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      basePrice: "",
      baseSku: "",
      category: "",
      description: "",
      isActive: true,
    },
  })

  useEffect(() => {
    if (product) {
      form.reset({
        title: product.title,
        basePrice: product.basePrice.toString(),
        baseSku: product.baseSku,
        category: product.category,
        description: product.description,
        isActive: product.isActive,
      })
      setImages(product.images || [])
      setSizeOptions(product.sizeOptions)
      setColorOptions(product.colorOptions)
      setVariants(product.variants)
      setDefaultVariant(product.defaultVariant || "")
    } else {
      form.reset()
      setImages([])
      setSizeOptions([])
      setColorOptions([])
      setVariants([])
      setDefaultVariant("")
    }
  }, [product, form])

  // Generate variants when sizes or colors change
  useEffect(() => {
    if (sizeOptions.length > 0 && colorOptions.length > 0) {
      const newVariants: ProductVariant[] = []

      sizeOptions.forEach((size) => {
        colorOptions.forEach((color) => {
          const existingVariant = variants.find((v) => v.size === size && v.color.name === color.name)
          if (existingVariant) {
            newVariants.push(existingVariant)
          } else {
            newVariants.push({
              id: `${size}-${color.name}-${Date.now()}`,
              size,
              color,
              sku: `${form.getValues("baseSku") || "SKU"}-${size.toUpperCase()}-${color.name.substring(0, 3).toUpperCase()}`,
              stock: 0,
              isActive: true,
            })
          }
        })
      })

      setVariants(newVariants)
    }
  }, [sizeOptions, colorOptions, form])

  const addImage = () => {
    const newImageUrl = `/placeholder.svg?height=400&width=400&text=Product+Image+${images.length + 1}`
    setImages([...images, newImageUrl])
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const moveImage = (index: number, direction: "up" | "down") => {
    const newImages = [...images]
    const targetIndex = direction === "up" ? index - 1 : index + 1

    if (targetIndex >= 0 && targetIndex < images.length) {
      ;[newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]]
      setImages(newImages)
    }
  }

  const addSize = () => {
    if (newSize && !sizeOptions.includes(newSize)) {
      setSizeOptions([...sizeOptions, newSize])
      setNewSize("")
    }
  }

  const removeSize = (size: string) => {
    setSizeOptions(sizeOptions.filter((s) => s !== size))
  }

  const addColor = () => {
    if (newColorName && !colorOptions.find((c) => c.name === newColorName)) {
      setColorOptions([
        ...colorOptions,
        {
          name: newColorName,
          type: colorInputType,
          value: colorInputType === "hex" ? newColorValue : "/placeholder.svg?height=50&width=50&text=" + newColorName,
        },
      ])
      setNewColorName("")
      setNewColorValue("#000000")
    }
  }

  const removeColor = (colorName: string) => {
    setColorOptions(colorOptions.filter((c) => c.name !== colorName))
  }

  const updateVariant = (variantId: string, updates: Partial<ProductVariant>) => {
    setVariants(variants.map((v) => (v.id === variantId ? { ...v, ...updates } : v)))
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true)

      const productData = {
        ...values,
        basePrice: Number.parseFloat(values.basePrice),
        sizeOptions,
        colorOptions,
        variants,
        defaultVariant,
        images: images.length > 0 ? images : ["/placeholder.svg?height=300&width=300"],
      }

      if (product) {
        await productAPI.updateProduct(product.id, productData)
        toast({
          title: "Success",
          description: "Product updated successfully",
        })
      } else {
        await productAPI.createProduct(productData)
        toast({
          title: "Success",
          description: "Product created successfully",
        })
      }

      onClose(true)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save product",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription>
            {product ? "Update product information and variants" : "Create a new product with size and color variants"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="variations">Size & Colors</TabsTrigger>
            <TabsTrigger value="variants">Variants</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Clothing">Clothing</SelectItem>
                            <SelectItem value="Electronics">Electronics</SelectItem>
                            <SelectItem value="Furniture">Furniture</SelectItem>
                            <SelectItem value="Books">Books</SelectItem>
                            <SelectItem value="Sports">Sports</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Price ($)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="baseSku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter SKU" {...field} />
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
                        <Textarea placeholder="Enter product description" rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Product</FormLabel>
                        <div className="text-sm text-muted-foreground">Product will be visible to customers</div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Sub-Category</label>
                  <select
                    value={form.subCategory || ""}
                    onChange={e => setForm({ ...form, subCategory: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Select sub-category</option>
                    <option value="T-Shirts">T-Shirts</option>
                    <option value="Hoodies">Hoodies</option>
                    <option value="Shorts">Shorts</option>
                    {/* Add more sub-categories as needed */}
                  </select>
                </div>
              </TabsContent>

              <TabsContent value="images" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Product Images
                    </CardTitle>
                    <CardDescription>
                      Add multiple images for your product. The first image will be used as the main product image.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button type="button" onClick={addImage} className="w-full bg-transparent" variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Add Image
                    </Button>

                    {images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map((image, index) => (
                          <Card key={index} className="relative group">
                            <CardContent className="p-2">
                              <div className="aspect-square relative">
                                <img
                                  src={image || "/placeholder.svg"}
                                  alt={`Product image ${index + 1}`}
                                  className="w-full h-full object-cover rounded-md"
                                />
                                {index === 0 && <Badge className="absolute top-1 left-1 text-xs">Main</Badge>}
                              </div>
                              <div className="flex justify-between items-center mt-2 gap-1">
                                <div className="flex gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => moveImage(index, "up")}
                                    disabled={index === 0}
                                  >
                                    <MoveUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => moveImage(index, "down")}
                                    disabled={index === images.length - 1}
                                  >
                                    <MoveDown className="h-3 w-3" />
                                  </Button>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeImage(index)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {images.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No images added yet</p>
                        <p className="text-sm">Click "Add Image" to upload product photos</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="variations" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Size Options */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Size Options</CardTitle>
                      <CardDescription>Add available sizes for this product</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Enter size (e.g., S, M, L)"
                          value={newSize}
                          onChange={(e) => setNewSize(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSize())}
                        />
                        <Button type="button" onClick={addSize}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-md bg-muted/20">
                        {sizeOptions.length > 0 ? (
                          sizeOptions.map((size) => (
                            <Badge key={size} variant="secondary" className="flex items-center gap-1">
                              {size}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={() => removeSize(size)}
                              />
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No sizes added yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Color Options */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Color Options</CardTitle>
                      <CardDescription>Add available colors for this product</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <Button
                          type="button"
                          variant={colorInputType === "hex" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setColorInputType("hex")}
                        >
                          <Palette className="h-4 w-4 mr-1" />
                          Color
                        </Button>
                        <Button
                          type="button"
                          variant={colorInputType === "image" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setColorInputType("image")}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Pattern
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Input
                          placeholder="Color name"
                          value={newColorName}
                          onChange={(e) => setNewColorName(e.target.value)}
                        />
                        <div className="flex space-x-2">
                          {colorInputType === "hex" ? (
                            <Input
                              type="color"
                              value={newColorValue}
                              onChange={(e) => setNewColorValue(e.target.value)}
                              className="w-20"
                            />
                          ) : (
                            <Input
                              type="file"
                              accept="image/*"
                              className="flex-1"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setNewColorValue("/placeholder.svg?height=50&width=50&text=" + newColorName)
                                }
                              }}
                            />
                          )}
                          <Button type="button" onClick={addColor}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-md bg-muted/20">
                        {colorOptions.length > 0 ? (
                          colorOptions.map((color) => (
                            <Badge key={color.name} variant="secondary" className="flex items-center gap-2">
                              {color.type === "hex" ? (
                                <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: color.value }} />
                              ) : (
                                <img
                                  src={color.value || "/placeholder.svg"}
                                  alt={color.name}
                                  className="w-4 h-4 rounded-full border object-cover"
                                />
                              )}
                              {color.name}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={() => removeColor(color.name)}
                              />
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No colors added yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="variants" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Product Variants</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure individual variants with specific SKU, stock, and pricing
                    </p>
                  </div>
                  <Badge variant="outline">{variants.length} variants</Badge>
                </div>

                {variants.length > 0 && (
                  <div className="space-y-3">
                    {variants.map((variant, index) => (
                      <Card key={variant.id} className={defaultVariant === variant.id ? "ring-2 ring-primary" : ""}>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            {/* Default Variant Button */}
                            <div className="col-span-1">
                              <Button
                                type="button"
                                variant={defaultVariant === variant.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setDefaultVariant(variant.id)}
                                title="Set as default variant"
                              >
                                <Star className={`h-3 w-3 ${defaultVariant === variant.id ? "fill-current" : ""}`} />
                              </Button>
                            </div>

                            {/* Variant Info */}
                            <div className="col-span-2">
                              <div className="font-medium text-sm">{variant.size}</div>
                              <div className="flex items-center space-x-1 mt-1">
                                {variant.color.type === "hex" ? (
                                  <div
                                    className="w-4 h-4 rounded-full border"
                                    style={{ backgroundColor: variant.color.value }}
                                  />
                                ) : (
                                  <img
                                    src={variant.color.value || "/placeholder.svg"}
                                    alt={variant.color.name}
                                    className="w-4 h-4 rounded-full border object-cover"
                                  />
                                )}
                                <span className="text-xs text-muted-foreground">{variant.color.name}</span>
                              </div>
                            </div>

                            {/* SKU */}
                            <div className="col-span-2">
                              <Input
                                placeholder="SKU"
                                value={variant.sku}
                                onChange={(e) => updateVariant(variant.id, { sku: e.target.value })}
                                className="text-sm"
                              />
                            </div>

                            {/* Stock */}
                            <div className="col-span-2">
                              <Input
                                type="number"
                                placeholder="Stock"
                                value={variant.stock}
                                onChange={(e) =>
                                  updateVariant(variant.id, { stock: Number.parseInt(e.target.value) || 0 })
                                }
                                className="text-sm"
                              />
                            </div>

                            {/* Price Override */}
                            <div className="col-span-2">
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Price override"
                                value={variant.priceOverride || ""}
                                onChange={(e) =>
                                  updateVariant(variant.id, {
                                    priceOverride: e.target.value ? Number.parseFloat(e.target.value) : undefined,
                                  })
                                }
                                className="text-sm"
                              />
                            </div>

                            {/* Active Toggle */}
                            <div className="col-span-1">
                              <Switch
                                checked={variant.isActive}
                                onCheckedChange={(checked) => updateVariant(variant.id, { isActive: checked })}
                              />
                            </div>

                            {/* Final Price Display */}
                            <div className="col-span-2 text-right">
                              <div className="text-sm font-medium">
                                ${variant.priceOverride || form.getValues("basePrice") || "0"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {variant.isActive ? "Active" : "Inactive"}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {variants.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <div className="text-muted-foreground">
                        <div className="text-lg mb-2">No variants generated yet</div>
                        <p className="text-sm">
                          Add sizes and colors in the previous tab to automatically generate variants
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => onClose()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : product ? "Update Product" : "Create Product"}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
