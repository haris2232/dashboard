"use client";

import { useEffect, useRef, useState } from "react";
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
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("/placeholder.svg")) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

type BannerFieldKey =
  | "categoriesMenBackground"
  | "categoriesMenForeground"
  | "categoriesWomenBackground"
  | "categoriesWomenForeground";

interface BannerConfig {
  title: string;
  description: string;
  fields: Array<{
    key: BannerFieldKey;
    label: string;
    helper: string;
    aspect?: string;
  }>;
}

const BANNER_CONFIGS: BannerConfig[] = [
  {
    title: "Men Banner",
    description:
      "Upload the images used for the MEN page hero banner. Background fills the rounded rectangle, foreground sits on top.",
    fields: [
      {
        key: "categoriesMenBackground",
        label: "Men Background",
        helper: "Recommended 3:1 ratio, wide image for the rounded banner",
        aspect: "aspect-[21/7]",
      },
      {
        key: "categoriesMenForeground",
        label: "Men Foreground",
        helper: "PNG with transparent background works best",
        aspect: "aspect-[3/4]",
      },
    ],
  },
  {
    title: "Women Banner",
    description:
      "Upload the images used for the WOMEN page hero banner. Background fills the rounded rectangle, foreground sits on top.",
    fields: [
      {
        key: "categoriesWomenBackground",
        label: "Women Background",
        helper: "Recommended 3:1 ratio, wide image for the rounded banner",
        aspect: "aspect-[21/7]",
      },
      {
        key: "categoriesWomenForeground",
        label: "Women Foreground",
        helper: "PNG with transparent background works best",
        aspect: "aspect-[3/4]",
      },
    ],
  },
];

export function CategoryBannersPage() {
  const [settings, setSettings] = useState<Partial<Settings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<BannerFieldKey | null>(null);
  const { toast } = useToast();
  const fileInputRefs = useRef<Record<BannerFieldKey, HTMLInputElement | null>>({
    categoriesMenBackground: null,
    categoriesMenForeground: null,
    categoriesWomenBackground: null,
    categoriesWomenForeground: null,
  });

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
        description: "Failed to load category banner settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, field: BannerFieldKey) => {
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
          errorData.message || `Upload failed! status: ${response.status}`,
        );
      }

      const result = await response.json();
      setSettings((prev) => ({ ...prev, [field]: result.imageUrl }));
      toast({
        title: "Success",
        description: `Image for ${field.replace(/([A-Z])/g, " $1").trim()} uploaded successfully.`,
      });
    } catch (error: any) {
      console.error("Error uploading category banner image:", error);
      toast({
        title: "Upload Failed",
        description:
          error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const removeImage = (field: BannerFieldKey) => {
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
        description: "Category banners have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save category banners.",
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Page Banners</CardTitle>
        <CardDescription>
          Manage the hero banners for the MEN and WOMEN category pages. Upload
          both the background bar and the foreground athlete image.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {BANNER_CONFIGS.map((config) => (
          <div key={config.title} className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{config.title}</h3>
              <p className="text-sm text-muted-foreground">
                {config.description}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {config.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="font-medium">{field.label}</label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center relative flex items-center justify-center overflow-hidden bg-muted/30 ${
                      field.aspect ?? "aspect-video"
                    }`}
                  >
                    {settings[field.key] ? (
                      <>
                        <img
                          src={getFullImageUrl(settings[field.key] as string)}
                          alt={field.label}
                          className="h-full w-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7"
                          onClick={() => removeImage(field.key)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="text-center text-muted-foreground flex flex-col items-center justify-center">
                        <ImageIcon className="h-10 w-10 mb-2 opacity-40" />
                        <span className="text-sm">No image selected</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={(el) => {
                      fileInputRefs.current[field.key] = el;
                    }}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        handleImageUpload(file, field.key);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      fileInputRefs.current[field.key]?.click()
                    }
                    disabled={!!uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading === field.key ? "Uploading..." : "Upload Image"}
                  </Button>
                  <p className="text-xs text-muted-foreground">{field.helper}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

