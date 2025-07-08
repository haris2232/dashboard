"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { couponAPI } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Search } from "lucide-react"

interface Coupon {
  _id: string
  code: string
  type: "flat" | "percentage"
  value: number
  usedCount: number
  usageLimit?: number
  isActive: boolean
  expiresAt?: string
}

export function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    try {
      const response = await couponAPI.getCoupons()
      setCoupons(response.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch coupons",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredCoupons = coupons.filter((coupon) => coupon.code.toLowerCase().includes(searchQuery.toLowerCase()))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">Create and manage discount coupons.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Coupon
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search coupons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCoupons.map((coupon) => (
          <Card key={coupon._id}>
            <CardHeader>
              <CardTitle className="text-lg font-mono">{coupon.code}</CardTitle>
              <CardDescription>
                {coupon.type === "percentage" ? `${coupon.value}% off` : `$${coupon.value} off`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Used:</span>
                  <span className="font-medium">
                    {coupon.usedCount}/{coupon.usageLimit || "∞"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={coupon.isActive ? "default" : "secondary"}>
                    {coupon.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {coupon.expiresAt && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Expires:</span>
                    <span className="text-sm">{new Date(coupon.expiresAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
