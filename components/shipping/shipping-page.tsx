"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { shippingAPI } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Truck, MapPin, DollarSign } from "lucide-react"

const shippingRuleSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  region: z.string().min(1, "Region is required"),
  minWeight: z.string().optional(),
  maxWeight: z.string().optional(),
  minAmount: z.string().optional(),
  maxAmount: z.string().optional(),
  shippingCost: z.string().min(1, "Shipping cost is required"),
  freeShippingThreshold: z.string().optional(),
  estimatedDays: z.string().min(1, "Estimated delivery days is required"),
  isActive: z.boolean(),
})

const generalSettingsSchema = z.object({
  freeShippingThreshold: z.string().min(1, "Free shipping threshold is required"),
  freeGiftThreshold: z.string().min(1, "Free gift threshold is required"),
  defaultShippingCost: z.string().min(1, "Default shipping cost is required"),
  enableFreeShipping: z.boolean(),
  enableFreeGift: z.boolean(),
  freeGiftProduct: z.string().optional(),
})

interface ShippingRule {
  id: string
  name: string
  region: string
  minWeight?: number
  maxWeight?: number
  minAmount?: number
  maxAmount?: number
  shippingCost: number
  freeShippingThreshold?: number
  estimatedDays: number
  isActive: boolean
  createdAt: string
}

interface ShippingSettings {
  freeShippingThreshold: number
  freeGiftThreshold: number
  defaultShippingCost: number
  enableFreeShipping: boolean
  enableFreeGift: boolean
  freeGiftProduct?: string
}

