"use client"

import { useState, useEffect, useRef } from "react"
import { useState, useEffect, useRef, useMemo } from "react"
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { bundleAPI, type Bundle } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Plus, Edit, Trash2, Package, Calendar, Percent, ImageIcon, Upload, Loader2, X } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

const bundleSchema = z.object({
  // Main details
  name: z.string().min(1, "Bundle name is required"),
  productSlug: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  badgeText: z.string().optional(),
  ratingValue: z.string().optional(),
  reviewsCount: z.string().optional(),
  basePrice: z.string().optional(),
  discountedPrice: z.string().optional(),
  finalPrice: z.string().optional(),
  dealTag: z.string().optional(),
  bundlePrice: z.string().min(1, "Bundle price is required"),
  dealTag: z.string().optional(), // This seems to be for display

  // This seems to be the primary price for the bundle, let's rename for clarity
  // and make it optional if prices are defined per-variant.
  defaultPrice: z.string().optional(),

  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean(),
})

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://athlekt.com/backendnew/api"
const UPLOAD_BASE_URL = API_BASE_URL.replace(/\/api$/, "")

const getFullImageUrl = (url?: string | null) => {
  if (!url) return ""
  if (url.startsWith("http")) return url
  if (url.startsWith("/")) return `${UPLOAD_BASE_URL}${url}`
  return `${UPLOAD_BASE_URL}/${url}`
}

type BundleVariant = {
  id: string
  pack: string
  color: string
  size: string
  sku: string
  price: number
  stock: number
  isActive: boolean
}

const createId = () => Math.random().toString(36).slice(2, 11)

type PackOptionForm = {
  id: string
  name: string
  quantity: number
  totalPrice: number
  pricePerItem: number
  tag?: string
  thumbnailImage?: string
}

type ColorOptionForm = {
  id: string
  name: string
  description?: string
  badge?: string
  thumbnailImage?: string
  galleryImages: string[]
}

type GuaranteeForm = {
  id: string
  title?: string
  description?: string
  icon?: string
}

const createDefaultPackOption = (): PackOptionForm => ({
  id: createId(),
  name: "Default Pack",
  quantity: 1,
  totalPrice: 0,
  pricePerItem: 0,
  tag: "",
  thumbnailImage: "",
})

const createDefaultColorOption = (): ColorOptionForm => ({
  id: createId(),
  name: "",
  description: "",
  badge: "",
  thumbnailImage: "",
  galleryImages: [],
})

const createDefaultGuarantee = (): GuaranteeForm => ({
  id: createId(),
  title: "",
  description: "",
  icon: "",
})

