"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { customerAPI, orderAPI, type Customer, type Order } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { Search, Users, Mail, ShoppingBag, Eye, MessageSquare, Ban, CheckCircle } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerOrders, setCustomerOrders] = useState<Order[]>([])
  const [profileOpen, setProfileOpen] = useState(false)
  const [notes, setNotes] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const data = await customerAPI.getCustomers()
      setCustomers(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomerOrders = async (customerId: string) => {
    try {
      const orders = await orderAPI.getOrdersByCustomer(customerId)
      setCustomerOrders(orders)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch customer orders",
        variant: "destructive",
      })
    }
  }

  const toggleCustomerStatus = async (customerId: string, isBanned: boolean) => {
    try {
      await customerAPI.updateCustomer(customerId, { isBanned: !isBanned })
      toast({
        title: "Success",
        description: `Customer ${!isBanned ? "banned" : "unbanned"} successfully`,
      })
      fetchCustomers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update customer status",
        variant: "destructive",
      })
    }
  }

  const saveCustomerNotes = async (customerId: string, notes: string) => {
    try {
      await customerAPI.updateCustomer(customerId, { notes })
      toast({
        title: "Success",
        description: "Customer notes saved successfully",
      })
      fetchCustomers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save customer notes",
        variant: "destructive",
      })
    }
  }

  const viewCustomerProfile = async (customer: Customer) => {
    setSelectedCustomer(customer)
    setNotes(customer.notes || "")
    await fetchCustomerOrders(customer.id)
    setProfileOpen(true)
  }

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">View and manage your customer base.</p>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">{customer.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                    <CardDescription className="flex items-center">
                      <Mail className="h-3 w-3 mr-1" />
                      {customer.email}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={customer.isBanned ? "destructive" : "default"}>
                  {customer.isBanned ? "Banned" : "Active"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <ShoppingBag className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">Orders:</span>
                    <span className="ml-auto font-medium">{customer.totalOrders}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-muted-foreground">Spent:</span>
                    <span className="ml-auto font-medium">{formatCurrency(customer.totalSpent)}</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">Joined: {formatDate(customer.createdAt)}</div>

                {customer.notes && (
                  <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                    <MessageSquare className="h-3 w-3 inline mr-1" />
                    {customer.notes.substring(0, 50)}...
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    variant={customer.isBanned ? "default" : "destructive"}
                    size="sm"
                    onClick={() => toggleCustomerStatus(customer.id, customer.isBanned)}
                    className="flex-1"
                  >
                    {customer.isBanned ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Unban
                      </>
                    ) : (
                      <>
                        <Ban className="h-3 w-3 mr-1" />
                        Ban
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => viewCustomerProfile(customer)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
          <p className="text-gray-500">
            {searchQuery ? "Try adjusting your search terms" : "Customers will appear here when they register"}
          </p>
        </div>
      )}

      {/* Customer Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Profile - {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <div className="text-lg">{selectedCustomer.name}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <div className="text-lg">{selectedCustomer.email}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total Orders</label>
                    <div className="text-lg font-bold">{selectedCustomer.totalOrders}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total Spent</label>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(selectedCustomer.totalSpent)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div>
                      <Badge variant={selectedCustomer.isBanned ? "destructive" : "default"}>
                        {selectedCustomer.isBanned ? "Banned" : "Active"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                    <div className="text-lg">{formatDate(selectedCustomer.createdAt)}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Internal Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Internal Notes</CardTitle>
                  <CardDescription>Add private notes about this customer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Add internal notes about this customer..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                  <Button onClick={() => saveCustomerNotes(selectedCustomer.id, notes)} className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Save Notes
                  </Button>
                </CardContent>
              </Card>

              {/* Order History */}
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>{customerOrders.length} orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {customerOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">#{order.orderNumber}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(order.createdAt)} • {order.items?.length || 0} items
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(order.total)}</div>
                          <Badge variant="outline" className="text-xs">
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {customerOrders.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">No orders found for this customer</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
