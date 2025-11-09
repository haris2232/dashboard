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
import { Loader2, Image as ImageIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

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

type QuickTag = {
  label: string
  open: string
  close?: string
  placeholder?: string
  selfClosing?: boolean
  cursorOffset?: number
}

const QUICK_TAGS: QuickTag[] = [
  { label: "H1", open: "<h1>", close: "</h1>", placeholder: "Heading text" },
  { label: "H2", open: "<h2>", close: "</h2>", placeholder: "Heading text" },
  { label: "H3", open: "<h3>", close: "</h3>", placeholder: "Heading text" },
  { label: "b", open: "<strong>", close: "</strong>", placeholder: "bold text" },
  { label: "i", open: "<em>", close: "</em>", placeholder: "italic text" },
  { label: "link", open: "<a href=\"\">", close: "</a>", placeholder: "link text", cursorOffset: 9 },
  { label: "b-quote", open: "<blockquote>", close: "</blockquote>", placeholder: "blockquote" },
  { label: "del", open: "<del>", close: "</del>", placeholder: "deleted text" },
  { label: "ins", open: "<ins>", close: "</ins>", placeholder: "inserted text" },
  { label: "img", open: "<img src=\"", close: "\" alt=\"\" />", selfClosing: true, cursorOffset: 10 },
  { label: "ul", open: "<ul>\n  <li>", close: "</li>\n</ul>", placeholder: "List item" },
  { label: "ol", open: "<ol>\n  <li>", close: "</li>\n</ol>", placeholder: "List item" },
  { label: "li", open: "<li>", close: "</li>", placeholder: "List item" },
  { label: "code", open: "<code>", close: "</code>", placeholder: "code snippet" },
  { label: "more", open: "<!--more-->", selfClosing: true },
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
  const [openTagStack, setOpenTagStack] = useState<string[]>([])
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

  const insertTag = (tag: QuickTag) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const { selectionStart, selectionEnd, value } = textarea
    const selectedText = value.substring(selectionStart, selectionEnd)

    if (tag.selfClosing) {
      const insertText = `${tag.open}${tag.close ?? ""}`
      const newValue = value.slice(0, selectionStart) + insertText + value.slice(selectionEnd)
      setContent(newValue)

      const caretBase = selectionStart + (tag.cursorOffset ?? tag.open.length)
      window.requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(caretBase, caretBase)
      })
      return
    }

    if (selectedText.length > 0) {
      const insertText = `${tag.open}${selectedText}${tag.close ?? ""}`
      const newValue = value.slice(0, selectionStart) + insertText + value.slice(selectionEnd)
      setContent(newValue)

      const caretPos = selectionStart + tag.open.length + selectedText.length + (tag.close ? 0 : 0)
      window.requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(caretPos, caretPos)
      })
      return
    }

    const newValue = value.slice(0, selectionStart) + tag.open + value.slice(selectionEnd)
    setContent(newValue)

    if (tag.close) {
      setOpenTagStack((prev) => [...prev, tag.close as string])
    }

    const caretOffset = tag.cursorOffset ?? tag.open.length
    const caretPos = selectionStart + caretOffset

    window.requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(caretPos, caretPos)
    })
  }

  const handleCloseTags = () => {
    const textarea = textareaRef.current
    if (!textarea || openTagStack.length === 0) return

    const { selectionStart, selectionEnd, value } = textarea
    const closingText = openTagStack.slice().reverse().join("")
    const newValue = value.slice(0, selectionStart) + closingText + value.slice(selectionEnd)
    setContent(newValue)
    setOpenTagStack([])

    const caretPos = selectionStart + closingText.length
    window.requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(caretPos, caretPos)
    })
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
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map((tag) => (
                <Button
                  key={tag.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertTag(tag)}
                >
                  {tag.label}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCloseTags}
                disabled={openTagStack.length === 0}
              >
                close tags
              </Button>
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter blog content..."
              className="min-h-[300px]"
              ref={textareaRef}
              required
            />
            <p className="text-xs text-muted-foreground">
              This is the main content of your blog post
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

