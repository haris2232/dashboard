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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { bundleAPI, type Bundle, type ProductVariant } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, XCircle, Plus, Palette, Trash2, Star, MoveUp, MoveDown, ImageIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const bundleSchema = z.object({
  name: z.string().min(1, "Bundle name is required"),
  description: z.string().optional(),
  basePrice: z.string().min(1, "Price is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Price must be a positive number"),
  baseSku: z.string().min(1, "SKU is required"),
  category: z.enum(["men", "women", "mixed"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean(),
})

interface BundleDialogProps {
  open: boolean
  onClose: (shouldRefresh?: boolean) => void
  bundle?: Bundle | null
}

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"]

export function BundleDialog({ open, onClose, bundle }: BundleDialogProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [sizeOptions, setSizeOptions] = useState<string[]>([])
  const [colorOptions, setColorOptions] = useState<Array<{ name: string; type: "hex" | "image"; value: string }>>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [defaultVariant, setDefaultVariant] = useState<string>("")
  const [newColorName, setNewColorName] = useState("")
  const [newColorValue, setNewColorValue] = useState("#000000")
  const [colorInputType, setColorInputType] = useState<"hex" | "image">("hex")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof bundleSchema>>({
    resolver: zodResolver(bundleSchema),
    defaultValues: {
      name: "",
      description: "",
      basePrice: "",
      baseSku: `BUNDLE-${Date.now()}`,
      category: "mixed",
      startDate: "",
      endDate: "",
      isActive: true,
    },
  })

  useEffect(() => {
    if (bundle) {
      form.reset({
        name: bundle.name,
        description: bundle.description || "",
        basePrice: (bundle.bundlePrice || bundle.basePrice || "").toString(),
        baseSku: bundle.baseSku || `BUNDLE-${bundle._id}`,
        category: bundle.category || "mixed",
        startDate: bundle.startDate ? new Date(bundle.startDate).toISOString().split('T')[0] : "",
        endDate: bundle.endDate ? new Date(bundle.endDate).toISOString().split('T')[0] : "",
        isActive: bundle.isActive,
      })
      setImages(bundle.images || (bundle.image ? [bundle.image] : []))
      setSizeOptions(bundle.sizeOptions || [])
      setColorOptions(bundle.colorOptions || [])
      setVariants(bundle.variants || [])
      setDefaultVariant(bundle.defaultVariant || "")
    } else {
      form.reset({
        name: "",
        description: "",
        basePrice: "",
        baseSku: `BUNDLE-${Date.now()}`,
        category: "mixed",
        startDate: "",
        endDate: "",
        isActive: true,
      })
      setImages([])
      setSizeOptions([])
      setColorOptions([])
      setVariants([])
      setDefaultVariant("")
    }
  }, [bundle, form, open])

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
              id: `variant-${size}-${color.name}-${Date.now()}`,
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
      setVariants([])
    }
  }, [sizeOptions, colorOptions, form])

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    try {
      setUploadingImage(true)
      const uploadedUrls = await bundleAPI.uploadImages(Array.from(files))
      setImages(prev => [...prev, ...uploadedUrls])
      toast({ title: "Success", description: "Image uploaded successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" })
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = (index: number) => setImages(images.filter((_, i) => i !== index))

  const moveImage = (index: number, direction: "up" | "down") => {
    const newImages = [...images]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex >= 0 && targetIndex < images.length) {
      [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]]
      setImages(newImages)
    }
  }

  const togglePresetSize = (size: string) => {
    const normalized = size.trim().toUpperCase()
    if (sizeOptions.includes(normalized)) {
      setSizeOptions(sizeOptions.filter((s) => s !== normalized))
    } else {
      setSizeOptions([...sizeOptions, normalized])
    }
  }

  const removeSize = (size: string) => setSizeOptions(sizeOptions.filter((s) => s !== size))

  const addColor = (imageUrl?: string) => {
    if (newColorName && !colorOptions.find((c) => c.name === newColorName)) {
      const value = colorInputType === 'image' ? imageUrl : newColorValue
      if (!value) return
      setColorOptions([...colorOptions, { name: newColorName, type: colorInputType, value }])
      setNewColorName("")
      setNewColorValue("#000000")
    }
  }

  const removeColor = (colorName: string) => setColorOptions(colorOptions.filter((c) => c.name !== colorName))

  const updateVariant = (variantId: string, updates: Partial<ProductVariant>) => {
    setVariants(variants.map((v) => (v.id === variantId ? { ...v, ...updates } : v)))
  }

  const onSubmit = async (values: z.infer<typeof bundleSchema>) => {
    try {
      setLoading(true)
      const bundleData = {
        ...values,
        basePrice: Number.parseFloat(values.basePrice),
        bundlePrice: Number.parseFloat(values.basePrice), // Using basePrice as bundlePrice
        images,
        sizeOptions,
        colorOptions,
        variants,
        defaultVariant: defaultVariant || (variants.length > 0 ? variants[0].id : ""),
        products: [], // No longer linking products
      }

      if (bundle) {
        await bundleAPI.updateBundle(bundle._id, bundleData)
        toast({ title: "Success", description: "Bundle updated successfully" })
      } else {
        await bundleAPI.createBundle(bundleData)
        toast({ title: "Success", description: "Bundle created successfully" })
      }
      onClose(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to save bundle",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bundle ? "Edit Bundle" : "Add New Bundle"}</DialogTitle>
          <DialogDescription>
            {bundle ? "Update bundle information and variations" : "Add a new bundle with all its details and variations."}
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
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Bundle Name</FormLabel><FormControl><Input placeholder="e.g., Summer Fitness Pack" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl><SelectContent><SelectItem value="men">Men</SelectItem><SelectItem value="women">Women</SelectItem><SelectItem value="mixed">Mixed</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="basePrice" render={({ field }) => (
                    <FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 199.99" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="baseSku" render={({ field }) => (
                    <FormItem><FormLabel>Base SKU</FormLabel><FormControl><Input placeholder="Enter SKU" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the bundle..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="startDate" render={({ field }) => (
                    <FormItem><FormLabel>Start Date (Optional)</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="endDate" render={({ field }) => (
                    <FormItem><FormLabel>End Date (Optional)</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5"><FormLabel className="text-base">Active Bundle</FormLabel><FormDescription>Bundle will be available for purchase.</FormDescription></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )} />
              </TabsContent>

              <TabsContent value="media" className="space-y-6 pt-4">
                <Card>
                  <CardHeader><CardTitle>Bundle Images</CardTitle><CardDescription>Add images. The first is the main display image.</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <Button type="button" onClick={() => fileInputRef.current?.click()} className="w-full" variant="outline" disabled={uploadingImage}><Upload className="h-4 w-4 mr-2" />{uploadingImage ? "Uploading..." : "Select Images"}</Button>
                    <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(e.target.files)} className="hidden" />
                    {images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((image, index) => (
                          <Card key={index} className="relative group">
                            <CardContent className="p-0"><img src={image} alt={`Bundle image ${index + 1}`} className="w-full h-full object-cover aspect-square rounded-md" />{index === 0 && <Badge className="absolute top-1 left-1 text-xs">Main</Badge>}</CardContent>
                            <div className="flex justify-center items-center mt-2 gap-1">
                              <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => moveImage(index, "up")} disabled={index === 0}><MoveUp className="h-4 w-4" /></Button>
                              <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => moveImage(index, "down")} disabled={index === images.length - 1}><MoveDown className="h-4 w-4" /></Button>
                              <Button type="button" size="icon" variant="destructive" className="h-7 w-7" onClick={() => removeImage(index)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle>Size Options</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">{PRESET_SIZES.map(size => <Button key={size} type="button" size="sm" variant={sizeOptions.includes(size) ? "default" : "outline"} onClick={() => togglePresetSize(size)}>{size}</Button>)}</div>
                      <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-md bg-muted/20">{sizeOptions.length > 0 ? sizeOptions.map(size => <Badge key={size} variant="secondary" className="flex items-center gap-1.5">{size}<X className="h-3.5 w-3.5 cursor-pointer hover:text-destructive" onClick={() => removeSize(size)} /></Badge>) : <p className="text-sm text-muted-foreground">No sizes</p>}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Color Options</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2"><Button type="button" variant={colorInputType === "hex" ? "default" : "outline"} size="sm" onClick={() => setColorInputType("hex")}><Palette className="h-4 w-4 mr-1" /> Color</Button></div>
                      <div className="space-y-2">
                        <Input placeholder="Color name (e.g., Black)" value={newColorName} onChange={(e) => setNewColorName(e.target.value)} />
                        <div className="flex space-x-2"><Input type="color" value={newColorValue} onChange={(e) => setNewColorValue(e.target.value)} className="w-20 p-1" /><Button type="button" onClick={() => addColor()}><Plus className="h-4 w-4" /> Add</Button></div>
                      </div>
                      <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-md bg-muted/20">{colorOptions.length > 0 ? colorOptions.map(color => <Badge key={color.name} variant="secondary" className="flex items-center gap-2 p-1.5"><div className="w-4 h-4 rounded-full border" style={{ backgroundColor: color.value }} />{color.name}<X className="h-3.5 w-3.5 cursor-pointer hover:text-destructive" onClick={() => removeColor(color.name)} /></Badge>) : <p className="text-sm text-muted-foreground">No colors</p>}</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="variants" className="space-y-4 pt-4">
                <div className="flex items-center justify-between"><h3 className="text-lg font-medium">Bundle Variants</h3><Badge variant="outline">{variants.length} variants</Badge></div>
                {variants.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {variants.map(variant => (
                      <Card key={variant.id} className={defaultVariant === variant.id ? "ring-2 ring-primary" : ""}>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-1"><Button type="button" variant={defaultVariant === variant.id ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setDefaultVariant(variant.id)} title="Set as default"><Star className={`h-4 w-4 ${defaultVariant === variant.id ? "fill-current" : ""}`} /></Button></div>
                            <div className="col-span-3"><div className="font-medium text-sm">{variant.size} / {variant.color.name}</div><div className="flex items-center space-x-1 mt-1"><div className="w-4 h-4 rounded-full border" style={{ backgroundColor: variant.color.value }} /><span className="text-xs text-muted-foreground">{variant.color.name}</span></div></div>
                            <div className="col-span-3"><FormLabel className="text-xs">SKU</FormLabel><Input placeholder="SKU" value={variant.sku} onChange={(e) => updateVariant(variant.id, { sku: e.target.value })} className="text-sm h-9" /></div>
                            <div className="col-span-2"><FormLabel className="text-xs">Stock</FormLabel><Input type="number" placeholder="Stock" value={variant.stock} onChange={(e) => updateVariant(variant.id, { stock: Number.parseInt(e.target.value) || 0 })} className="text-sm h-9" /></div>
                            <div className="col-span-2 text-center"><FormLabel className="text-xs">Active</FormLabel><div className="flex justify-center pt-1"><Switch checked={variant.isActive} onCheckedChange={(checked) => updateVariant(variant.id, { isActive: checked })} /></div></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : <Card><CardContent className="text-center py-12"><p className="text-sm text-muted-foreground">Add sizes and colors to generate variants.</p></CardContent></Card>}
              </TabsContent>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => onClose()}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? "Saving..." : bundle ? "Update Bundle" : "Create Bundle"}</Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}