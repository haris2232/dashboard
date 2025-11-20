"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { settingsAPI, type Settings } from "@/lib/api";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://athlekt.com/backendnew/api";

const getFullImageUrl = (url: string | undefined): string => {
  if (!url) {
    return "";
  }
  if (url.startsWith("http") || url.startsWith("/placeholder.svg")) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

export function HomepageImagesPage() {
  const [settings, setSettings] = useState<Partial<Settings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSettings();
      setSettings(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load homepage image settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, field: keyof Settings) => {
    // Validate file size (500MB limit for videos, 50MB for images)
    const maxSize = field === "homepageImage1" ? 500 * 1024 * 1024 : 50 * 1024 * 1024; // 500MB for video, 50MB for images
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      toast({
        title: "File too large",
        description: `File size exceeds ${maxSizeMB}MB limit. Please choose a smaller file.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(field);
    try {
      const formData = new FormData();
      // The single image upload endpoint expects the field name to be 'image'
      formData.append("image", file);

      // Create AbortController for timeout (30 minutes for large videos)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000); // 30 minutes timeout

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Upload failed! status: ${response.status}`
        );
      }

      const result = await response.json();
      setSettings((prev) => {
        const updated = { ...prev, [field]: result.imageUrl };
        // If uploading to homepageImage1, also set the type
        if (field === 'homepageImage1' && result.fileType) {
          updated.homepageImage1Type = result.fileType as 'image' | 'video';
        }
        return updated;
      });
      toast({
        title: "Success",
        description: `${result.fileType === 'video' ? 'Video' : 'Image'} for ${field} uploaded successfully.`,
      });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      let errorMessage = "Failed to upload file. Please try again.";
      
      if (error.name === 'AbortError') {
        errorMessage = "Upload timeout. The file is too large or connection is slow. Please try again or use a smaller file.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const removeImage = async (field: keyof Settings) => {
    if (!settings[field]) return; // Nothing to delete
    
    setDeleting(field);
    // Save current state for potential revert
    const previousSettings = { ...settings };
    
    try {
      // Update local state first for immediate UI feedback
      const updatedSettings = { ...settings, [field]: "" };
      // Also clear homepageImage1Type if deleting homepageImage1
      if (field === 'homepageImage1') {
        updatedSettings.homepageImage1Type = 'image';
      }
      setSettings(updatedSettings);
      
      // Save to database
      const formData = new FormData();
      formData.append("settingsData", JSON.stringify(updatedSettings));
      await settingsAPI.updateSettings(formData);
      
      toast({
        title: "Success",
        description: `Image deleted successfully.`,
      });
    } catch (error) {
      // Revert local state on error
      setSettings(previousSettings);
      toast({
        title: "Error",
        description: "Failed to delete image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("settingsData", JSON.stringify(settings));
      await settingsAPI.updateSettings(formData);
      toast({
        title: "Success",
        description: "Homepage images have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const imageFields: (keyof Settings)[] = [
    "homepageImage1",
    "homepageImage2",
    "homepageImage3",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Homepage Images</CardTitle>
        <CardDescription>
          Manage the main images displayed on your homepage. Upload 3 images:
          Image 1 for hero section, Images 2 & 3 for banner carousel.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {imageFields.map((field, index) => (
            <div key={field} className="space-y-2">
              <label className="font-medium">Homepage Image {index + 1}</label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center relative aspect-video flex items-center justify-center">
                {settings[field] ? (
                  <>
                    {field === "homepageImage1" && settings.homepageImage1Type === "video" ? (
                      <video
                        src={getFullImageUrl(settings[field] as string)}
                        className="w-full h-full object-cover rounded-md"
                        controls
                      />
                    ) : (
                      <img
                        src={getFullImageUrl(settings[field] as string)}
                        alt={`Homepage Image ${index + 1}`}
                        className="w-full h-full object-cover rounded-md"
                      />
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => removeImage(field)}
                      disabled={!!deleting || !!uploading}
                      title="Delete image"
                    >
                      {deleting === field ? (
                        <LoadingSpinner />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No {field === "homepageImage1" ? "image/video" : "image"} uploaded</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept={field === "homepageImage1" ? "image/*,video/*" : "image/*"}
                className="hidden"
                ref={(el) => (fileInputRefs.current[index] = el)}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, field);
                }}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRefs.current[index]?.click()}
                disabled={!!uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading === field ? "Uploading..." : field === "homepageImage1" ? "Upload Image/Video" : "Upload Image"}
              </Button>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}