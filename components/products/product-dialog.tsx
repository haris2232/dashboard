"use client"
import { useState, useEffect, useRef } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { productAPI, type Product, type ProductVariant } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { X, Plus, Star, Upload, Palette, ImageIcon, Trash2, MoveUp, MoveDown } from "lucide-react"
import { subCategoryAPI } from "@/lib/subCategoryAPI"

// ✅ FIX: API ka base URL yahan define karein taake aasani se badla ja sake.
const API_BASE_URL = "https://athlekt.com/backendnew";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  basePrice: z.string().min(1, "Price is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Price must be a positive number"),
  baseSku: z.string().min(1, "SKU is required"),
  category: z.string().min(1, "Category is required"),
  subCategory: z.string().optional(),
  discountPercentage: z.string().optional(),
  description: z.string().optional(),
  purpose: z.string().optional(),
  features: z.string().optional(),
  materials: z.string().optional(),
  care: z.string().optional(),
  reviewRating: z.string().optional(),
  isActive: z.boolean(),
  isProductHighlight: z.boolean(),
  highlightImageIndex: z.number().min(0).optional(),
})

interface ProductDialogProps {
  open: boolean
  onClose: (shouldRefresh?: boolean) => void
  product?: Product | null
}

interface ColorOption {
  name: string
  type: "hex" | "image"
  value: string
}

