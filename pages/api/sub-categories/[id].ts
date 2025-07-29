import { NextApiRequest, NextApiResponse } from "next"

let subCategories: SubCategory[] = [] // Replace with DB in production

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (req.method === "PUT") {
    const { name, category } = req.body
    const idx = subCategories.findIndex((sc) => sc.id === id)
    if (idx === -1) return res.status(404).end()
    subCategories[idx] = { ...subCategories[idx], name, category }
    res.status(200).json(subCategories[idx])
  } else if (req.method === "DELETE") {
    subCategories = subCategories.filter((sc) => sc.id !== id)
    res.status(204).end()
  } else {
    res.status(405).end()
  }
}