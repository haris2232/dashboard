"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { couponAPI } from "@/lib/api"

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

interface CouponDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  coupon?: Coupon | null
  onSuccess: () => void
}

export function CouponDialog({ open, onOpenChange, coupon, onSuccess }: CouponDialogProps) {
  const [formData, setFormData] = useState({
    code: coupon?.code || "",
    type: coupon?.type || "percentage",
    value: coupon?.value || 0,
    minAmount: coupon?.minAmount || 0,
    maxDiscount: coupon?.maxDiscount || 0,
    usageLimit: coupon?.usageLimit || 0,
    expiresAt: coupon?.expiresAt ? coupon.expiresAt.split('T')[0] : "",
    isStackable: coupon?.isStackable ?? false,
    isActive: coupon?.isActive ?? true,
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const submitData = {
        ...formData,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
        minAmount: formData.minAmount || undefined,
        maxDiscount: formData.maxDiscount || undefined,
        usageLimit: formData.usageLimit || undefined,
      }

      if (coupon) {
        await couponAPI.updateCoupon(coupon._id, submitData)
        toast({
          title: "Success",
          description: "Coupon updated successfully",
        })
      } else {
        await couponAPI.createCoupon(submitData)
        toast({
          title: "Success",
          description: "Coupon created successfully",
        })
      }
      onSuccess()
      onOpenChange(false)
      setFormData({
        code: "",
        type: "percentage",
        value: 0,
        minAmount: 0,
        maxDiscount: 0,
        usageLimit: 0,
        expiresAt: "",
        isStackable: false,
        isActive: true,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: coupon ? "Failed to update coupon" : "Failed to create coupon",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {coupon ? "Edit Coupon" : "Add New Coupon"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="code">Coupon Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="Enter coupon code"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Discount Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "flat" | "percentage") => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="flat">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="value">Discount Value *</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  placeholder={formData.type === "percentage" ? "10" : "20"}
                  min="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Conditions</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minAmount">Minimum Order Amount</Label>
                <Input
                  id="minAmount"
                  type="number"
                  value={formData.minAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, minAmount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  min="0"
                />
              </div>

              {formData.type === "percentage" && (
                <div>
                  <Label htmlFor="maxDiscount">Maximum Discount</Label>
                  <Input
                    id="maxDiscount"
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxDiscount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                    min="0"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="usageLimit">Usage Limit</Label>
              <Input
                id="usageLimit"
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, usageLimit: parseInt(e.target.value) || 0 }))}
                placeholder="0 (unlimited)"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="expiresAt">Expiry Date</Label>
              <Input
                id="expiresAt"
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
              />
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Settings</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isActive">Active Status</Label>
                <p className="text-sm text-gray-500">Enable this coupon</p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isStackable">Stackable</Label>
                <p className="text-sm text-gray-500">Can be used with other coupons</p>
              </div>
              <Switch
                id="isStackable"
                checked={formData.isStackable}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isStackable: checked }))}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : (coupon ? "Update Coupon" : "Create Coupon")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 