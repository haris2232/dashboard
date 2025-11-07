"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { blogAPI, type Blog } from "@/lib/api"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Search, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { BlogDialog } from "./blog-dialog"

export function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const response = await blogAPI.getBlogs()
      setBlogs(response.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch blogs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this blog?")) {
      try {
        await blogAPI.deleteBlog(id)
        toast({
          title: "Success",
          description: "Blog deleted successfully",
        })
        fetchBlogs()
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete blog",
          variant: "destructive",
        })
      }
    }
  }

  const toggleBlogStatus = async (id: string) => {
    try {
      await blogAPI.toggleBlogStatus(id)
      toast({
        title: "Success",
        description: "Blog status updated successfully",
      })
      fetchBlogs()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update blog status",
        variant: "destructive",
      })
    }
  }

  const filteredBlogs = blogs.filter((blog) =>
    blog.adminName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blogs</h1>
          <p className="text-muted-foreground">Manage your blog posts.</p>
        </div>
        <Button onClick={() => {
          setSelectedBlog(null)
          setDialogOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Blog
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search blogs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredBlogs.map((blog) => (
          <Card key={blog._id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{blog.adminName}</CardTitle>
                  <CardDescription className="mt-1 break-all">{blog.url}</CardDescription>
                </div>
                <div className="flex space-x-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleBlogStatus(blog._id)}
                    title={blog.isActive ? "Deactivate blog" : "Activate blog"}
                  >
                    {blog.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Edit blog"
                    onClick={() => {
                      setSelectedBlog(blog)
                      setDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete blog"
                    onClick={() => handleDelete(blog._id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant={blog.isActive ? "default" : "secondary"}>
                    {blog.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(blog.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground line-clamp-3">
                  {blog.content.substring(0, 150)}...
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBlogs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No blogs found.</p>
        </div>
      )}

      <BlogDialog
        open={dialogOpen}
        onClose={(refresh) => {
          setDialogOpen(false)
          setSelectedBlog(null)
          if (refresh) {
            fetchBlogs()
          }
        }}
        blog={selectedBlog}
      />
    </div>
  )
}

