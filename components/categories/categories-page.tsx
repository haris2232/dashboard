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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchCategories()
    fetchSubCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const categoriesData = await categoryAPI.getCategories()
      setCategories(categoriesData)
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
    try {
        const subs = await subCategoryAPI.getAll()
        setSubCategories(subs)
    } catch (error) {
        toast({
            title: "Error",
            description: "Failed to fetch sub-categories",
            variant: "destructive",
        })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !category) {
        toast({
            title: "Missing fields",
            description: "Please provide a name and select a parent category.",
            variant: "destructive",
        })
        return
    }

    try {
        if (editing) {
          await subCategoryAPI.update(editing.id, { name, category })
           toast({ title: "Success", description: "Sub-category updated." })
        } else {
          await subCategoryAPI.create({ name, category })
           toast({ title: "Success", description: "Sub-category created." })
        }
        setName("")
        setCategory("")
        setEditing(null)
        fetchSubCategories()
    } catch (error) {
         toast({
            title: "Error",
            description: "An error occurred while saving the sub-category.",
            variant: "destructive",
        })
    }
  }

  const handleEdit = (sc: SubCategory) => {
    setEditing(sc)
    setName(sc.name)
    setCategory(sc.category)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this sub-category?")) {
      await subCategoryAPI.delete(id)
      fetchSubCategories()
      toast({ title: "Success", description: "Sub-category deleted." })
    }
  }
  
  const handleCancelEdit = () => {
    setEditing(null)
    setName("")
    setCategory("")
  }

  const toggleCarouselDisplay = async (categoryId: string, showInCarousel: boolean) => {
    try {
      await categoryAPI.toggleCarouselDisplay(categoryId, {
        showInCarousel,
        carouselOrder: showInCarousel ? (categories.filter(c => c.showInCarousel).length + 1) : 0
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
    if (confirm("Are you sure you want to delete this category? This will not delete its sub-categories.")) {
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
    <div className="space-y-8">
      {/* Top Section for Categories */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Manage your main product categories.</p>
        </div>
        <Button onClick={() => {
          setSelectedCategory(null)
          setDialogOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Categories Grid */}
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
                    size="icon"
                    onClick={() => toggleCarouselDisplay(category._id, !category.showInCarousel)}
                    title={category.showInCarousel ? "Hide from carousel" : "Show in carousel"}
                  >
                    {category.showInCarousel ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Edit category"
                    onClick={() => {
                      setSelectedCategory(category)
                      setDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete category"
                    onClick={() => handleDeleteCategory(category._id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
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
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={category.isActive ? "default" : "secondary"}>
                    {category.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Carousel:</span>
                  <Badge variant={category.showInCarousel ? "default" : "secondary"}>
                    {category.showInCarousel ? "Shown" : "Hidden"}
                  </Badge>
                </div>
                {category.showInCarousel && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Order:</span>
                    <span className="text-sm font-medium">{category.carouselOrder ?? 'N/A'}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sub-Categories Section */}
      <Card>
        <CardHeader>
            <CardTitle>Sub-Categories</CardTitle>
            <CardDescription>Add, edit, or remove sub-categories and assign them to a fixed parent category.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit} className="mb-6 flex flex-col sm:flex-row items-center gap-2">
                <Input
                    placeholder="New or editing sub-category name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="flex-1"
                />
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="flex-1 w-full h-10 border border-input bg-background px-3 py-2 text-sm rounded-md"
                >
                    <option value="">Select parent category</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                </select>
                <Button type="submit">
                    {editing ? "Update Sub-Category" : "Add Sub-Category"}
                </Button>
                {editing && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                        Cancel
                    </Button>
                )}
            </form>

            <div className="space-y-2">
                {subCategories.length > 0 ? subCategories.map((sc) => (
                    <div key={sc.id} className="flex items-center justify-between p-2 rounded-md border">
                        <div>
                            <span className="font-medium">{sc.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">({sc.category})</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" title="Edit sub-category" onClick={() => handleEdit(sc)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Delete sub-category" className="text-destructive hover:text-destructive" onClick={() => handleDelete(sc.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )) : (
                    <p className="text-sm text-center text-muted-foreground">No sub-categories found.</p>
                )}
            </div>
        </CardContent>
      </Card>

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