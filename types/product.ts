export interface Product {
  id: string
  title: string
  baseSku: string
  category: string
  subCategory?: string // <-- Add this line
  // ...other fields...
}