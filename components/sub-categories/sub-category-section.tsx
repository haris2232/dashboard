import { useEffect, useState } from "react"
import { subCategoryAPI } from "@/lib/subCategoryAPI"
import { SubCategory } from "@/types/sub-category"

export function SubCategorySection() {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")

  useEffect(() => {
    fetchSubCategories()
  }, [])

  const fetchSubCategories = async () => {
    setSubCategories(await subCategoryAPI.getAll())
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !category) return
    await subCategoryAPI.create({ name, category })
    setName("")
    setCategory("")
    fetchSubCategories()
  }

  const handleDelete = async (id: string) => {
    if (confirm("Delete this sub-category?")) {
      await subCategoryAPI.delete(id)
      fetchSubCategories()
    }
  }

  return (
    <div className="mb-6 p-4 border rounded bg-gray-50">
      <h2 className="text-lg font-semibold mb-2">Sub-Categories</h2>
      <form onSubmit={handleAdd} className="flex gap-2 mb-3">
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
          Add
        </button>
      </form>
      <ul>
        {subCategories.map(sc => (
          <li key={sc.id} className="flex items-center gap-2 mb-1">
            <span>{sc.name} ({sc.category})</span>
            <button
              onClick={() => handleDelete(sc.id)}
              className="text-red-600 text-xs"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}