"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Upload, X, Plus, Trash2 } from "lucide-react"
import { categoryAPI } from "@/lib/api"
import { subCategoryAPI } from "@/lib/subCategoryAPI"

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

interface SubCategory {
  id: string
  name: string
  category: string
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
    isActive: category?.isActive ?? true,
    showInCarousel: category?.showInCarousel ?? false,
    carouselOrder: category?.carouselOrder || 0,
    discountPercentage: category?.discountPercentage || 0,
    displaySection: category?.displaySection || 'none',
    sectionOrder: category?.sectionOrder || 0,
  })
  
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([])
  const [allSubCategories, setAllSubCategories] = useState<SubCategory[]>([])
  const [existingSubCategories, setExistingSubCategories] = useState<SubCategory[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Fetch all sub-categories when dialog opens
  useEffect(() => {
    if (open) {
      fetchAllSubCategories()
    }
  }, [open])

  // Fetch existing sub-categories when category changes
  useEffect(() => {
    if (category?.name) {
      fetchExistingSubCategories(category.name)
    }
  }, [category?.name])

  const fetchAllSubCategories = async () => {
    try {
      const subCategories = await subCategoryAPI.getAll()
      setAllSubCategories(subCategories)
    } catch (error) {
      console.error('Error fetching all sub-categories:', error)
    }
  }

  const fetchExistingSubCategories = async (categoryName: string) => {
    try {
      const allSubCategories = await subCategoryAPI.getAll()
      const filtered = allSubCategories.filter(sc => sc.category === categoryName)
      setExistingSubCategories(filtered)
    } catch (error) {
      console.error('Error fetching existing sub-categories:', error)
    }
  }

  const handleImageUpload = async (file: File, type: 'image') => {
    setUploading(true)
    try {
      console.log('📤 Starting image upload...', { file: file.name, type });
      
      const formData = new FormData()
      formData.append('image', file)

      console.log('📋 FormData created');

      const response = await fetch('http://34.18.0.53/api/upload', {
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

  const addSubCategory = (subCategoryId: string) => {
    if (!selectedSubCategories.includes(subCategoryId)) {
      setSelectedSubCategories(prev => [...prev, subCategoryId])
    }
  }

  const removeSubCategory = (subCategoryId: string) => {
    setSelectedSubCategories(prev => prev.filter(id => id !== subCategoryId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      let createdCategoryId: string

      if (category) {
        // Update existing category
        const updatedCategory = await categoryAPI.updateCategory(category._id, formData)
        createdCategoryId = updatedCategory._id
        toast({
          title: "Success",
          description: "Category updated successfully",
        })
      } else {
        // Create new category
        const newCategory = await categoryAPI.createCategory(formData)
        createdCategoryId = newCategory._id
        toast({
          title: "Success",
          description: "Category created successfully",
        })
      }

      // Link selected sub-categories to this category
      if (selectedSubCategories.length > 0) {
        for (const subCategoryId of selectedSubCategories) {
          try {
            const subCategory = allSubCategories.find(sc => sc.id === subCategoryId)
            if (subCategory) {
              await subCategoryAPI.update(subCategoryId, {
                name: subCategory.name,
                category: formData.name
              })
            }
          } catch (error) {
            console.error(`Error linking sub-category ${subCategoryId}:`, error)
            toast({
              title: "Warning",
              description: `Failed to link sub-category`,
              variant: "destructive",
            })
          }
        }
        
        toast({
          title: "Success",
          description: `Category created and ${selectedSubCategories.length} sub-category(s) linked successfully`,
        })
      }

      onSuccess()
      onOpenChange(false)
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        image: "",
        isActive: true,
        showInCarousel: false,
        carouselOrder: 0,
        discountPercentage: 0,
        displaySection: 'none',
        sectionOrder: 0,
      })
      setSelectedSubCategories([])
      setExistingSubCategories([])
      
    } catch (error: unknown) {
      console.error('Error saving category:', error)
      toast({
        title: "Error",
        description: category ? "Failed to update category" : "Failed to create category",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Get available sub-categories (not already linked to this category)
  const getAvailableSubCategories = () => {
    if (!formData.name) {
      // If no category selected, show unique sub-categories without duplicates
      const uniqueSubCategories = allSubCategories.reduce((acc, sc) => {
        if (!acc.find(item => item.name === sc.name)) {
          acc.push(sc)
        }
        return acc
      }, [] as typeof allSubCategories)
      return uniqueSubCategories
    }
    // Show sub-categories that are from the same category or unassigned
    return allSubCategories.filter(sc => sc.category === formData.name || sc.category === '')
  }

  // Get selected sub-category details
  const getSelectedSubCategoryDetails = () => {
    return selectedSubCategories.map(id => 
      allSubCategories.find(sc => sc.id === id)
    ).filter(Boolean) as SubCategory[]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {category ? "Edit Category" : "Add New Category"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto flex-1 pr-2 pb-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Category Name *</Label>
              <select
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select category</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
              </select>
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

          {/* Sub-Categories Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Sub-Categories</h3>
            
            {/* Existing Sub-Categories */}
            {existingSubCategories.length > 0 && (
              <div className="space-y-2">
                <Label>Existing Sub-Categories</Label>
                <div className="space-y-2">
                  {existingSubCategories.map((subCat, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                      <span className="text-sm font-medium">{subCat.name}</span>
                      <span className="text-xs text-gray-500">Already linked</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Sub-Categories Dropdown */}
            <div className="space-y-3">
              <Label>Add Sub-Categories</Label>
              
              {/* Sub-Category Dropdown */}
              <div className="flex gap-2">
                <select
                  className="flex-1 p-2 border border-gray-300 rounded-md"
                  onChange={(e) => {
                    if (e.target.value) {
                      addSubCategory(e.target.value)
                      e.target.value = ""
                    }
                  }}
                >
                  <option value="">Select sub-category to add</option>
                  {getAvailableSubCategories().map((subCat) => (
                    <option key={subCat.id} value={subCat.id}>
                      {subCat.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  onClick={() => {
                    const select = document.querySelector('select') as HTMLSelectElement
                    if (select && select.value) {
                      addSubCategory(select.value)
                      select.value = ""
                    }
                  }}
                  disabled={getAvailableSubCategories().length === 0}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Selected Sub-Categories List */}
              {getSelectedSubCategoryDetails().length > 0 && (
                <div className="space-y-2">
                  <Label>Sub-Categories to be linked:</Label>
                  <div className="space-y-2">
                    {getSelectedSubCategoryDetails().map((subCat) => (
                      <div key={subCat.id} className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
                        <div>
                          <span className="text-sm font-medium">{subCat.name}</span>
                          <p className="text-xs text-gray-500">Will be linked to {formData.name || 'this category'}</p>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeSubCategory(subCat.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Images</h3>
            
            <div>
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
          <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 mt-6">
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