"use client"

import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Star,
  Tag,
  Gift,
  UserCog,
  Settings,
  LogOut,
  Image,
  Truck,
  Percent,
  Package2,
  FileText,
  Images,
} from "lucide-react"

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "customers", label: "Customers", icon: Users },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "categories", label: "Categories", icon: Tag },
  { id: "coupons", label: "Coupons", icon: Gift },
  { id: "homepage-images", label: "Homepage Images", icon: Image },
  { id: "sales-page", label: "Sales Page", icon: Percent },
  { id: "bundles", label: "Bundles", icon: Package2 },
  { id: "blogs", label: "Blogs", icon: FileText },
  { id: "images", label: "Images", icon: Images },
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "users", label: "Users", icon: UserCog },
  { id: "settings", label: "Settings", icon: Settings },
  
]

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const { user, logout } = useAuth()

  return (
    <div className="bg-white dark:bg-gray-800 w-64 min-h-screen shadow-lg">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Athetik Website</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {user?.name} ({user?.role})
        </p>
      </div>

      <nav className="mt-6">
        <div className="px-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  activeSection === item.id
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </button>
            )
          })}
        </div>

        <div className="mt-8 px-4">
          <button
            onClick={logout}
            className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </nav>
    </div>
  )
}
