"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { blogAPI, type Blog } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface BlogDialogProps {
  open: boolean
  onClose: (refresh?: boolean) => void
  blog?: Blog | null
}

export function BlogDialog({ open, onClose, blog }: BlogDialogProps) {
  const [loading, setLoading] = useState(false)
  const [adminName, setAdminName] = useState("")
  const [url, setUrl] = useState("")
  const [content, setContent] = useState("")
  const [isActive, setIsActive] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (blog) {
      setAdminName(blog.adminName)
      setUrl(blog.url)
      setContent(blog.content)
      setIsActive(blog.isActive)
    } else {
      setAdminName("")
      setUrl("")
      setContent("")
      setIsActive(true)
    }
  }, [blog, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!adminName.trim() || !url.trim() || !content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      const blogData = {
        adminName: adminName.trim(),
        url: url.trim(),
        content: content.trim(),
        isActive,
      }

      if (blog) {
        await blogAPI.updateBlog(blog._id, blogData)
        toast({
          title: "Success",
          description: "Blog updated successfully",
        })
      } else {
        await blogAPI.createBlog(blogData)
        toast({
          title: "Success",
          description: "Blog created successfully",
        })
      }

      onClose(true)
    } catch (error: any) {
      console.error('Error saving blog:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save blog",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{blog ? "Edit Blog" : "Create New Blog"}</DialogTitle>
          <DialogDescription>
            {blog ? "Update the blog information below." : "Fill in the details to create a new blog post."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="adminName">Admin Name *</Label>
            <Input
              id="adminName"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              placeholder="Enter admin name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter blog URL (e.g., /blog/my-post)"
              required
            />
            <p className="text-xs text-muted-foreground">
              This should be a unique URL for the blog post
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter blog content..."
              className="min-h-[300px]"
              required
            />
            <p className="text-xs text-muted-foreground">
              This is the main content of your blog post
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active (Blog will be visible on website)
            </Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {blog ? "Update Blog" : "Create Blog"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

