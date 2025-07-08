"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { reviewAPI, type Review } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { Search, Star, MessageSquare, CheckCircle, X, Reply } from "lucide-react"

export function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [responseOpen, setResponseOpen] = useState(false)
  const [response, setResponse] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await reviewAPI.getReviews()
      setReviews(response.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch reviews",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateReviewStatus = async (reviewId: string, status: "approved" | "rejected") => {
    try {
      await reviewAPI.updateReview(reviewId, { status })
      toast({
        title: "Success",
        description: `Review ${status} successfully`,
      })
      fetchReviews()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update review status",
        variant: "destructive",
      })
    }
  }

  const submitResponse = async () => {
    if (!selectedReview || !response.trim()) return

    try {
      await reviewAPI.updateReview(selectedReview.id, {
        adminResponse: response,
        responseDate: new Date().toISOString(),
      })
      toast({
        title: "Success",
        description: "Response submitted successfully",
      })
      setResponseOpen(false)
      setResponse("")
      fetchReviews()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit response",
        variant: "destructive",
      })
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className={`h-4 w-4 ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
        ))}
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary"
      case "approved":
        return "default"
      case "rejected":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.product?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || review.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
        <p className="text-muted-foreground">Manage customer reviews and feedback.</p>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reviews..."
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
            <SelectItem value="all">All Reviews</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <Card key={review.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{review.product?.title}</CardTitle>
                  <CardDescription>
                    by {review.customer?.name} • {new Date(review.createdAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="text-right space-y-2">
                  {renderStars(review.rating)}
                  <Badge variant={getStatusColor(review.status)}>{review.status}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {review.comment && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm italic">"{review.comment}"</p>
                </div>
              )}

              {review.adminResponse && (
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center mb-2">
                    <Reply className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">Admin Response</span>
                  </div>
                  <p className="text-sm">{review.adminResponse}</p>
                  {review.responseDate && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Responded on {new Date(review.responseDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex space-x-2">
                  {review.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => updateReviewStatus(review.id, "approved")}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => updateReviewStatus(review.id, "rejected")}>
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedReview(review)
                    setResponse(review.adminResponse || "")
                    setResponseOpen(true)
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  {review.adminResponse ? "Edit Response" : "Respond"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReviews.length === 0 && !loading && (
        <div className="text-center py-12">
          <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
          <p className="text-gray-500">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search terms or filters"
              : "Customer reviews will appear here"}
          </p>
        </div>
      )}

      {/* Response Dialog */}
      <Dialog open={responseOpen} onOpenChange={setResponseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Review</DialogTitle>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{selectedReview.product?.title}</span>
                  {renderStars(selectedReview.rating)}
                </div>
                <p className="text-sm italic">"{selectedReview.comment}"</p>
                <p className="text-xs text-muted-foreground mt-2">by {selectedReview.customer?.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Your Response</label>
                <Textarea
                  placeholder="Write your response to this review..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setResponseOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submitResponse} disabled={!response.trim()}>
                  Submit Response
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
