"use client"

import { useEffect, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { customerAPI } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { Search, Trash2, Ban, UserCheck, Download, Users, Calendar as CalendarIcon } from "lucide-react"

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
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
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

  const handleExport = (period: 'week' | 'month' | 'custom' | 'selected') => {
    let customersToExport: Customer[] = []

    if (period === 'selected') {
      customersToExport = customers.filter(c => selectedCustomers.includes(c._id))
    } else {
      toast({
        title: "No Data to Export",
        description: "There are no customers matching the date range.",
        variant: "default",
      })
      return
    }

    const headers = [
      "ID",
      "Name",
      "Email",
      "Total Orders",
      "Total Spent (AED)",
      "Status",
      "Email Verified",
      "Joined At",
    ]

    const rows = customersToExport.map(customer =>
      [
        customer._id,
        `"${customer.name || "N/A"}"`,
        customer.email,
        customer.totalOrders,
        customer.totalSpent.toFixed(2),
        getStatusText(customer),
        customer.isEmailVerified ? "Yes" : "No",
        new Date(customer.createdAt).toISOString(),
      ].join(",")
    )

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n")
    const link = document.createElement("a")
    link.setAttribute("href", encodeURI(csvContent))
    link.setAttribute("download", `customers_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Successful",
      description: `${customersToExport.length} customers exported to CSV.`,
    })
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

  const handleSelectCustomer = (customerId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedCustomers((prev) => [...prev, customerId])
    } else {
      setSelectedCustomers((prev) => prev.filter((id) => id !== customerId))
    }
  }

  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedCustomers(filteredCustomers.map((c) => c._id))
    } else {
      setSelectedCustomers([])
    }
  }

  const areAllVisibleSelected = filteredCustomers.length > 0 && selectedCustomers.length === filteredCustomers.length;

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
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Manage website signups and customer accounts.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedCustomers.length > 0 && (
            <Button variant="outline" onClick={() => handleExport('selected')}>
              <Download className="mr-2 h-4 w-4" />
              Export Selected ({selectedCustomers.length})
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Export by Date
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('week')}>Last 7 Days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('month')}>Last 30 Days</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter & Search</CardTitle>
          <CardDescription>Find specific customers by name, email, or join date.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>{filteredCustomers.length} customer(s) found.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={areAllVisibleSelected}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    aria-label="Select all customers on this page"
                    disabled={filteredCustomers.length === 0}
                  />
                </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Email Verified</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length > 0 ? (filteredCustomers.map((customer) => {
                  const isSelected = selectedCustomers.includes(customer._id)
                  return (
                  <TableRow key={customer._id} data-state={isSelected ? "selected" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectCustomer(customer._id, !!checked)}
                        aria-label={`Select customer ${customer.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>{customer.name?.charAt(0) || customer.email.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{customer.name || "No Name"}</div>
                          <div className="text-sm text-muted-foreground">{customer.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(customer)}>{getStatusText(customer)}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={customer.isEmailVerified ? "default" : "secondary"}>
                        {customer.isEmailVerified ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">AED{customer.totalSpent?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell className="text-right">{customer.totalOrders}</TableCell>
                    <TableCell>{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        {customer.isBanned ? (
                          <Button variant="ghost" size="icon" onClick={() => handleUnbanCustomer(customer._id)} title="Unban customer">
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => handleBanCustomer(customer._id)} title="Ban customer">
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCustomer(customer._id)} title="Delete customer" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )})
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No customers found.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
