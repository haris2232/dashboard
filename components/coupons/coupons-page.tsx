"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { couponAPI } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { CouponDialog } from "./coupon-dialog"

interface Coupon {
  _id: string
  code: string
  type: "flat" | "percentage"
  value: number
  minAmount?: number
  maxDiscount?: number
  usageLimit?: number
  usedCount: number
  expiresAt?: string
  isStackable: boolean
  applicableProducts?: string[]
  applicableCategories?: string[]
  isActive: boolean
  createdAt: string
}

export function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    try {
      console.log('🔍 Fetching coupons...')
      const coupons = await couponAPI.getCoupons()
      console.log('📊 Coupons fetched:', coupons)
      setCoupons(coupons)
    } catch (error) {
      console.error('❌ Error fetching coupons:', error)
      toast({
        title: "Error",
        description: "Failed to fetch coupons",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCoupon = async (couponId: string) => {
    if (confirm("Are you sure you want to delete this coupon?")) {
      try {
        await couponAPI.deleteCoupon(couponId)
        toast({
          title: "Success",
          description: "Coupon deleted successfully",
        })
        fetchCoupons()
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete coupon",
          variant: "destructive",
        })
      }
    }
  }

  const filteredCoupons = coupons?.filter((coupon) => coupon.code.toLowerCase().includes(searchQuery.toLowerCase())) || []

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
        <Button onClick={() => {
          setSelectedCoupon(null)
          setDialogOpen(true)
        }}>
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
        {filteredCoupons.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No coupons found. Create your first coupon!</p>
          </div>
        ) : (
          filteredCoupons.map((coupon) => (
                     <Card key={coupon._id}>
             <CardHeader>
               <div className="flex items-start justify-between">
                 <div>
                   <CardTitle className="text-lg font-mono">{coupon.code}</CardTitle>
                   <CardDescription>
                     {coupon.type === "percentage" ? `${coupon.value}% off` : `$${coupon.value} off`}
                   </CardDescription>
                 </div>
                 <div className="flex space-x-1">
                   <Button 
                     variant="ghost" 
                     size="sm"
                     onClick={() => {
                       setSelectedCoupon(coupon)
                       setDialogOpen(true)
                     }}
                   >
                     <Edit className="h-4 w-4" />
                   </Button>
                   <Button 
                     variant="ghost" 
                     size="sm"
                     onClick={() => handleDeleteCoupon(coupon._id)}
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </div>
               </div>
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
                 {coupon.minAmount && (
                   <div className="flex justify-between">
                     <span className="text-sm text-muted-foreground">Min Amount:</span>
                     <span className="text-sm">${coupon.minAmount}</span>
                   </div>
                 )}
                 {coupon.maxDiscount && (
                   <div className="flex justify-between">
                     <span className="text-sm text-muted-foreground">Max Discount:</span>
                     <span className="text-sm">${coupon.maxDiscount}</span>
                   </div>
                 )}
                 {coupon.expiresAt && (
                   <div className="flex justify-between">
                     <span className="text-sm text-muted-foreground">Expires:</span>
                     <span className="text-sm">{new Date(coupon.expiresAt).toLocaleDateString()}</span>
                   </div>
                 )}
                 <div className="flex justify-between">
                   <span className="text-sm text-muted-foreground">Stackable:</span>
                   <Badge variant={coupon.isStackable ? "default" : "secondary"}>
                     {coupon.isStackable ? "Yes" : "No"}
                   </Badge>
                 </div>
               </div>
             </CardContent>
           </Card>
         ))
       )}
     </div>

     {/* Coupon Dialog */}
     <CouponDialog
       open={dialogOpen}
       onOpenChange={setDialogOpen}
       coupon={selectedCoupon}
       onSuccess={fetchCoupons}
           />
    </div>
  )
}
