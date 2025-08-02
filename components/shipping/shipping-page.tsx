"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Truck } from "lucide-react"
import { shippingAPI } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { ShippingRuleDialog } from "./shipping-rule-dialog"

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
  createdAt: string
}

export function ShippingPage() {
  const [rules, setRules] = useState<ShippingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<ShippingRule | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadShippingRules()
  }, [])

  const loadShippingRules = async () => {
    try {
      setLoading(true)
      const response = await shippingAPI.getShippingRules()
      setRules(response.data || [])
    } catch (error) {
      console.error("Error loading shipping rules:", error)
      toast({
        title: "Error",
        description: "Failed to load shipping rules",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRule = () => {
    setEditingRule(null)
    setDialogOpen(true)
  }

  const handleEditRule = (rule: ShippingRule) => {
    setEditingRule(rule)
    setDialogOpen(true)
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this shipping rule?")) {
      return
    }

    try {
      await shippingAPI.deleteShippingRule(ruleId)
      toast({
        title: "Success",
        description: "Shipping rule deleted successfully",
      })
      loadShippingRules()
    } catch (error) {
      console.error("Error deleting shipping rule:", error)
      toast({
        title: "Error",
        description: "Failed to delete shipping rule",
        variant: "destructive",
      })
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
      setEditingRule(null)
  }

  const handleDialogSave = async () => {
    await loadShippingRules()
    handleDialogClose()
  }

  const getRegionColor = (region: string) => {
    const colors: { [key: string]: string } = {
      US: "bg-blue-100 text-blue-800",
      INTL: "bg-purple-100 text-purple-800",
      EU: "bg-green-100 text-green-800",
      ASIA: "bg-orange-100 text-orange-800",
      GLOBAL: "bg-gray-100 text-gray-800",
    }
    return colors[region] || "bg-gray-100 text-gray-800"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading shipping rules...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Shipping Management</h1>
          <p className="text-gray-600 mt-2">
            Configure shipping rules, rates, and free shipping thresholds.
          </p>
        </div>
        <Button onClick={handleCreateRule}>
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </Button>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Shipping Rules</TabsTrigger>
          <TabsTrigger value="settings">General Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Rules</CardTitle>
              <CardDescription>
                Create region-specific shipping rules and rates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No shipping rules configured
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create your first shipping rule to get started.
                  </p>
                  <Button onClick={handleCreateRule}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Rule
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <div
                      key={rule._id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
          <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Truck className="w-5 h-5 text-gray-500" />
            <div>
                            <h3 className="font-medium">{rule.name}</h3>
                            <p className="text-sm text-gray-600">
                              {rule.region} • {rule.deliveryDays} days delivery
                            </p>
                          </div>
                    </div>
                    <div className="flex items-center space-x-2">
                          <Badge
                            variant={rule.isActive ? "default" : "secondary"}
                          >
                        {rule.isActive ? "Active" : "Inactive"}
                      </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRule(rule)}
                          >
                            <Edit className="w-4 h-4" />
                      </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRule(rule._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                          <span className="text-gray-600">Shipping Cost:</span>
                          <p className="font-medium">${rule.shippingCost}</p>
                    </div>
                      <div>
                          <span className="text-gray-600">Free Shipping At:</span>
                          <p className="font-medium">${rule.freeShippingAt}</p>
                      </div>
                      <div>
                          <span className="text-gray-600">Order Range:</span>
                          <p className="font-medium">
                            ${rule.minOrderAmount} - ${rule.maxOrderAmount}
                          </p>
                        </div>
                      <div>
                          <span className="text-gray-600">Weight Range:</span>
                          <p className="font-medium">
                            {rule.minWeight} - {rule.maxWeight} lbs
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                      </div>
                    )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure default shipping settings and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Default Settings</h3>
                  <p className="text-sm text-gray-600">
                    These settings apply when no specific shipping rule matches.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Default Shipping Cost
                    </label>
                    <p className="text-sm text-gray-600">$20.00</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Default Free Shipping Threshold
                    </label>
                    <p className="text-sm text-gray-600">$500.00</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ShippingRuleDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSave={handleDialogSave}
        rule={editingRule}
      />
    </div>
  )
}