export function ProductDialog({ open, onClose, product }: ProductDialogProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [images, setImages] = useState<string[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
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
  const [uploadingImages, setUploadingImages] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [categories, setCategories] = useState<{ men: any[], women: any[], other: any[] }>({ men: [], women: [], other: [] })
  const [subCategories, setSubCategories] = useState<any[]>([])
  const [highlightImageIndex, setHighlightImageIndex] = useState<number>(0)
  
  // ✅ FIX: Image URL ko theek se format karne ke liye helper function.
  // Yeh function full URL aur relative paths dono ko handle karega.
  const getFullImageUrl = (url: string | undefined): string => {
      if (!url) {
        return ""; // Agar URL nahi hai to empty string return karein.
      }
      // Agar URL pehle se hi 'http' se shuru ho raha hai, to usay wese hi rehne dein.
      if (url.startsWith('http')) {
        return url;
      }
      // Warna, base URL ke saath jor dein, aur double slash (//) se bachne ka khayal rakhein.
      return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
  };

  // Fetch categories and sub-categories when dialog opens
  useEffect(() => {
    if (open) {
      fetchCategories()
      fetchSubCategories()
    }
  }, [open])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/public/dashboard`)
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setCategories(data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchSubCategories = async () => {
    try {
      const subCategoriesData = await subCategoryAPI.getAll()
      setSubCategories(subCategoriesData)
    } catch (error) {
      console.error('❌ Error fetching sub-categories:', error)
    }
  }

  // Generate unique SKU
  const generateUniqueSku = () => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 5)
    return `SKU-${timestamp}-${random}`
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      basePrice: "",
      baseSku: `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      category: "",
      subCategory: "",
      discountPercentage: "",
      description: "",
      purpose: "",
      features: "",
      materials: "",
      care: "",
      reviewRating: "5",
      isActive: true,
      isProductHighlight: false,
      highlightImageIndex: 0,
    },
  })

  // Reset sub-category when category changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'category') {
        form.setValue('subCategory', '')
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  useEffect(() => {
    if (product) {
      form.reset({
        title: product.title,
        basePrice: product.basePrice.toString(),
        baseSku: product.baseSku,
        category: product.category,
        subCategory: product.subCategory || "",
        discountPercentage: product.discountPercentage?.toString() || "",
        description: product.description,
        purpose: product.purpose || "",
        features: product.features || "",
        materials: product.materials || "",
        care: product.care || "",
        reviewRating: product.reviewRating?.toString() || "5",
        isActive: product.isActive,
        isProductHighlight: product.isProductHighlight || false,
        highlightImageIndex: product.highlightImageIndex || 0,
      })
      setHighlightImageIndex(product.highlightImageIndex || 0)
      setImages(product.images || [])
      setSizeOptions(product.sizeOptions)
      setColorOptions(product.colorOptions)
      setVariants(product.variants)
      setDefaultVariant(product.defaultVariant || "")
    } else {
      form.reset({
        title: "",
        basePrice: "",
        baseSku: generateUniqueSku(),
        category: "",
        subCategory: "",
        discountPercentage: "",
        description: "",
        purpose: "",
        features: "",
        materials: "",
        care: "",
        reviewRating: "5",
        isActive: true,
        isProductHighlight: false,
        highlightImageIndex: 0,
      })
      setHighlightImageIndex(0)
      setImages([])
      setImageFiles([])
      setSizeOptions([])
      setColorOptions([])
      setVariants([])
      setDefaultVariant("")
    }
  }, [product, form, open])

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
              id: `variant-${size}-${color.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    try {
      setUploadingImages(true)
      const fileArray = Array.from(files)
      const uploadedUrls = await productAPI.uploadImages(fileArray)
      setImages(prev => [...prev, ...uploadedUrls])
      
      toast({
        title: "Success",
        description: `${files.length} image(s) uploaded successfully`,
      })
    } catch (error) {
      console.error('Error uploading images:', error)
      toast({
        title: "Error",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingImages(false)
    }
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

  const validateForm = () => {
    const errors: string[] = []
    if (!form.getValues("title")) errors.push("Product title is required")
    if (!form.getValues("basePrice")) errors.push("Base price is required")
    if (!form.getValues("baseSku")) errors.push("Base SKU is required")
    if (!form.getValues("category")) errors.push("Category is required")
    if (images.length === 0) errors.push("At least one product image is required")
    if (sizeOptions.length === 0) errors.push("Please add at least one size option")
    if (colorOptions.length === 0) errors.push("Please add at least one color option")
    return errors
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true)
      const validationErrors = validateForm()
      if (validationErrors.length > 0) {
        toast({
          title: "Validation Error",
          description: validationErrors.join(", "),
          variant: "destructive",
        })
        return
      }

      const productData = {
        ...values,
        basePrice: Number.parseFloat(values.basePrice),
        sizeOptions,
        colorOptions,
        variants,
        defaultVariant,
        images: images.length > 0 ? images : [],
      }

      if (product) {
        await productAPI.updateProduct(product._id, productData)
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
    } catch (error: any) {
      console.error('Error saving product:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
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
                            <SelectItem value="Men">Men</SelectItem>
                            <SelectItem value="Women">Women</SelectItem>
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
                        <FormLabel>Base Price (AED)</FormLabel>
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
                  name="subCategory"
                  render={({ field }) => {
                    const selectedCategory = form.watch("category")
                    const filteredSubCategories = selectedCategory 
                      ? subCategories.filter(subCat => subCat.category === selectedCategory)
                      : subCategories
                    
                    const uniqueSubCategories = filteredSubCategories.reduce((acc, subCat) => {
                      if (!acc.find(item => item.name === subCat.name)) {
                        acc.push(subCat)
                      }
                      return acc
                    }, [] as typeof filteredSubCategories)
                    
                    return (
                      <FormItem>
                        <FormLabel>Sub-Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sub-category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {uniqueSubCategories.map((subCategory) => (
                              <SelectItem key={subCategory.id} value={subCategory.name}>
                                {subCategory.name}
                              </SelectItem>
                            ))}
                            {uniqueSubCategories.length === 0 && (
                              <SelectItem value="no-subcategories" disabled>
                                {selectedCategory ? `No sub-categories found for ${selectedCategory}` : 'No sub-categories available'}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />

                <FormField
                  control={form.control}
                  name="discountPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Percentage (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter product purpose" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="features"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Features & Fit</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter product features and fit details" rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="materials"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Materials</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter product materials" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="care"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Care Instructions</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter care instructions" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reviewRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Review Rating (1-5)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="5" step="0.1" placeholder="5" {...field} />
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

                <FormField
                  control={form.control}
                  name="isProductHighlight"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Product Highlight</FormLabel>
                        <div className="text-sm text-muted-foreground">Show this product in the highlight section on the website</div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("isProductHighlight") && images.length > 0 && (
                  <FormField
                    control={form.control}
                    name="highlightImageIndex"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-base">Highlight Image</FormLabel>
                        <div className="text-sm text-muted-foreground">Select which image to show in the highlight section</div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {images.map((image, index) => (
                            <div
                              key={index}
                              className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                                field.value === index 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => field.onChange(index)}
                            >
                              <div className="aspect-square relative">
                                {/* ✅ FIX: Image URL ko theek karne ke liye helper function istemal kiya gaya hai. */}
                                <img
                                  src={getFullImageUrl(image)}
                                  alt={`Product image ${index + 1}`}
                                  className="w-full h-full object-cover rounded-md"
                                />
                                {field.value === index && (
                                  <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                                    <Star className="h-6 w-6 text-blue-600 fill-blue-600" />
                                  </div>
                                )}
                              </div>
                              <div className="p-2 text-center">
                                <span className="text-xs font-medium">Image {index + 1}</span>
                                {field.value === index && (
                                  <div className="mt-1">
                                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                                      <Star className="h-3 w-3 mr-1" />
                                      Highlighted
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />
                )}
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
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()} 
                        className="w-full bg-transparent" 
                        variant="outline"
                        disabled={uploadingImages}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingImages ? "Uploading..." : "Select Images"}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files)}
                        className="hidden"
                      />
                    </div>

                    {images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map((image, index) => (
                          <Card key={index} className="relative group">
                            <CardContent className="p-2">
                              <div className="aspect-square relative">
                                {/* ✅ FIX: Image URL ko theek karne ke liye helper function istemal kiya gaya hai. */}
                                <img
                                  src={getFullImageUrl(image)}
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
                        <p className="text-sm">Click "Select Images" to upload product photos</p>
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
                                    alt={variant.color?.name || 'Color'}
                                    className="w-4 h-4 rounded-full border object-cover"
                                  />
                                )}
                                <span className="text-xs text-muted-foreground">{variant.color?.name || 'N/A'}</span>
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
                                AED{variant.priceOverride || form.getValues("basePrice") || "0"}
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