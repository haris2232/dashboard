import { useEffect, useState } from "react"
import { subCategoryAPI } from "@/lib/subCategoryAPI"
import { categoryAPI } from "@/lib/api"
import { SubCategory } from "@/types/sub-category"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Plus, X } from "lucide-react"

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

export function SubCategoriesPage() {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [editing, setEditing] = useState<SubCategory | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchSubCategories()
    fetchCategories()
  }, [])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // Get unique categories (remove duplicates)
  const getUniqueCategories = () => {
    const uniqueNames = new Set<string>()
    const uniqueCategories: Category[] = []
    
    categories.forEach(cat => {
      if (!uniqueNames.has(cat.name)) {
        uniqueNames.add(cat.name)
        uniqueCategories.push(cat)
      }
    })
    
    return uniqueCategories.sort((a, b) => a.name.localeCompare(b.name))
  }

  const fetchSubCategories = async () => {
    try {
      setLoading(true)
      const data = await subCategoryAPI.getAll()
      setSubCategories(data)
    } catch (error) {
      console.error('Error fetching subcategories:', error)
      showMessage('error', 'Failed to load subcategories')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const categories = await categoryAPI.getCategories()
      setCategories(categories)
    } catch (error) {
      console.error('Error fetching categories:', error)
      showMessage('error', 'Failed to load categories')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !category.trim()) return

    try {
      setLoading(true)
      if (editing) {
        await subCategoryAPI.update(editing.id, { name: name.trim(), category: category.trim() })
        showMessage('success', 'Sub-category updated successfully!')
      } else {
        await subCategoryAPI.create({ name: name.trim(), category: category.trim() })
        showMessage('success', 'Sub-category created successfully!')
      }
      setName("")
      setCategory("")
      setEditing(null)
      await fetchSubCategories()
    } catch (error) {
      console.error('Error saving subcategory:', error)
      showMessage('error', 'Failed to save sub-category')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (sc: SubCategory) => {
    setEditing(sc)
    setName(sc.name)
    setCategory(sc.category)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this sub-category?")) return

    try {
      setLoading(true)
      await subCategoryAPI.delete(id)
      showMessage('success', 'Sub-category deleted successfully!')
      await fetchSubCategories()
    } catch (error) {
      console.error('Error deleting subcategory:', error)
      showMessage('error', 'Failed to delete sub-category')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditing(null)
    setName("")
    setCategory("")
  }

  const uniqueCategories = getUniqueCategories()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Sub-Categories Management</h1>
        <div className="text-sm text-gray-600">
          {subCategories.length} sub-categories
              </div>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">
          {editing ? "Edit Sub-Category" : "Add New Sub-Category"}
        </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sub-Category Name</label>
              <select
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
                disabled={loading}
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
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Parent Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
                disabled={loading}
              >
                <option value="">Select a parent category</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
              </select>
            </div>
            </div>
          <div className="flex gap-2">
            <button 
              type="submit" 
              disabled={loading || !name.trim() || !category.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : editing ? "Update" : "Add Sub-Category"}
            </button>
            {editing && (
              <button 
                type="button" 
                onClick={handleCancel} 
                disabled={loading}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
              </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">All Sub-Categories</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading sub-categories...</p>
              </div>
        ) : subCategories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No sub-categories found. Add your first sub-category above.</p>
            </div>
        ) : (
          <div className="space-y-3">
            {(() => {
              // Group sub-categories by name to avoid duplicates
              const groupedSubCategories = subCategories.reduce((acc, sc) => {
                if (!acc[sc.name]) {
                  acc[sc.name] = []
                }
                acc[sc.name].push(sc)
                return acc
              }, {} as Record<string, SubCategory[]>)

              return Object.entries(groupedSubCategories).map(([name, subCats]) => (
                <div key={name} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <h3 className="font-medium">{name}</h3>
                    <p className="text-sm text-gray-600">
                      Available for: {subCats.map(sc => sc.category).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(subCats[0])}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-700 px-3 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        // Delete all instances of this sub-category
                        subCats.forEach(sc => handleDelete(sc.id))
                      }}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            })()}
            </div>
        )}
            </div>
    </div>
  )
}