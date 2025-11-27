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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { productAPI, type Product, type ProductVariant } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { X, Plus, Star, Upload, Palette, ImageIcon, Trash2, MoveUp, MoveDown, Ruler } from "lucide-react"
import { subCategoryAPI } from "@/lib/subCategoryAPI"

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
  highlightImage: z.string().optional(),
  sizeGuideImage: z.string().optional(),
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
      images?: string[]
    }>
  >([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [defaultVariant, setDefaultVariant] = useState<string>("")
  const [newColorName, setNewColorName] = useState("")
  const [newColorValue, setNewColorValue] = useState("#000000")
  const [colorInputType, setColorInputType] = useState<"hex" | "image">("hex")
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadingColorImage, setUploadingColorImage] = useState(false)
  const [uploadingSizeGuide, setUploadingSizeGuide] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [subCategories, setSubCategories] = useState<any[]>([])
  
  const getFullImageUrl = (url: string | undefined): string => {
    if (!url) {
      return "";
    }
    if (url.startsWith('http')) {
      return url;
    }
    return `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
  };

  // Helper function to normalize image paths for storage
  const normalizeImagePath = (url: string): string => {
    if (!url) return "";
    // If it's already a relative path, return as is
    if (!url.startsWith('http')) {
      return url.startsWith('/') ? url : `/${url}`;
    }
    // If it's a full URL, extract just the path part for storage
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return url;
    }
  };

  useEffect(() => {
    if (open) {
      fetchSubCategories()
    }
  }, [open])

  const fetchSubCategories = async () => {
    try {
      const subCategoriesData = await subCategoryAPI.getAll()
      setSubCategories(subCategoriesData)
    } catch (error) {
      console.error('❌ Error fetching sub-categories:', error)
    }
  }

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
      highlightImage: "",
      sizeGuideImage: "",
    },
  })

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'category') {
        form.setValue('subCategory', '')
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  useEffect(() => {
    if (product && open) {
      console.log('🔄 Loading product data:', {
        productImages: product.images,
        productHighlightImage: product.highlightImage,
        productSizeGuideImage: product.sizeGuideImage
      });

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
        highlightImage: product.highlightImage || "",
        sizeGuideImage: product.sizeGuideImage || "",
      })

      // Load images - store them as they are from the API
      setImages(product.images || [])
      setSizeOptions(product.sizeOptions || [])
      setColorOptions(product.colorOptions || [])
      setVariants(product.variants || [])
      setDefaultVariant(product.defaultVariant || "")
    } else if (open) {
      // Reset form for new product
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
        highlightImage: "",
        sizeGuideImage: "",
      })
      setImages([])
      setSizeOptions([])
      setColorOptions([])
      setVariants([])
      setDefaultVariant("")
    }
  }, [product, form, open])

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
    } else {
        setVariants([]);
    }
  }, [sizeOptions, colorOptions, form])

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    try {
      setUploadingImages(true)
      const fileArray = Array.from(files)
      const uploadedUrls = await productAPI.uploadImages(fileArray)
      
      // Normalize the uploaded URLs for consistent storage
      const normalizedUrls = uploadedUrls.map(url => normalizeImagePath(url))
      
      setImages(prev => [...prev, ...normalizedUrls])
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

  const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"] satisfies string[];

  const normalizeSize = (value: string) => value.trim().toUpperCase()

  const addSize = (value: string) => {
    const normalized = normalizeSize(value)
    if (normalized && !sizeOptions.includes(normalized)) {
      setSizeOptions([...sizeOptions, normalized])
    }
  }

  const togglePresetSize = (size: string) => {
    if (sizeOptions.includes(size)) {
      setSizeOptions(sizeOptions.filter((s) => s !== size))
    } else {
      addSize(size)
    }
  }

  const removeSize = (size: string) => {
    setSizeOptions(sizeOptions.filter((s) => s !== size))
  }

  const addColor = (imageUrl?: string) => {
    if (newColorName && !colorOptions.find((c) => c.name === newColorName)) {
        const value = colorInputType === 'image' ? imageUrl : newColorValue;

        if (!value) {
            toast({
                title: "Error",
                description: "Could not add color option. Value is missing.",
                variant: "destructive"
            });
            return;
        }
        
        setColorOptions([
            ...colorOptions,
            {
                name: newColorName,
                type: colorInputType,
                value: normalizeImagePath(value),
                value: colorInputType === 'hex' ? value : normalizeImagePath(value),
            },
        ]);
        setNewColorName("");
        setNewColorValue("#000000");
    }
  };

  const removeColor = (colorName: string) => {
    setColorOptions(colorOptions.filter((c) => c.name !== colorName))
  }

  const assignImagesToColor = (colorName: string, selectedImages: string[]) => {
    setColorOptions(colorOptions.map(color => 
      color.name === colorName 
        ? { ...color, images: selectedImages.map(img => normalizeImagePath(img)) }
        : color
    ))
  }

  const handleColorImageUpload = async (file: File) => {
    if (!newColorName.trim()) {
        toast({
            title: "Validation Error",
            description: "Please enter a name for the pattern before uploading an image.",
            variant: "destructive",
        });
        return;
    }

    try {
        setUploadingColorImage(true);
        const uploadedUrls = await productAPI.uploadImages([file]);
        
        if (uploadedUrls && uploadedUrls.length > 0) {
            addColor(uploadedUrls[0]);
            toast({
                title: "Success",
                description: "Pattern image uploaded and added successfully.",
            });
        } else {
            throw new Error("API did not return a URL for the uploaded image.");
        }
    } catch (error) {
        console.error('Error uploading color pattern:', error);
        toast({
            title: "Upload Failed",
            description: "Failed to upload pattern image. Please try again.",
            variant: "destructive",
        });
    } finally {
        setUploadingColorImage(false);
    }
  };

  const handleSizeGuideUpload = async (file: File) => {
    if (!file) return;
    try {
      setUploadingSizeGuide(true);
      const uploadedUrls = await productAPI.uploadImages([file]);
      if (uploadedUrls && uploadedUrls.length > 0) {
        const normalizedUrl = normalizeImagePath(uploadedUrls[0]);
        form.setValue("sizeGuideImage", normalizedUrl, { shouldValidate: true });
        toast({
          title: "Success",
          description: "Size guide image uploaded successfully.",
        });
      } else {
        throw new Error("API did not return a URL for the uploaded image.");
      }
    } catch (error) {
      console.error('Error uploading size guide image:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload size guide image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingSizeGuide(false);
    }
  };

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
          description: validationErrors.join("\n"),
          variant: "destructive",
        })
        return
      }

      // Prepare product data with normalized image paths
      const productData = {
        ...values,
        basePrice: Number.parseFloat(values.basePrice),
        discountPercentage: values.discountPercentage ? Number.parseFloat(values.discountPercentage) : undefined,
        reviewRating: values.reviewRating ? Number.parseFloat(values.reviewRating) : undefined,
        sizeOptions,
        colorOptions: colorOptions.map(color => ({
          ...color,
          value: normalizeImagePath(color.value),
          images: color.images?.map(img => normalizeImagePath(img))
        })),
        variants: variants.map(variant => ({
          ...variant,
          color: {
            ...variant.color,
            value: normalizeImagePath(variant.color.value),
            images: variant.color.images?.map(img => normalizeImagePath(img))
          }
        })),
        defaultVariant: defaultVariant || (variants.length > 0 ? variants[0].id : ""),
        images: images.map(img => normalizeImagePath(img)),
        highlightImage: values.isProductHighlight ? normalizeImagePath(values.highlightImage || "") : null,
        sizeGuideImage: normalizeImagePath(values.sizeGuideImage || ""),
      }

      console.log('💾 Saving product data:', {
        images: productData.images,
        highlightImage: productData.highlightImage,
        sizeGuideImage: productData.sizeGuideImage,
        isUpdate: !!product
      });

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
            {product ? "Update product information and variants" : "Add a new product with all its details, variations, and media."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="media">Media & Variations</TabsTrigger>
            <TabsTrigger value="variants">Variants</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
              <TabsContent value="basic" className="space-y-4 pt-4">
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Men">Men</SelectItem>
                            <SelectItem value="Women">Women</SelectItem>
                            <SelectItem value="Sets">Sets</SelectItem>
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
                      : []
                    
                    const uniqueSubCategories = Array.from(new Set(filteredSubCategories.map(sc => sc.name)))
                        .map(name => {
                            return filteredSubCategories.find(sc => sc.name === name)
                        });
                    
                    return (
                      <FormItem>
                        <FormLabel>Sub-Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select sub-category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {uniqueSubCategories.map((subCategory) => (
                              <SelectItem key={subCategory._id} value={subCategory.name}>
                                {subCategory.name}
                              </SelectItem>
                            ))}
                            {uniqueSubCategories.length === 0 && (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                {selectedCategory ? `No sub-categories for ${selectedCategory}` : 'Select a category first'}
                              </div>
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
                        <Input type="number" min="0" max="100" step="0.01" placeholder="e.g., 10 for 10%" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField
                  control={form.control}
                  name="sizeGuideImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Size Guide</FormLabel>
                      <FormControl>
                        <Card>
                          <CardContent className="p-4 space-y-4">
                            {field.value ? (
                              <div className="relative w-48">
                                <img
                                  src={getFullImageUrl(field.value)}
                                  alt="Size guide"
                                  className="w-full h-auto rounded-md border"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                  onClick={() => field.onChange("")}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  id="size-guide-input"
                                  disabled={uploadingSizeGuide}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleSizeGuideUpload(file);
                                  }}
                                />
                                <Button type="button" variant="outline" onClick={() => document.getElementById('size-guide-input')?.click()} disabled={uploadingSizeGuide}>
                                  <Ruler className="h-4 w-4 mr-2" />
                                  {uploadingSizeGuide ? "Uploading..." : "Upload Size Guide"}
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
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
                        <Textarea placeholder="e.g., High-intensity training, casual wear" rows={3} {...field} />
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
                        <Textarea placeholder="e.g.,- Moisture-wicking fabric&#x0a;- Athletic fit" rows={4} {...field} />
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
                        <Textarea placeholder="e.g., 88% Polyester, 12% Spandex" rows={3} {...field} />
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
                        <Textarea placeholder="e.g., Machine wash cold, tumble dry low" rows={3} {...field} />
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
                        <div className="text-sm text-muted-foreground">Show this product in the highlight section</div>
                        </div>
                        <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                    </FormItem>
                    )}
                />

                {images.length > 0 && form.getValues("isProductHighlight") && (
                    <FormField
                    control={form.control}
                    name="highlightImage"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                        <FormLabel className="text-base">Product Highlight Image</FormLabel>
                        <div className="text-sm text-muted-foreground">Select which image to show as highlight (optional)</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {images.map((image, index) => (
                            <div
                                key={index}
                                className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                                field.value === image 
                                    ? 'border-primary' 
                                    : 'border-transparent hover:border-muted-foreground'
                                }`}
                                onClick={() => field.onChange(field.value === image ? "" : image)}
                            >
                                <div className="aspect-square relative">
                                <img
                                    src={getFullImageUrl(image)}
                                    alt={`Product image ${index + 1}`}
                                    className="w-full h-full object-cover rounded-md"
                                />
                                {field.value === image && (
                                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center rounded-md">
                                    <Star className="h-6 w-6 text-primary fill-primary" />
                                    </div>
                                )}
                                </div>
                                {field.value === image && (
                                    <div className="absolute top-1 right-1">
                                        <Badge className="bg-primary text-primary-foreground text-xs">Highlight</Badge>
                                    </div>
                                )}
                            </div>
                            ))}
                        </div>
                        </FormItem>
                    )}
                    />
                )}
              </TabsContent>

              <TabsContent value="media" className="space-y-6 pt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Product Images
                    </CardTitle>
                    <CardDescription>
                      Add product images. The first image in the list will be the main display image.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()} 
                        className="w-full" 
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

                    {images.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map((image, index) => (
                          <Card key={index} className="relative group">
                            <CardContent className="p-0">
                              <div className="aspect-square relative rounded-lg overflow-hidden">
                                <img
                                  src={getFullImageUrl(image)}
                                  alt={`Product image ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                {index === 0 && <Badge className="absolute top-1 left-1 text-xs">Main</Badge>}
                              </div>
                              <div className="flex justify-center items-center mt-2 gap-1">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7"
                                  onClick={() => moveImage(index, "up")}
                                  disabled={index === 0}
                                >
                                  <MoveUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7"
                                  onClick={() => moveImage(index, "down")}
                                  disabled={index === images.length - 1}
                                >
                                  <MoveDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="destructive"
                                  className="h-7 w-7"
                                  onClick={() => removeImage(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No images added yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Size Options</CardTitle>
                      <CardDescription>Add available sizes</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {PRESET_SIZES.map((size) => {
                          const isSelected = sizeOptions.includes(size)
                          return (
                            <Button
                              key={size}
                              type="button"
                              size="sm"
                              variant={isSelected ? "default" : "outline"}
                              onClick={() => togglePresetSize(size)}
                            >
                              {size}
                            </Button>
                          )
                        })}
                      </div>
                      <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-md bg-muted/20">
                        {sizeOptions.length > 0 ? (
                          sizeOptions.map((size) => (
                            <Badge key={size} variant="secondary" className="flex items-center gap-1.5">
                              {size}
                              <X
                                className="h-3.5 w-3.5 cursor-pointer hover:text-destructive"
                                onClick={() => removeSize(size)}
                              />
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No sizes added</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Color Options</CardTitle>
                      <CardDescription>Add available colors or patterns</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Button
                                type="button"
                                variant={colorInputType === "hex" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setColorInputType("hex")}
                            >
                                <Palette className="h-4 w-4 mr-1" /> Color
                            </Button>
                            <Button
                                type="button"
                                variant={colorInputType === "image" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setColorInputType("image")}
                            >
                                <Upload className="h-4 w-4 mr-1" /> Pattern
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Input
                                placeholder="Color/Pattern name (e.g., Black)"
                                value={newColorName}
                                onChange={(e) => setNewColorName(e.target.value)}
                                disabled={uploadingColorImage}
                            />
                            <div className="flex space-x-2">
                                {colorInputType === "hex" ? (
                                    <Input
                                        type="color"
                                        value={newColorValue}
                                        onChange={(e) => setNewColorValue(e.target.value)}
                                        className="w-20 p-1"
                                    />
                                ) : (
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        className="flex-1"
                                        disabled={uploadingColorImage}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                handleColorImageUpload(file);
                                            }
                                            e.target.value = '';
                                        }}
                                    />
                                )}
                                {colorInputType === 'hex' && (
                                    <Button type="button" onClick={() => addColor()}>
                                        <Plus className="h-4 w-4" /> Add
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-md bg-muted/20">
                            {colorOptions.length > 0 ? (
                            colorOptions.map((color) => (
                                <Badge key={color.name} variant="secondary" className="flex items-center gap-2 p-1.5">
                                {color.type === "hex" ? (
                                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: color.value }} />
                                ) : (
                                    <img
                                    src={getFullImageUrl(color.value)}
                                    alt={color.name}
                                    className="w-5 h-5 rounded-full border object-cover"
                                    />
                                )}
                                {color.name}
                                <X
                                    className="h-3.5 w-3.5 cursor-pointer hover:text-destructive"
                                    onClick={() => removeColor(color.name)}
                                />
                                </Badge>
                            ))
                            ) : (
                            <p className="text-sm text-muted-foreground">No colors added</p>
                            )}
                        </div>
                    </CardContent>
                  </Card>
                </div>

                {colorOptions.length > 0 && images.length > 0 && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Assign Images to Colors</CardTitle>
                      <CardDescription>
                        Select which images should be displayed for each color variant
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {colorOptions.map((color) => (
                        <div key={color.name} className="space-y-3 p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            {color.type === "hex" ? (
                              <div
                                className="w-6 h-6 rounded-full border"
                                style={{ backgroundColor: color.value }}
                              />
                            ) : (
                              <img
                                src={getFullImageUrl(color.value)}
                                alt={color.name}
                                className="w-6 h-6 rounded-full border object-cover"
                              />
                            )}
                            <span className="font-medium">{color.name}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {images.map((image, index) => {
                              const isSelected = color.images?.includes(image) || false
                              return (
                                <div
                                  key={index}
                                  className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                                    isSelected 
                                      ? 'border-primary' 
                                      : 'border-transparent hover:border-muted-foreground'
                                  }`}
                                  onClick={() => {
                                    const currentImages = color.images || [];
                                    const newImages = isSelected
                                      ? currentImages.filter(img => img !== image)
                                      : [...currentImages, image];
                                    assignImagesToColor(color.name, newImages);
                                  }}
                                >
                                  <div className="aspect-square relative rounded-md overflow-hidden">
                                    <img
                                      src={getFullImageUrl(image)}
                                      alt={`Product image ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    {isSelected && (
                                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center rounded-md">
                                        <Star className="h-4 w-4 text-primary fill-primary" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="variants" className="space-y-4 pt-4 mt-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Product Variants</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure stock and SKU for each generated variant
                    </p>
                  </div>
                  <Badge variant="outline">{variants.length} variants</Badge>
                </div>

                {variants.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {variants.map((variant) => (
                      <Card key={variant.id} className={defaultVariant === variant.id ? "ring-2 ring-primary" : ""}>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-1">
                              <Button
                                type="button"
                                variant={defaultVariant === variant.id ? "default" : "outline"}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setDefaultVariant(variant.id)}
                                title="Set as default variant"
                              >
                                <Star className={`h-4 w-4 ${defaultVariant === variant.id ? "fill-current" : ""}`} />
                              </Button>
                            </div>

                            <div className="col-span-3">
                              <div className="font-medium text-sm">{variant.size} / {variant.color?.name || 'N/A'}</div>
                              <div className="flex items-center space-x-1 mt-1">
                                {variant.color.type === "hex" ? (
                                  <div
                                    className="w-4 h-4 rounded-full border"
                                    style={{ backgroundColor: variant.color.value }}
                                  />
                                ) : (
                                  <img
                                    src={getFullImageUrl(variant.color.value)}
                                    alt={variant.color?.name || 'Color'}
                                    className="w-4 h-4 rounded-full border object-cover"
                                  />
                                )}
                                <span className="text-xs text-muted-foreground">{variant.color?.name || 'N/A'}</span>
                              </div>
                            </div>

                            <div className="col-span-2">
                                <FormLabel className="text-xs">SKU</FormLabel>
                                <Input
                                    placeholder="SKU"
                                    value={variant.sku}
                                    onChange={(e) => updateVariant(variant.id, { sku: e.target.value })}
                                    className="text-sm h-9"
                                />
                            </div>

                            <div className="col-span-2">
                                <FormLabel className="text-xs">Price (AED)</FormLabel>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={variant.priceOverride || form.getValues("basePrice")}
                                    onChange={(e) => updateVariant(variant.id, { priceOverride: Number.parseFloat(e.target.value) || 0 })}
                                    className="text-sm h-9"
                                />
                            </div>

                            <div className="col-span-2">
                                <FormLabel className="text-xs">Stock</FormLabel>
                                <Input
                                    type="number"
                                    placeholder="Stock"
                                    value={variant.stock}
                                    onChange={(e) =>
                                    updateVariant(variant.id, { stock: Number.parseInt(e.target.value) || 0 })
                                    }
                                    className="text-sm h-9"
                                />
                            </div>

                            <div className="col-span-2 text-center">
                                <FormLabel className="text-xs">Active</FormLabel>
                                <div className="flex justify-center pt-1">
                                    <Switch
                                        checked={variant.isActive}
                                        onCheckedChange={(checked) => updateVariant(variant.id, { isActive: checked })}
                                    />
                                </div>
                            </div>
                            
                            <div className="col-span-1 text-right">
                                <div className="text-xs text-muted-foreground">
                                {variant.isActive ? "Active" : "Inactive"}
                                </div>
                            </div>

                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <div className="text-muted-foreground">
                        <div className="text-lg mb-2">No variants to display</div>
                        <p className="text-sm">
                          Add sizes and colors in the previous tab to generate variants.
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