"use client"

import { DashboardOverview } from "@/components/dashboard/overview"
import { ProductsPage } from "@/components/products/products-page"
import { OrdersPage } from "@/components/orders/orders-page"
import { CustomersPage } from "@/components/customers/customers-page"
import { ReviewsPage } from "@/components/reviews/reviews-page"
import { CategoriesPage } from "@/components/categories/categories-page"
import { CouponsPage } from "@/components/coupons/coupons-page"
import { BundlesPage } from "@/components/bundles/bundles-page"
import { ShippingPage } from "@/components/shipping/shipping-page"
import { UsersPage } from "@/components/users/users-page"
import { SettingsPage } from "@/components/settings/settings-page"
import { HomepageImagesSection } from "@/components/homepage-images-section"
import { SalesPageSection } from "@/components/sales-page-section" // This path is now correct.

interface DashboardContentProps {
  activeSection: string
}

export function DashboardContent({ activeSection }: DashboardContentProps) {
  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardOverview />
      case "products":
        return <ProductsPage />
      case "orders":
        return <OrdersPage />
      case "customers":
        return <CustomersPage />
      case "reviews":
        return <ReviewsPage />
      case "categories":
        return <CategoriesPage />
      case "coupons":
        return <CouponsPage />
      case "bundles":
        return <BundlesPage />
      case "homepage-images":
        return <HomepageImagesSection />
      case "sales-page":
        return <SalesPageSection />
      case "shipping":
        return <ShippingPage />
      case "users":
        return <UsersPage />
      case "settings":
        return <SettingsPage />
      default:
        return <DashboardOverview />
    }
  }

  return <div className="h-full">{renderContent()}</div>
}
