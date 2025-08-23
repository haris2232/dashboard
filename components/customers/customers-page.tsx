"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { customerAPI } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { Search, Edit, Trash2, Ban, UserCheck } from "lucide-react"

interface Customer {
  _id: string
  name: string
  email: string
  totalOrders: number
  totalSpent: number
  isActive: boolean
  isBanned: boolean
  isEmailVerified: boolean
  createdAt: string
}

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [fromDate, setFromDate] = useState<string>("")
  const [toDate, setToDate] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getCustomers()
      setCustomers(response.data)
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

  const handleBanCustomer = async (customerId: string) => {
    if (confirm("Are you sure you want to ban this customer?")) {
      try {
        await customerAPI.banCustomer(customerId)
        toast({
          title: "Success",
          description: "Customer banned successfully",
        })
        fetchCustomers()
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to ban customer",
          variant: "destructive",
        })
      }
    }
  }

  const handleUnbanCustomer = async (customerId: string) => {
    try {
      await customerAPI.unbanCustomer(customerId)
      toast({
        title: "Success",
        description: "Customer unbanned successfully",
      })
      fetchCustomers()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unban customer",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      try {
        await customerAPI.deleteCustomer(customerId)
        toast({
          title: "Success",
          description: "Customer deleted successfully",
        })
        fetchCustomers()
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete customer",
          variant: "destructive",
        })
      }
    }
  }

  const getStatusColor = (customer: Customer) => {
    if (customer.isBanned) return "destructive"
    if (!customer.isActive) return "secondary"
    return "default"
  }

  const getStatusText = (customer: Customer) => {
    if (customer.isBanned) return "Banned"
    if (!customer.isActive) return "Inactive"
    return "Active"
  }

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())

    const createdDate = new Date(customer.createdAt)
    const from = fromDate ? new Date(fromDate) : null
    const to = toDate ? new Date(toDate) : null

    const matchesDate =
      (!from || createdDate >= from) &&
      (!to || createdDate <= to)

    return matchesSearch && matchesDate
  })

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
          <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
          <p className="text-muted-foreground">Manage website signups and customer accounts.</p>
        </div>
      </div>

      {/* Date range filter */}
      <div className="flex items-center space-x-2 mb-2">
        <div>
          <label className="text-sm mr-2">From:</label>
          <Input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="w-[140px]"
          />
        </div>
        <div>
          <label className="text-sm mr-2">To:</label>
          <Input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="w-[140px]"
          />
        </div>
      </div>

      {/* Search input */}
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
          <Card key={customer._id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>{customer.name?.charAt(0) || customer.email.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{customer.name || "No Name"}</CardTitle>
                    <CardDescription>{customer.email}</CardDescription>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {customer.isBanned ? (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleUnbanCustomer(customer._id)}
                      title="Unban customer"
                    >
                      <UserCheck className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleBanCustomer(customer._id)}
                      title="Ban customer"
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteCustomer(customer._id)}
                    title="Delete customer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={getStatusColor(customer)}>
                    {getStatusText(customer)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Orders:</span>
                  <span className="font-medium">{customer.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Spent:</span>
                  <span className="font-medium">AED{customer.totalSpent?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Email Verified:</span>
                  <Badge variant={customer.isEmailVerified ? "default" : "secondary"}>
                    {customer.isEmailVerified ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Joined:</span>
                  <span className="text-sm">{new Date(customer.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
