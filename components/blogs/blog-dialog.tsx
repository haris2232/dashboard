"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { blogAPI, type Blog } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Image as ImageIcon, Bold, Italic, Link, Quote, List, ListOrdered, Heading1, Heading2, Heading3, Code, Minus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://athlekt.com/backendnew/api"

const getFullImageUrl = (url: string | undefined): string => {
  if (!url) {
    return ""
  }
  if (url.startsWith("http") || url.startsWith("/placeholder.svg")) {
    return url
  }
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`
}

type FormatAction = {
  label: string
  icon: React.ReactNode
  action: (textarea: HTMLTextAreaElement) => void
}

const FORMAT_ACTIONS: FormatAction[] = [
  {
    label: "Bold",
    icon: <Bold className="h-4 w-4" />,
    action: (textarea) => {
      const { selectionStart, selectionEnd, value } = textarea
      const selectedText = value.substring(selectionStart, selectionEnd)
      const newValue = value.slice(0, selectionStart) + `<strong>${selectedText}</strong>` + value.slice(selectionEnd)
      textarea.value = newValue
      textarea.focus()
      textarea.setSelectionRange(selectionStart + 8, selectionEnd + 8)
    }
  },
  {
    label: "Italic",
    icon: <Italic className="h-4 w-4" />,
    action: (textarea) => {
      const { selectionStart, selectionEnd, value } = textarea
      const selectedText = value.substring(selectionStart, selectionEnd)
      const newValue = value.slice(0, selectionStart) + `<em>${selectedText}</em>` + value.slice(selectionEnd)
      textarea.value = newValue
      textarea.focus()
      textarea.setSelectionRange(selectionStart + 3, selectionEnd + 3)
    }
  },
  {
    label: "Link",
    icon: <Link className="h-4 w-4" />,
    action: (textarea) => {
      const { selectionStart, selectionEnd, value } = textarea
      const selectedText = value.substring(selectionStart, selectionEnd)
      const url = prompt("Enter URL:", "https://")
      if (url) {
        const newValue = value.slice(0, selectionStart) + `<a href="${url}">${selectedText || "Link"}</a>` + value.slice(selectionEnd)
        textarea.value = newValue
        textarea.focus()
        if (selectedText) {
          textarea.setSelectionRange(selectionStart + 9 + url.length, selectionEnd + 9 + url.length)
        } else {
          textarea.setSelectionRange(selectionStart + 9 + url.length + 4, selectionStart + 9 + url.length + 8)
        }
      }
    }
  },
  {
    label: "Quote",
    icon: <Quote className="h-4 w-4" />,
    action: (textarea) => {
      const { selectionStart, selectionEnd, value } = textarea
      const selectedText = value.substring(selectionStart, selectionEnd)
      const newValue = value.slice(0, selectionStart) + `<blockquote>${selectedText}</blockquote>` + value.slice(selectionEnd)
      textarea.value = newValue
      textarea.focus()
      textarea.setSelectionRange(selectionStart + 15, selectionEnd + 15)
    }
  },
  {
    label: "Unordered List",
    icon: <List className="h-4 w-4" />,
    action: (textarea) => {
      const { selectionStart, selectionEnd, value } = textarea
      const selectedText = value.substring(selectionStart, selectionEnd)
      const lines = selectedText.split('\n').filter(line => line.trim())
      
      if (lines.length === 0) {
        const newValue = value.slice(0, selectionStart) + `<ul>\n  <li>List item</li>\n</ul>` + value.slice(selectionEnd)
        textarea.value = newValue
        textarea.focus()
        textarea.setSelectionRange(selectionStart + 9, selectionStart + 18)
      } else {
        const listItems = lines.map(line => `  <li>${line}</li>`).join('\n')
        const newValue = value.slice(0, selectionStart) + `<ul>\n${listItems}\n</ul>` + value.slice(selectionEnd)
        textarea.value = newValue
        textarea.focus()
      }
    }
  },
  {
    label: "Ordered List",
    icon: <ListOrdered className="h-4 w-4" />,
    action: (textarea) => {
      const { selectionStart, selectionEnd, value } = textarea
      const selectedText = value.substring(selectionStart, selectionEnd)
      const lines = selectedText.split('\n').filter(line => line.trim())
      
      if (lines.length === 0) {
        const newValue = value.slice(0, selectionStart) + `<ol>\n  <li>List item</li>\n</ol>` + value.slice(selectionEnd)
        textarea.value = newValue
        textarea.focus()
        textarea.setSelectionRange(selectionStart + 9, selectionStart + 18)
      } else {
        const listItems = lines.map(line => `  <li>${line}</li>`).join('\n')
        const newValue = value.slice(0, selectionStart) + `<ol>\n${listItems}\n</ol>` + value.slice(selectionEnd)
        textarea.value = newValue
        textarea.focus()
      }
    }
  },
  {
    label: "Code",
    icon: <Code className="h-4 w-4" />,
    action: (textarea) => {
      const { selectionStart, selectionEnd, value } = textarea
      const selectedText = value.substring(selectionStart, selectionEnd)
      const newValue = value.slice(0, selectionStart) + `<code>${selectedText}</code>` + value.slice(selectionEnd)
      textarea.value = newValue
      textarea.focus()
      textarea.setSelectionRange(selectionStart + 6, selectionEnd + 6)
    }
  },
  {
    label: "Horizontal Line",
    icon: <Minus className="h-4 w-4" />,
    action: (textarea) => {
      const { selectionStart, value } = textarea
      const newValue = value.slice(0, selectionStart) + `<hr />` + value.slice(selectionStart)
      textarea.value = newValue
      textarea.focus()
      textarea.setSelectionRange(selectionStart + 6, selectionStart + 6)
    }
  }
]

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
  const [urlTouched, setUrlTouched] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [coverImage, setCoverImage] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [headingLevel, setHeadingLevel] = useState("")
  const { toast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const formatDisplayUrl = (storedUrl: string): string => {
    if (!storedUrl) return ""
    const trimmed = storedUrl.trim()
    if (trimmed.startsWith("http")) return trimmed
    if (trimmed.startsWith("/blog/")) return trimmed
    if (trimmed.startsWith("/")) return `/blog${trimmed}`
    if (trimmed.startsWith("blog/")) return `/${trimmed}`
    return `/blog/${trimmed}`
  }

  const normalizeUrlForSaving = (rawValue: string): string => {
    const trimmed = rawValue.trim().toLowerCase()
    if (!trimmed) return ""

    const withoutDomain = trimmed.replace(/^https?:\/\/[^/]+/i, "")
    let slug = withoutDomain.replace(/^\/+/, "")

    if (slug.startsWith("blog/")) {
      slug = slug.slice(5)
    }

    slug = slug
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

    return slug
  }

  useEffect(() => {
    if (blog) {
      setAdminName(blog.adminName)
      setUrl(formatDisplayUrl(blog.url))
      setUrlTouched(true)
      setContent(blog.content)
      setIsActive(blog.isActive)
      setCoverImage(
        blog.coverImage
          ? (blog.coverImage.startsWith("http") ? new URL(blog.coverImage).pathname : blog.coverImage)
          : ""
      )
    } else {
      setAdminName("")
      setUrl("")
      setUrlTouched(false)
      setContent("")
      setIsActive(true)
      setCoverImage("")
    }
  }, [blog, open])

  const generateSlug = (value: string) => {
    const slug = normalizeUrlForSaving(value)
    if (!slug) return ""
    return `/blog/${slug}`
  }

  const handleFormatAction = (action: FormatAction) => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    action.action(textarea)
    setContent(textarea.value)
  }

  const handleHeadingChange = (level: string) => {
    const textarea = textareaRef.current
    if (!textarea || !level) return
    
    const { selectionStart, selectionEnd, value } = textarea
    const selectedText = value.substring(selectionStart, selectionEnd)
    
    const newValue = value.slice(0, selectionStart) + `<h${level}>${selectedText}</h${level}>` + value.slice(selectionEnd)
    textarea.value = newValue
    setContent(newValue)
    textarea.focus()
    
    if (selectedText) {
      textarea.setSelectionRange(selectionStart + 3 + level.length, selectionEnd + 3 + level.length)
    } else {
      textarea.setSelectionRange(selectionStart + 3 + level.length, selectionStart + 3 + level.length)
    }
    
    setHeadingLevel("")
  }

  const handleImageInsert = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const url = prompt("Enter image URL:", "https://")
    if (url) {
      const alt = prompt("Enter image description (alt text):", "")
      const { selectionStart, value } = textarea
      const imgTag = `<img src="${url}" alt="${alt || ''}" />`
      const newValue = value.slice(0, selectionStart) + imgTag + value.slice(selectionStart)
      textarea.value = newValue
      setContent(newValue)
      textarea.focus()
      textarea.setSelectionRange(selectionStart + imgTag.length, selectionStart + imgTag.length)
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!file) return

    try {
      setUploadingImage(true)
      const formData = new FormData()
      formData.append("image", file)

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Upload failed! status: ${response.status}`)
      }

      const result = await response.json()
      const imagePath = result.imageUrl || result.fileUrl
      setCoverImage(imagePath)
      toast({
        title: "Success",
        description: "Cover image uploaded successfully.",
      })
    } catch (error: any) {
      console.error("Error uploading blog cover image:", error)
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const normalizedUrl = normalizeUrlForSaving(url)

    if (!adminName.trim() || !normalizedUrl || !content.trim()) {
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
        url: normalizedUrl,
        content: content.trim(),
        coverImage: coverImage || "",
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
              onChange={(e) => {
                const value = e.target.value
                setAdminName(value)
                if (!blog && !urlTouched) {
                  setUrl(generateSlug(value))
                }
              }}
              placeholder="Enter admin name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setUrlTouched(true)
              }}
              placeholder="Enter blog URL (e.g., /blog/my-post)"
              required
            />
            <p className="text-xs text-muted-foreground">
              This should be a unique URL for the blog post
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <div className="border rounded-md overflow-hidden">
              {/* Formatting Toolbar */}
              <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/50 border-b">
                {/* Heading Selector */}
                <Select value={headingLevel} onValueChange={handleHeadingChange}>
                  <SelectTrigger className="w-[100px] h-8">
                    <SelectValue placeholder="Heading" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Heading 1</SelectItem>
                    <SelectItem value="2">Heading 2</SelectItem>
                    <SelectItem value="3">Heading 3</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Formatting Buttons */}
                <ToggleGroup type="multiple" className="flex flex-wrap gap-1">
                  {FORMAT_ACTIONS.map((action) => (
                    <ToggleGroupItem
                      key={action.label}
                      value={action.label}
                      aria-label={action.label}
                      onClick={() => handleFormatAction(action)}
                      className="h-8 w-8 p-0"
                    >
                      {action.icon}
                    </ToggleGroupItem>
                  ))}
                  
                  {/* Image Insert Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handleImageInsert}
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </ToggleGroup>
              </div>
              
              {/* Content Textarea */}
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your blog content here..."
                className="min-h-[300px] border-0 focus-visible:ring-0"
                ref={textareaRef}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Use the toolbar above to format your content without needing to know HTML
            </p>
          </div>

          <div className="space-y-2">
            <Label>Cover Image</Label>
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative w-full sm:w-48 aspect-[4/5] rounded-md border border-dashed border-muted-foreground/40 flex items-center justify-center overflow-hidden bg-muted/30">
                    {coverImage ? (
                      <img
                        src={getFullImageUrl(coverImage)}
                        alt="Blog cover"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground flex flex-col items-center justify-center p-4">
                        <ImageIcon className="h-10 w-10 mb-2" />
                        <span className="text-sm">No image selected</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) {
                          handleImageUpload(file)
                        }
                      }}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          "Upload Image"
                        )}
                      </Button>
                      {coverImage && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setCoverImage("")}
                        >
                          Remove Image
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recommended ratio 3:4 (e.g. 600x800). JPG or PNG up to 5MB.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
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