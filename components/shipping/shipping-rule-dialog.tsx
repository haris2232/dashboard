"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { shippingAPI } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

const shippingRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  region: z.string().min(1, "Region is required"),
  minWeight: z.string().optional(),
  maxWeight: z.string().optional(),
  minOrderAmount: z.string().optional(),
  maxOrderAmount: z.string().optional(),
  shippingCost: z.string().min(1, "Shipping cost is required"),
  freeShippingAt: z.string().optional(),
  deliveryDays: z.string().min(1, "Delivery days is required"),
  isActive: z.boolean(),
  priority: z.string().optional(),
})

interface ShippingRule {
  _id: string
  name: string
  region: string
  minWeight: number
  maxWeight: number
  minOrderAmount: number
  maxOrderAmount: number
  shippingCost: number
  freeShippingAt: number
  deliveryDays: number
  isActive: boolean
  priority: number
}

interface ShippingRuleDialogProps {
  open: boolean
  onClose: () => void
  onSave: () => void
  rule: ShippingRule | null
}

export function ShippingRuleDialog({ open, onClose, onSave, rule }: ShippingRuleDialogProps) {
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof shippingRuleSchema>>({
    resolver: zodResolver(shippingRuleSchema),
    defaultValues: {
      name: "",
      region: "",
      minWeight: "",
      maxWeight: "",
      minOrderAmount: "",
      maxOrderAmount: "",
      shippingCost: "",
      freeShippingAt: "",
      deliveryDays: "3",
      isActive: true,
      priority: "1",
    },
  })

  useEffect(() => {
    if (open) {
      if (rule) {
        // Edit mode
        form.reset({
          name: rule.name,
          region: rule.region,
          minWeight: rule.minWeight?.toString() || "",
          maxWeight: rule.maxWeight?.toString() || "",
          minOrderAmount: rule.minOrderAmount?.toString() || "",
          maxOrderAmount: rule.maxOrderAmount?.toString() || "",
          shippingCost: rule.shippingCost?.toString() || "",
          freeShippingAt: rule.freeShippingAt?.toString() || "",
          deliveryDays: rule.deliveryDays?.toString() || "3",
          isActive: rule.isActive,
          priority: rule.priority?.toString() || "1",
        })
      } else {
        // Create mode
        form.reset({
          name: "",
          region: "",
          minWeight: "",
          maxWeight: "",
          minOrderAmount: "",
          maxOrderAmount: "",
          shippingCost: "",
          freeShippingAt: "",
          deliveryDays: "3",
          isActive: true,
          priority: "1",
        })
      }
    }
  }, [open, rule, form])

  const onSubmit = async (values: z.infer<typeof shippingRuleSchema>) => {
    try {
      setSaving(true)
      
      // Convert string values to numbers with proper handling
      const ruleData = {
        ...values,
        minWeight: values.minWeight ? parseFloat(values.minWeight) : 0,
        maxWeight: values.maxWeight ? parseFloat(values.maxWeight) : 100,
        minOrderAmount: values.minOrderAmount ? parseFloat(values.minOrderAmount) : 0,
        maxOrderAmount: values.maxOrderAmount ? parseFloat(values.maxOrderAmount) : 10000,
        shippingCost: values.shippingCost ? parseFloat(values.shippingCost) : 0,
        freeShippingAt: values.freeShippingAt ? parseFloat(values.freeShippingAt) : 0, // Aap jo bhi amount dalenge wahi save hoga
        deliveryDays: values.deliveryDays ? parseInt(values.deliveryDays) : 3,
        priority: values.priority ? parseInt(values.priority) : 1,
      }

      console.log('Saving shipping rule:', ruleData)

      if (rule) {
        await shippingAPI.updateShippingRule(rule._id, ruleData)
        toast({
          title: "Success",
          description: "Shipping rule updated successfully",
        })
      } else {
        await shippingAPI.createShippingRule(ruleData)
        toast({
          title: "Success",
          description: "Shipping rule created successfully",
        })
      }

      onSave()
      onClose()
    } catch (error) {
      console.error("Error saving shipping rule:", error)
      toast({
        title: "Error",
        description: "Failed to save shipping rule",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {rule ? "Edit Shipping Rule" : "Create Shipping Rule"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Standard Shipping" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="US">United Arab Emirates</SelectItem>
                        <SelectItem value="UAE">United States</SelectItem>
                        <SelectItem value="INTL">International</SelectItem>
                        <SelectItem value="EU">Europe</SelectItem>
                        <SelectItem value="ASIA">Asia</SelectItem>
                        <SelectItem value="GLOBAL">Global</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Weight (lbs)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxWeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Weight (lbs)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minOrderAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Order Amount (AED)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxOrderAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Order Amount (AED)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="10000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="shippingCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping Cost (AED)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="20.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="freeShippingAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Free Shipping At (AED)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="230" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Enter amount for free shipping (230, 240, 250, etc.)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deliveryDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Days</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1" {...field} />
                    </FormControl>
                    <FormDescription>Lower number = higher priority</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Rule</FormLabel>
                      <FormDescription>Enable this shipping rule</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : rule ? "Update Rule" : "Create Rule"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}