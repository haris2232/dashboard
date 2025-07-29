import { NextApiRequest, NextApiResponse } from "next"

let subCategories: SubCategory[] = [] // Replace with DB in production

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    res.status(200).json(subCategories)
  } else if (req.method === "POST") {
    const { name, category } = req.body
    const newSubCategory = { id: Date.now().toString(), name, category }
    subCategories.push(newSubCategory)
    res.status(201).json(newSubCategory)
  } else {
    res.status(405).end()
  }
}