export function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null)
  const [heroImage, setHeroImage] = useState<string>("")
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [uploadingHero, setUploadingHero] = useState<boolean>(false)
  const [uploadingGallery, setUploadingGallery] = useState<boolean>(false)
  const heroInputRef = useRef<HTMLInputElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)
  const [packOptions, setPackOptions] = useState<PackOptionForm[]>([createDefaultPackOption()])
  const [colorOptions, setColorOptions] = useState<ColorOptionForm[]>([])
  const [sizeOptions, setSizeOptions] = useState<string[]>([])
  const [sizePriceVariation, setSizePriceVariation] = useState<Record<string, number>>({})
  const [lengthOptions, setLengthOptions] = useState<string[]>([])
  const [guarantees, setGuarantees] = useState<GuaranteeForm[]>([])
  const [newSizeValue, setNewSizeValue] = useState("")
  const [newLengthValue, setNewLengthValue] = useState("")
  const [uploadingPackImageId, setUploadingPackImageId] = useState<string | null>(null)
  const [uploadingColorThumbnailId, setUploadingColorThumbnailId] = useState<string | null>(null)
  const [uploadingColorGalleryId, setUploadingColorGalleryId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("details")
  const [variants, setVariants] = useState<BundleVariant[]>([])
  const [defaultVariantId, setDefaultVariantId] = useState<string>("")
  const { toast } = useToast()

  const form = useForm<z.infer<typeof bundleSchema>>({
    resolver: zodResolver(bundleSchema),
    defaultValues: {
      name: "",
      productSlug: "",
      description: "",
      shortDescription: "",
      badgeText: "",
      ratingValue: "",
      reviewsCount: "",
      basePrice: "",
      discountedPrice: "",
      finalPrice: "",
      dealTag: "",
      bundlePrice: "",
      dealTag: "", // Renamed from bundlePrice
      defaultPrice: "",
      startDate: "",
      endDate: "",
      isActive: true,
    },
  })

  // Effect to generate variants whenever options change
  const generatedSkuPrefix = useMemo(() => {
    const name = form.getValues("name") || "BUNDLE"
    return name.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, "")
  }, [form.watch("name")])

  useEffect(() => {
    const packs = packOptions.filter(p => p.name)
    const colors = colorOptions.filter(c => c.name)
    const sizes = sizeOptions.filter(s => s)

    if (packs.length === 0 || colors.length === 0 || sizes.length === 0) {
      setVariants([])
      return
    }

    const newVariants: BundleVariant[] = []
    packs.forEach(pack => {
      colors.forEach(color => {
        sizes.forEach(size => {
          const existing = variants.find(v => v.pack === pack.name && v.color === color.name && v.size === size)
          if (existing) {
            newVariants.push(existing)
          } else {
            const id = `var-${pack.name}-${color.name}-${size}-${createId()}`
            const sku = `${generatedSkuPrefix}-${pack.quantity}P-${color.name.substring(0, 3).toUpperCase()}-${size}`
            newVariants.push({ id, pack: pack.name, color: color.name, size, sku, price: Number(form.getValues("defaultPrice")) || 0, stock: 0, isActive: true })
          }
        })
      })
    })
    setVariants(newVariants)
  }, [packOptions, colorOptions, sizeOptions, generatedSkuPrefix, form.watch("defaultPrice")])

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

  const triggerFileInput = (inputId: string) => {
    const input = document.getElementById(inputId) as HTMLInputElement | null
    input?.click()
  }

  const addPackOption = () => {
    setPackOptions((prev) => [...prev, createDefaultPackOption()])
  }

  const updatePackOptionQuantity = (id: string, quantity: number) => {
    setPackOptions((prev) =>
      prev.map((pack) => {
        if (pack.id !== id) return pack
        const safeQuantity = quantity > 0 ? quantity : 0
        const totalPrice = pack.totalPrice
        return {
          ...pack,
          quantity: safeQuantity,
          pricePerItem: safeQuantity > 0 ? Number((totalPrice / safeQuantity).toFixed(2)) : 0,
        }
      }),
    )
  }

  const updatePackOptionTotalPrice = (id: string, totalPrice: number) => {
    setPackOptions((prev) =>
      prev.map((pack) => {
        if (pack.id !== id) return pack
        const quantity = pack.quantity
        return {
          ...pack,
          totalPrice,
          pricePerItem: quantity > 0 ? Number((totalPrice / quantity).toFixed(2)) : 0,
        }
      }),
    )
  }

  const updatePackOptionField = (id: string, field: keyof Omit<PackOptionForm, "id" | "quantity" | "totalPrice" | "pricePerItem">, value: string) => {
    setPackOptions((prev) =>
      prev.map((pack) =>
        pack.id === id
          ? {
              ...pack,
              [field]: value,
            }
          : pack,
      ),
    )
  }

  const removePackOption = (id: string) => {
    setPackOptions((prev) => {
      if (prev.length === 1) {
        toast({
          title: "At least one pack",
          description: "A bundle needs at least one pack option.",
          variant: "destructive",
        })
        return prev
      }
      return prev.filter((pack) => pack.id !== id)
    })
  }

  const addColorOption = () => {
    setColorOptions((prev) => [...prev, createDefaultColorOption()])
  }

  const updateColorOptionField = (id: string, field: keyof Omit<ColorOptionForm, "id" | "galleryImages" | "thumbnailImage">, value: string) => {
    setColorOptions((prev) =>
      prev.map((color) =>
        color.id === id
          ? {
              ...color,
              [field]: value,
            }
          : color,
      ),
    )
  }

  const removeColorOption = (id: string) => {
    setColorOptions((prev) => prev.filter((color) => color.id !== id))
  }

  const handlePackThumbnailUpload = async (id: string, file: File) => {
    try {
      setUploadingPackImageId(id)
      const uploadedUrl = await uploadImageFile(file)
      setPackOptions((prev) =>
        prev.map((pack) => (pack.id === id ? { ...pack, thumbnailImage: uploadedUrl } : pack)),
      )
      toast({
        title: "Pack image uploaded",
        description: "Thumbnail updated for this pack.",
      })
    } catch (error: any) {
      console.error("Error uploading pack thumbnail:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Unable to upload pack image.",
        variant: "destructive",
      })
    } finally {
      setUploadingPackImageId(null)
    }
  }

  const handleColorThumbnailUpload = async (id: string, file: File) => {
    try {
      setUploadingColorThumbnailId(id)
      const uploadedUrl = await uploadImageFile(file)
      setColorOptions((prev) =>
        prev.map((color) => (color.id === id ? { ...color, thumbnailImage: uploadedUrl } : color)),
      )
      toast({
        title: "Color thumbnail uploaded",
        description: "Thumbnail updated for this color set.",
      })
    } catch (error: any) {
      console.error("Error uploading color thumbnail:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Unable to upload color thumbnail.",
        variant: "destructive",
      })
    } finally {
      setUploadingColorThumbnailId(null)
    }
  }

  const handleColorGalleryUpload = async (id: string, files: FileList) => {
    if (!files.length) return
    try {
      setUploadingColorGalleryId(id)
      const uploaded: string[] = []
      for (const file of Array.from(files)) {
        const url = await uploadImageFile(file)
        uploaded.push(url)
      }
      setColorOptions((prev) =>
        prev.map((color) =>
          color.id === id
            ? {
                ...color,
                galleryImages: [...color.galleryImages, ...uploaded],
              }
            : color,
        ),
      )
      toast({
        title: "Gallery updated",
        description: `${uploaded.length} image${uploaded.length > 1 ? "s" : ""} added to this color.`,
      })
    } catch (error: any) {
      console.error("Error uploading color gallery:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Unable to upload gallery images.",
        variant: "destructive",
      })
    } finally {
      setUploadingColorGalleryId(null)
    }
  }

  const removeColorGalleryImage = (id: string, imageUrl: string) => {
    setColorOptions((prev) =>
      prev.map((color) =>
        color.id === id
          ? { ...color, galleryImages: color.galleryImages.filter((img) => img !== imageUrl) }
          : color,
      ),
    )
  }

  const addSizeOption = () => {
    const value = newSizeValue.trim()
    if (!value) return
    setSizeOptions((prev) => {
      if (prev.includes(value)) {
        toast({
          title: "Already added",
          description: `${value} is already in the size list.`,
        })
        return prev
      }
      const next = [...prev, value]
      setSizePriceVariation((variation) => ({
        ...variation,
        [value]: variation[value] ?? 0,
      }))
      return next
    })
    setNewSizeValue("")
  }

  const removeSizeOption = (size: string) => {
    setSizeOptions((prev) => prev.filter((item) => item !== size))
    setSizePriceVariation((variation) => {
      const updated = { ...variation }
      delete updated[size]
      return updated
    })
  }

  const updateSizePriceVariation = (size: string, value: number) => {
    setSizePriceVariation((prev) => ({
      ...prev,
      [size]: value,
    }))
  }

  const addLengthOption = () => {
    const value = newLengthValue.trim()
    if (!value) return
    setLengthOptions((prev) => {
      if (prev.includes(value)) {
        toast({
          title: "Already added",
          description: `${value} length already exists.`,
        })
        return prev
      }
      return [...prev, value]
    })
    setNewLengthValue("")
  }

  const removeLengthOption = (value: string) => {
    setLengthOptions((prev) => prev.filter((item) => item !== value))
  }

  const addGuarantee = () => {
    setGuarantees((prev) => [...prev, createDefaultGuarantee()])
  }

  const updateGuaranteeField = (id: string, field: keyof Omit<GuaranteeForm, "id">, value: string) => {
    setGuarantees((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    )
  }

  const removeGuarantee = (id: string) => {
    setGuarantees((prev) => prev.filter((item) => item.id !== id))
  }

  const uploadImageFile = async (file: File) => {
    const formData = new FormData()
    formData.append("image", file)

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Upload failed (status ${response.status})`)
    }

    const data = await response.json()
    const imageUrl = data.imageUrl || data.fileUrl || data.url

    if (!imageUrl) {
      throw new Error("Upload succeeded but no image URL was returned.")
    }

    return imageUrl as string
  }

  const handleHeroImageUpload = async (file: File) => {
    try {
      setUploadingHero(true)
      const uploadedUrl = await uploadImageFile(file)
      setHeroImage(uploadedUrl)
      toast({
        title: "Hero image uploaded",
        description: "The bundle hero image has been uploaded successfully.",
      })
    } catch (error: any) {
      console.error("Error uploading hero image:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Unable to upload hero image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingHero(false)
    }
  }

  const handleGalleryImagesUpload = async (files: FileList) => {
    if (!files.length) return
    try {
      setUploadingGallery(true)
      const uploaded: string[] = []
      for (const file of Array.from(files)) {
        const url = await uploadImageFile(file)
        uploaded.push(url)
      }
      setGalleryImages((prev) => [...prev, ...uploaded])
      toast({
        title: "Gallery updated",
        description: `${uploaded.length} image${uploaded.length > 1 ? "s" : ""} added to gallery.`,
      })
    } catch (error: any) {
      console.error("Error uploading gallery images:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Unable to upload gallery images. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingGallery(false)
    }
  }

  const removeGalleryImage = (url: string) => {
    setGalleryImages((prev) => prev.filter((img) => img !== url))
  }

  const openDialog = (bundle?: Bundle) => {
    if (bundle) {
      setEditingBundle(bundle)
      form.reset({
        name: bundle.name,
        productSlug: bundle.productSlug || "",
        description: bundle.description || "",
        shortDescription: bundle.shortDescription || "",
        badgeText: bundle.badgeText || "",
        ratingValue: bundle.ratingValue !== undefined ? String(bundle.ratingValue) : "",
        reviewsCount: bundle.reviewsCount !== undefined ? String(bundle.reviewsCount) : "",
        basePrice: bundle.basePrice !== undefined ? String(bundle.basePrice) : "",
        discountedPrice: bundle.discountedPrice !== undefined ? String(bundle.discountedPrice) : "",
        finalPrice: bundle.finalPrice !== undefined ? String(bundle.finalPrice) : "",
        dealTag: bundle.dealTag || "",
        bundlePrice: bundle.bundlePrice !== undefined ? String(bundle.bundlePrice) : "",
        dealTag: bundle.dealTag || "", // This is correct
        defaultPrice: bundle.bundlePrice !== undefined ? String(bundle.bundlePrice) : "", // Mapped to defaultPrice
        startDate: bundle.startDate || "",
        endDate: bundle.endDate || "",
        isActive: bundle.isActive,
      })
      setHeroImage(bundle.heroImage || "")
      setGalleryImages(bundle.galleryImages || [])
      setPackOptions(
        (bundle.packOptions || []).map((option) => ({
          id: createId(),
          name: option.name || "",
          quantity: option.quantity ?? 1,
          totalPrice: option.totalPrice ?? 0,
          pricePerItem:
            option.pricePerItem !== undefined
              ? option.pricePerItem
              : option.quantity
                ? Number(((option.totalPrice ?? 0) / option.quantity).toFixed(2))
                : 0,
          tag: option.tag,
          thumbnailImage: option.thumbnailImage,
        }))
      )
      if (!bundle.packOptions || bundle.packOptions.length === 0) {
        setPackOptions([createDefaultPackOption()])
      }
      setColorOptions(
        (bundle.colorOptions || []).map((option) => ({
          id: createId(),
          name: option.name || "",
          description: option.description || "",
          badge: option.badge || "",
          thumbnailImage: option.thumbnailImage || "",
          galleryImages: option.galleryImages ? [...option.galleryImages] : [],
        }))
      )
      setSizeOptions([...(bundle.sizeOptions || [])])
      setSizePriceVariation(bundle.sizePriceVariation ? { ...bundle.sizePriceVariation } : {})
      setLengthOptions([...(bundle.lengthOptions || [])])
      setGuarantees(
        (bundle.guarantees || []).map((item) => ({
          id: createId(),
          title: item.title || "",
          description: item.description || "",
          icon: item.icon || "",
        }))
      )
    } else {
      setEditingBundle(null)
      form.reset()
      setHeroImage("")
      setGalleryImages([])
      setPackOptions([createDefaultPackOption()])
      setColorOptions([])
      setSizeOptions([])
      setSizePriceVariation({})
      setLengthOptions([])
      setGuarantees([])
    }
    setNewSizeValue("")
    setNewLengthValue("")
    setDialogOpen(true)
    setActiveTab("details") // Reset to the first tab
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingBundle(null)
    form.reset()
    setHeroImage("")
    setGalleryImages([])
    setPackOptions([createDefaultPackOption()])
    setColorOptions([])
    setSizeOptions([])
    setSizePriceVariation({})
    setLengthOptions([])
    setGuarantees([])
    setNewSizeValue("")
    setNewLengthValue("")
    setActiveTab("details")
  }

  const onSubmit = async (values: z.infer<typeof bundleSchema>) => {
    try {
      const sanitizedGallery = galleryImages.filter((url) => typeof url === "string" && url.trim().length > 0)
      const heroImageValue = heroImage?.trim() || undefined
  const validPackOptions = packOptions.filter(
    ({ name, quantity }) => name.trim().length > 0 && quantity > 0,
  )

  if (validPackOptions.length === 0) {
      toast({
      title: "Pack options required",
      description: "Please add at least one pack with a name and quantity.",
        variant: "destructive",
      })
      return
    }

  const packsPayload = validPackOptions.map(
    ({ id, name, tag, quantity, totalPrice, pricePerItem, thumbnailImage }) => ({
      name: name.trim(),
      tag: tag?.trim() || undefined,
      quantity,
      totalPrice,
      pricePerItem,
      thumbnailImage: thumbnailImage || undefined,
    }),
  )

      if (packsPayload.length === 0) {
          toast({
            title: "Error",
          description: "Please add at least one pack option.",
            variant: "destructive",
          })
          return
    }

      const colorOptionsPayload = colorOptions.map(({ id, name, description, badge, thumbnailImage, galleryImages }) => ({
        name: name.trim(),
        description: description?.trim() || undefined,
        badge: badge?.trim() || undefined,
        thumbnailImage: thumbnailImage || undefined,
        galleryImages,
      }))

      const sizePricePayload = sizeOptions.reduce<Record<string, number>>((acc, size) => {
        const value = sizePriceVariation[size] ?? 0
        acc[size] = Number(value)
        return acc
      }, {})

      const ratingValue = values.ratingValue?.trim() ? Number(values.ratingValue) : undefined
      const reviewsCount = values.reviewsCount?.trim() ? Number(values.reviewsCount) : undefined
      const basePrice = values.basePrice?.trim() ? Number(values.basePrice) : undefined
      const discountedPrice = values.discountedPrice?.trim() ? Number(values.discountedPrice) : undefined
      const finalPrice = values.finalPrice?.trim() ? Number(values.finalPrice) : undefined
      const bundlePriceNumeric = Number.parseFloat(values.bundlePrice)
      const defaultPriceNumeric = values.defaultPrice ? Number.parseFloat(values.defaultPrice) : 0

      const guaranteesPayload = guarantees
        .filter((item) => item.title || item.description || item.icon)
        .map(({ id, title, description, icon }) => ({
          title: title?.trim() || undefined,
          description: description?.trim() || undefined,
          icon: icon?.trim() || undefined,
        }))

      const bundleData: any = {
        ...values,
        bundlePrice: bundlePriceNumeric,
        bundlePrice: defaultPriceNumeric, // This is the main/default price
        products: [],
        heroImage: heroImageValue,
        galleryImages: sanitizedGallery,
        packOptions: packsPayload,
        colorOptions: colorOptionsPayload,
        sizeOptions,
        sizePriceVariation: sizePricePayload,
        lengthOptions,
        guarantees: guaranteesPayload,
        ratingValue,
        reviewsCount,
        basePrice,
        discountedPrice,
        finalPrice: finalPrice ?? bundlePriceNumeric,
        discountedPrice, // This is the main/default price
        finalPrice: finalPrice ?? defaultPriceNumeric,
        dealTag: values.dealTag?.trim() || undefined,
        originalPrice: basePrice ?? bundlePriceNumeric,
        createdAt: editingBundle?.createdAt || new Date().toISOString(),
      }

      bundleData.productSlug = values.productSlug?.trim() || undefined
      bundleData.badgeText = values.badgeText?.trim() || undefined
      bundleData.shortDescription = values.shortDescription?.trim() || undefined
      bundleData.name = values.name.trim()
      bundleData.description = values.description || ""

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

  const calculateSavings = (originalPrice?: number, bundlePrice?: number) => {
    const base = Number(originalPrice) || 0
    const current = Number(bundlePrice) || 0
    if (base <= 0 || current >= base) {
      return { savings: 0, percentage: "0" }
    }
    const savings = base - current
    const percentage = ((savings / base) * 100).toFixed(0)
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
      <div className="flex flex-wrap justify-between items-center gap-4">
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
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBundle ? "Edit Bundle" : "Create New Bundle"}</DialogTitle>
              <DialogDescription>
                {editingBundle ? "Update bundle information" : "Create a new product bundle with special pricing"}
                {editingBundle ? "Update bundle information and variations." : "Create a new product bundle with all its options and variations."}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Bundle Details</TabsTrigger>
                <TabsTrigger value="options">Options & Media</TabsTrigger>
                <TabsTrigger value="variants">Variants</TabsTrigger>
              </TabsList>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4">
                  <TabsContent value="details" className="space-y-6">
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
                    name="defaultPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bundle Price </FormLabel>
                        <FormLabel>Default Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                    </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="shortDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Short summary shown on bundle card" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="badgeText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Badge Text</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Black Friday Deal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="productSlug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="classic-crew-neck" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dealTag"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deal Tag</FormLabel>
                        <FormControl>
                          <Input placeholder="Black Friday Deal" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ratingValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rating</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" min="0" max="5" placeholder="4.8" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reviewsCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reviews Count</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" placeholder="65069" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="65200" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discountedPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discounted Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="36300" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="finalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Featured Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="28677" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                  </TabsContent>

                  <TabsContent value="options" className="space-y-6">
                <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
                  <div className="space-y-2">
                    <FormLabel>Hero Image</FormLabel>
                    <div className="border border-dashed border-muted-foreground/40 rounded-lg p-4 flex flex-col items-center justify-center gap-3 bg-muted/20">
                      {heroImage ? (
                        <div className="w-full relative">
                          <img
                            src={getFullImageUrl(heroImage)}
                            alt="Bundle hero"
                            className="w-full h-48 object-cover rounded-md"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                            onClick={() => setHeroImage("")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground flex flex-col items-center gap-2 py-8">
                          <ImageIcon className="h-10 w-10" />
                          <p className="text-sm">No hero image selected</p>
                        </div>
                      )}
                      <input
                        ref={heroInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          if (file) {
                            handleHeroImageUpload(file)
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => heroInputRef.current?.click()}
                        disabled={uploadingHero}
                      >
                        {uploadingHero ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Hero Image
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FormLabel>Gallery Images</FormLabel>
                    <div className="border border-dashed border-muted-foreground/40 rounded-lg p-4 bg-muted/20">
                      <div className="flex flex-wrap gap-4">
                        {galleryImages.map((imageUrl) => (
                          <div key={imageUrl} className="relative w-32 h-32 rounded-md overflow-hidden border">
                            <img
                              src={getFullImageUrl(imageUrl)}
                              alt="Gallery"
                              className="w-full h-full object-cover"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="absolute top-1 right-1 bg-white/80 hover:bg-white"
                              onClick={() => removeGalleryImage(imageUrl)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <div className="w-32 h-32 border border-dashed border-muted-foreground/40 rounded-md flex flex-col items-center justify-center text-center text-muted-foreground bg-background/40">
                          <input
                            ref={galleryInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(event) => {
                              const files = event.target.files
                              if (files) {
                                handleGalleryImagesUpload(files)
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            className="flex flex-col items-center gap-2"
                            onClick={() => galleryInputRef.current?.click()}
                            disabled={uploadingGallery}
                          >
                            {uploadingGallery ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Upload className="h-5 w-5" />
                            )}
                            <span className="text-xs">Add Images</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
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
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-base font-medium">Pack Options</FormLabel>
                    <Button type="button" variant="secondary" onClick={addPackOption}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Pack
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Define the quantity packs available for this bundle. Per-item pricing updates automatically.
                  </p>
                  <div className="space-y-4">
                    {packOptions.map((pack) => (
                      <div key={pack.id} className="rounded-lg border p-4 space-y-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="grid flex-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <FormLabel className="text-sm font-medium">Pack Name</FormLabel>
                              <Input
                                value={pack.name}
                                onChange={(event) => updatePackOptionField(pack.id, "name", event.target.value)}
                                placeholder="6-Pack"
                              />
                            </div>
                            <div className="space-y-2">
                              <FormLabel className="text-sm font-medium">Tag (optional)</FormLabel>
                              <Input
                                value={pack.tag ?? ""}
                                onChange={(event) => updatePackOptionField(pack.id, "tag", event.target.value)}
                                placeholder="Top Seller"
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePackOption(pack.id)}
                            disabled={packOptions.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <FormLabel className="text-sm font-medium">Quantity</FormLabel>
                            <Input
                              type="number"
                              min="1"
                              value={pack.quantity}
                              onChange={(event) => updatePackOptionQuantity(pack.id, Number(event.target.value))}
                            />
                          </div>
                          <div className="space-y-2">
                            <FormLabel className="text-sm font-medium">Total Price</FormLabel>
                            <Input
                              type="number"
                              step="0.01"
                              value={pack.totalPrice}
                              onChange={(event) => updatePackOptionTotalPrice(pack.id, Number(event.target.value))}
                            />
                          </div>
                          <div className="space-y-1">
                            <FormLabel className="text-sm font-medium">Per Item</FormLabel>
                            <p className="rounded-md border bg-muted px-3 py-2 text-sm font-medium">
                              {pack.pricePerItem.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <FormLabel className="text-sm font-medium">Thumbnail</FormLabel>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="h-20 w-20 overflow-hidden rounded-md border bg-muted">
                              {pack.thumbnailImage ? (
                                <img src={getFullImageUrl(pack.thumbnailImage)} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                  No image
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => triggerFileInput(`pack-thumb-${pack.id}`)}
                                disabled={uploadingPackImageId === pack.id}
                              >
                                {uploadingPackImageId === pack.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Image
                                  </>
                                )}
                              </Button>
                              {pack.thumbnailImage && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => updatePackOptionField(pack.id, "thumbnailImage", "")}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                              <input
                                id={`pack-thumb-${pack.id}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0]
                                  if (file) {
                                    handlePackThumbnailUpload(pack.id, file)
                                  }
                                  event.target.value = ""
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-base font-medium">Color Sets</FormLabel>
                    <Button type="button" variant="secondary" onClick={addColorOption}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Color
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add color groupings with dedicated imagery and badges.
                  </p>
                  <div className="space-y-4">
                    {colorOptions.map((color) => (
                      <div key={color.id} className="space-y-4 rounded-lg border p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="grid flex-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <FormLabel className="text-sm font-medium">Color Name</FormLabel>
                              <Input
                                value={color.name}
                                onChange={(event) => updateColorOptionField(color.id, "name", event.target.value)}
                                placeholder="Black"
                              />
                            </div>
                            <div className="space-y-2">
                              <FormLabel className="text-sm font-medium">Badge (optional)</FormLabel>
                              <Input
                                value={color.badge ?? ""}
                                onChange={(event) => updateColorOptionField(color.id, "badge", event.target.value)}
                                placeholder="Top Seller"
                              />
                            </div>
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeColorOption(color.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <FormLabel className="text-sm font-medium">Description</FormLabel>
                          <Textarea
                            value={color.description ?? ""}
                            onChange={(event) => updateColorOptionField(color.id, "description", event.target.value)}
                            placeholder="List colors covered in this pack."
                          />
                        </div>
                        <div className="space-y-2">
                          <FormLabel className="text-sm font-medium">Thumbnail</FormLabel>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="h-20 w-20 overflow-hidden rounded-md border bg-muted">
                              {color.thumbnailImage ? (
                                <img src={getFullImageUrl(color.thumbnailImage)} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                  No image
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => triggerFileInput(`color-thumb-${color.id}`)}
                                disabled={uploadingColorThumbnailId === color.id}
                              >
                                {uploadingColorThumbnailId === color.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Thumbnail
                                  </>
                                )}
                              </Button>
                              {color.thumbnailImage && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setColorOptions((prev) =>
                                      prev.map((item) =>
                                        item.id === color.id ? { ...item, thumbnailImage: "" } : item,
                                      ),
                                    )
                                  }
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                              <input
                                id={`color-thumb-${color.id}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0]
                                  if (file) {
                                    handleColorThumbnailUpload(color.id, file)
                                  }
                                  event.target.value = ""
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <FormLabel className="text-sm font-medium">Gallery Images</FormLabel>
                          <div className="flex flex-wrap gap-3">
                            {color.galleryImages.map((imageUrl) => (
                              <div key={imageUrl} className="relative h-20 w-20 overflow-hidden rounded-md border bg-muted">
                                <img src={getFullImageUrl(imageUrl)} alt="" className="h-full w-full object-cover" />
                                <button
                                  type="button"
                                  className="absolute right-1 top-1 rounded-full bg-white/80 p-1 text-xs hover:bg-white"
                                  onClick={() => removeColorGalleryImage(color.id, imageUrl)}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => triggerFileInput(`color-gallery-${color.id}`)}
                              disabled={uploadingColorGalleryId === color.id}
                            >
                              {uploadingColorGalleryId === color.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload Images
                                </>
                              )}
                            </Button>
                            <input
                              id={`color-gallery-${color.id}`}
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(event) => {
                                if (event.target.files) {
                                  handleColorGalleryUpload(color.id, event.target.files)
                                }
                                event.target.value = ""
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {colorOptions.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No colors added yet. Use “Add Color” to create a color set.
                      </p>
                    )}
                  </div>
                  </div>

                <div className="space-y-4">
                  <FormLabel className="text-base font-medium">Sizes</FormLabel>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      value={newSizeValue}
                      onChange={(event) => setNewSizeValue(event.target.value.toUpperCase())}
                      placeholder="Add size (e.g. S)"
                      className="sm:w-64"
                    />
                    <Button type="button" variant="secondary" onClick={addSizeOption}>
                      Add Size
                    </Button>
                  </div>
                  {sizeOptions.length > 0 && (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {sizeOptions.map((size) => (
                          <span
                            key={size}
                            className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-sm font-medium"
                          >
                            {size}
                            <button
                              type="button"
                              onClick={() => removeSizeOption(size)}
                              className="rounded-full bg-white/70 p-1 hover:bg-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Size Price Adjustments</h4>
                        <p className="text-xs text-muted-foreground">
                          Optional price offsets for larger sizes (e.g. XL +150).
                        </p>
                        <div className="grid gap-3 md:grid-cols-3">
                          {sizeOptions.map((size) => (
                            <div key={size} className="space-y-2">
                              <FormLabel className="text-xs uppercase">{size}</FormLabel>
                              <Input
                                type="number"
                                step="0.01"
                                value={sizePriceVariation[size] ?? 0}
                                onChange={(event) => updateSizePriceVariation(size, Number(event.target.value))}
                              />
                            </div>
                          ))}
                          </div>
                        </div>
                    </>
                  )}
                  </div>
                  
                <div className="space-y-4">
                  <FormLabel className="text-base font-medium">Length Options</FormLabel>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      value={newLengthValue}
                      onChange={(event) => setNewLengthValue(event.target.value)}
                      placeholder="Add length (e.g. Regular)"
                      className="sm:w-64"
                    />
                    <Button type="button" variant="secondary" onClick={addLengthOption}>
                      Add Length
                    </Button>
                      </div>
                  {lengthOptions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {lengthOptions.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-sm font-medium"
                        >
                          {item}
                          <button
                            type="button"
                            onClick={() => removeLengthOption(item)}
                            className="rounded-full bg-white/70 p-1 hover:bg-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                        </div>
                      )}
                    </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-base font-medium">Guarantee Highlights</FormLabel>
                    <Button type="button" variant="secondary" onClick={addGuarantee}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Highlight
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {guarantees.map((item) => (
                      <div key={item.id} className="space-y-3 rounded-lg border p-4">
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <FormLabel className="text-sm font-medium">Title</FormLabel>
                            <Input
                              value={item.title ?? ""}
                              onChange={(event) => updateGuaranteeField(item.id, "title", event.target.value)}
                              placeholder="100-Day Guarantee"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <FormLabel className="text-sm font-medium">Description</FormLabel>
                            <Input
                              value={item.description ?? ""}
                              onChange={(event) => updateGuaranteeField(item.id, "description", event.target.value)}
                              placeholder="Free returns & exchanges"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <FormLabel className="text-sm font-medium">Icon (optional)</FormLabel>
                            <Input
                              value={item.icon ?? ""}
                              onChange={(event) => updateGuaranteeField(item.id, "icon", event.target.value)}
                              placeholder="shield-check"
                            />
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeGuarantee(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {guarantees.length === 0 && (
                      <p className="text-sm text-muted-foreground">No highlights added. Use “Add Highlight” to showcase guarantees.</p>
                    )}
                  </div>
                </div>
                  </TabsContent>

                  <TabsContent value="variants" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Bundle Variants</h3>
                        <p className="text-sm text-muted-foreground">
                          Configure stock, SKU, and price for each generated variant.
                        </p>
                      </div>
                      <Badge variant="outline">{variants.length} variants</Badge>
                    </div>

                    {variants.length > 0 ? (
                      <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                        {variants.map((variant) => (
                          <Card key={variant.id} className={defaultVariantId === variant.id ? "ring-2 ring-primary" : ""}>
                            <CardContent className="p-4">
                              <div className="grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-1">
                                  <Button
                                    type="button"
                                    variant={defaultVariantId === variant.id ? "default" : "outline"}
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setDefaultVariantId(variant.id)}
                                    title="Set as default variant"
                                  >
                                    <Star className={`h-4 w-4 ${defaultVariantId === variant.id ? "fill-current" : ""}`} />
                                  </Button>
                                </div>

                                <div className="col-span-3">
                                  <div className="font-medium text-sm">{variant.pack} / {variant.color} / {variant.size}</div>
                                </div>

                                <div className="col-span-2">
                                  <FormLabel className="text-xs">SKU</FormLabel>
                                  <Input
                                    placeholder="SKU"
                                    value={variant.sku}
                                    onChange={(e) => setVariants(vars => vars.map(v => v.id === variant.id ? { ...v, sku: e.target.value } : v))}
                                    className="text-sm h-9"
                                  />
                                </div>

                                <div className="col-span-2">
                                  <FormLabel className="text-xs">Price</FormLabel>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={variant.price}
                                    onChange={(e) => setVariants(vars => vars.map(v => v.id === variant.id ? { ...v, price: Number.parseFloat(e.target.value) || 0 } : v))}
                                    className="text-sm h-9"
                                  />
                                </div>

                                <div className="col-span-2">
                                  <FormLabel className="text-xs">Stock</FormLabel>
                                  <Input
                                    type="number"
                                    placeholder="Stock"
                                    value={variant.stock}
                                    onChange={(e) => setVariants(vars => vars.map(v => v.id === variant.id ? { ...v, stock: Number.parseInt(e.target.value) || 0 } : v))}
                                    className="text-sm h-9"
                                  />
                                </div>

                                <div className="col-span-2 text-center">
                                  <FormLabel className="text-xs">Active</FormLabel>
                                  <div className="flex justify-center pt-1">
                                    <Switch
                                      checked={variant.isActive}
                                      onCheckedChange={(checked) => setVariants(vars => vars.map(v => v.id === variant.id ? { ...v, isActive: checked } : v))}
                                    />
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
                              Add pack options, color sets, and sizes in the "Options & Media" tab to generate variants.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <div className="flex justify-end space-x-2 pt-6 border-t">
                    <Button type="button" variant="outline" onClick={closeDialog}>
                      Cancel
                    </Button>
                    <Button type="submit">{editingBundle ? "Update Bundle" : "Create Bundle"}</Button>
                  </div>
                </form>
              </Form>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {bundles.map((bundle) => {
          const { savings, percentage } = calculateSavings(
            bundle.basePrice ?? bundle.originalPrice,
            bundle.finalPrice ?? bundle.bundlePrice,
          )

          return (
            <Card key={bundle._id}>
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="flex items-center gap-2 text-xl">
                      <Package className="h-5 w-5" />
                      {bundle.name}
                    </CardTitle>
                      {bundle.badgeText && <Badge>{bundle.badgeText}</Badge>}
                      {!bundle.isActive && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    {typeof bundle.ratingValue === "number" && (
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">★ {bundle.ratingValue.toFixed(1)}</span>
                        {typeof bundle.reviewsCount === "number" && (
                          <span>{bundle.reviewsCount.toLocaleString()} reviews</span>
                        )}
                      </div>
                    )}
                    {bundle.shortDescription && (
                      <p className="text-sm text-muted-foreground">{bundle.shortDescription}</p>
                    )}
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
                <div className="grid gap-6 lg:grid-cols-4">
                  <div>
                    <h4 className="mb-3 font-medium">Pack Options ({bundle.packOptions?.length ?? 0})</h4>
                    <div className="space-y-2">
                      {bundle.packOptions && bundle.packOptions.length > 0 ? (
                        bundle.packOptions.map((pack, index) => (
                          <div key={`${pack.name}-${index}`} className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                            <div className="flex items-center justify-between font-medium">
                              <span>{pack.name}</span>
                              <span>{pack.quantity} pcs</span>
                          </div>
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(pack.totalPrice ?? 0)} • {formatCurrency(pack.pricePerItem ?? 0)}/item
                        </div>
                            {pack.tag && <div className="mt-1 text-xs font-semibold uppercase text-emerald-600">{pack.tag}</div>}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No pack options configured.</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                  <div>
                      <h4 className="mb-3 font-medium">Colors ({bundle.colorOptions?.length ?? 0})</h4>
                    <div className="space-y-2">
                        {bundle.colorOptions && bundle.colorOptions.length > 0 ? (
                        bundle.colorOptions.map((color, index) => (
                          <div key={`${color.name}-${index}`} className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                              <div className="font-medium">{color.name}</div>
                              {color.badge && <div className="text-xs uppercase text-amber-600">{color.badge}</div>}
                              {color.description && (
                                <div className="text-xs text-muted-foreground">{color.description}</div>
                              )}
                      </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No color sets defined.</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {bundle.sizeOptions && bundle.sizeOptions.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold uppercase text-muted-foreground">Sizes</h5>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {bundle.sizeOptions.map((size) => (
                              <span
                                key={size}
                                className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-medium"
                              >
                                {size}
                                {bundle.sizePriceVariation && bundle.sizePriceVariation[size] ? (
                                  <span className="text-emerald-600">
                                    +{formatCurrency(bundle.sizePriceVariation[size])}
                        </span>
                                ) : null}
                              </span>
                            ))}
                      </div>
                        </div>
                      )}
                      {bundle.lengthOptions && bundle.lengthOptions.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold uppercase text-muted-foreground">Lengths</h5>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {bundle.lengthOptions.map((option) => (
                              <span key={option} className="rounded-full border bg-muted px-3 py-1 text-xs font-medium">
                                {option}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 font-medium">Pricing Details</h4>
                    <div className="space-y-2 text-sm">
                      {typeof bundle.basePrice === "number" && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base Price:</span>
                          <span className="line-through">{formatCurrency(bundle.basePrice)}</span>
                        </div>
                      )}
                      {typeof bundle.discountedPrice === "number" && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Discounted:</span>
                          <span>{formatCurrency(bundle.discountedPrice)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium">
                        <span>Featured:</span>
                        <span className="text-green-600">
                          {formatCurrency(bundle.finalPrice ?? bundle.bundlePrice ?? 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Bundle Price:</span>
                        <span>{formatCurrency(bundle.bundlePrice ?? 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">You Save:</span>
                        <span className="text-green-600 font-medium">
                          {formatCurrency(savings)} ({percentage}%)
                        </span>
                      </div>
                      {bundle.dealTag && <div className="text-xs font-semibold uppercase text-amber-600">{bundle.dealTag}</div>}
                      <div className="space-y-2 pt-2 text-sm">
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
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        <span>Discount: {percentage}% off</span>
                      </div>
                    </div>
                  </div>
                </div>

                  <div>
                    <h4 className="mb-3 font-medium">Media</h4>
                    <div className="space-y-3">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-md border bg-muted/40">
                        <img
                          src={
                            bundle.heroImage
                              ? getFullImageUrl(bundle.heroImage)
                              : bundle.galleryImages && bundle.galleryImages.length > 0
                                ? getFullImageUrl(bundle.galleryImages[0])
                                : "/placeholder.svg"
                          }
                          alt={`${bundle.name} hero`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      {bundle.galleryImages && bundle.galleryImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {bundle.galleryImages.slice(0, 3).map((image) => (
                            <div key={image} className="relative aspect-[4/3] overflow-hidden rounded-md border bg-muted/20">
                              <img
                                src={getFullImageUrl(image)}
                                alt={`${bundle.name} gallery`}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {bundle.guarantees && bundle.guarantees.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h4 className="font-medium">Guarantees</h4>
                    <div className="flex flex-wrap gap-3">
                      {bundle.guarantees.map((item, index) => (
                        <div key={`${item.title}-${index}`} className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
                          <div className="font-semibold">{item.title}</div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground">{item.description}</div>
                          )}
                          {item.icon && <div className="text-xs text-muted-foreground">{item.icon}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
          const { savings, percentage } = calculateSavings(
            bundle.basePrice ?? bundle.originalPrice,
            bundle.finalPrice ?? bundle.bundlePrice,
          )

          return (
            <Card key={bundle._id}>
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="flex items-center gap-2 text-xl">
                      <Package className="h-5 w-5" />
                      {bundle.name}
                    </CardTitle>
                      {bundle.badgeText && <Badge>{bundle.badgeText}</Badge>}
                      {!bundle.isActive && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                    {typeof bundle.ratingValue === "number" && (
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">★ {bundle.ratingValue.toFixed(1)}</span>
                        {typeof bundle.reviewsCount === "number" && (
                          <span>{bundle.reviewsCount.toLocaleString()} reviews</span>
                        )}
                      </div>
                    )}
                    {bundle.shortDescription && (
                      <p className="text-sm text-muted-foreground">{bundle.shortDescription}</p>
                    )}
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
                <div className="grid gap-6 lg:grid-cols-4">
                  <div>
                    <h4 className="mb-3 font-medium">Pack Options ({bundle.packOptions?.length ?? 0})</h4>
                    <div className="space-y-2">
                      {bundle.packOptions && bundle.packOptions.length > 0 ? (
                        bundle.packOptions.map((pack, index) => (
                          <div key={`${pack.name}-${index}`} className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                            <div className="flex items-center justify-between font-medium">
                              <span>{pack.name}</span>
                              <span>{pack.quantity} pcs</span>
                          </div>
                            <div className="text-xs text-muted-foreground">
                              {formatCurrency(pack.totalPrice ?? 0)} • {formatCurrency(pack.pricePerItem ?? 0)}/item
                        </div>
                            {pack.tag && <div className="mt-1 text-xs font-semibold uppercase text-emerald-600">{pack.tag}</div>}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No pack options configured.</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                  <div>
                      <h4 className="mb-3 font-medium">Colors ({bundle.colorOptions?.length ?? 0})</h4>
                    <div className="space-y-2">
                        {bundle.colorOptions && bundle.colorOptions.length > 0 ? (
                        bundle.colorOptions.map((color, index) => (
                          <div key={`${color.name}-${index}`} className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                              <div className="font-medium">{color.name}</div>
                              {color.badge && <div className="text-xs uppercase text-amber-600">{color.badge}</div>}
                              {color.description && (
                                <div className="text-xs text-muted-foreground">{color.description}</div>
                              )}
                      </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No color sets defined.</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {bundle.sizeOptions && bundle.sizeOptions.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold uppercase text-muted-foreground">Sizes</h5>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {bundle.sizeOptions.map((size) => (
                              <span
                                key={size}
                                className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-medium"
                              >
                                {size}
                                {bundle.sizePriceVariation && bundle.sizePriceVariation[size] ? (
                                  <span className="text-emerald-600">
                                    +{formatCurrency(bundle.sizePriceVariation[size])}
                        </span>
                                ) : null}
                              </span>
                            ))}
                      </div>
                        </div>
                      )}
                      {bundle.lengthOptions && bundle.lengthOptions.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold uppercase text-muted-foreground">Lengths</h5>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {bundle.lengthOptions.map((option) => (
                              <span key={option} className="rounded-full border bg-muted px-3 py-1 text-xs font-medium">
                                {option}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 font-medium">Pricing Details</h4>
                    <div className="space-y-2 text-sm">
                      {typeof bundle.basePrice === "number" && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base Price:</span>
                          <span className="line-through">{formatCurrency(bundle.basePrice)}</span>
                        </div>
                      )}
                      {typeof bundle.discountedPrice === "number" && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Discounted:</span>
                          <span>{formatCurrency(bundle.discountedPrice)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium">
                        <span>Featured:</span>
                        <span className="text-green-600">
                          {formatCurrency(bundle.finalPrice ?? bundle.bundlePrice ?? 0)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Bundle Price:</span>
                        <span>{formatCurrency(bundle.bundlePrice ?? 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">You Save:</span>
                        <span className="text-green-600 font-medium">
                          {formatCurrency(savings)} ({percentage}%)
                        </span>
                      </div>
                      {bundle.dealTag && <div className="text-xs font-semibold uppercase text-amber-600">{bundle.dealTag}</div>}
                      <div className="space-y-2 pt-2 text-sm">
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
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        <span>Discount: {percentage}% off</span>
                      </div>
                    </div>
                  </div>
                </div>

                  <div>
                    <h4 className="mb-3 font-medium">Media</h4>
                    <div className="space-y-3">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-md border bg-muted/40">
                        <img
                          src={
                            bundle.heroImage
                              ? getFullImageUrl(bundle.heroImage)
                              : bundle.galleryImages && bundle.galleryImages.length > 0
                                ? getFullImageUrl(bundle.galleryImages[0])
                                : "/placeholder.svg"
                          }
                          alt={`${bundle.name} hero`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      {bundle.galleryImages && bundle.galleryImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {bundle.galleryImages.slice(0, 3).map((image) => (
                            <div key={image} className="relative aspect-[4/3] overflow-hidden rounded-md border bg-muted/20">
                              <img
                                src={getFullImageUrl(image)}
                                alt={`${bundle.name} gallery`}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {bundle.guarantees && bundle.guarantees.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h4 className="font-medium">Guarantees</h4>
                    <div className="flex flex-wrap gap-3">
                      {bundle.guarantees.map((item, index) => (
                        <div key={`${item.title}-${index}`} className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
                          <div className="font-semibold">{item.title}</div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground">{item.description}</div>
                          )}
                          {item.icon && <div className="text-xs text-muted-foreground">{item.icon}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
