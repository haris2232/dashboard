"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { orderAPI, type Order } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { Search, Package, Eye, Truck, Download, Calendar, XCircle } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { useCurrency } from "@/lib/currency-context"

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const { toast } = useToast()
  const { formatPrice } = useCurrency()
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const data = await orderAPI.getOrders()
      setOrders(data)
    } catch (error) {
      console.error("Error fetching orders:", error);
      
      // Handle different error types
      if (error.status === 401 || error.message.includes("401")) {
        toast({
          title: "Authentication Error",
          description: "Please login again to continue",
          variant: "destructive",
        })
      } else if (error.status === 403 || error.message.includes("403")) {
        toast({
          title: "Permission Denied",
          description: "You don't have permission to view orders",
          variant: "destructive",
        })
      } else if (error.status === 500 || error.message.includes("500")) {
        toast({
          title: "Server Error",
          description: "Server error occurred. Please try again later",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch orders. Please try again",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const response = await orderAPI.updateOrderStatus(orderId, newStatus)
      
      // Check if email was sent
      if (response.emailSent) {
        toast({
          title: "Success",
          description: "Order status updated successfully and customer notified via email",
        })
      } else if (response.statusChanged) {
        toast({
          title: "Success",
          description: "Order status updated successfully",
        })
      } else {
        toast({
          title: "Info",
          description: "Order status unchanged",
        })
      }
      
      fetchOrders()
    } catch (error) {
      console.error("Error updating order status:", error);
      
      // Handle different error types
      if (error.status === 401 || error.message.includes("401")) {
        toast({
          title: "Authentication Error",
          description: "Please login again to continue",
          variant: "destructive",
        })
      } else if (error.status === 403 || error.message.includes("403")) {
        toast({
          title: "Permission Denied",
          description: "You don't have permission to update orders",
          variant: "destructive",
        })
      } else if (error.status === 404 || error.message.includes("404")) {
        toast({
          title: "Order Not Found",
          description: "The order you're trying to update doesn't exist",
          variant: "destructive",
        })
      } else if (error.status === 500 || error.message.includes("500")) {
        toast({
          title: "Server Error",
          description: "Server error occurred. Please try again later",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to update order status. Please try again",
          variant: "destructive",
        })
      }
    }
  }

  const assignTracking = async (orderId: string, trackingNumber: string, carrier: string) => {
    try {
      await orderAPI.assignTracking(orderId, trackingNumber, carrier)
      toast({
        title: "Success",
        description: "Tracking information assigned successfully",
      })
      fetchOrders()
    } catch (error) {
      console.error("Error assigning tracking:", error);
      
      // Handle different error types
      if (error.status === 401 || error.message.includes("401")) {
        toast({
          title: "Authentication Error",
          description: "Please login again to continue",
          variant: "destructive",
        })
      } else if (error.status === 403 || error.message.includes("403")) {
        toast({
          title: "Permission Denied",
          description: "You don't have permission to update tracking",
          variant: "destructive",
        })
      } else if (error.status === 404 || error.message.includes("404")) {
        toast({
          title: "Order Not Found",
          description: "The order you're trying to update doesn't exist",
          variant: "destructive",
        })
      } else if (error.status === 500 || error.message.includes("500")) {
        toast({
          title: "Server Error",
          description: "Server error occurred. Please try again later",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to assign tracking information. Please try again",
          variant: "destructive",
        })
      }
    }
  }

  const exportOrders = (period: 'selected' | 'week' | 'month' | 'custom' | 'all') => {
    let ordersToExport: Order[] = []
    const now = new Date()

    if (period === 'selected') {
      ordersToExport = orders.filter(o => selectedOrders.includes(o.id))
    } else if (period === 'week') {
      const lastWeek = new Date(now.setDate(now.getDate() - 7))
      ordersToExport = orders.filter(o => new Date(o.createdAt) >= lastWeek)
    } else if (period === 'month') {
      const lastMonth = new Date(now.setMonth(now.getMonth() - 1))
      ordersToExport = orders.filter(o => new Date(o.createdAt) >= lastMonth)
    } else if (period === 'custom') {
      ordersToExport = filteredOrders.filter(o => {
        const orderDate = new Date(o.createdAt)
        const matchesStartDate = !startDate || orderDate >= new Date(startDate)
        const matchesEndDate = !endDate || orderDate <= new Date(new Date(endDate).setHours(23, 59, 59, 999))
        return matchesStartDate && matchesEndDate
      })
    } else {
      ordersToExport = filteredOrders
    }

    if (ordersToExport.length === 0) {
      toast({
        title: "No Orders to Export",
        description: "There are no orders matching your selection.",
      })
      return
    }

    const csvContent = [
      ["Order Number", "Customer", "Email", "Total", "Status", "Date"].join(","),
      ...ordersToExport.map((order) =>
        [
          order.orderNumber,
          order.customer.name,
          order.customer.email,
          order.total.toString(),
          order.status,
          formatDate(order.createdAt),
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: `${ordersToExport.length} orders exported successfully`,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary"
      case "processing":
        return "default"
      case "shipped":
        return "outline"
      case "delivered":
        return "default"
      case "cancelled":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    const orderDate = new Date(order.createdAt)
    const matchesStartDate = !startDate || orderDate >= new Date(startDate)
    const matchesEndDate =
      !endDate || orderDate <= new Date(new Date(endDate).setHours(23, 59, 59, 999))

    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate
  })

  const handleSelectOrder = (orderId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedOrders((prev) => [...prev, orderId])
    } else {
      setSelectedOrders((prev) => prev.filter((id) => id !== orderId))
    }
  }

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedOrders(filteredOrders.map((o) => o.id))
    } else {
      setSelectedOrders([])
    }
  }

  const areAllVisibleSelected =
    filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length


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
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders and track their status.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedOrders.length > 0 && (
            <Button variant="outline" onClick={() => exportOrders('selected')}>
              <Download className="mr-2 h-4 w-4" />
              Export Selected ({selectedOrders.length})
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportOrders('all')}>Export Filtered List ({filteredOrders.length})</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportOrders('custom')}>Export Custom Date Range</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportOrders('week')}>Export Last 7 Days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportOrders('month')}>Export Last 30 Days</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Checkbox
          checked={areAllVisibleSelected}
          onCheckedChange={(checked) => handleSelectAll(!!checked)}
          aria-label="Select all orders on this page"
        />
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-auto"
            aria-label="Start date"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-auto"
            aria-label="End date"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const isSelected = selectedOrders.includes(order.id)
          return (
          <Card key={order.id} className={`transition-all ${isSelected ? "border-primary ring-2 ring-primary" : "hover:shadow-lg"}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleSelectOrder(order.id, !!checked)}
                    aria-label={`Select order ${order.orderNumber}`}
                    className="mt-1"
                  />
                  <div>
                    <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
                  </div>
                  <CardDescription className="flex items-center space-x-4 mt-1">
                    <span>{order.customer?.name}</span>
                    <span>•</span>
                    <span>{order.customer?.email}</span>
                    <span>•</span>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(order.createdAt)}
                    </div>
                  </CardDescription>
                </div>
                <div className="text-right space-y-2">
                  <div className="text-lg font-bold">{formatPrice(order.total)}</div>
                  <Badge variant={getStatusColor(order.status)}>{order.status}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Package className="h-4 w-4 mr-1" />
                    {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
                  </div>
                  {order.trackingNumber && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Truck className="h-4 w-4 mr-1" />
                      {order.carrier}: {order.trackingNumber}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Select
                    value={order.status}
                    onValueChange={(value) => updateOrderStatus(order.id, value as Order["status"])}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedOrder(order)
                      setDetailsOpen(true)
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          )
        })}
      </div>

      {filteredOrders.length === 0 && !loading && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search terms or filters"
              : "Orders will appear here when customers make purchases"}
          </p>
        </div>
      )}

      {/* Order Details Dialog */}
      <OrderDetailsDialog
        order={selectedOrder}
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false)
          setSelectedOrder(null)
        }}
        onTrackingAssign={assignTracking}
      />
    </div>
  )
}

interface OrderDetailsDialogProps {
  order: Order | null
  open: boolean
  onClose: () => void
  onTrackingAssign: (orderId: string, trackingNumber: string, carrier: string) => void
}

function OrderDetailsDialog({ order, open, onClose, onTrackingAssign }: OrderDetailsDialogProps) {
  const [trackingNumber, setTrackingNumber] = useState("")
  const [carrier, setCarrier] = useState("")
  const { formatPrice } = useCurrency()

  useEffect(() => {
    if (order) {
      setTrackingNumber(order.trackingNumber || "")
      setCarrier(order.carrier || "")
    }
  }, [order])

  if (!order) return null

  const handleTrackingSubmit = () => {
    if (trackingNumber && carrier) {
      onTrackingAssign(order.id, trackingNumber, carrier)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Order Details - #{order.orderNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span>{order.customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span>{order.customer.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Date:</span>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Status:</span>
                <span className={`font-semibold ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {order.paymentStatus?.toUpperCase() || 'PENDING'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {order.customer.address ? (
                <>
                  <p>{order.customer.address.street}</p>
                  <p>{order.customer.address.city}, {order.customer.address.state} {order.customer.address.zipCode}</p>
                  <p>{order.customer.address.country || 'United Arab Emirates'}</p>
                </>
              ) : (
                <p className="text-muted-foreground">No address provided.</p>
              )}
              <p><strong>Phone:</strong> {order.customer.phone}</p>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="font-medium">{item.product.title}</div>
                      {item.variant && (
                        <div className="text-sm text-muted-foreground">
                          {item.variant.size} / {item.variant.color?.name || 'N/A'}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        SKU: {item.variant?.sku || item.product.baseSku}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">Qty: {item.quantity}</div>
                      <div className="text-sm text-muted-foreground">{formatPrice(item.price)} each</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                                      <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shipping & Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Carrier</label>
                  <Select value={carrier} onValueChange={setCarrier}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPS">UPS</SelectItem>
                      <SelectItem value="FedEx">FedEx</SelectItem>
                      <SelectItem value="USPS">USPS</SelectItem>
                      <SelectItem value="DHL">DHL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Tracking Number</label>
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                  />
                </div>
              </div>
              <Button onClick={handleTrackingSubmit} className="w-full">
                <Truck className="mr-2 h-4 w-4" />
                Update Tracking Information
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
