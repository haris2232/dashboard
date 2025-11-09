import { CategoryBannersPage } from "@/components/category-banners-page";

export function CategoryBannersSection() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Category Banners</h1>
        <p className="text-muted-foreground">
          Upload the MEN and WOMEN hero banner images used on the category pages.
        </p>
      </div>
      <CategoryBannersPage />
    </div>
  );
}

