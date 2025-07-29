import { SubCategory } from "@/types/sub-category"

export const subCategoryAPI = {
  async getAll(): Promise<SubCategory[]> {
    const res = await fetch("/api/sub-categories")
    return res.json()
  },
  async create(data: Omit<SubCategory, "id">): Promise<SubCategory> {
    const res = await fetch("/api/sub-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return res.json()
  },
  async update(id: string, data: Omit<SubCategory, "id">): Promise<SubCategory> {
    const res = await fetch(`/api/sub-categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return res.json()
  },
  async delete(id: string): Promise<void> {
    await fetch(`/api/sub-categories/${id}`, { method: "DELETE" })
  },
}