"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { categoryAPI } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Search, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { subCategoryAPI } from "@/lib/subCategoryAPI"
import { SubCategory } from "@/types/sub-category"
import { CategoryDialog } from "./category-dialog"

interface Category {
  _id: string
  name: string
  description?: string
  image?: string
  isActive: boolean
  showInCarousel?: boolean
  carouselOrder?: number
  carouselImage?: string
  discountPercentage?: number
  displaySection?: string
  sectionOrder?: number
  createdAt: string
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [editing, setEditing] = useState<SubCategory | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchCategories()
    fetchSubCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const categories = await categoryAPI.getCategories()
      setCategories(categories)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSubCategories = async () => {
    setSubCategories(await subCategoryAPI.getAll())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      await subCategoryAPI.update(editing.id, { name, category })
    } else {
      await subCategoryAPI.create({ name, category })
    }
    setName("")
    setCategory("")
    setEditing(null)
    fetchSubCategories()
  }

  const handleEdit = (sc: SubCategory) => {
    setEditing(sc)
    setName(sc.name)
    setCategory(sc.category)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Delete this sub-category?")) {
      await subCategoryAPI.delete(id)
      fetchSubCategories()
    }
  }

  const toggleCarouselDisplay = async (categoryId: string, showInCarousel: boolean) => {
    try {
      await categoryAPI.toggleCarouselDisplay(categoryId, {
        showInCarousel,
        carouselOrder: showInCarousel ? (categories.length + 1) : 0
      })
        toast({
          title: "Success",
        description: `Category ${showInCarousel ? 'added to' : 'removed from'} carousel`,
        })
        fetchCategories()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update carousel display",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await categoryAPI.deleteCategory(categoryId)
        toast({
          title: "Success",
          description: "Category deleted successfully",
        })
        fetchCategories()
    } catch (error) {
      toast({
        title: "Error",
          description: "Failed to delete category",
          variant: "destructive",
        })
      }
    }
  }

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Organize your products into categories.</p>
        </div>
        <Button onClick={() => {
          setSelectedCategory(null)
          setDialogOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCategories.map((category) => (
          <Card key={category._id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  {category.description && <CardDescription>{category.description}</CardDescription>}
                </div>
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => toggleCarouselDisplay(category._id, !category.showInCarousel)}
                    title={category.showInCarousel ? "Hide from carousel" : "Show in carousel"}
                  >
                    {category.showInCarousel ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(category)
                      setDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCategory(category._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
                {/* Category Image */}
                {category.image && (
                <div className="mb-4">
                    <img 
                      src={category.image} 
                      alt={category.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  </div>
                )}
                
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={category.isActive ? "default" : "secondary"}>
                    {category.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Carousel:</span>
                  <Badge variant={category.showInCarousel ? "default" : "secondary"}>
                    {category.showInCarousel ? "Shown" : "Hidden"}
                    </Badge>
                </div>
                {category.showInCarousel && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Order:</span>
                    <span className="text-sm font-medium">{category.carouselOrder || 0}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Categories & Sub-Categories</h1>
        <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
          <select
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border px-2 py-1 rounded"
            required
          >
            <option value="">Select sub-category</option>
            <option value="T-Shirts">T-Shirts</option>
            <option value="Shorts">Shorts</option>
            <option value="Trousers">Trousers</option>
            <option value="Twinsets">Twinsets</option>
            <option value="Tanks">Tanks</option>
            <option value="Leggings">Leggings</option>
            <option value="Tank Tops">Tank Tops</option>
            <option value="Sports Bras">Sports Bras</option>
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border px-2 py-1 rounded"
            required
          >
            <option value="">Select parent category</option>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
          </select>
          <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">
            {editing ? "Update" : "Add"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null)
                setName("")
                setCategory("")
              }}
              className="ml-2"
            >
              Cancel
            </button>
          )}
        </form>
        <ul>
          {subCategories.map((sc) => (
            <li key={sc.id} className="flex items-center gap-2 mb-2">
              <span>
                {sc.name} ({sc.category})
              </span>
              <button onClick={() => handleEdit(sc)} className="text-blue-600">
                Edit
              </button>
              <button onClick={() => handleDelete(sc.id)} className="text-red-600">
                Delete
              </button>
            </li>
          ))}
        </ul>
        </div>

      {/* Category Dialog */}
      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={selectedCategory}
        onSuccess={fetchCategories}
      />
    </div>
  )
}