export function ShippingPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [shippingRules, setShippingRules] = useState<ShippingRule[]>([])
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings | null>(null)
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<ShippingRule | null>(null)
  const { toast } = useToast()

  const settingsForm = useForm<z.infer<typeof generalSettingsSchema>>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      freeShippingThreshold: "50",
      freeGiftThreshold: "100",
      defaultShippingCost: "9.99",
      enableFreeShipping: true,
      enableFreeGift: true,
      freeGiftProduct: "",
    },
  })

  const ruleForm = useForm<z.infer<typeof shippingRuleSchema>>({
    resolver: zodResolver(shippingRuleSchema),
    defaultValues: {
      name: "",
      region: "",
      minWeight: "",
      maxWeight: "",
      minAmount: "",
      maxAmount: "",
      shippingCost: "",
      freeShippingThreshold: "",
      estimatedDays: "3",
      isActive: true,
    },
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [rulesResponse, settingsResponse] = await Promise.all([
        shippingAPI.getShippingRules(),
        shippingAPI.getShippingSettings(),
      ])

      setShippingRules(rulesResponse.data)
      setShippingSettings(settingsResponse.data)

      // Update form with settings
      if (settingsResponse.data) {
        settingsForm.reset({
          freeShippingThreshold: settingsResponse.data.freeShippingThreshold.toString(),
          freeGiftThreshold: settingsResponse.data.freeGiftThreshold.toString(),
          defaultShippingCost: settingsResponse.data.defaultShippingCost.toString(),
          enableFreeShipping: settingsResponse.data.enableFreeShipping,
          enableFreeGift: settingsResponse.data.enableFreeGift,
          freeGiftProduct: settingsResponse.data.freeGiftProduct || "",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch shipping data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const onSettingsSubmit = async (values: z.infer<typeof generalSettingsSchema>) => {
    try {
      setSaving(true)
      const settingsData = {
        ...values,
        freeShippingThreshold: Number.parseFloat(values.freeShippingThreshold),
        freeGiftThreshold: Number.parseFloat(values.freeGiftThreshold),
        defaultShippingCost: Number.parseFloat(values.defaultShippingCost),
      }

      await shippingAPI.updateShippingSettings(settingsData)
      toast({
        title: "Success",
        description: "Shipping settings updated successfully",
      })
      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update shipping settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const onRuleSubmit = async (values: z.infer<typeof shippingRuleSchema>) => {
    try {
      setSaving(true)
      const ruleData = {
        ...values,
        minWeight: values.minWeight ? Number.parseFloat(values.minWeight) : undefined,
        maxWeight: values.maxWeight ? Number.parseFloat(values.maxWeight) : undefined,
        minAmount: values.minAmount ? Number.parseFloat(values.minAmount) : undefined,
        maxAmount: values.maxAmount ? Number.parseFloat(values.maxAmount) : undefined,
        shippingCost: Number.parseFloat(values.shippingCost),
        freeShippingThreshold: values.freeShippingThreshold
          ? Number.parseFloat(values.freeShippingThreshold)
          : undefined,
        estimatedDays: Number.parseInt(values.estimatedDays),
      }

      if (editingRule) {
        await shippingAPI.updateShippingRule(editingRule.id, ruleData)
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

      setRuleDialogOpen(false)
      setEditingRule(null)
      ruleForm.reset()
      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save shipping rule",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const deleteRule = async (ruleId: string) => {
    try {
      await shippingAPI.deleteShippingRule(ruleId)
      toast({
        title: "Success",
        description: "Shipping rule deleted successfully",
      })
      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete shipping rule",
        variant: "destructive",
      })
    }
  }

  const openRuleDialog = (rule?: ShippingRule) => {
    if (rule) {
      setEditingRule(rule)
      ruleForm.reset({
        name: rule.name,
        region: rule.region,
        minWeight: rule.minWeight?.toString() || "",
        maxWeight: rule.maxWeight?.toString() || "",
        minAmount: rule.minAmount?.toString() || "",
        maxAmount: rule.maxAmount?.toString() || "",
        shippingCost: rule.shippingCost.toString(),
        freeShippingThreshold: rule.freeShippingThreshold?.toString() || "",
        estimatedDays: rule.estimatedDays.toString(),
        isActive: rule.isActive,
      })
    } else {
      setEditingRule(null)
      ruleForm.reset()
    }
    setRuleDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shipping Management</h1>
          <p className="text-muted-foreground">Configure shipping rules, rates, and free shipping thresholds.</p>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">General Settings</TabsTrigger>
          <TabsTrigger value="rules">Shipping Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="mr-2 h-5 w-5" />
                Free Shipping & Gifts
              </CardTitle>
              <CardDescription>Configure free shipping thresholds and free gift promotions</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={settingsForm.control}
                      name="enableFreeShipping"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable Free Shipping</FormLabel>
                            <FormDescription>Offer free shipping above a certain order amount</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="enableFreeGift"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable Free Gift</FormLabel>
                            <FormDescription>Offer a free gift above a certain order amount</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={settingsForm.control}
                      name="freeShippingThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Free Shipping Threshold ($)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="50.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="freeGiftThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Free Gift Threshold ($)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="100.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="defaultShippingCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Shipping Cost ($)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="9.99" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={settingsForm.control}
                    name="freeGiftProduct"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Free Gift Product</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name or ID for free gift" {...field} />
                        </FormControl>
                        <FormDescription>Product to give as a free gift when threshold is met</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Settings"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Shipping Rules</h3>
              <p className="text-sm text-muted-foreground">Create region-specific shipping rules and rates</p>
            </div>
            <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openRuleDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingRule ? "Edit Shipping Rule" : "Create Shipping Rule"}</DialogTitle>
                </DialogHeader>

                <Form {...ruleForm}>
                  <form onSubmit={ruleForm.handleSubmit(onRuleSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={ruleForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rule Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., US Standard Shipping" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={ruleForm.control}
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
                                <SelectItem value="US">United States</SelectItem>
                                <SelectItem value="CA">Canada</SelectItem>
                                <SelectItem value="EU">Europe</SelectItem>
                                <SelectItem value="UK">United Kingdom</SelectItem>
                                <SelectItem value="AU">Australia</SelectItem>
                                <SelectItem value="INTL">International</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={ruleForm.control}
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
                        control={ruleForm.control}
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
                        control={ruleForm.control}
                        name="minAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Min Order Amount ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={ruleForm.control}
                        name="maxAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Order Amount ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="100" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={ruleForm.control}
                        name="shippingCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Shipping Cost ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="9.99" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={ruleForm.control}
                        name="freeShippingThreshold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Free Shipping At ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="50" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={ruleForm.control}
                        name="estimatedDays"
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

                    <FormField
                      control={ruleForm.control}
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

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setRuleDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={saving}>
                        {saving ? "Saving..." : editingRule ? "Update Rule" : "Create Rule"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {shippingRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Truck className="mr-2 h-4 w-4" />
                        {rule.name}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin className="mr-1 h-3 w-3" />
                        {rule.region} • {rule.estimatedDays} days delivery
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={rule.isActive ? "default" : "secondary"}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => openRuleDialog(rule)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => deleteRule(rule.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Shipping Cost:</span>
                      <div className="font-medium">${rule.shippingCost.toFixed(2)}</div>
                    </div>
                    {rule.freeShippingThreshold && (
                      <div>
                        <span className="text-muted-foreground">Free Shipping At:</span>
                        <div className="font-medium">${rule.freeShippingThreshold.toFixed(2)}</div>
                      </div>
                    )}
                    {rule.minWeight && rule.maxWeight && (
                      <div>
                        <span className="text-muted-foreground">Weight Range:</span>
                        <div className="font-medium">
                          {rule.minWeight} - {rule.maxWeight} lbs
                        </div>
                      </div>
                    )}
                    {rule.minAmount && rule.maxAmount && (
                      <div>
                        <span className="text-muted-foreground">Order Range:</span>
                        <div className="font-medium">
                          ${rule.minAmount} - ${rule.maxAmount}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {shippingRules.length === 0 && (
              <div className="text-center py-12">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No shipping rules found</h3>
                <p className="text-gray-500">Create your first shipping rule to get started</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
