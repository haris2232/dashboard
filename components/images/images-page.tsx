"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { carouselImageAPI, type CarouselImage } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Edit, Trash2, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react"
import { CarouselImageDialog } from "./carousel-image-dialog"
import Image from "next/image"

export function ImagesPage() {
  const [images, setImages] = useState<CarouselImage[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<CarouselImage | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      setLoading(true)
      const response = await carouselImageAPI.getCarouselImages()
      setImages(response.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch images",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this image?")) {
      try {
        await carouselImageAPI.deleteCarouselImage(id)
        toast({
          title: "Success",
          description: "Image deleted successfully",
        })
        fetchImages()
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete image",
          variant: "destructive",
        })
      }
    }
  }

  const toggleImageStatus = async (id: string) => {
    try {
      await carouselImageAPI.toggleCarouselImageStatus(id)
      toast({
        title: "Success",
        description: "Image status updated successfully",
      })
      fetchImages()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update image status",
        variant: "destructive",
      })
    }
  }

  const moveImage = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = images.findIndex(img => img._id === id)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= images.length) return

    const updatedImages = [...images]
    const [movedImage] = updatedImages.splice(currentIndex, 1)
    updatedImages.splice(newIndex, 0, movedImage)

    // Update order for all images
    try {
      for (let i = 0; i < updatedImages.length; i++) {
        await carouselImageAPI.updateCarouselImage(updatedImages[i]._id, { order: i })
      }
      toast({
        title: "Success",
        description: "Image order updated successfully",
      })
      fetchImages()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update image order",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Carousel Images</h1>
          <p className="text-muted-foreground">Manage images for the MOVE WITH US carousel section.</p>
        </div>
        <Button onClick={() => {
          setSelectedImage(null)
          setDialogOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Image
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {images.map((image, index) => (
          <Card key={image._id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">Image #{index + 1}</CardTitle>
                  <CardDescription className="mt-1">Order: {image.order}</CardDescription>
                </div>
                <div className="flex space-x-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveImage(image._id, 'up')}
                    disabled={index === 0}
                    title="Move up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveImage(image._id, 'down')}
                    disabled={index === images.length - 1}
                    title="Move down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleImageStatus(image._id)}
                    title={image.isActive ? "Deactivate image" : "Activate image"}
                  >
                    {image.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Edit image"
                    onClick={() => {
                      setSelectedImage(image)
                      setDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete image"
                    onClick={() => handleDelete(image._id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={image.imageUrl}
                    alt={`Carousel image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant={image.isActive ? "default" : "secondary"}>
                    {image.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(image.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {images.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No images found. Add your first image to get started.</p>
        </div>
      )}

      <CarouselImageDialog
        open={dialogOpen}
        onClose={(refresh) => {
          setDialogOpen(false)
          setSelectedImage(null)
          if (refresh) {
            fetchImages()
          }
        }}
        image={selectedImage}
      />
    </div>
  )
}

