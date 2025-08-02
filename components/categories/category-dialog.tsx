"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Upload, X } from "lucide-react"
import { categoryAPI } from "@/lib/api"

interface Category {
  _id: string
  name: string
  description?: string
  image?: string
  carouselImage?: string
  showInCarousel?: boolean
  carouselOrder?: number
  discountPercentage?: number
  displaySection?: string
  sectionOrder?: number
  isActive: boolean
  createdAt: string
}

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  onSuccess: () => void
}

export function CategoryDialog({ open, onOpenChange, category, onSuccess }: CategoryDialogProps) {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
    image: category?.image || "",
    carouselImage: category?.carouselImage || "",
    isActive: category?.isActive ?? true,
    showInCarousel: category?.showInCarousel ?? false,
    carouselOrder: category?.carouselOrder || 0,
    discountPercentage: category?.discountPercentage || 0,
    displaySection: category?.displaySection || 'none',
    sectionOrder: category?.sectionOrder || 0,
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleImageUpload = async (file: File, type: 'image' | 'carouselImage') => {
    setUploading(true)
    try {
      console.log('📤 Starting image upload...', { file: file.name, type });
      
      const formData = new FormData()
      formData.append('image', file)

      console.log('📋 FormData created');

      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      })

      console.log('📡 Upload response status:', response.status);

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Upload successful:', data);
        
        setFormData(prev => ({
          ...prev,
          [type]: data.imageUrl
        }))
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        })
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Upload failed:', errorData);
        throw new Error(errorData.error || 'Upload failed')
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      toast({
        title: "Error",
        description: `Failed to upload image: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (category) {
        await categoryAPI.updateCategory(category._id, formData)
        toast({
          title: "Success",
          description: "Category updated successfully",
        })
      } else {
        await categoryAPI.createCategory(formData)
        toast({
          title: "Success",
          description: "Category created successfully",
        })
      }
      onSuccess()
      onOpenChange(false)
      setFormData({
        name: "",
        description: "",
        image: "",
        carouselImage: "",
        isActive: true,
        showInCarousel: false,
        carouselOrder: 0,
        discountPercentage: 0,
        displaySection: 'none',
        sectionOrder: 0,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: category ? "Failed to update category" : "Failed to create category",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit Category" : "Add New Category"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter category name"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter category description"
                rows={3}
              />
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Images</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Main Image */}
              <div>
                <Label>Main Image</Label>
                <div className="mt-2 space-y-2">
                  {formData.image && (
                    <div className="relative">
                      <img
                        src={formData.image}
                        alt="Main image"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setFormData(prev => ({ ...prev, image: "" }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, 'image')
                      }}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {uploading ? "Uploading..." : "Click to upload main image"}
                      </p>
                    </label>
                  </div>
                </div>
              </div>

              {/* Carousel Image */}
              <div>
                <Label>Carousel Image</Label>
                <div className="mt-2 space-y-2">
                  {formData.carouselImage && (
                    <div className="relative">
                      <img
                        src={formData.carouselImage}
                        alt="Carousel image"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setFormData(prev => ({ ...prev, carouselImage: "" }))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(file, 'carouselImage')
                      }}
                      className="hidden"
                      id="carousel-image-upload"
                    />
                    <label htmlFor="carousel-image-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">
                        {uploading ? "Uploading..." : "Click to upload carousel image"}
                      </p>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Settings</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">Active Status</Label>
                <p className="text-sm text-gray-500">Show this category on the website</p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="showInCarousel">Show in Carousel</Label>
                <p className="text-sm text-gray-500">Display this category in the main carousel</p>
              </div>
              <Switch
                id="showInCarousel"
                checked={formData.showInCarousel}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showInCarousel: checked }))}
              />
            </div>

            {formData.showInCarousel && (
              <div>
                <Label htmlFor="carouselOrder">Carousel Order</Label>
                <Input
                  id="carouselOrder"
                  type="number"
                  value={formData.carouselOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, carouselOrder: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  min="0"
                />
                <p className="text-sm text-gray-500 mt-1">Lower numbers appear first</p>
              </div>
            )}

            <div>
              <Label htmlFor="displaySection">Display Section</Label>
              <select
                id="displaySection"
                value={formData.displaySection}
                onChange={(e) => setFormData(prev => ({ ...prev, displaySection: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="none">None</option>
                <option value="carousel">Carousel</option>
                <option value="women">Women Collection</option>
                <option value="men">Men Collection</option>
                <option value="training">Training Section</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">Choose where this category should appear</p>
            </div>

            {formData.displaySection !== 'none' && (
              <div>
                <Label htmlFor="sectionOrder">Section Order</Label>
                <Input
                  id="sectionOrder"
                  type="number"
                  value={formData.sectionOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, sectionOrder: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  min="0"
                />
                <p className="text-sm text-gray-500 mt-1">Lower numbers appear first in the section</p>
              </div>
            )}

            <div>
              <Label htmlFor="discountPercentage">Discount Percentage (Optional)</Label>
              <Input
                id="discountPercentage"
                type="number"
                value={formData.discountPercentage}
                onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
                max="100"
              />
              <p className="text-sm text-gray-500 mt-1">Set discount percentage (0-100)</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : (category ? "Update Category" : "Create Category")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 