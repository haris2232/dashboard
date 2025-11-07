"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { carouselImageAPI, type CarouselImage } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Upload } from "lucide-react"
import Image from "next/image"

interface CarouselImageDialogProps {
  open: boolean
  onClose: (refresh?: boolean) => void
  image?: CarouselImage | null
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://athlekt.com/backendnew/api';

export function CarouselImageDialog({ open, onClose, image }: CarouselImageDialogProps) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [order, setOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [previewUrl, setPreviewUrl] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (image) {
      setImageUrl(image.imageUrl)
      setOrder(image.order)
      setIsActive(image.isActive)
      setPreviewUrl(image.imageUrl)
    } else {
      setImageUrl("")
      setOrder(0)
      setIsActive(true)
      setPreviewUrl("")
    }
  }, [image, open])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('image', file)

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      // Upload route returns { imageUrl: '/uploads/filename.jpg' }
      const uploadedUrl = data.imageUrl || data.url || data.path
      
      if (uploadedUrl) {
        // If it's a relative path, make it absolute
        const fullUrl = uploadedUrl.startsWith('http') 
          ? uploadedUrl 
          : `${API_BASE_URL.replace('/api', '')}${uploadedUrl}`
        setImageUrl(fullUrl)
        setPreviewUrl(fullUrl)
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        })
      } else {
        throw new Error('No URL returned from upload')
      }
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!imageUrl.trim()) {
      toast({
        title: "Validation Error",
        description: "Please upload an image or provide an image URL",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const imageData = {
        imageUrl: imageUrl.trim(),
        order,
        isActive,
      }

      if (image) {
        await carouselImageAPI.updateCarouselImage(image._id, imageData)
        toast({
          title: "Success",
          description: "Image updated successfully",
        })
      } else {
        await carouselImageAPI.createCarouselImage(imageData)
        toast({
          title: "Success",
          description: "Image created successfully",
        })
      }

      onClose(true)
    } catch (error: any) {
      console.error('Error saving image:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save image",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{image ? "Edit Carousel Image" : "Add New Carousel Image"}</DialogTitle>
          <DialogDescription>
            {image ? "Update the carousel image information below." : "Upload an image to display in the MOVE WITH US carousel section."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="imageUpload">Upload Image</Label>
            <div className="flex items-center gap-4">
              <Input
                id="imageUpload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="flex-1"
              />
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            <p className="text-xs text-muted-foreground">
              Or enter an image URL below
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL *</Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value)
                setPreviewUrl(e.target.value)
              }}
              placeholder="Enter image URL or upload above"
              required
            />
          </div>

          {previewUrl && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100 border">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-contain"
                  onError={() => setPreviewUrl("")}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="order">Order</Label>
            <Input
              id="order"
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              placeholder="Display order (lower numbers appear first)"
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              Lower numbers appear first in the carousel
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active (Image will be visible in carousel)
            </Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {image ? "Update Image" : "Add Image"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

