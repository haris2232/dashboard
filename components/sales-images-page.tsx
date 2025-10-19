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

export function SalesImagesPage() {
  const [settings, setSettings] = useState<Partial<Settings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
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
        description: "Failed to load sales page image settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, field: keyof Settings) => {
    setUploading(field);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Upload failed! status: ${response.status}`
        );
      }

      const result = await response.json();
      setSettings((prev) => ({ ...prev, [field]: result.imageUrl }));
      toast({
        title: "Success",
        description: `Image for ${field} uploaded successfully.`,
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const removeImage = (field: keyof Settings) => {
    setSettings((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("settingsData", JSON.stringify(settings));
      await settingsAPI.updateSettings(formData);
      toast({
        title: "Success",
        description: "Sales page images have been updated.",
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

  const imageFields: (keyof Settings)[] = ["salesImage1", "salesImage2"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Page Images</CardTitle>
        <CardDescription>
          Manage the promotional images displayed on your sales page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {imageFields.map((field, index) => (
            <div key={field} className="space-y-2">
              <label className="font-medium">Sales Image {index + 1}</label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center relative aspect-video flex items-center justify-center">
                {settings[field] ? (
                  <>
                    <img
                      src={getFullImageUrl(settings[field] as string)}
                      alt={`Sales Image ${index + 1}`}
                      className="w-full h-full object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => removeImage(field)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No image uploaded</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
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
                {uploading === field ? "Uploading..." : "Upload Image"}
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