import { useEffect, useState } from "react"
import { subCategoryAPI } from "@/lib/subCategoryAPI"
import { SubCategory } from "@/types/sub-category"

export function SubCategoriesPage() {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [editing, setEditing] = useState<SubCategory | null>(null)

  useEffect(() => {
    fetchSubCategories()
  }, [])

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Sub-Categories</h1>
      <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Sub-category name"
          className="border px-2 py-1 rounded"
          required
        />
        <input
          value={category}
          onChange={e => setCategory(e.target.value)}
          placeholder="Parent category"
          className="border px-2 py-1 rounded"
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded">
          {editing ? "Update" : "Add"}
        </button>
        {editing && (
          <button type="button" onClick={() => { setEditing(null); setName(""); setCategory(""); }} className="ml-2">
            Cancel
          </button>
        )}
      </form>
      <ul>
        {subCategories.map(sc => (
          <li key={sc.id} className="flex items-center gap-2 mb-2">
            <span>{sc.name} ({sc.category})</span>
            <button onClick={() => handleEdit(sc)} className="text-blue-600">Edit</button>
            <button onClick={() => handleDelete(sc.id)} className="text-red-600">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}